import Customer from '../models/Customer.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Deal from '../models/Deal.js';
import Project from '../models/Project.js';
import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Meeting from '../models/Meeting.js';
import SupportTicket from '../models/SupportTicket.js';
import Document from '../models/Document.js';
import Followup from '../models/Followup.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from '../controllers/authController.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';
import { getCustomerFilterByRole, getCustomerIdsForProjects, canAccessCustomer } from '../utils/roleFilters.js';
import { canPerformAction } from '../constants/permissions.js';
import { normalizeDealStage } from '../utils/dealStatus.js';
import {
  getCustomerTechAssignment,
  getCustomerSupportAssignment,
  buildTechAssignedSegmentFilter,
  buildTechUnassignedSegmentFilter,
  buildSupportAssignedSegmentFilter,
  buildSupportUnassignedSegmentFilter,
} from '../utils/customerTechAssignment.js';

const assignedToPopulate = {
  path: 'assignedTo',
  select: 'firstName lastName email role departmentName staffRole',
  populate: { path: 'staffRole', select: 'name code teamGroup department' },
};

const supportAssigneePopulate = {
  path: 'supportAssignee',
  select: 'firstName lastName email role departmentName staffRole',
  populate: { path: 'staffRole', select: 'name code teamGroup department' },
};

const projectTeamPopulate = [
  { path: 'manager', select: 'firstName lastName email role departmentName staffRole', populate: { path: 'staffRole', select: 'name code teamGroup department' } },
  { path: 'assignedTo', select: 'firstName lastName email role' },
  { path: 'supportAssignee', select: 'firstName lastName email role departmentName staffRole', populate: { path: 'staffRole', select: 'name code teamGroup department' } },
];

const formatCustomerLabel = (c) => {
  const name = `${c.firstName} ${c.lastName}`;
  const company = c.companyName || c.company?.name;
  return company ? `${name} (${company})` : name;
};

const buildSegmentCondition = async (segment) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  switch (segment) {
    case 'new':
      return { createdAt: { $gte: thirtyDaysAgo } };
    case 'active':
      return { status: 'active' };
    case 'inactive':
      return { status: 'inactive' };
    case 'vip':
      return { status: 'vip' };
    case 'assigned':
    case 'tech-assigned':
      return await buildTechAssignedSegmentFilter();
    case 'unassigned':
    case 'tech-unassigned':
      return await buildTechUnassignedSegmentFilter();
    case 'support-assigned':
      return await buildSupportAssignedSegmentFilter();
    case 'support-unassigned':
      return await buildSupportUnassignedSegmentFilter();
    case 'project': {
      const dealIds = await Deal.distinct('customer', { customer: { $ne: null }, dealType: 'project' });
      const projectIds = await Project.distinct('customer');
      const merged = [...new Set([...dealIds, ...projectIds].map(String))];
      return { _id: { $in: merged } };
    }
    default:
      return null;
  }
};

const ORDER_STAGES = ['won', 'converted_to_customer', 'advance_payment_received', 'contract_signed'];

const buildQuotationFilter = (customer, dealIds = []) => {
  const or = [{ customer: customer._id }];
  if (customer.leadRef) or.push({ lead: customer.leadRef });
  if (dealIds.length) or.push({ deal: { $in: dealIds } });
  return { $or: or };
};

const buildHubQuotationFilter = async (roleFilter, customerIds) => {
  const customers = await Customer.find(roleFilter).select('leadRef').lean();
  const leadIds = customers.map((c) => c.leadRef).filter(Boolean);
  const dealIds = await Deal.distinct('_id', {
    $or: [
      { customer: { $in: customerIds } },
      ...(leadIds.length ? [{ lead: { $in: leadIds } }] : []),
    ],
  });
  const or = [{ customer: { $in: customerIds } }];
  if (leadIds.length) or.push({ lead: { $in: leadIds } });
  if (dealIds.length) or.push({ deal: { $in: dealIds } });
  return { $or: or };
};

export const getCustomers = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20, segment } = req.query;
  const roleFilter = await getCustomerFilterByRole(req.user.role, req.user._id, req.user);
  const conditions = [roleFilter];
  if (status) conditions.push({ status });
  if (segment && segment !== 'all') {
    const segFilter = await buildSegmentCondition(segment);
    if (segFilter) conditions.push(segFilter);
  }
  if (search) {
    conditions.push({
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ],
    });
  }
  const query = conditions.length === 1 ? conditions[0] : { $and: conditions };
  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query)
    .populate('company', 'name industry')
    .populate(assignedToPopulate)
    .populate(supportAssigneePopulate)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const customerIds = customers.map((c) => c._id);
  const projects = customerIds.length
    ? await Project.find({ customer: { $in: customerIds } })
      .select('customer manager assignedTo supportAssignee updatedAt')
      .populate(projectTeamPopulate)
      .sort('-updatedAt')
      .lean()
    : [];

  const projectByCustomer = {};
  projects.forEach((project) => {
    const key = String(project.customer);
    if (!projectByCustomer[key]) projectByCustomer[key] = project;
  });

  const enriched = customers.map((customer) => {
    const obj = customer.toObject();
    const project = projectByCustomer[String(customer._id)];
    obj.techAssignment = getCustomerTechAssignment(obj, project);
    obj.supportAssignment = getCustomerSupportAssignment(obj, project);
    return obj;
  });

  res.json({ customers: enriched, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
});

