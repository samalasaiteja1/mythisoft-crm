import SupportTicket from '../models/SupportTicket.js';
import Activity from '../models/Activity.js';
import Customer from '../models/Customer.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { createCrudController } from '../utils/crudFactory.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity, createNotification } from './authController.js';
import { getTicketFilterByRole, getCustomerRefId } from '../utils/roleFilters.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';
import { isSupportManager, isTechnicalManager } from '../utils/managerScope.js';
import {
  ALL_TICKET_ISSUE_CATEGORIES,
  issueCategoryGroup,
  isChangeRequestCategory,
} from '../constants/supportTickets.js';

const baseCtrl = createCrudController(SupportTicket, {
  module: 'ticket',
  populate: ['customer', 'project', 'supportAssignee', 'technicalAssignee', 'createdBy', 'comments.author'],
  searchFields: ['ticketNumber', 'subject', 'description'],
});

const populateFields = ['customer', 'project', 'supportAssignee', 'technicalAssignee', 'createdBy', 'comments.author'];

const populateQuery = (query) => {
  populateFields.forEach((p) => {
    if (p === 'supportAssignee' || p === 'technicalAssignee') {
      query = query.populate(p, 'firstName lastName email phone avatar role');
    } else if (p === 'project') {
      query = query.populate({
        path: 'project',
        select: 'name status workflowStage manager supportExecutiveAssignee technicalSupportAssignee supportTeamAssignees supportAssignee supportStaffRole',
        populate: [
          { path: 'manager', select: 'firstName lastName email' },
          { path: 'supportExecutiveAssignee', select: 'firstName lastName email role' },
          { path: 'technicalSupportAssignee', select: 'firstName lastName email role staffRole' },
          { path: 'supportTeamAssignees', select: 'firstName lastName email role staffRole' },
          { path: 'supportStaffRole', select: 'name code memberRoleLabels' },
        ],
      });
    } else {
      query = query.populate(p);
    }
  });
  return query;
};

const idStr = (ref) => (ref ? String(ref._id || ref) : '');

async function getProjectSupportTeamIds(project) {
  if (!project) return null;
  const ids = new Set();
  if (project.supportExecutiveAssignee) ids.add(idStr(project.supportExecutiveAssignee));
  if (project.technicalSupportAssignee) ids.add(idStr(project.technicalSupportAssignee));
  if (project.supportAssignee) ids.add(idStr(project.supportAssignee));
  (project.supportTeamAssignees || []).forEach((u) => {
    const id = idStr(u);
    if (id) ids.add(id);
  });
  if (ids.size) return [...ids];

  const staffRoleId = idStr(project.supportStaffRole);
  if (staffRoleId) {
    const members = await User.find({
      role: { $in: ['support', 'technical'] },
      isActive: { $ne: false },
      staffRole: staffRoleId,
    }).distinct('_id');
    if (members.length) return members.map(String);
  }
  return null;
}

async function assertSupportAssigneeOnProject(projectId, assigneeId) {
  if (!projectId || !assigneeId) return;
  const project = await Project.findById(projectId)
    .select('supportExecutiveAssignee supportAssignee supportTeamAssignees supportStaffRole')
    .lean();
  const allowed = await getProjectSupportTeamIds(project);
  if (allowed && !allowed.includes(String(assigneeId))) {
    const err = new Error('Assignee must be on the project support team');
    err.statusCode = 400;
    throw err;
  }
}

async function assertAssigneeOnSupportTeam(assigneeId, staffRoleId) {
  if (!staffRoleId || !assigneeId) return false;
  const User = (await import('../models/User.js')).default;
  const count = await User.countDocuments({
    _id: assigneeId,
    staffRole: staffRoleId,
    role: { $in: ['support', 'technical'] },
    isActive: { $ne: false },
  });
  return count > 0;
}

async function notifyTicketCustomer(ticket, title, message, path) {
  const customer = await Customer.findById(ticket.customer).select('portalUser firstName lastName').lean();
  const portalUserId = customer?.portalUser;
  if (!portalUserId) return;
  const link = path || (ticket.requestKind === 'change_request'
    ? `/change-requests/${ticket._id}`
    : `/tickets/${ticket._id}`);
  await createNotification(portalUserId, title, message, 'ticket', link);
}

function isTicketWorker(user, ticket) {
  const uid = idStr(user?._id);
  if (!uid) return false;
  return uid === idStr(ticket.supportAssignee) || uid === idStr(ticket.technicalAssignee);
}

const WORKER_STATUS_TRANSITIONS = {
  assigned: 'accepted',
  accepted: 'working',
  working: 'completed',
};

