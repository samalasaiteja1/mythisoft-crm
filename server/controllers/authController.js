import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/helpers.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';
import { applyDepartmentFields } from '../utils/userPayload.js';
import { getCustomerRefId } from '../utils/roleFilters.js';
import { sendPasswordResetEmail } from '../utils/sendEmail.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, role } = req.body;
  if (role === 'customer') {
    res.status(403);
    throw new Error('Customer portal accounts are created by admin only');
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }
  const user = await User.create({ firstName, lastName, email, password, phone, role: role || 'sales' });
  const token = generateToken(user._id);
  res.status(201).json({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    token,
  });
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is deactivated');
  }
  user.lastLogin = new Date();
  await user.save();
  const populated = await User.findById(user._id)
    .populate('customerRef', 'firstName lastName email companyName status')
    .populate('staffRole', 'code name teamGroup department description');
  res.json({
    _id: populated._id,
    firstName: populated.firstName,
    lastName: populated.lastName,
    email: populated.email,
    role: populated.role,
    avatar: populated.avatar,
    customerRef: populated.customerRef,
    staffRole: populated.staffRole,
    departmentName: populated.departmentName,
    token: generateToken(populated._id),
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('team', 'name')
    .populate('customerRef', 'firstName lastName email companyName status phone')
    .populate('staffRole', 'code name teamGroup department description');
  res.json(user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { firstName, lastName, phone, preferences } = req.body;
  if (firstName) user.firstName = String(firstName).trim();
  if (lastName) user.lastName = String(lastName).trim();
  if (phone !== undefined) user.phone = phone;
  applyDepartmentFields(user, req.body);
  if (preferences) user.preferences = { ...user.preferences, ...preferences };
  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/avatars');
    user.avatar = result.url;
  }
  await user.save();
  res.json(user);
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const { currentPassword, newPassword } = req.body;
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent' });
  }
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 3600000;
  await user.save();

  const emailResult = await sendPasswordResetEmail(user.email, resetToken);

  res.json({
    message: emailResult.sent
      ? 'Password reset link sent to your email'
      : 'Password reset link generated (check below in development)',
    resetUrl: emailResult.devMode ? emailResult.resetUrl : undefined,
    emailSent: emailResult.sent,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.json({ message: 'Password reset successful', token: generateToken(user._id) });
});

export const getCustomerPortalProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') {
    res.status(403);
    throw new Error('Customer portal profile is for customer accounts only');
  }
  const customerId = getCustomerRefId(req.user);
  if (!customerId) {
    res.status(404);
    throw new Error('Customer profile not linked');
  }
  const customer = await Customer.findById(customerId).populate('company', 'name website').lean();
  res.json({ user: req.user, customer });
});

export const updateCustomerPortalProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') {
    res.status(403);
    throw new Error('Customer portal profile is for customer accounts only');
  }
  const customerId = getCustomerRefId(req.user);
  if (!customerId) {
    res.status(404);
    throw new Error('Customer profile not linked');
  }

  const customer = await Customer.findById(customerId);
  const {
    firstName, lastName, phone, companyName, gstNumber, title, designation,
    alternatePhone, website,
  } = req.body;
  let { address } = req.body;
  if (typeof address === 'string') {
    try { address = JSON.parse(address); } catch { /* keep as-is */ }
  }

  if (firstName) customer.firstName = String(firstName).trim();
  if (lastName) customer.lastName = String(lastName).trim();
  if (phone !== undefined) customer.phone = phone;
  if (companyName !== undefined) customer.companyName = companyName;
  if (gstNumber !== undefined) customer.gstNumber = gstNumber;
  if (title !== undefined) customer.title = title;
  if (designation !== undefined) customer.designation = designation;
  if (alternatePhone !== undefined) customer.alternatePhone = alternatePhone;
  if (website !== undefined) customer.website = website;
  if (address) customer.address = { ...(customer.address?.toObject?.() || customer.address || {}), ...address };

  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/logos');
    customer.companyLogo = result.url;
  }

  await customer.save();

  const user = await User.findById(req.user._id);
  if (firstName) user.firstName = String(firstName).trim();
  if (lastName) user.lastName = String(lastName).trim();
  if (phone !== undefined) user.phone = phone;
  await user.save();

  const populated = await Customer.findById(customerId).populate('company', 'name website').lean();
  res.json({ user, customer: populated });
});

export const checkUserExists = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select('_id email role');
  res.json({ exists: !!user, user: user ? { _id: user._id, email: user.email, role: user.role } : null });
});

export const logActivity = async (userId, type, title, relatedTo = null, description = '') => {
  await Activity.create({ type, title, description, user: userId, relatedTo });
};

export const createNotification = async (userId, title, message, type = 'info', link = '') => {
  await Notification.create({ user: userId, title, message, type, link });
};
