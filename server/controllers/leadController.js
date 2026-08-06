import Lead from '../models/Lead.js';
import Customer from '../models/Customer.js';
import Deal from '../models/Deal.js';
import Activity from '../models/Activity.js';
import Communication from '../models/Communication.js';
import Document from '../models/Document.js';
import Note from '../models/Note.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from '../controllers/authController.js';
import { getLeadFilterByRole, findLeadForRole, getManagerLeadScope, managerCanAccessLead } from '../utils/roleFilters.js';
import { canPerformAction } from '../constants/permissions.js';
import { applyLeadStatus, normalizeLeadStatus, statusFilterValues } from '../utils/leadStatus.js';
import {
  completeFollowUpForLead,
  linkFollowupsLeadToDeal,
  syncFollowUpForDeal,
  syncFollowUpForCustomer,
  syncLeadContactToPendingFollowups,
  ensureLeadFollowUpFromContact,
} from '../utils/leadFollowup.js';
import { prepareDealPayload } from '../utils/dealPayload.js';

const isEmptyAssignId = (v) => v === '' || v === null || v === undefined;

async function resolveLeadAssignments(role, userId, { assignedManager, assignedTo }, existingLead = null) {
  const User = (await import('../models/User.js')).default;
  let managerId = isEmptyAssignId(assignedManager) ? null : String(assignedManager);
  let salesId = isEmptyAssignId(assignedTo) ? null : String(assignedTo);

  if (role === 'sales') {
    salesId = String(userId);
    const self = await User.findById(userId).select('reportsTo');
    managerId = self?.reportsTo ? String(self.reportsTo) : null;
    return { assignedManager: managerId, assignedTo: salesId };
  }

  if (role === 'manager') {
    managerId = String(userId);
    if (!salesId) {
      return { assignedManager: managerId, assignedTo: null };
    }
    const assignee = await User.findById(salesId).select('reportsTo role isActive');
    if (!assignee || assignee.isActive === false || assignee.role !== 'sales') {
      const err = new Error('Invalid salesperson');
      err.statusCode = 400;
      throw err;
    }
    if (String(assignee.reportsTo) !== managerId) {
      const err = new Error('Can only assign to your direct reports');
      err.statusCode = 403;
      throw err;
    }
    return { assignedManager: managerId, assignedTo: salesId };
  }

  if (role === 'admin') {
    if (salesId && !managerId) {
      const assignee = await User.findById(salesId).select('reportsTo role isActive');
      if (!assignee || assignee.isActive === false || assignee.role !== 'sales') {
        const err = new Error('Invalid salesperson');
        err.statusCode = 400;
        throw err;
      }
      if (assignee.reportsTo) managerId = String(assignee.reportsTo);
    }
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== 'manager') {
        const err = new Error('Selected user is not a manager');
        err.statusCode = 400;
        throw err;
      }
    }
    if (salesId) {
      const assignee = await User.findById(salesId).select('reportsTo role isActive');
      if (!assignee || assignee.isActive === false || assignee.role !== 'sales') {
        const err = new Error('Invalid salesperson');
        err.statusCode = 400;
        throw err;
      }
      if (managerId && assignee.reportsTo && String(assignee.reportsTo) !== managerId) {
        const err = new Error('Sales executive must report to the selected sales manager');
        err.statusCode = 400;
        throw err;
      }
    }
    return { assignedManager: managerId, assignedTo: salesId };
  }

  return {
    assignedManager: existingLead?.assignedManager || null,
    assignedTo: existingLead?.assignedTo || null,
  };
}

const populateLeadUsers = (query) => query
  .populate('assignedTo', 'firstName lastName email')
  .populate('assignedManager', 'firstName lastName email')
  .populate('createdBy', 'firstName lastName');