function canManageTicketWorkflow(user, ticket) {
  if (!user || !ticket) return false;
  if (user.role === 'admin') return true;
  if (isSupportManager(user)) return true;
  if (isTechnicalManager(user)) return true;
  if (user.role === 'support') return true;
  if (user.role === 'technical') {
    const assigneeId = idStr(ticket.technicalAssignee);
    return assigneeId && assigneeId === idStr(user._id);
  }
  return false;
}

const assertCustomerTicketAccess = (req, ticket) => {
  if (req.user.role !== 'customer') return true;
  const customerId = getCustomerRefId(req.user);
  return customerId && ticket?.customer && String(ticket.customer._id || ticket.customer) === customerId;
};

const assertTicketRoleAccess = async (req, ticket) => {
  if (!ticket || !assertCustomerTicketAccess(req, ticket)) return false;
  if (req.user.role === 'customer') return true;
  const roleFilter = await getTicketFilterByRole(req.user.role, req.user, req.user._id);
  if (!Object.keys(roleFilter).length) return true;
  const allowed = await SupportTicket.findOne({ _id: ticket._id, ...roleFilter });
  return Boolean(allowed);
};

const uploadTicketAttachments = async (files, userId) => {
  if (!files?.length) return [];
  const attachments = [];
  for (const file of files) {
    const result = await uploadBufferToCloudinary(file.buffer, 'mythisoft-crm/ticket-attachments', {
      originalname: file.originalname,
    });
    attachments.push({
      name: file.originalname,
      url: result.url,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: userId,
    });
  }
  return attachments;
};

export const getAll = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20, requestKind, excludeChangeRequests, ...filters } = req.query;
  const roleFilter = await getTicketFilterByRole(req.user.role, req.user, req.user._id);
  const query = { ...filters, ...roleFilter };
  if (status) query.status = status;
  if (requestKind) query.requestKind = requestKind;
  if (excludeChangeRequests === 'true') query.requestKind = { $ne: 'change_request' };
  if (search) {
    query.$or = ['ticketNumber', 'subject', 'description'].map((f) => ({ [f]: { $regex: search, $options: 'i' } }));
  }
  const total = await SupportTicket.countDocuments(query);
  let q = SupportTicket.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
  q = populateQuery(q);
  const items = await q;
  res.json({ items, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
});

export const getOne = asyncHandler(async (req, res) => {
  let q = SupportTicket.findById(req.params.id);
  q = populateQuery(q);
  const item = await q;
  if (!item || !(await assertTicketRoleAccess(req, item))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (req.user.role === 'customer') {
    item.comments = item.comments.filter((c) => !c.isInternal);
  }
  res.json(item);
});

export const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id };
  if (req.files?.length) {
    data.attachments = await uploadTicketAttachments(req.files, req.user._id);
  }
  if (req.user.role === 'customer') {
    const customerId = getCustomerRefId(req.user);
    if (!customerId) {
      res.status(400);
      throw new Error('Customer account is not linked to a customer profile');
    }
    data.customer = customerId;
    data.status = 'open';
    data.requestKind = data.requestKind || 'customer_ticket';
    delete data.supportAssignee;
    delete data.technicalAssignee;

    if (!data.project) {
      res.status(400);
      throw new Error('Project is required');
    }
    if (!data.subject?.trim()) {
      res.status(400);
      throw new Error('Subject is required');
    }
    if (!data.description?.trim()) {
      res.status(400);
      throw new Error('Description is required');
    }
    if (!data.category?.trim()) {
      res.status(400);
      throw new Error('Issue category is required');
    }
    if (!ALL_TICKET_ISSUE_CATEGORIES.includes(data.category)) {
      res.status(400);
      throw new Error('Invalid issue category');
    }
    if (data.module && !data.module.trim()) delete data.module;

    data.issueCategoryGroup = issueCategoryGroup(data.category);
    if (isChangeRequestCategory(data.category)) {
      data.requestKind = 'change_request';
      data.updateRequestType = 'enhancement';
    }

    const project = await Project.findById(data.project).select('supportAssignee name customer').lean();
    if (!project || String(project.customer) !== String(customerId)) {
      res.status(400);
      throw new Error('Invalid project for this customer');
    }

    if (data.requestKind === 'change_request' && project?.supportAssignee) {
      // Change requests still notify SM; assignment happens on review
    }
  } else if (data.category) {
    data.issueCategoryGroup = issueCategoryGroup(data.category) || data.issueCategoryGroup;
  }

  const item = await SupportTicket.create(data);
  const logLabel = item.requestKind === 'change_request' ? 'change request' : 'ticket';
  await logActivity(req.user._id, 'ticket', `Created ${logLabel}: ${item.ticketNumber || item.subject}`, { type: 'ticket', id: item._id });

  if (req.user.role === 'customer') {
    const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Customer';
    const project = item.project
      ? await Project.findById(item.project).select('name supportAssignee').lean()
      : null;

    const notifyIds = new Set();
    if (project?.supportAssignee) notifyIds.add(String(project.supportAssignee));

    const customer = await Customer.findById(item.customer).select('supportAssignee').lean();
    if (customer?.supportAssignee) notifyIds.add(String(customer.supportAssignee));

    const supportManagers = await User.find({
      role: 'manager',
      isActive: { $ne: false },
    }).select('departmentName staffRole hrProfile designation').populate('staffRole', 'department name code').lean();
    supportManagers.filter((u) => isSupportManager(u)).forEach((u) => notifyIds.add(String(u._id)));

    await Promise.all([...notifyIds].map((uid) => createNotification(
      uid,
      item.requestKind === 'change_request' ? 'New change request' : 'New support ticket',
      `${actorName} submitted ${item.ticketNumber}: ${item.subject}`,
      'ticket',
      `/tickets/${item._id}`,
    )));
  } else if (item.supportAssignee) {
    const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Staff';
    const title = item.requestKind === 'change_request' ? 'New change request' : 'New support ticket';
    await createNotification(
      item.supportAssignee,
      title,
      `${actorName} submitted ${item.ticketNumber}: ${item.subject}`,
      'ticket',
      `/tickets/${item._id}`,
    );
  }

  if (item.requestKind === 'change_request' && item.project && !item.supportAssignee && req.user.role !== 'customer') {
    const project = await Project.findById(item.project).select('supportAssignee name').lean();
    if (project?.supportAssignee) {
      await createNotification(
        project.supportAssignee,
        'New change request',
        `Change request ${item.ticketNumber} for project ${project.name || ''}: ${item.subject}`,
        'ticket',
        `/tickets/${item._id}`,
      );
    }
  }

  let q = SupportTicket.findById(item._id);
  q = populateQuery(q);
  res.status(201).json(await q);
});

