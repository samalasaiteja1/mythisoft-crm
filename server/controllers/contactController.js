import Contact from '../models/Contact.js';
import { asyncHandler } from '../utils/helpers.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';

export const getContacts = asyncHandler(async (req, res) => {
  const { search, company, page = 1, limit = 20 } = req.query;
  const query = {};
  if (company) query.company = company;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Contact.countDocuments(query);
  const contacts = await Contact.find(query)
    .populate('company', 'name')
    .populate('customer', 'firstName lastName')
    .populate('assignedTo', 'firstName lastName')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ contacts, total, pages: Math.ceil(total / limit) });
});

export const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id)
    .populate('company')
    .populate('customer')
    .populate('assignedTo', 'firstName lastName email');
  if (!contact) {
    res.status(404);
    throw new Error('Contact not found');
  }
  res.json(contact);
});

export const createContact = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id };
  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/contacts');
    data.avatar = result.url;
  }
  const contact = await Contact.create(data);
  res.status(201).json(contact);
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    res.status(404);
    throw new Error('Contact not found');
  }
  Object.assign(contact, req.body);
  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/contacts');
    contact.avatar = result.url;
  }
  await contact.save();
  res.json(contact);
});

export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    res.status(404);
    throw new Error('Contact not found');
  }
  await contact.deleteOne();
  res.json({ message: 'Contact removed' });
});