const buildLeadQuery = async (role, userId, { status, search, assignmentFilter } = {}) => {
  let roleFilter = getLeadFilterByRole(role, userId);
  if (role === 'manager') {
    roleFilter = await getManagerLeadScope(userId);
  }
  const andClauses = [];

  if (Object.keys(roleFilter).length) andClauses.push(roleFilter);

  if (status) {
    const values = statusFilterValues(status);
    andClauses.push({ $or: [{ status: { $in: values } }, { workflowStage: { $in: values } }] });
  }

  if (search) {
    andClauses.push({
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ],
    });
  }

  if (assignmentFilter === 'needs_manager') {
    andClauses.push({
      $or: [{ assignedManager: null }, { assignedManager: { $exists: false } }],
    });
  }
  if (assignmentFilter === 'needs_sales') {
    andClauses.push({
      $and: [
        { assignedManager: { $exists: true, $ne: null } },
        { $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }] },
      ],
    });
  }
  if (assignmentFilter === 'manager_only') {
    andClauses.push({
      $and: [
        { assignedManager: { $exists: true, $ne: null } },
        { $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }] },
      ],
    });
  }
  if (assignmentFilter === 'sales_only') {
    andClauses.push({
      $and: [
        { $or: [{ assignedManager: null }, { assignedManager: { $exists: false } }] },
        { assignedTo: { $exists: true, $ne: null } },
      ],
    });
  }
  if (assignmentFilter === 'both') {
    andClauses.push({
      assignedManager: { $exists: true, $ne: null },
      assignedTo: { $exists: true, $ne: null },
    });
  }
  if (assignmentFilter === 'with_sales') {
    andClauses.push({ assignedTo: { $exists: true, $ne: null } });
  }
  if (assignmentFilter === 'assigned') {
    andClauses.push({
      $or: [
        { assignedManager: { $exists: true, $ne: null } },
        { assignedTo: { $exists: true, $ne: null } },
      ],
    });
  }
  if (assignmentFilter === 'unsigned_sales') {
    andClauses.push({
      $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }],
    });
  }
  if (assignmentFilter === 'unassigned') {
    andClauses.push({
      $and: [
        { $or: [{ assignedManager: null }, { assignedManager: { $exists: false } }] },
        { $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }] },
      ],
    });
  }

  if (andClauses.length === 1) return andClauses[0];
  if (andClauses.length > 1) return { $and: andClauses };
  return {};
};

export const getLeads = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20, assignmentFilter } = req.query;
  const query = await buildLeadQuery(req.user.role, req.user._id, { status, search, assignmentFilter });
  const total = await Lead.countDocuments(query);
  const leads = await populateLeadUsers(Lead.find(query))
    .populate('convertedToDeal', 'title stage value')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const normalizedLeads = leads.map((lead) => {
    const doc = lead.toObject();
    doc.status = normalizeLeadStatus(doc.status, doc.workflowStage);
    doc.workflowStage = doc.status;
    return doc;
  });

  res.json({ leads: normalizedLeads, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
});

