import Deal from '../models/Deal.js';
import Lead from '../models/Lead.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from '../controllers/authController.js';
import { getDealFilterByRole, findDealForRole } from '../utils/roleFilters.js';
import { canPerformAction } from '../constants/permissions.js';
import { applyDealStage, normalizeDealStage, stageFilterValues } from '../utils/dealStatus.js';
import { prepareDealPayload, prepareDealUpdatePayload } from '../utils/dealPayload.js';
import {
  linkFollowupsLeadToDeal,
  syncFollowUpForDeal,
} from '../utils/followupSync.js';
import { ensureCustomerFromDeal } from '../utils/dealCustomer.js';
import { copyDealRequirementsToProject } from '../utils/projectDocuments.js';
import { syncQuotationOnDealStage } from '../utils/dealQuotation.js';

const buildDealQuery = (role, userId, { stage, search, assigned, unassigned } = {}) => {
  const roleFilter = getDealFilterByRole(role, userId);
  const andClauses = [];
  if (Object.keys(roleFilter).length) andClauses.push(roleFilter);
  if (stage) {
    const values = stageFilterValues(stage);
    andClauses.push({ stage: { $in: values } });
  }
  if (assigned === 'true') {
    andClauses.push({ assignedTo: { $exists: true, $ne: null } });
  }
  if (unassigned === 'true') {
    andClauses.push({ $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }] });
  }
  if (search) andClauses.push({ title: { $regex: search, $options: 'i' } });
  if (!andClauses.length) return {};
  if (andClauses.length === 1) return andClauses[0];
  return { $and: andClauses };
};

const formatDeal = (deal) => {
  const doc = deal.toObject ? deal.toObject() : { ...deal };
  doc.stage = normalizeDealStage(doc.stage);
  return doc;
};

const populateDealRelations = (query) => query
  .populate('customer', 'firstName lastName email companyName phone title')
  .populate('company', 'name')
  .populate({
    path: 'lead',
    select: 'firstName lastName email phone alternatePhone website company title industry status',
    populate: { path: 'assignedManager', select: 'firstName lastName email' },
  })
  .populate('assignedManager', 'firstName lastName email')
  .populate({
    path: 'assignedTo',
    select: 'firstName lastName email avatar reportsTo',
    populate: { path: 'reportsTo', select: 'firstName lastName email' },
  });

export const getDeals = asyncHandler(async (req, res) => {
  const { stage, search, assigned, unassigned } = req.query;
  const query = buildDealQuery(req.user.role, req.user._id, { stage, search, assigned, unassigned });
  const deals = await populateDealRelations(Deal.find(query)).sort('-createdAt');
  res.json(deals.map(formatDeal));
});

export const getDeal = asyncHandler(async (req, res) => {
  const deal = await findDealForRole(req.user.role, req.user._id, req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }
  const populated = await populateDealRelations(Deal.findById(deal._id))
    .populate('contact')
    .populate('createdBy', 'firstName lastName')
    .populate('projectRequirements.category', 'name code status');
  res.json(formatDeal(populated));
});

