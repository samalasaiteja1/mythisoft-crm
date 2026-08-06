import Subscription from '../models/Subscription.js';
import Company from '../models/Company.js';
import { asyncHandler } from '../utils/helpers.js';

export const getSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find()
    .populate('company', 'name industry email')
    .populate('createdBy', 'firstName lastName')
    .sort('-createdAt');
  res.json(subscriptions);
});

export const createSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.create({ ...req.body, createdBy: req.user._id });
  const populated = await Subscription.findById(subscription._id).populate('company', 'name industry email');
  res.status(201).json(populated);
});

export const updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('company', 'name industry email');
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }
  res.json(subscription);
});

export const getSubscriptionStats = asyncHandler(async (req, res) => {
  const [active, trial, suspended, totalCompanies] = await Promise.all([
    Subscription.countDocuments({ status: 'active' }),
    Subscription.countDocuments({ status: 'trial' }),
    Subscription.countDocuments({ status: 'suspended' }),
    Company.countDocuments(),
  ]);
  const mrr = await Subscription.aggregate([
    { $match: { status: { $in: ['active', 'trial'] } } },
    { $group: { _id: null, total: { $sum: '$monthlyPrice' } } },
  ]);
  res.json({
    active,
    trial,
    suspended,
    totalCompanies,
    mrr: mrr[0]?.total || 0,
  });
});