export const update = asyncHandler(async (req, res) => {
  const existing = await SupportTicket.findById(req.params.id);
  if (!existing || !(await assertTicketRoleAccess(req, existing))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (req.user.role === 'customer') {
    const allowed = ['description'];
    Object.keys(req.body).forEach((key) => {
      if (!allowed.includes(key)) delete req.body[key];
    });
  } else if (req.body.status && req.body.status !== existing.status) {
    await logActivity(
      req.user._id,
      'ticket',
      `Ticket ${existing.ticketNumber} status: ${existing.status} → ${req.body.status}`,
      { type: 'ticket', id: existing._id },
    );
  }
  let q = SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  q = populateQuery(q);
  const item = await q;
  res.json(item);
});

export const remove = baseCtrl.remove;

export const addComment = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  const isInternal = req.user.role === 'customer' ? false : Boolean(req.body.isInternal);
  ticket.comments.push({ author: req.user._id, message: req.body.message, isInternal });
  await ticket.save();
  await logActivity(
    req.user._id,
    'ticket',
    `${req.user.role === 'customer' ? 'Customer reply' : 'Support reply'} on ${ticket.ticketNumber}`,
    { type: 'ticket', id: ticket._id },
    req.body.message?.slice(0, 200) || '',
  );
  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  if (req.user.role === 'customer') {
    populated.comments = populated.comments.filter((c) => !c.isInternal);
  }
  res.json(populated);
});

