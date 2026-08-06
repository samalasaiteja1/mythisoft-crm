import Followup from '../models/Followup.js';
import Lead from '../models/Lead.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from './authController.js';
import {
  defaultFollowUpDate,
  contactFromLead,
  contactFromDeal,
  contactFromCustomer,
  logFollowUpCommunication,
  scheduleFollowUpMeeting,
  buildVirtualDealFollowup,
  buildVirtualCustomerFollowup,
} from '../utils/followupSync.js';
import { getDealFilterByRole, getCustomerFilterByRole } from '../utils/roleFilters.js';
import {
  normalizeActivityType,
  normalizeFollowupStatus,
  normalizeLeadStatusForFollowup,
  isMeetingActivity,
} from '../constants/followupTypes.js';
import {
  normalizeDealStageForFollowup,
  normalizeDealFollowupStatus,
  DEAL_ACTIVE_STATUSES,
} from '../constants/dealFollowupTypes.js';
import {
  isSupportManager,
  getSupportTeamFollowupFilter,
  getSupportPersonFollowupFilter,
} from '../utils/managerScope.js';

const ACTIVE_STATUSES = DEAL_ACTIVE_STATUSES;
const PENDING_STATUSES = [...ACTIVE_STATUSES, 'missed'];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

/** Past-due by time, or explicitly marked overdue/missed in the form */
const buildOverdueFilter = (base, now = new Date()) => ({
  ...base,
  $or: [
    { scheduledAt: { $lt: now }, status: { $in: PENDING_STATUSES } },
    { status: { $in: ['overdue', 'missed'] } },
  ],
});

const populateFollowup = (query) => query
  .populate('lead', 'firstName lastName email phone alternatePhone website company title industry status nextFollowUp interestedService priority description notes')
  .populate('deal', 'title stage value dealType expectedCloseDate projectRequirements')
  .populate('customer', 'firstName lastName email phone status companyName title')
  .populate('project', 'name status workflowStage')
  .populate('assignedTo', 'firstName lastName email')
  .populate('createdBy', 'firstName lastName');

const getFollowupFilterByRole = async (user) => {
  const role = user?.role;
  const userId = user?._id;
  if (role === 'admin') return {};
  if (role === 'manager') {
    if (isSupportManager(user)) return getSupportTeamFollowupFilter();
    return {};
  }
  if (role === 'support') return getSupportPersonFollowupFilter(userId);
  const leadIds = await Lead.find({ assignedTo: userId }).distinct('_id');
  const Deal = (await import('../models/Deal.js')).default;
  const Customer = (await import('../models/Customer.js')).default;
  const dealIds = await Deal.find({ assignedTo: userId }).distinct('_id');
  const customerIds = await Customer.find({ assignedTo: userId }).distinct('_id');
  const or = [{ assignedTo: userId }, { createdBy: userId }];
  if (leadIds.length) or.push({ lead: { $in: leadIds } });
  if (dealIds.length) or.push({ deal: { $in: dealIds } });
  if (customerIds.length) or.push({ customer: { $in: customerIds } });
  return { $or: or };
};

const resolveContact = async (body) => {
  if (body.contactName) {
    return {
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      contactAlternatePhone: body.contactAlternatePhone,
      contactWebsite: body.contactWebsite,
      contactTitle: body.contactTitle,
      contactIndustry: body.contactIndustry,
      company: body.company,
    };
  }
  if (body.lead) {
    const lead = await Lead.findById(body.lead);
    if (lead) return contactFromLead(lead);
  }
  if (body.deal) {
    const Deal = (await import('../models/Deal.js')).default;
    const deal = await Deal.findById(body.deal).populate('customer').populate('lead');
    if (deal) return contactFromDeal(deal, deal.lead);
  }
  if (body.customer) {
    const Customer = (await import('../models/Customer.js')).default;
    const customer = await Customer.findById(body.customer).populate('company');
    if (customer) return contactFromCustomer(customer);
  }
  return {};
};

const inferWorkflowStage = (body) => {
  if (body.workflowStage) return body.workflowStage;
  if (body.customer) return 'customer';
  if (body.deal) return 'deal';
  return 'lead';
};

