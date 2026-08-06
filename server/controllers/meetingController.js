import Meeting from '../models/Meeting.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from './authController.js';
import { getMeetingFilterByRole, canAccessCustomer } from '../utils/roleFilters.js';
import Lead from '../models/Lead.js';
import { getLeadFilterByRole } from '../utils/roleFilters.js';

const populateMeeting = (query) => query
  .populate('lead', 'firstName lastName email company')
  .populate('customer', 'firstName lastName email company')
  .populate('assignedTo', 'firstName lastName email')
  .populate('createdBy', 'firstName lastName');

export const getAll = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const query = { ...getMeetingFilterByRole(req.user.role, req.user._id, req.user) };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Meeting.countDocuments(query);
  const items = await populateMeeting(
    Meeting.find(query).sort('-scheduledAt').skip((page - 1) * limit).limit(Number(limit))
  );
  res.json({ items, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
});

export const getOne = asyncHandler(async (req, res) => {
  const item = await populateMeeting(Meeting.findById(req.params.id));
  if (!item) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  res.json(item);
});

export const create = asyncHandler(async (req, res) => {
  const { customer, lead, title, scheduledAt } = req.body;
  if (!title?.trim()) {
    res.status(400);
    throw new Error('Meeting title is required');
  }
  if (!scheduledAt) {
    res.status(400);
    throw new Error('Scheduled date & time is required');
  }
  if (!customer && !lead) {
    res.status(400);
    throw new Error('Select a customer or lead for this meeting');
  }
  if (customer) {
    const allowed = await canAccessCustomer(req.user.role, req.user._id, customer);
    if (!allowed) {
      res.status(403);
      throw new Error('You do not have access to this customer');
    }
  }
  if (lead) {
    const leadFilter = { _id: lead, ...getLeadFilterByRole(req.user.role, req.user._id) };
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      const found = await Lead.findOne(leadFilter);
      if (!found) {
        res.status(403);
        throw new Error('You do not have access to this lead');
      }
    }
  }

  const item = await Meeting.create({
    ...req.body,
    createdBy: req.user._id,
    assignedTo: req.body.assignedTo || req.user._id,
  });
  try {
    await logActivity(req.user._id, 'meeting', `Created meeting: ${item.title}`, { type: 'meeting', id: item._id });
  } catch { /* ignore */ }
  res.status(201).json(await populateMeeting(Meeting.findById(item._id)));
});

export const update = asyncHandler(async (req, res) => {
  if (req.body.customer) {
    const allowed = await canAccessCustomer(req.user.role, req.user._id, req.body.customer);
    if (!allowed) {
      res.status(403);
      throw new Error('You do not have access to this customer');
    }
  }
  const item = await populateMeeting(
    Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  );
  if (!item) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  try {
    await logActivity(req.user._id, 'meeting', `Updated meeting: ${item.title}`, { type: 'meeting', id: item._id });
  } catch { /* ignore */ }
  res.json(item);
});

export const remove = asyncHandler(async (req, res) => {
  const item = await Meeting.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  await item.deleteOne();
  res.json({ message: 'Deleted successfully' });
});