export const escalateTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id).populate('project', 'name manager supportAssignee');
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (!canManageTicketWorkflow(req.user, ticket)) {
    res.status(403);
    throw new Error('Not authorized to escalate this ticket');
  }
  if (['closed', 'waiting_customer', 'resolved'].includes(ticket.status)) {
    res.status(400);
    throw new Error('Ticket cannot be escalated in its current status');
  }

  const { notes } = req.body;
  ticket.escalated = true;
  ticket.priority = ticket.priority === 'critical' ? 'critical' : 'high';
  ticket.technicalStatus = 'assigned';
  ticket.status = 'working';
  if (notes?.trim()) {
    ticket.comments.push({ author: req.user._id, message: notes.trim(), isInternal: true });
  }
  await ticket.save();

  await logActivity(req.user._id, 'ticket', `Ticket escalated: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

  const project = ticket.project?._id
    ? ticket.project
    : (ticket.project ? await Project.findById(ticket.project).select('name manager supportAssignee').lean() : null);

  if (project?.manager) {
    await createNotification(
      project.manager,
      'Ticket escalated to technical',
      `${ticket.ticketNumber}: ${ticket.subject} needs technical attention`,
      'ticket',
      `/tickets/${ticket._id}`,
    );
  }
  const smId = project?.supportAssignee || ticket.supportAssignee;
  if (smId && String(smId) !== String(project?.manager || '')) {
    await createNotification(
      smId,
      'Ticket escalated',
      `${ticket.ticketNumber} was escalated to the technical team`,
      'ticket',
      `/tickets/${ticket._id}`,
    );
  }

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  res.json(populated);
});

export const assignTechnical = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (req.user.role !== 'admin' && !isTechnicalManager(req.user) && !isSupportManager(req.user)) {
    res.status(403);
    throw new Error('Not authorized to assign technical staff');
  }

  const { technicalAssignee, notes } = req.body;
  if (!technicalAssignee) {
    res.status(400);
    throw new Error('Technical assignee is required');
  }

  ticket.technicalAssignee = technicalAssignee;
  ticket.technicalStatus = 'assigned';
  ticket.status = 'working';
  ticket.escalated = true;
  if (notes?.trim()) {
    ticket.comments.push({ author: req.user._id, message: notes.trim(), isInternal: true });
  }
  await ticket.save();

  await logActivity(
    req.user._id,
    'ticket',
    `Technical assignee set on ${ticket.ticketNumber}`,
    { type: 'ticket', id: ticket._id },
  );

  await createNotification(
    technicalAssignee,
    'Ticket assigned to you',
    `You were assigned ${ticket.ticketNumber}: ${ticket.subject}`,
    'ticket',
    `/tickets/${ticket._id}`,
  );

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  res.json(populated);
});

export const assignSupport = asyncHandler(async (req, res) => {
  const { role } = req.user;
  if (!['admin', 'manager', 'support'].includes(role) && !isSupportManager(req.user)) {
    res.status(403);
    throw new Error('Not authorized to assign support staff');
  }

  const ticket = await SupportTicket.findById(req.params.id).populate('customer', 'firstName lastName supportAssignee');
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  const { supportAssignee } = req.body;
  if (!supportAssignee) {
    res.status(400);
    throw new Error('Support assignee is required');
  }

  await assertSupportAssigneeOnProject(ticket.project, supportAssignee);

  ticket.supportAssignee = supportAssignee;
  if (['open', 'assigned'].includes(ticket.status)) {
    ticket.status = 'assigned';
  }
  await ticket.save();

  if (ticket.customer?._id || ticket.customer) {
    await Customer.findByIdAndUpdate(ticket.customer._id || ticket.customer, {
      supportAssignee,
    });
  }

  await createNotification(
    supportAssignee,
    'Ticket assigned to you',
    `You were assigned ${ticket.ticketNumber}: ${ticket.subject}`,
    'ticket',
    `/tickets/${ticket._id}`,
  );

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  res.json(populated);
});

/** Support Manager assigns ticket to Support Executive, TSE, or Technical Manager */
export const assignTicketByManager = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can assign tickets to team members');
  }

  const ticket = await SupportTicket.findById(req.params.id).populate('project', 'name manager supportExecutiveAssignee technicalSupportAssignee');
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (['closed', 'resolved'].includes(ticket.status)) {
    res.status(400);
    throw new Error('Ticket is already closed or resolved');
  }

  const { assigneeId, assigneeType, notes, dueDate, staffRoleId } = req.body;
  if (!['support_executive', 'technical_support_engineer', 'technical_manager'].includes(assigneeType)) {
    res.status(400);
    throw new Error('assigneeType must be support_executive, technical_support_engineer, or technical_manager');
  }

  if (assigneeType !== 'technical_manager' && !assigneeId) {
    res.status(400);
    throw new Error('Select a team member to assign');
  }

  if (notes?.trim()) {
    ticket.comments.push({ author: req.user._id, message: notes.trim(), isInternal: true });
  }

  if (dueDate) {
    const parsed = new Date(dueDate);
    if (!Number.isNaN(parsed.getTime())) {
      ticket.slaDeadline = parsed;
      ticket.expectedCompletion = parsed;
    }
  }

  ticket.assignedBy = req.user._id;

  const validateAssignee = async () => {
    if (assigneeType === 'technical_manager') return;
    if (staffRoleId) {
      const onTeam = await assertAssigneeOnSupportTeam(assigneeId, staffRoleId);
      if (!onTeam) {
        res.status(400);
        throw new Error('Selected member must belong to the chosen support team');
      }
      const StaffRole = (await import('../models/StaffRole.js')).default;
      const team = await StaffRole.findById(staffRoleId);
      if (!team || team.teamGroup !== 'support' || team.status === 'inactive') {
        res.status(400);
        throw new Error('Invalid support team');
      }
      if (ticket.project) {
        await Project.findByIdAndUpdate(ticket.project._id || ticket.project, {
          supportStaffRole: staffRoleId,
        });
      }
      return;
    }
    await assertSupportAssigneeOnProject(ticket.project?._id || ticket.project, assigneeId);
  };

  let notifyUserId = assigneeId;

  if (assigneeType === 'technical_manager') {
    const project = ticket.project?._id ? ticket.project : await Project.findById(ticket.project).lean();
    notifyUserId = assigneeId || project?.manager;
    if (!notifyUserId) {
      res.status(400);
      throw new Error('No technical manager available for this project');
    }
    ticket.technicalAssignee = notifyUserId;
    ticket.escalated = true;
    ticket.status = 'working';
    ticket.technicalStatus = 'assigned';
  } else if (assigneeType === 'technical_support_engineer') {
    if (!assigneeId) {
      res.status(400);
      throw new Error('Select a team member');
    }
    await validateAssignee();
    ticket.technicalAssignee = assigneeId;
    ticket.supportAssignee = assigneeId;
    ticket.technicalStatus = 'assigned';
    ticket.status = 'assigned';
    ticket.escalated = false;
  } else {
    if (!assigneeId) {
      res.status(400);
      throw new Error('Select a team member');
    }
    await validateAssignee();
    ticket.supportAssignee = assigneeId;
    ticket.technicalAssignee = undefined;
    ticket.status = 'assigned';
    ticket.escalated = false;
  }

  await ticket.save();

  await logActivity(
    req.user._id,
    'ticket',
    `Ticket ${ticket.ticketNumber} assigned (${assigneeType.replace(/_/g, ' ')})`,
    { type: 'ticket', id: ticket._id },
  );

  if (notifyUserId) {
    await createNotification(
      notifyUserId,
      'Ticket assigned to you',
      `You were assigned ${ticket.ticketNumber}: ${ticket.subject}`,
      'ticket',
      `/tickets/${ticket._id}`,
    );
  }

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  res.json(populated);
});

export const resolveTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (!canManageTicketWorkflow(req.user, ticket)) {
    res.status(403);
    throw new Error('Not authorized to resolve this ticket');
  }
  if (['closed', 'waiting_customer', 'resolved'].includes(ticket.status)) {
    res.status(400);
    throw new Error('Ticket is already resolved or closed');
  }

  const { message, notifyCustomer = true } = req.body;
  ticket.status = 'waiting_customer';
  ticket.resolvedAt = new Date();
  if (ticket.escalated || ticket.technicalAssignee) {
    ticket.technicalStatus = 'resolved';
  }
  if (message?.trim()) {
    ticket.comments.push({ author: req.user._id, message: message.trim(), isInternal: false });
  }
  await ticket.save();

  await logActivity(req.user._id, 'ticket', `Ticket resolved — awaiting customer: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

  if (notifyCustomer !== false) {
    await notifyTicketCustomer(
      ticket,
      'Your ticket has been resolved',
      `Support has resolved ${ticket.ticketNumber}: ${ticket.subject}. Please review and confirm.`,
    );
  }

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  if (req.user.role === 'customer') {
    populated.comments = populated.comments.filter((c) => !c.isInternal);
  }
  res.json(populated);
});