const normalizePayload = (body) => {
  const payload = { ...body };
  if (payload.activityType) payload.activityType = normalizeActivityType(payload.activityType);
  if (payload.status) {
    const isDeal = payload.workflowStage === 'deal' || payload.deal;
    payload.status = isDeal
      ? normalizeDealFollowupStatus(payload.status)
      : normalizeFollowupStatus(payload.status);
  }
  if (payload.leadStatus) payload.leadStatus = normalizeLeadStatusForFollowup(payload.leadStatus);
  if (payload.dealStage) payload.dealStage = normalizeDealStageForFollowup(payload.dealStage);
  if (payload.followUpOutcome) payload.outcome = payload.followUpOutcome;
  return payload;
};

const mapCommType = (activityType) => {
  const type = normalizeActivityType(activityType);
  if (type === 'whatsapp') return 'chat';
  if (type === 'phone_call') return 'call';
  if (type === 'email' || type === 'send_brochure') return 'email';
  return null;
};

export const getFollowups = asyncHandler(async (req, res) => {
  const { workflowStage, status, activityType, today, upcoming, overdue, filter, includeAllDeals, includeAllCustomers, assigned } = req.query;
  const { role, _id: userId } = req.user;

  if (includeAllDeals === 'true' && workflowStage === 'deal') {
    const Deal = (await import('../models/Deal.js')).default;
    const dealFilter = {
      ...getDealFilterByRole(role, userId),
      lead: { $exists: true, $ne: null },
    };

    const deals = await Deal.find(dealFilter)
      .populate('lead', 'firstName lastName email phone alternatePhone website company title industry status')
      .populate('assignedTo', 'firstName lastName email')
      .sort('-createdAt');

    const dealIds = deals.map((d) => d._id);
    const followups = dealIds.length
      ? await populateFollowup(
        Followup.find({ deal: { $in: dealIds } }).sort('-updatedAt')
      )
      : [];

    const followupByDeal = new Map();
    for (const f of followups) {
      const dealId = String(f.deal?._id || f.deal);
      if (!followupByDeal.has(dealId)) followupByDeal.set(dealId, f);
    }

    const items = deals.map((deal) => {
      const existing = followupByDeal.get(String(deal._id));
      if (existing) {
        return typeof existing.toObject === 'function' ? existing.toObject() : existing;
      }
      return buildVirtualDealFollowup(deal);
    });

    return res.json({ items, total: items.length });
  }

  if (includeAllCustomers === 'true' && workflowStage === 'customer') {
    const Customer = (await import('../models/Customer.js')).default;
    const customerFilter = await getCustomerFilterByRole(role, userId, req.user);

    const customers = await Customer.find(customerFilter)
      .populate('assignedTo', 'firstName lastName email')
      .sort('-createdAt');

    const customerIds = customers.map((c) => c._id);
    const followups = customerIds.length
      ? await populateFollowup(
        Followup.find({ customer: { $in: customerIds } }).sort('-updatedAt')
      )
      : [];

    const followupByCustomer = new Map();
    for (const f of followups) {
      const customerId = String(f.customer?._id || f.customer);
      if (!followupByCustomer.has(customerId)) followupByCustomer.set(customerId, f);
    }

    const items = customers.map((customer) => {
      const existing = followupByCustomer.get(String(customer._id));
      if (existing) {
        return typeof existing.toObject === 'function' ? existing.toObject() : existing;
      }
      return buildVirtualCustomerFollowup(customer);
    });

    return res.json({ items, total: items.length });
  }

  const dbFilter = { ...(await getFollowupFilterByRole(req.user)) };

  const activeFilter = filter || (today === 'true' ? 'today' : upcoming === 'true' ? 'upcoming' : overdue === 'true' ? 'overdue' : null);

  if (workflowStage && workflowStage !== 'all') dbFilter.workflowStage = workflowStage;
  if (activityType) dbFilter.activityType = activityType;

  // Support filtering by assigned/unassigned follow-ups
  if (assigned === 'true') dbFilter.assignedTo = { $ne: null };
  if (assigned === 'false') dbFilter.assignedTo = null;

  if (status) {
    dbFilter.status = status === 'scheduled' ? { $in: ACTIVE_STATUSES } : status;
  } else if (activeFilter === 'completed') {
    dbFilter.status = 'completed';
  } else if (activeFilter !== 'completed' && activeFilter !== 'overdue') {
    dbFilter.status = { $in: PENDING_STATUSES };
  }

  const now = new Date();
  const todayEnd = endOfToday();

  let queryFilter = dbFilter;

  if (activeFilter === 'today' || today === 'true') {
    queryFilter = { ...dbFilter, scheduledAt: { $gte: now, $lte: todayEnd }, status: { $in: PENDING_STATUSES } };
  } else if (activeFilter === 'upcoming' || upcoming === 'true') {
    queryFilter = { ...dbFilter, scheduledAt: { $gt: todayEnd }, status: { $in: PENDING_STATUSES } };
  } else if (activeFilter === 'overdue' || overdue === 'true') {
    const { status: _ignored, ...base } = dbFilter;
    queryFilter = buildOverdueFilter(base, now);
  }

  const sort = activeFilter === 'completed'
    ? '-completedAt'
    : workflowStage === 'lead'
      ? '-createdAt'
      : 'scheduledAt';

  const items = await populateFollowup(
    Followup.find(queryFilter).sort(sort)
  );

  res.json({
    items,
    total: items.length,
  });
});

