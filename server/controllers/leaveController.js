import Leave from '../models/Leave.js';
import { createCrudController } from '../utils/crudFactory.js';
import { asyncHandler } from '../utils/helpers.js';

const ctrl = createCrudController(Leave, {
  module: 'leave',
  populate: ['user', 'approvedBy', 'createdBy'],
  searchFields: ['reason', 'type'],
  beforeCreate: (req) => ({
    ...req.body,
    createdBy: req.user._id,
    user: req.body.user || req.user._id,
  }),
});

export const { getAll, getOne, create, update, remove } = ctrl;

export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  ).populate('user', 'firstName lastName email role');
  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }
  res.json(leave);
});

export const rejectLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected', approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  ).populate('user', 'firstName lastName email role');
  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }
  res.json(leave);
});