export const reviewChangeRequestScope = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support managers can review change requests');
  }

  const ticket = await SupportTicket.findById(req.params.id).populate('project', 'name manager supportExecutiveAssignee');
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (ticket.requestKind !== 'change_request') {
    res.status(400);
    throw new Error('This action is only for change requests');
  }

  const { changeScope, notes, supportAssignee, technicalAssignee } = req.body;
  if (!['minor', 'development_required'].includes(changeScope)) {
    res.status(400);
    throw new Error('Change scope must be minor or development_required');
  }

  ticket.changeScope = changeScope;
  if (notes?.trim()) {
    ticket.comments.push({ author: req.user._id, message: notes.trim(), isInternal: true });
  }

  if (changeScope === 'minor') {
    const assigneeId = supportAssignee || ticket.project?.supportExecutiveAssignee;
    if (!assigneeId) {
      res.status(400);
      throw new Error('Assign a support executive for minor changes');
    }
    ticket.supportAssignee = assigneeId;
    ticket.status = 'assigned';
    ticket.technicalStatus = 'unassigned';
    ticket.escalated = false;
    await ticket.save();

    await createNotification(
      assigneeId,
      'Minor change request assigned',
      `${ticket.ticketNumber}: ${ticket.subject} — handle within the support team`,
      'ticket',
      `/tickets/${ticket._id}`,
    );
  } else {
    const project = ticket.project;
    const tmId = technicalAssignee || project?.manager;
    ticket.escalated = true;
    ticket.status = 'working';
    ticket.technicalStatus = 'assigned';
    ticket.supportReviewPhase = 'in_progress';
    if (tmId) ticket.technicalAssignee = tmId;
    await ticket.save();

    if (tmId) {
      await createNotification(
        tmId,
        'Change request requires development',
        `${ticket.ticketNumber}: ${ticket.subject}`,
        'ticket',
        `/tickets/${ticket._id}`,
      );
    }
  }

  await logActivity(req.user._id, 'ticket', `Change request classified as ${changeScope}: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  res.json(populated);
});

export const sendChangeRequestToTechnical = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support managers can send change requests to technical');
  }

  const ticket = await SupportTicket.findById(req.params.id).populate('project', 'name manager');
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (ticket.requestKind !== 'change_request') {
    res.status(400);
    throw new Error('This action is only for change requests');
  }
  if (['closed', 'waiting_customer', 'resolved'].includes(ticket.status)) {
    res.status(400);
    throw new Error('Change request cannot be sent to technical in its current status');
  }

  const { notes, technicalAssignee } = req.body;
  const project = ticket.project;
  const tmId = technicalAssignee || project?.manager;

  ticket.escalated = true;
  ticket.status = 'working';
  ticket.technicalStatus = 'assigned';
  ticket.supportReviewPhase = 'in_progress';
  ticket.priority = ticket.priority === 'low' ? 'medium' : ticket.priority;
  if (tmId) ticket.technicalAssignee = tmId;
  if (notes?.trim()) {
    ticket.comments.push({ author: req.user._id, message: notes.trim(), isInternal: true });
  }
  await ticket.save();

  await logActivity(req.user._id, 'ticket', `Change request sent to technical: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

  if (tmId) {
    await createNotification(
      tmId,
      'Change request for technical review',
      `${ticket.ticketNumber}: ${ticket.subject} — assign a developer and implement`,
      'ticket',
      `/tickets/${ticket._id}`,
    );
  }

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  res.json(populated);
});