export const getFollowup = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const filter = { _id: req.params.id, ...(await getFollowupFilterByRole(req.user)) };
  const item = await populateFollowup(Followup.findOne(filter));
  if (!item) {
    res.status(404);
    throw new Error('Follow-up not found');
  }
  res.json(item);
});

export const createFollowup = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const body = normalizePayload(req.body);

  if (role === 'support' && body.customer) {
    const Customer = (await import('../models/Customer.js')).default;
    const allowed = await Customer.findOne({ _id: body.customer, supportAssignee: userId });
    if (!allowed) {
      res.status(403);
      throw new Error('You can only schedule follow-ups for customers assigned to you');
    }
    body.assignedTo = userId;
    body.workflowStage = 'customer';
  }

  if (role === 'manager' && isSupportManager(req.user) && body.customer) {
    body.workflowStage = 'customer';
    if (!body.assignedTo) body.assignedTo = userId;
  }

  const contact = await resolveContact(body);
  const workflowStage = inferWorkflowStage(body);

  const item = await Followup.create({
    ...body,
    ...contact,
    workflowStage,
    scheduledAt: body.scheduledAt || defaultFollowUpDate(),
    assignedTo: body.assignedTo || userId,
    createdBy: userId,
    status: body.status || 'scheduled',
  });

  if (isMeetingActivity(body.activityType)) {
    await scheduleFollowUpMeeting(item, userId, body);
  }
  const commType = mapCommType(body.activityType);
  if (commType && body.notes) {
    await logFollowUpCommunication(item, userId, {
      type: commType,
      subject: body.title,
      body: body.notes,
      to: contact.contactEmail,
    });
  }

  await logActivity(userId, 'followup', `Follow-up logged: ${item.title}`, { type: 'lead', id: item.lead || item._id });
  res.status(201).json(await populateFollowup(Followup.findById(item._id)));
});

export const updateFollowup = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const filter = { _id: req.params.id, ...(await getFollowupFilterByRole(req.user)) };
  const existing = await Followup.findOne(filter);
  if (!existing) {
    res.status(404);
    throw new Error('Follow-up not found');
  }

  const updates = normalizePayload({ ...req.body });
  if (updates.status === 'completed' && !updates.completedAt) {
    updates.completedAt = new Date();
  }
  if (req.body.contactName) {
    Object.assign(updates, {
      contactName: req.body.contactName,
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      contactAlternatePhone: req.body.contactAlternatePhone,
      contactWebsite: req.body.contactWebsite,
      contactTitle: req.body.contactTitle,
      contactIndustry: req.body.contactIndustry,
      company: req.body.company,
    });
  }

  const item = await populateFollowup(
    Followup.findByIdAndUpdate(existing._id, updates, { new: true, runValidators: true })
  );
  res.json(item);
});

export const completeFollowup = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const filter = { _id: req.params.id, ...(await getFollowupFilterByRole(req.user)) };
  const item = await populateFollowup(
    Followup.findOneAndUpdate(
      filter,
      { status: 'completed', completedAt: new Date(), outcome: req.body.outcome },
      { new: true },
    )
  );
  if (!item) {
    res.status(404);
    throw new Error('Follow-up not found');
  }
  res.json(item);
});