export const getLead = asyncHandler(async (req, res) => {
  const lead = await findLeadForRole(req.user.role, req.user._id, req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  const populated = await populateLeadUsers(Lead.findById(lead._id))
    .populate('companyRef', 'name industry')
    .populate('convertedToCustomer')
    .populate('convertedToDeal');
  const leadObj = populated.toObject();
  leadObj.status = normalizeLeadStatus(leadObj.status, leadObj.workflowStage);
  leadObj.workflowStage = leadObj.status;
  const [activities, communications, documents, notes] = await Promise.all([
    Activity.find({ 'relatedTo.id': lead._id }).populate('user', 'firstName lastName avatar').sort('-createdAt').limit(30),
    Communication.find({ 'relatedTo.id': lead._id }).populate('user', 'firstName lastName').sort('-createdAt').limit(20),
    Document.find({ 'relatedTo.id': lead._id, isActive: true }).populate('uploadedBy', 'firstName lastName').sort('-createdAt'),
    Note.find({ 'relatedTo.id': lead._id }).populate('user', 'firstName lastName').sort('-createdAt').limit(20),
  ]);
  res.json({ lead: leadObj, activities, communications, documents, notes });
});

export const createLead = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const { customerPassword, ...leadData } = req.body;
  const payload = { ...leadData, createdBy: userId };
  applyLeadStatus(payload, payload.status || 'new');

  const touchingAssignment = 'assignedManager' in req.body || 'assignedTo' in req.body;

  if (touchingAssignment && canPerformAction(role, 'leads', 'assign')) {
    const { assignedManager, assignedTo } = await resolveLeadAssignments(role, userId, {
      assignedManager: payload.assignedManager,
      assignedTo: payload.assignedTo,
    });
    payload.assignedManager = assignedManager;
    payload.assignedTo = assignedTo;
    if (assignedManager || assignedTo) {
      if (payload.status === 'new') applyLeadStatus(payload, 'contacted');
    }
  } else if (role === 'sales') {
    const { assignedManager, assignedTo } = await resolveLeadAssignments(role, userId, {});
    payload.assignedTo = assignedTo;
    payload.assignedManager = assignedManager;
  } else if (role === 'manager') {
    payload.assignedManager = userId;
    delete payload.assignedTo;
  } else {
    delete payload.assignedTo;
    delete payload.assignedManager;
  }

  const lead = await Lead.create(payload);

  // Create customer portal user if password is provided
  let portalUser = null;
  if (customerPassword && customerPassword.length >= 6) {
    const User = (await import('../models/User.js')).default;
    const existingUser = await User.findOne({ email: lead.email });
    if (!existingUser) {
      portalUser = await User.create({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        password: customerPassword,
        phone: lead.phone,
        role: 'customer',
        customerRef: lead.customerRef || null,
        isActive: true,
      });
      lead.portalUser = portalUser._id;
      await lead.save();
      await logActivity(userId, 'user', `Customer portal account created for ${lead.firstName} ${lead.lastName}`, { type: 'lead', id: lead._id });
    }
  }

  const followUp = await ensureLeadFollowUpFromContact(lead, userId, {
    scheduledAt: payload.nextFollowUp,
    activityType: 'phone_call',
    followUpOption: 'first_call',
    title: `New lead: ${lead.firstName} ${lead.lastName}`,
  });
  if (followUp && !lead.nextFollowUp) {
    await Lead.findByIdAndUpdate(lead._id, { nextFollowUp: followUp.scheduledAt });
  }

  await logActivity(userId, 'lead', `New lead created: ${lead.firstName} ${lead.lastName}`, { type: 'lead', id: lead._id });
  if (followUp) {
    await logActivity(userId, 'followup', `Lead follow-up scheduled: ${lead.firstName} ${lead.lastName}`, { type: 'lead', id: lead._id });
  }
  const populated = await populateLeadUsers(Lead.findById(lead._id));
  const result = populated.toObject();
  result.autoFollowUpId = followUp?._id;
  result.portalUserCreated = !!portalUser;
  res.status(201).json(result);
});