export const getCustomerOptions = asyncHandler(async (req, res) => {
  const { forModule } = req.query;
  const filter = forModule === 'projects'
    ? await getCustomerIdsForProjects(req.user.role, req.user._id, req.user)
    : await getCustomerFilterByRole(req.user.role, req.user._id, req.user);

  const customers = await Customer.find(filter)
    .select('firstName lastName email company assignedTo')
    .populate('company', 'name')
    .populate('assignedTo', 'firstName lastName')
    .sort('firstName');

  res.json(customers.map((c) => ({
    _id: c._id,
    label: formatCustomerLabel(c),
    email: c.email,
    assignedTo: c.assignedTo,
  })));
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customerId = req.params.id;
  if (!customerId) {
    res.status(400);
    throw new Error('Customer ID is required');
  }

  const allowed = await canAccessCustomer(req.user.role, req.user._id, customerId, req.user);
  if (!allowed) {
    res.status(404);
    throw new Error('Customer not found or access denied');
  }
  const customer = await Customer.findById(customerId)
    .populate('company')
    .populate('leadRef', 'firstName lastName email phone company leadNumber status source')
    .populate('assignedTo', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName');
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const dealQuery = { $or: [{ customer: customer._id }] };
  if (customer.leadRef) {
    dealQuery.$or.push({ lead: customer.leadRef });
  }

  const [activities, deals, projects, invoices, payments, meetings, tickets, documents, followups] = await Promise.all([
    Activity.find({ 'relatedTo.id': customer._id }).populate('user', 'firstName lastName avatar').sort('-createdAt').limit(50),
    Deal.find(dealQuery)
      .populate('projectRequirements.category', 'name code status')
      .populate('assignedManager', 'firstName lastName email role')
    .populate('assignedTo', 'firstName lastName email')
      .populate('lead', 'firstName lastName company leadNumber')
      .sort('-createdAt'),
    Project.find({ customer: customer._id })
      .populate('category', 'name code status')
      .populate('manager', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email')
      .sort('-createdAt'),
    Invoice.find({ customer: customer._id }).sort('-createdAt'),
    Payment.find({ customer: customer._id }).sort('-createdAt'),
    Meeting.find({ customer: customer._id }).populate('assignedTo', 'firstName lastName').sort('-scheduledAt'),
    SupportTicket.find({ customer: customer._id }).sort('-createdAt'),
    Document.find({ 'relatedTo.id': customer._id, 'relatedTo.type': 'customer' }).sort('-createdAt'),
    Followup.find({ customer: customer._id }).populate('assignedTo', 'firstName lastName').sort('-scheduledAt'),
  ]);

  const dealIds = deals.map((d) => d._id);
  const quotations = await Quotation.find(buildQuotationFilter(customer, dealIds))
    .populate('deal', 'title stage dealType value')
    .sort('-createdAt');

  const deliverySummary = deals.map((deal) => ({
    dealId: deal._id,
    title: deal.title,
    dealType: 'project',
    stage: normalizeDealStage(deal.stage),
    value: deal.value,
    projectRequirements: deal.projectRequirements || null,
  }));

  const orders = deals.filter((d) => ORDER_STAGES.includes(normalizeDealStage(d.stage)));

  const timeline = [
    ...activities.map((a) => ({ type: 'activity', title: a.title, date: a.createdAt, id: a._id })),
    ...followups.map((f) => ({ type: 'followup', title: f.title, date: f.scheduledAt, status: f.status, id: f._id })),
    ...deals.map((d) => ({ type: 'deal', title: d.title, date: d.updatedAt || d.createdAt, stage: normalizeDealStage(d.stage), id: d._id })),
    ...quotations.map((q) => ({ type: 'quotation', title: q.title || q.quotationNumber, date: q.createdAt, status: q.status, id: q._id })),
    ...meetings.map((m) => ({ type: 'meeting', title: m.title, date: m.scheduledAt, id: m._id })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    customer,
    activities,
    deals: deals.map((d) => ({ ...d.toObject(), stage: normalizeDealStage(d.stage) })),
    projects,
    deliverySummary,
    quotations,
    invoices,
    payments,
    meetings,
    tickets,
    documents,
    followups,
    orders: orders.map((d) => ({ ...d.toObject(), stage: normalizeDealStage(d.stage) })),
    timeline,
  });
});

export const getCustomerHub = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const roleFilter = await getCustomerFilterByRole(req.user.role, req.user._id, req.user);
  const customerIds = await Customer.find(roleFilter).distinct('_id');
  const cid = { $in: customerIds };

  const populateCustomer = { path: 'customer', select: 'firstName lastName email companyName' };

  switch (type) {
    case 'followups': {
      const items = await Followup.find({ customer: cid }).populate(populateCustomer).sort('-scheduledAt').limit(100);
      return res.json({ items });
    }
    case 'meetings': {
      const items = await Meeting.find({ customer: cid }).populate(populateCustomer).sort('-scheduledAt').limit(100);
      return res.json({ items });
    }
    case 'quotations': {
      const qFilter = await buildHubQuotationFilter(roleFilter, customerIds);
      const items = await Quotation.find(qFilter)
        .populate(populateCustomer)
        .populate('deal', 'title stage')
        .sort('-createdAt')
        .limit(100);
      return res.json({ items });
    }
    case 'orders': {
      const items = await Deal.find({ customer: cid, stage: { $in: ORDER_STAGES } }).populate(populateCustomer).sort('-updatedAt').limit(100);
      return res.json({ items: items.map((d) => ({ ...d.toObject(), stage: normalizeDealStage(d.stage) })) });
    }
    case 'projects': {
      const items = await Project.find({ customer: cid }).populate(populateCustomer).sort('-createdAt').limit(100);
      return res.json({ items });
    }
    case 'invoices': {
      const items = await Invoice.find({ customer: cid }).populate(populateCustomer).sort('-createdAt').limit(100);
      return res.json({ items });
    }
    case 'payments': {
      const items = await Payment.find({ customer: cid }).populate(populateCustomer).sort('-createdAt').limit(100);
      return res.json({ items });
    }
    case 'tickets': {
      const items = await SupportTicket.find({ customer: cid }).populate(populateCustomer).sort('-createdAt').limit(100);
      return res.json({ items });
    }
    case 'documents': {
      const items = await Document.find({ 'relatedTo.id': { $in: customerIds }, 'relatedTo.type': 'customer' }).sort('-createdAt').limit(100);
      return res.json({ items });
    }
    case 'notes': {
      const items = await Customer.find({ ...roleFilter, notes: { $exists: true, $ne: '' } })
        .select('firstName lastName email notes updatedAt')
        .sort('-updatedAt')
        .limit(100);
      return res.json({ items });
    }
    case 'timeline': {
      const activities = await Activity.find({ 'relatedTo.id': { $in: customerIds } }).sort('-createdAt').limit(50);
      const followups = await Followup.find({ customer: cid }).sort('-scheduledAt').limit(50);
      const items = [
        ...activities.map((a) => ({ type: 'activity', title: a.title, date: a.createdAt })),
        ...followups.map((f) => ({ type: 'followup', title: f.title, date: f.scheduledAt })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json({ items });
    }
    case 'reports': {
      const [total, active, vip, withDeals, withProjects] = await Promise.all([
        Customer.countDocuments(roleFilter),
        Customer.countDocuments({ ...roleFilter, status: 'active' }),
        Customer.countDocuments({ ...roleFilter, status: 'vip' }),
        Deal.countDocuments({ customer: cid }),
        Project.countDocuments({ customer: cid }),
      ]);
      return res.json({ stats: { total, active, vip, withDeals, withProjects } });
    }
    default:
      res.status(400);
      throw new Error('Unknown hub type');
  }
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { customerPassword, ...customerData } = req.body;
  const data = { ...customerData, createdBy: req.user._id };
  if (req.user.role === 'sales') {
    data.assignedTo = req.user._id;
  }
  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/customers');
    data.avatar = result.url;
  }
  const customer = await Customer.create(data);

  // Create customer portal user if password is provided
  let portalUser = null;
  if (customerPassword && customerPassword.length >= 6) {
    const existingUser = await User.findOne({ email: customer.email });
    if (!existingUser) {
      portalUser = await User.create({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        password: customerPassword,
        phone: customer.phone,
        role: 'customer',
        customerRef: customer._id,
        isActive: true,
      });
      customer.portalUser = portalUser._id;
      await customer.save();
      await logActivity(req.user._id, 'user', `Customer portal account created for ${customer.firstName} ${customer.lastName}`, { type: 'customer', id: customer._id });
    }
  }

  await logActivity(req.user._id, 'customer', `New customer: ${customer.firstName} ${customer.lastName}`, { type: 'customer', id: customer._id });
  const result = customer.toObject();
  result.portalUserCreated = !!portalUser;
  res.status(201).json(result);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const { role } = req.user;
  const allowed = await canAccessCustomer(req.user.role, req.user._id, req.params.id, req.user);
  if (!allowed) {
    res.status(404);
    throw new Error('Customer not found');
  }
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  const updates = { ...req.body };
  if (role === 'sales') {
    if (updates.assignedTo) {
      const managerUser = await User.findById(updates.assignedTo).select('role');
      if (!managerUser || managerUser.role !== 'manager') {
        res.status(400);
        throw new Error('Sales can only assign customers to a manager');
      }
    }
  } else if (!canPerformAction(role, 'customers', 'assign')) {
    delete updates.assignedTo;
  }
  Object.assign(customer, updates);
  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/customers');
    customer.avatar = result.url;
  }
  await customer.save();
  res.json(customer);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const allowed = await canAccessCustomer(req.user.role, req.user._id, req.params.id, req.user);
  if (!allowed) {
    res.status(404);
    throw new Error('Customer not found');
  }
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  await customer.deleteOne();
  res.json({ message: 'Customer removed' });
});