export const createDeal = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const { customerPassword, ...dealData } = req.body;
  let payload;
  try {
    payload = prepareDealPayload({ ...dealData, createdBy: userId });
  } catch (err) {
    res.status(err.statusCode || 400);
    throw err;
  }
  applyDealStage(payload, payload.stage || 'deal_created');

  if (role === 'sales') {
    payload.assignedTo = userId;
  } else {
    if (!payload.assignedTo) delete payload.assignedTo;
    if (!payload.assignedManager) delete payload.assignedManager;
  }

  const deal = await Deal.create(payload);

  // Create customer portal user if password is provided
  let portalUser = null;
  let customerEmail = null;
  if (deal.customer) {
    const Customer = (await import('../models/Customer.js')).default;
    const customer = await Customer.findById(deal.customer);
    if (customer) customerEmail = customer.email;
  } else if (deal.lead) {
    const leadDoc = await Lead.findById(deal.lead);
    if (leadDoc) customerEmail = leadDoc.email;
  }

  if (customerPassword && customerPassword.length >= 6 && customerEmail) {
    const existingUser = await User.findOne({ email: customerEmail });
    if (!existingUser) {
      const customerName = deal.customer 
        ? (await (await import('../models/Customer.js')).default.findById(deal.customer))
        : (deal.lead ? await Lead.findById(deal.lead) : null);
      
      portalUser = await User.create({
        firstName: customerName?.firstName || 'Customer',
        lastName: customerName?.lastName || 'User',
        email: customerEmail,
        password: customerPassword,
        role: 'customer',
        isActive: true,
      });
      deal.portalUser = portalUser._id;
      await deal.save();
      await logActivity(userId, 'user', `Customer portal account created for deal: ${deal.title}`, { type: 'deal', id: deal._id });
    }
  }

  if (deal.lead) {
    const leadDoc = await Lead.findById(deal.lead);
    await linkFollowupsLeadToDeal(deal.lead, deal._id);
    await syncFollowUpForDeal(deal, userId, leadDoc);
  } else {
    await syncFollowUpForDeal(deal, userId);
  }
  await logActivity(userId, 'deal', `New deal: ${deal.title}`, { type: 'deal', id: deal._id });
  const populated = await populateDealRelations(Deal.findById(deal._id));
  const result = formatDeal(populated);
  result.portalUserCreated = !!portalUser;
  res.status(201).json(result);
});

export const updateDeal = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const deal = await findDealForRole(role, userId, req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  const existing = await Deal.findById(deal._id);
  let updates;
  try {
    updates = prepareDealUpdatePayload(existing, req.body);
  } catch (err) {
    res.status(err.statusCode || 400);
    throw err;
  }

  if (role === 'sales') delete updates.assignedTo;
  if (!canPerformAction(role, 'deals', 'assign')) {
    delete updates.assignedTo;
    delete updates.assignedManager;
  }
  if (!updates.assignedManager) delete updates.assignedManager;
  if (updates.stage) applyDealStage(updates, updates.stage);
  delete updates.createdBy;
  delete updates.lead;

  const updated = await Deal.findByIdAndUpdate(deal._id, updates, { new: true, runValidators: true });
  if (normalizeDealStage(updated.stage) === 'quotation_sent') {
    await syncQuotationOnDealStage(updated, userId);
  }
  const populated = await populateDealRelations(Deal.findById(updated._id))
    .populate('projectRequirements.category', 'name code status');
  res.json(formatDeal(populated));
});

export const assignDeal = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  if (!canPerformAction(role, 'deals', 'assign')) {
    res.status(403);
    throw new Error('Not allowed to assign deals');
  }
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }
  const { assignedTo } = req.body;
  if (!assignedTo) {
    res.status(400);
    throw new Error('Salesperson is required');
  }
  deal.assignedTo = assignedTo;
  if (!deal.assignedManager) {
    const assignee = await User.findById(assignedTo).select('reportsTo');
    if (assignee?.reportsTo) deal.assignedManager = assignee.reportsTo;
  }
  await deal.save();
  await logActivity(userId, 'deal', `Deal assigned: ${deal.title}`, { type: 'deal', id: deal._id });
  const populated = await populateDealRelations(Deal.findById(deal._id));
  res.json(formatDeal(populated));
});