export const updateLead = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const lead = await findLeadForRole(role, userId, req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  const updates = { ...req.body };
  const salesAssigningManager = role === 'sales' && 'assignedManager' in req.body;

  if (role === 'sales') {
    delete updates.assignedTo;
    if (!salesAssigningManager) {
      delete updates.assignedManager;
    }
  }

  if (salesAssigningManager) {
    const User = (await import('../models/User.js')).default;
    const managerId = isEmptyAssignId(req.body.assignedManager) ? null : String(req.body.assignedManager);
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== 'manager' || manager.isActive === false) {
        res.status(400);
        throw new Error('Selected user is not a manager');
      }
    }
    updates.assignedManager = managerId;
    if (managerId && lead.status === 'new') {
      applyLeadStatus(updates, 'contacted');
    }
  }

  const touchingAssignment = 'assignedManager' in updates || 'assignedTo' in updates;
  if (touchingAssignment && canPerformAction(role, 'leads', 'assign') && role !== 'sales') {
    const { assignedManager, assignedTo } = await resolveLeadAssignments(
      role,
      userId,
      {
        assignedManager: updates.assignedManager ?? lead.assignedManager,
        assignedTo: updates.assignedTo ?? lead.assignedTo,
      },
      lead
    );
    updates.assignedManager = assignedManager;
    updates.assignedTo = assignedTo;
    if ((assignedManager || assignedTo) && lead.status === 'new') {
      applyLeadStatus(updates, 'contacted');
    }
  } else if (!touchingAssignment) {
    delete updates.assignedTo;
    delete updates.assignedManager;
  } else if (!salesAssigningManager) {
    delete updates.assignedTo;
    delete updates.assignedManager;
  }

  const contactFields = ['firstName', 'lastName', 'email', 'phone', 'alternatePhone', 'website', 'company', 'title', 'industry', 'interestedService', 'description', 'notes', 'priority'];
  const contactChanged = contactFields.some((field) => field in updates);

  if (updates.status) {
    if (updates.status === 'converted_to_deal') {
      res.status(400);
      throw new Error('Use Convert to Deal after moving the lead to Qualified');
    }
    applyLeadStatus(updates, updates.status);
    if (updates.status === 'contacted' || updates.status === 'interested' || updates.status === 'qualified') {
      await completeFollowUpForLead(lead._id);
    }
  }

  if (contactChanged) {
    const updatedForSync = { ...lead.toObject(), ...updates };
    await syncLeadContactToPendingFollowups(updatedForSync);
    await ensureLeadFollowUpFromContact(updatedForSync, userId);
  }

  const updated = await populateLeadUsers(
    Lead.findByIdAndUpdate(lead._id, updates, { new: true, runValidators: true })
  );

  await logActivity(userId, 'lead', `Lead updated: ${updated.firstName} ${updated.lastName}`, { type: 'lead', id: updated._id });
  res.json(updated);
});

export const deleteLead = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const lead = await findLeadForRole(role, userId, req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  if (role !== 'admin') {
    res.status(403);
    throw new Error('Only admin can delete leads');
  }
  await lead.deleteOne();
  res.json({ message: 'Lead removed' });
});

export const assignLeadToManager = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  if (role !== 'admin') {
    res.status(403);
    throw new Error('Only admin can assign leads to managers');
  }
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  const { assignedManager, priority, assignmentDueDate, assignmentRemarks } = req.body;
  if (!assignedManager) {
    res.status(400);
    throw new Error('Manager is required');
  }
  const User = (await import('../models/User.js')).default;
  const manager = await User.findById(assignedManager);
  if (!manager || manager.role !== 'manager') {
    res.status(400);
    throw new Error('Selected user is not a manager');
  }
  lead.assignedManager = assignedManager;
  lead.set('assignedTo', undefined);
  if (priority) lead.priority = priority;
  if (assignmentDueDate) lead.assignmentDueDate = assignmentDueDate;
  if (assignmentRemarks) lead.assignmentRemarks = assignmentRemarks;
  if (lead.status === 'new') applyLeadStatus(lead, 'contacted');
  await lead.save();
  await logActivity(userId, 'lead', `Lead assigned to manager: ${lead.firstName} ${lead.lastName}`, { type: 'lead', id: lead._id });
  const populated = await populateLeadUsers(Lead.findById(lead._id));
  res.json(populated);
});

