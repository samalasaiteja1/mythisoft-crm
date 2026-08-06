import CustomerFeedback from '../models/CustomerFeedback.js';
import { asyncHandler } from '../utils/helpers.js';

export const getFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await CustomerFeedback.find()
    .populate('customer', 'firstName lastName email')
    .populate('project', 'name')
    .populate('submittedBy', 'firstName lastName')
    .sort('-createdAt');
  res.json(feedbacks);
});

export const createFeedback = asyncHandler(async (req, res) => {
  const feedback = await CustomerFeedback.create({ ...req.body, submittedBy: req.user._id });
  res.status(201).json(feedback);
});

export const publishFeedback = asyncHandler(async (req, res) => {
  const feedback = await CustomerFeedback.findByIdAndUpdate(req.params.id, { published: true }, { new: true });
  if (!feedback) {
    res.status(404);
    throw new Error('Feedback not found');
  }
  res.json(feedback);
});