export const completeTechnicalWork = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id).populate('project', 'name supportAssignee manager');
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  const isAssignee = idStr(ticket.technicalAssignee) === idStr(req.user._id);
  const isTm = isTechnicalManager(req.user);
  if (req.user.role !== 'admin' && !isAssignee && !isTm) {
    res.status(403);
    throw new Error('Not authorized to complete technical work on this ticket');
  }
  if (!['working', 'assigned'].includes(ticket.status) && ticket.technicalStatus !== 'in_progress') {
    if (ticket.status === 'closed') {
      res.status(400);
      throw new Error('Ticket is already closed');
    }
  }

  const { notes } = req.body;
  ticket.technicalStatus = 'resolved';
  ticket.supportReviewPhase = ticket.requestKind === 'change_request' ? 'resubmitted' : ticket.supportReviewPhase;
  if (notes?.trim()) {
    ticket.comments.push({ author: req.user._id, message: notes.trim(), isInternal: true });
  }
  await ticket.save();

  await logActivity(req.user._id, 'ticket', `Technical work completed: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

  const smId = ticket.supportAssignee || ticket.project?.supportAssignee;
  if (smId) {
    await createNotification(
      smId,
      'Technical work ready for review',
      `${ticket.ticketNumber}: ${ticket.subject} — verify the fix before notifying the customer`,
      'ticket',
      `/tickets/${ticket._id}`,
    );
  }

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  res.json(populated);
});

export const verifyTicketFix = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support managers can verify ticket fixes');
  }

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  const { decision, notes } = req.body;
  if (!['approve', 'reopen'].includes(decision)) {
    res.status(400);
    throw new Error('Decision must be approve or reopen');
  }

  if (decision === 'approve') {
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.technicalStatus = 'resolved';
    ticket.supportReviewPhase = ticket.requestKind === 'change_request' ? 'approved' : ticket.supportReviewPhase;
    if (notes?.trim()) {
      ticket.comments.push({ author: req.user._id, message: notes.trim(), isInternal: true });
    }
    await ticket.save();

    await logActivity(req.user._id, 'ticket', `Resolution approved — resolved: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

    await notifyTicketCustomer(
      ticket,
      ticket.requestKind === 'change_request' ? 'Change request update' : 'Your ticket has been resolved',
      `Support verified the fix for ${ticket.ticketNumber}: ${ticket.subject}. Please confirm resolution in your portal.`,
    );
  } else {
    ticket.status = 'working';
    ticket.technicalStatus = 'assigned';
    ticket.supportReviewPhase = ticket.requestKind === 'change_request' ? 'reopened' : ticket.supportReviewPhase;
    if (notes?.trim()) {
      ticket.comments.push({ author: req.user._id, message: notes.trim(), isInternal: true });
    }
    await ticket.save();

    await logActivity(req.user._id, 'ticket', `Fix reopened for technical: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

    if (ticket.technicalAssignee) {
      await createNotification(
        ticket.technicalAssignee,
        'Ticket fix needs rework',
        `${ticket.ticketNumber} was returned for further work${notes ? `: ${notes.slice(0, 120)}` : ''}`,
        'ticket',
        `/tickets/${ticket._id}`,
      );
    }
  }

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  res.json(populated);
});

/** Assigned support person updates ticket: Accepted → In Progress → Completed */
export const updateTicketWorkStatus = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id).populate('project', 'name supportAssignee');
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (ticket.requestKind === 'change_request') {
    res.status(400);
    throw new Error('Use change request workflow for this ticket');
  }

  const { status: nextStatus, workNotes } = req.body;
  const expectedNext = WORKER_STATUS_TRANSITIONS[ticket.status];
  if (!expectedNext || expectedNext !== nextStatus) {
    res.status(400);
    throw new Error(`Cannot change status from ${ticket.status} to ${nextStatus}`);
  }

  const isWorker = isTicketWorker(req.user, ticket);
  if (!isWorker && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only the assigned support person can update this ticket');
  }

  if (nextStatus === 'completed' && !workNotes?.trim()) {
    res.status(400);
    throw new Error('Completion notes are required when marking completed');
  }

  ticket.status = nextStatus;
  if (workNotes?.trim()) {
    if (nextStatus === 'completed') {
      ticket.completionNotes = workNotes.trim();
    }
    ticket.comments.push({
      author: req.user._id,
      message: workNotes.trim(),
      isInternal: nextStatus !== 'completed',
    });
  }

  await ticket.save();

  await logActivity(
    req.user._id,
    'ticket',
    `Ticket ${ticket.ticketNumber} → ${nextStatus.replace(/_/g, ' ')}`,
    { type: 'ticket', id: ticket._id },
  );

  if (nextStatus === 'completed') {
    const smId = ticket.project?.supportAssignee || ticket.assignedBy;
    if (smId) {
      await createNotification(
        smId,
        'Ticket ready for review',
        `${ticket.ticketNumber} completed by assignee — review resolution before notifying customer`,
        'ticket',
        `/tickets/${ticket._id}`,
      );
    }
  }

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  if (req.user.role === 'customer') {
    populated.comments = populated.comments.filter((c) => !c.isInternal);
  }
  res.json(populated);
});

/** Support Manager reviews completed ticket → Resolved or return for rework */
export const reviewTicketResolution = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can review ticket resolution');
  }

  const ticket = await SupportTicket.findById(req.params.id).populate('project', 'name supportAssignee');
  if (!ticket || !(await assertTicketRoleAccess(req, ticket))) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (ticket.requestKind === 'change_request') {
    res.status(400);
    throw new Error('Use change request workflow for this ticket');
  }
  if (ticket.status !== 'completed') {
    res.status(400);
    throw new Error('Ticket must be completed before review');
  }

  const { decision, notes } = req.body;
  if (!['approve', 'rework'].includes(decision)) {
    res.status(400);
    throw new Error('Decision must be approve or rework');
  }

  const workerId = idStr(ticket.supportAssignee) || idStr(ticket.technicalAssignee);

  if (decision === 'approve') {
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    if (notes?.trim()) {
      ticket.comments.push({ author: req.user._id, message: notes.trim(), isInternal: true });
    }
    await ticket.save();

    await logActivity(req.user._id, 'ticket', `Resolution approved: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

    await notifyTicketCustomer(
      ticket,
      'Your ticket has been resolved',
      `Support resolved ${ticket.ticketNumber}: ${ticket.subject}. Please confirm in your portal.`,
    );
  } else {
    ticket.status = 'assigned';
    if (notes?.trim()) {
      ticket.comments.push({ author: req.user._id, message: notes.trim(), isInternal: true });
    }
    await ticket.save();

    await logActivity(req.user._id, 'ticket', `Returned for rework: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

    if (workerId) {
      await createNotification(
        workerId,
        'Ticket returned for rework',
        `${ticket.ticketNumber} needs more work${notes ? `: ${notes.slice(0, 120)}` : ''}`,
        'ticket',
        `/tickets/${ticket._id}`,
      );
    }
  }

  const populated = await populateQuery(SupportTicket.findById(ticket._id));
  res.json(populated);
});

export const getSupportLogs = asyncHandler(async (req, res) => {
  const roleFilter = await getTicketFilterByRole(req.user.role, req.user, req.user._id);
  const tickets = await SupportTicket.find(roleFilter)
    .populate('createdBy', 'firstName lastName role email')
    .populate('comments.author', 'firstName lastName role email')
    .populate('customer', 'firstName lastName companyName')
    .sort('-updatedAt')
    .lean();

  const ticketIds = tickets.map((t) => t._id);
  const ticketById = Object.fromEntries(tickets.map((t) => [String(t._id), t]));

  const activities = ticketIds.length
    ? await Activity.find({
      type: 'ticket',
      'relatedTo.id': { $in: ticketIds },
    })
      .populate('user', 'firstName lastName role email')
      .sort('-createdAt')
      .lean()
    : [];

  const logs = [];

  tickets.forEach((ticket) => {
    logs.push({
      _id: `${ticket._id}-created`,
      logType: 'created',
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      message: ticket.description || 'Support ticket opened',
      status: ticket.status,
      priority: ticket.priority,
      author: ticket.createdBy,
      createdAt: ticket.createdAt,
    });

    (ticket.comments || []).forEach((comment) => {
      if (req.user.role === 'customer' && comment.isInternal) return;
      logs.push({
        _id: String(comment._id),
        logType: comment.isInternal ? 'internal_note' : 'comment',
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        message: comment.message,
        author: comment.author,
        isInternal: comment.isInternal,
        createdAt: comment.createdAt,
      });
    });
  });

  activities.forEach((activity) => {
    const ticket = ticketById[String(activity.relatedTo?.id)];
    if (!ticket) return;
    logs.push({
      _id: String(activity._id),
      logType: 'activity',
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      title: activity.title,
      message: activity.description || activity.title,
      author: activity.user,
      createdAt: activity.createdAt,
    });
  });

  logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    logs,
    total: logs.length,
    ticketCount: tickets.length,
  });
});

export const confirmResolution = asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') {
    res.status(403);
    throw new Error('Only customers can confirm ticket resolution');
  }

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket || !assertCustomerTicketAccess(req, ticket)) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (!['resolved', 'waiting_customer'].includes(ticket.status)) {
    res.status(400);
    throw new Error('Ticket is not awaiting customer confirmation');
  }

  ticket.status = 'closed';
  ticket.closedAt = new Date();
  if (!ticket.resolvedAt) ticket.resolvedAt = new Date();
  const { rating, comments: confirmCommentsBody } = req.body;
  if (confirmCommentsBody?.trim()) {
    ticket.comments.push({ author: req.user._id, message: confirmCommentsBody.trim(), isInternal: false });
  }
  if (rating !== undefined && rating !== null && rating !== '') {
    const parsed = Number(rating);
    if (parsed >= 1 && parsed <= 5) ticket.rating = parsed;
  }
  await ticket.save();

  await logActivity(req.user._id, 'ticket', `Customer confirmed resolution: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

  if (ticket.supportAssignee) {
    await createNotification(
      ticket.supportAssignee,
      'Ticket closed by customer',
      `Customer confirmed resolution of ${ticket.ticketNumber}: ${ticket.subject}`,
      'ticket',
      `/tickets/${ticket._id}`,
    );
  }

  let q = SupportTicket.findById(ticket._id);
  q = populateQuery(q);
  const item = await q;
  item.comments = item.comments.filter((c) => !c.isInternal);
  res.json(item);
});

export const reopenTicket = asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') {
    res.status(403);
    throw new Error('Only customers can reopen tickets');
  }

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket || !assertCustomerTicketAccess(req, ticket)) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (!['resolved', 'closed', 'waiting_customer'].includes(ticket.status)) {
    res.status(400);
    throw new Error('Ticket cannot be reopened in its current status');
  }

  const { message } = req.body;
  ticket.status = 'reopened';
  ticket.closedAt = undefined;
  ticket.resolvedAt = undefined;
  ticket.supportAssignee = undefined;
  ticket.technicalAssignee = undefined;
  if (message?.trim()) {
    ticket.comments.push({ author: req.user._id, message: message.trim(), isInternal: false });
  }
  await ticket.save();

  await logActivity(req.user._id, 'ticket', `Customer reopened ticket: ${ticket.ticketNumber}`, { type: 'ticket', id: ticket._id });

  const project = ticket.project ? await Project.findById(ticket.project).select('supportAssignee name').lean() : null;
  const smId = project?.supportAssignee;
  if (smId) {
    await createNotification(
      smId,
      'Ticket reopened by customer',
      `Customer reopened ${ticket.ticketNumber}: ${ticket.subject} — assign again when ready`,
      'ticket',
      `/tickets/${ticket._id}`,
    );
  } else if (ticket.supportAssignee) {
    await createNotification(
      ticket.supportAssignee,
      'Ticket reopened by customer',
      `Customer reopened ${ticket.ticketNumber}: ${ticket.subject}`,
      'ticket',
      `/tickets/${ticket._id}`,
    );
  }

  let q = SupportTicket.findById(ticket._id);
  q = populateQuery(q);
  const item = await q;
  item.comments = item.comments.filter((c) => !c.isInternal);
  res.json(item);
});