export const assignLead = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  if (!canPerformAction(role, 'leads', 'assign')) {
    res.status(403);
    throw new Error('Not allowed to assign leads');
  }
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  if (role === 'manager' && String(lead.assignedManager) !== String(userId)) {
    res.status(403);
    throw new Error('This lead is not assigned to you');
  }
  const { assignedTo, priority, assignmentDueDate, assignmentRemarks } = req.body;
  if (!assignedTo) {
    res.status(400);
    throw new Error('Salesperson is required');
  }
  if (role === 'manager') {
    const User = (await import('../models/User.js')).default;
    const assignee = await User.findById(assignedTo).select('reportsTo role isActive');
    if (!assignee || assignee.isActive === false || assignee.role !== 'sales') {
      res.status(400);
      throw new Error('Invalid salesperson');
    }
    if (String(assignee.reportsTo) !== String(userId)) {
      res.status(403);
      throw new Error('Can only assign to your direct reports');
    }
  }
  lead.assignedTo = assignedTo;
  if (priority) lead.priority = priority;
  if (assignmentDueDate) lead.assignmentDueDate = assignmentDueDate;
  if (assignmentRemarks) lead.assignmentRemarks = assignmentRemarks;
  if (lead.status === 'new') applyLeadStatus(lead, 'contacted');
  await lead.save();
  await logActivity(userId, 'lead', `Lead assigned to sales: ${lead.firstName} ${lead.lastName}`, { type: 'lead', id: lead._id });
  const populated = await populateLeadUsers(Lead.findById(lead._id));
  res.json(populated);
});

export const getSalesTeam = asyncHandler(async (req, res) => {
  const { role } = req.user;
  if (!canPerformAction(role, 'leads', 'assign')) {
    res.status(403);
    throw new Error('Not allowed to assign leads');
  }
  const { getSalesTeamMembers } = await import('../utils/salesTeam.js');
  res.json(await getSalesTeamMembers());
});

export const qualifyLead = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const lead = await findLeadForRole(role, userId, req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  lead.qualification = { ...lead.qualification?.toObject?.() || lead.qualification || {}, ...req.body };
  applyLeadStatus(lead, 'qualified');
  if (req.body.probability) lead.score = req.body.score || req.body.probability;
  await lead.save();
  await logActivity(userId, 'lead', `Lead qualified: ${lead.firstName} ${lead.lastName}`, { type: 'lead', id: lead._id });
  res.json(lead);
});

export const convertLeadToDeal = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const lead = await findLeadForRole(role, userId, req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  const leadStatus = normalizeLeadStatus(lead.status, lead.workflowStage);
  if (leadStatus !== 'qualified' && !lead.isQualified) {
    res.status(400);
    throw new Error('Move the lead to Qualified before creating a deal');
  }

  if (canPerformAction(role, 'leads', 'assign')) {
    const { assignedManager, assignedTo } = await resolveLeadAssignments(role, userId, {
      assignedManager: req.body.assignedManager ?? lead.assignedManager,
      assignedTo: req.body.assignedTo ?? lead.assignedTo,
    }, lead);
    lead.assignedManager = assignedManager;
    lead.assignedTo = assignedTo;
  }

  const dealAssignedTo = req.body.assignedTo || undefined;
  const dealAssignedManager = req.body.assignedManager ?? lead.assignedManager ?? undefined;

  let payload;
  try {
    payload = prepareDealPayload({
      ...req.body,
      title: req.body.title || `${lead.company || lead.firstName} - Deal`,
      value: req.body.value ?? lead.budget ?? lead.value ?? 0,
      stage: 'deal_created',
      probability: req.body.probability ?? lead.qualification?.probability ?? lead.score ?? 25,
      lead: lead._id,
      assignedTo: dealAssignedTo,
      assignedManager: dealAssignedManager,
      createdBy: userId,
      description: req.body.description || lead.description || lead.notes,
      expectedCloseDate: req.body.expectedCloseDate,
    });
  } catch (err) {
    res.status(err.statusCode || 400);
    throw err;
  }
  if (!payload.assignedTo) delete payload.assignedTo;
  if (!payload.assignedManager) delete payload.assignedManager;
  const deal = await Deal.create(payload);
  lead.convertedToDeal = deal._id;
  lead.isQualified = true;
  if (!lead.qualification?.probability) {
    lead.qualification = {
      ...(lead.qualification?.toObject?.() || lead.qualification || {}),
      probability: lead.score || 50,
      budgetConfirmed: true,
    };
  }
  applyLeadStatus(lead, 'converted_to_deal');
  await lead.save();
  await linkFollowupsLeadToDeal(lead._id, deal._id);
  await syncFollowUpForDeal(deal, userId, lead);
  await logActivity(userId, 'deal', `Deal created from lead: ${deal.title}`, { type: 'deal', id: deal._id });
  const populatedDeal = await Deal.findById(deal._id)
    .populate('assignedManager', 'firstName lastName email')
    .populate({
      path: 'assignedTo',
      select: 'firstName lastName email avatar reportsTo',
      populate: { path: 'reportsTo', select: 'firstName lastName email' },
    })
    .populate({
      path: 'lead',
      select: 'firstName lastName email company',
      populate: { path: 'assignedManager', select: 'firstName lastName email' },
    });
  res.status(201).json({ deal: populatedDeal, lead });
});