export const updateDealStage = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const { stage } = req.body;
  const deal = await findDealForRole(role, userId, req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }
  if (!canPerformAction(role, 'deals', 'update')) {
    res.status(403);
    throw new Error('Not allowed to move deals');
  }

  applyDealStage(deal, stage);

  if (deal.stage === 'won' && deal.lead) {
    await Lead.findByIdAndUpdate(deal.lead, { status: 'converted_to_deal', workflowStage: 'converted_to_deal' });
  }
  if (deal.stage === 'lost' && deal.lead) {
    await Lead.findByIdAndUpdate(deal.lead, { status: 'not_interested', workflowStage: 'not_interested' });
  }
  await deal.save();
  if (['proposal_sent', 'negotiation', 'quotation_sent', 'customer_approval'].includes(deal.stage)) {
    const leadDoc = deal.lead ? await Lead.findById(deal.lead) : null;
    await syncFollowUpForDeal(deal, userId, leadDoc);
  }

  let quotationSync = null;
  if (normalizeDealStage(deal.stage) === 'quotation_sent') {
    quotationSync = await syncQuotationOnDealStage(deal, userId);
  }

  let conversion = null;
  if (normalizeDealStage(deal.stage) === 'converted_to_customer' && deal.customer) {
    conversion = await ensureCustomerFromDeal(deal, userId);
    if (conversion.created) {
      await logActivity(userId, 'customer', `Customer created from deal: ${conversion.customer.firstName} ${conversion.customer.lastName}`, { type: 'customer', id: conversion.customer._id });
    }
  }

  await logActivity(userId, 'deal', `Deal moved to ${deal.stage.replace(/_/g, ' ')}: ${deal.title}`, { type: 'deal', id: deal._id });

  const populated = await Deal.findById(deal._id)
    .populate('customer', 'firstName lastName email phone title companyName')
    .populate('lead', 'firstName lastName company email phone')
    .populate('assignedTo', 'firstName lastName email avatar');
  const response = formatDeal(populated);
  if (conversion?.customer) {
    response.convertedCustomer = conversion.customer;
    response.customerCreated = conversion.created;
  }
  if (quotationSync?.quotation) {
    response.quotation = quotationSync.quotation;
    response.quotationCreated = quotationSync.created;
  }
  res.json(response);
});

export const deleteDeal = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const deal = await findDealForRole(role, userId, req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }
  if (role !== 'admin') {
    res.status(403);
    throw new Error('Only admin can delete deals');
  }
  await deal.deleteOne();
  res.json({ message: 'Deal removed' });
});

export const getPipelineStats = asyncHandler(async (req, res) => {
  const match = getDealFilterByRole(req.user.role, req.user._id);
  const stats = await Deal.aggregate([
    { $match: match },
    { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$value' } } },
  ]);
  res.json(stats.map((s) => ({ ...s, _id: normalizeDealStage(s._id) })));
});

export const convertDealToCustomer = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const deal = await findDealForRole(role, userId, req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }
  const stage = normalizeDealStage(deal.stage);
  if (stage === 'lost') {
    res.status(400);
    throw new Error('Cannot convert a lost deal to customer');
  }

  if (role === 'sales' && req.body.assignedTo) {
    const managerUser = await User.findById(req.body.assignedTo).select('role');
    if (!managerUser || managerUser.role !== 'manager') {
      res.status(400);
      throw new Error('Sales can only assign customer to a manager');
    }
  }

  const { customer, deal: updatedDeal, created } = await ensureCustomerFromDeal(deal, userId, { body: req.body });

  if (created) {
    await logActivity(userId, 'customer', `Customer created from deal: ${customer.firstName} ${customer.lastName}`, { type: 'customer', id: customer._id });
  }

  const result = await Deal.findById(updatedDeal._id)
    .populate('customer')
    .populate('lead')
    .populate('assignedTo', 'firstName lastName email');
  res.status(created ? 201 : 200).json({ customer, deal: formatDeal(result), message: created ? 'Customer created' : 'Customer already linked' });
});