export const deleteFollowup = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const filter = { _id: req.params.id, ...(await getFollowupFilterByRole(req.user)) };
  const item = await Followup.findOne(filter);
  if (!item) {
    res.status(404);
    throw new Error('Follow-up not found');
  }
  await item.deleteOne();
  res.json({ message: 'Follow-up deleted' });
});

export const getFollowupStats = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const base = await getFollowupFilterByRole(req.user);
  const now = new Date();
  const todayEnd = endOfToday();

  const [pending, today, overdue, overdueDeals, leadStage, dealStage, customerStage, allDeals, allCustomers] = await Promise.all([
    Followup.countDocuments({ ...base, status: { $in: PENDING_STATUSES } }),
    Followup.countDocuments({ ...base, status: { $in: PENDING_STATUSES }, scheduledAt: { $gte: now, $lte: todayEnd } }),
    Followup.countDocuments(buildOverdueFilter(base, now)),
    Followup.countDocuments(buildOverdueFilter({ ...base, workflowStage: 'deal' }, now)),
    Followup.countDocuments({ ...base, status: { $in: ACTIVE_STATUSES }, workflowStage: 'lead' }),
    Followup.countDocuments({ ...base, status: { $in: ACTIVE_STATUSES }, workflowStage: 'deal' }),
    Followup.countDocuments({ ...base, status: { $in: ACTIVE_STATUSES }, workflowStage: 'customer' }),
    (async () => {
      const Deal = (await import('../models/Deal.js')).default;
      return Deal.countDocuments({
        ...getDealFilterByRole(role, userId),
        lead: { $exists: true, $ne: null },
      });
    })(),
    (async () => {
      const Customer = (await import('../models/Customer.js')).default;
      return Customer.countDocuments(await getCustomerFilterByRole(role, userId, req.user));
    })(),
  ]);

  // additional breakdowns for lead follow-ups assigned vs unassigned
  const [assignedLeadFollowUps, unassignedLeadFollowUps] = await Promise.all([
    Followup.countDocuments({ ...base, workflowStage: 'lead', status: { $in: PENDING_STATUSES }, assignedTo: { $ne: null } }),
    Followup.countDocuments({ ...base, workflowStage: 'lead', status: { $in: PENDING_STATUSES }, assignedTo: null }),
  ]);

  res.json({ pending, today, overdue, overdueDeals, leadStage, dealStage, allDeals, customerStage, allCustomers, assignedLeadFollowUps, unassignedLeadFollowUps });
});

export const getFollowupReports = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const base = await getFollowupFilterByRole(req.user);

  const [byActivity, byStage, byAssignee, monthly, completionRate] = await Promise.all([
    Followup.aggregate([
      { $match: base },
      { $group: { _id: '$activityType', count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]),
    Followup.aggregate([
      { $match: base },
      { $group: { _id: '$workflowStage', count: { $sum: 1 }, pending: { $sum: { $cond: [{ $in: ['$status', ACTIVE_STATUSES] }, 1, 0] } } } },
    ]),
    Followup.aggregate([
      { $match: base },
      { $group: { _id: '$assignedTo', count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Followup.aggregate([
      { $match: { ...base, createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Followup.aggregate([
      { $match: base },
      { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
    ]),
  ]);

  const assigneeIds = byAssignee.map((a) => a._id).filter(Boolean);
  const User = (await import('../models/User.js')).default;
  const users = await User.find({ _id: { $in: assigneeIds } }).select('firstName lastName');
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  res.json({
    byActivity: byActivity.map((r) => ({ activityType: r._id, count: r.count, completed: r.completed })),
    byStage: byStage.map((r) => ({ stage: r._id, count: r.count, pending: r.pending })),
    byAssignee: byAssignee.map((r) => ({
      user: userMap[String(r._id)] || { firstName: 'Unknown' },
      count: r.count,
      completed: r.completed,
    })),
    monthly: monthly.map((r) => ({ month: r._id, count: r.count })),
    completionRate: completionRate[0]
      ? Math.round((completionRate[0].completed / completionRate[0].total) * 100)
      : 0,
  });
});