export const exportLeads = asyncHandler(async (req, res) => {
  const query = await buildLeadQuery(req.user.role, req.user._id, req.query);
  const leads = await populateLeadUsers(Lead.find(query)).sort('-createdAt');
  const header = 'Lead ID,Name,Company,Email,Phone,Source,Manager,Sales Rep,Status,Created Date\n';
  const rows = leads.map((l) => [
    l.leadNumber || l._id,
    `"${l.firstName} ${l.lastName}"`,
    `"${l.company || ''}"`,
    l.email,
    l.phone || '',
    l.source,
    l.assignedManager ? `"${l.assignedManager.firstName} ${l.assignedManager.lastName}"` : '',
    l.assignedTo ? `"${l.assignedTo.firstName} ${l.assignedTo.lastName}"` : '',
    l.status,
    new Date(l.createdAt).toISOString().split('T')[0],
  ].join(','));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
  res.send(header + rows.join('\n'));
});

export const convertLead = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const lead = await findLeadForRole(role, userId, req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  if (!canPerformAction(role, 'leads', 'update')) {
    res.status(403);
    throw new Error('Not allowed to convert leads');
  }

  const customer = await Customer.create({
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    title: lead.title,
    companyName: lead.company || '',
    assignedTo: lead.assignedTo,
    createdBy: userId,
    leadRef: lead._id,
  });
  lead.status = 'won';
  lead.workflowStage = 'customer_created';
  lead.convertedToCustomer = customer._id;
  await lead.save();
  await syncFollowUpForCustomer(customer, userId, null, lead._id);
  await logActivity(userId, 'customer', `Lead converted to customer: ${customer.firstName} ${customer.lastName}`, { type: 'customer', id: customer._id });
  res.json({ customer, lead });
});

export const getLeadStats = asyncHandler(async (req, res) => {
  const match = req.user.role === 'manager'
    ? await getManagerLeadScope(req.user._id)
    : getLeadFilterByRole(req.user.role, req.user._id);
  const stats = await Lead.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$value' } } },
  ]);
  res.json(stats);
});

export const getLeadOptions = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'manager'
    ? await getManagerLeadScope(req.user._id)
    : getLeadFilterByRole(req.user.role, req.user._id);
  const leads = await Lead.find(filter)
    .select('firstName lastName email phone alternatePhone website company title industry status priority interestedService assignedTo assignedManager')
    .sort('firstName');
  res.json(leads.map((l) => ({
    _id: l._id,
    label: `${l.firstName} ${l.lastName}${l.company ? ` (${l.company})` : ''}`,
    email: l.email,
    phone: l.phone,
    alternatePhone: l.alternatePhone,
    website: l.website,
    company: l.company,
    title: l.title,
    industry: l.industry,
    firstName: l.firstName,
    lastName: l.lastName,
    status: l.status,
    priority: l.priority,
    interestedService: l.interestedService,
    assignedTo: l.assignedTo,
  })));
});