export const createProjectFromDeal = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const deal = await findDealForRole(role, userId, req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  const fullDeal = await Deal.findById(deal._id).populate('customer');
  if (!fullDeal.customer) {
    res.status(400);
    throw new Error('Create a customer from this deal first');
  }
  const project = await Project.create({
    name: req.body.name || fullDeal.projectRequirements?.name || `${fullDeal.title} — Delivery`,
    description: req.body.description || fullDeal.projectRequirements?.description || fullDeal.description,
    scope: req.body.scope || fullDeal.projectRequirements?.scope,
    deliverables: req.body.deliverables || fullDeal.projectRequirements?.deliverables,
    category: req.body.category || fullDeal.projectRequirements?.category,
    customer: fullDeal.customer._id,
    dealRef: fullDeal._id,
    budget: fullDeal.projectRequirements?.estimatedBudget || fullDeal.value || 0,
    technologyStack: fullDeal.projectRequirements?.technologyStack || [],
    startDate: fullDeal.projectRequirements?.startDate,
    endDate: fullDeal.projectRequirements?.endDate,
    priority: fullDeal.projectRequirements?.priority || 'medium',
    workflowStage: 'project_started',
    status: 'planning',
    manager: req.body.manager || (role === 'manager' ? userId : undefined),
    assignedTo: req.body.assignedTo || [],
    createdBy: userId,
  });

  await copyDealRequirementsToProject(fullDeal._id, project._id);

  if (fullDeal.lead) {
    await Lead.findByIdAndUpdate(fullDeal.lead, { workflowStage: 'project_started' });
  }

  await logActivity(userId, 'project', `Project created from deal: ${project.name}`, { type: 'project', id: project._id });
  res.status(201).json({ project, deal: fullDeal });
});

export const assignProjectFromDeal = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  if (!['admin', 'manager'].includes(role)) {
    res.status(403);
    throw new Error('Only admin or manager can assign projects to the technical team');
  }

  const deal = await findDealForRole(role, userId, req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  const fullDeal = await Deal.findById(deal._id).populate('customer').populate('lead');
  if (!fullDeal.customer) {
    res.status(400);
    throw new Error('Convert this deal to a customer first');
  }

  const { assignedTo = [] } = req.body;
  if (!Array.isArray(assignedTo) || !assignedTo.length) {
    res.status(400);
    throw new Error('Select at least one technical team member');
  }

  const User = (await import('../models/User.js')).default;
  const techCount = await User.countDocuments({
    _id: { $in: assignedTo },
    role: 'technical',
    isActive: { $ne: false },
  });
  if (techCount !== assignedTo.length) {
    res.status(400);
    throw new Error('All assignees must be active technical team members');
  }

  const reqFields = fullDeal.projectRequirements || {};
  let project = await Project.findOne({ dealRef: fullDeal._id });
  const created = !project;

  const projectData = {
    name: req.body.name || reqFields.name || `${fullDeal.title} — Delivery`,
    description: req.body.description || reqFields.description || fullDeal.description,
    scope: req.body.scope ?? reqFields.scope,
    deliverables: req.body.deliverables ?? reqFields.deliverables,
    category: req.body.category || reqFields.category,
    customer: fullDeal.customer._id,
    dealRef: fullDeal._id,
    budget: reqFields.estimatedBudget || fullDeal.value || 0,
    technologyStack: reqFields.technologyStack || [],
    startDate: reqFields.startDate,
    endDate: reqFields.endDate,
    priority: reqFields.priority || 'medium',
    workflowStage: 'project_started',
    manager: req.body.manager || userId,
    assignedTo,
    status: 'development',
  };

  if (project) {
    Object.assign(project, projectData);
    await project.save();
  } else {
    project = await Project.create({ ...projectData, createdBy: userId });
  }

  await copyDealRequirementsToProject(fullDeal._id, project._id);

  if (fullDeal.lead) {
    await Lead.findByIdAndUpdate(fullDeal.lead._id || fullDeal.lead, { workflowStage: 'project_started' });
  }

  await logActivity(userId, 'project', `Project assigned to technical team: ${project.name}`, { type: 'project', id: project._id });

  const populated = await Project.findById(project._id)
    .populate('customer', 'firstName lastName email companyName')
    .populate('assignedTo', 'firstName lastName email')
    .populate('manager', 'firstName lastName email')
    .populate('category', 'name code');

  res.status(created ? 201 : 200).json({ project: populated, deal: formatDeal(fullDeal), created });
});
