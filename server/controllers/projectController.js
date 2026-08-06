import Project from '../models/Project.js';
import Document from '../models/Document.js';
import SupportTicket from '../models/SupportTicket.js';
import SupportProjectTask from '../models/SupportProjectTask.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity, createNotification } from './authController.js';
import { getProjectFilterByRole, canAccessCustomer, findProjectForRole, getCustomerRefId } from '../utils/roleFilters.js';
import { isTechnicalManager, getTechnicalManagerReportIds, getTechnicalManagerProjectFilter, isSupportHandoffAssignee, isSupportManager, getSupportManagerStaffRoleFilter } from '../utils/managerScope.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';
import { TECHNICAL_PROJECT_STATUSES, WORKFLOW_TO_STATUS } from '../constants/projectStatuses.js';
import { copyDealRequirementsToProject } from '../utils/projectDocuments.js';
import { createSplitDefaultSupportTasks } from './supportProjectTaskController.js';

const populateProject = (query) => query
  .populate('customer', 'firstName lastName email company companyName phone')
  .populate('category', 'name code status')
  .populate('quotation', 'quotationNumber title total')
  .populate('manager', 'firstName lastName email role departmentName staffRole', {
    populate: { path: 'staffRole', select: 'name code teamGroup department' },
  })
  .populate('supportAssignee', 'firstName lastName email phone avatar role')
  .populate('supportExecutiveAssignee', 'firstName lastName email phone avatar role roleId')
  .populate({ path: 'supportExecutiveAssignee.roleId', select: 'name' })
  .populate('supportTeamAssignees', 'firstName lastName email phone avatar role')
  .populate('supportStaffRole', 'name code teamGroup status')
  .populate('supportReviewedBy', 'firstName lastName email')
  .populate('activeUpdateRequest')
  .populate('supportHandoffBy', 'firstName lastName email')
  .populate('assignedTo', 'firstName lastName email role employeeId roleId')
  .populate({ path: 'assignedTo.roleId', select: 'name department' })
  .populate('createdBy', 'firstName lastName');

const TECHNICAL_ALLOWED_STATUSES = TECHNICAL_PROJECT_STATUSES;

const WORKFLOW_STATUS_MAP = WORKFLOW_TO_STATUS;

const formatStatusLabel = (status) => (status || '').replace(/_/g, ' ');

const parseMemberRoleLabels = (memberRoleLabels, assignedTo = []) => {
  if (!memberRoleLabels || typeof memberRoleLabels !== 'object') return undefined;
  const labels = new Map();
  const validIds = new Set((assignedTo || []).map(String));
  Object.entries(memberRoleLabels).forEach(([uid, label]) => {
    const trimmed = String(label || '').trim();
    if (!trimmed) return;
    const id = String(uid);
    if (validIds.size && !validIds.has(id)) return;
    labels.set(id, trimmed);
  });
  return labels.size ? labels : undefined;
};

const notifyProjectStakeholders = async (project, actor, messageOrOptions, linkPath) => {
  const User = (await import('../models/User.js')).default;
  let message;
  let title = 'Project status updated';
  let type = 'project';
  let link = linkPath;

  if (messageOrOptions && typeof messageOrOptions === 'object') {
    ({
      message,
      title = 'Project update',
      type = 'project',
      linkPath: link,
    } = messageOrOptions);
  } else {
    message = messageOrOptions;
  }

  const recipientIds = new Set();

  if (project.manager) recipientIds.add(String(project.manager._id || project.manager));
  if (project.createdBy) recipientIds.add(String(project.createdBy._id || project.createdBy));

  const admins = await User.find({ role: 'admin', isActive: { $ne: false } }).select('_id').lean();
  admins.forEach((admin) => recipientIds.add(String(admin._id)));

  const managers = await User.find({ role: 'manager', isActive: { $ne: false } }).select('_id').lean();
  managers.forEach((manager) => recipientIds.add(String(manager._id)));

  recipientIds.delete(String(actor._id));

  const notificationLink = link || `/projects/${project._id}`;

  await Promise.all(
    [...recipientIds].map((userId) => createNotification(
      userId,
      title,
      message,
      type,
      notificationLink,
    )),
  );
};

const applyStatusChange = async (project, previousStatus, newStatus, actor) => {
  if (!newStatus || previousStatus === newStatus) return;

  const actorName = `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email || 'Team member';
  const title = `Project status: ${project.name} — ${formatStatusLabel(previousStatus)} → ${formatStatusLabel(newStatus)}`;

  await logActivity(actor._id, 'project', title, { type: 'project', id: project._id });
  await notifyProjectStakeholders(
    project,
    actor,
    `${actorName} updated "${project.name}" to ${formatStatusLabel(newStatus)} (was ${formatStatusLabel(previousStatus)})`,
  );
};

export const getAll = asyncHandler(async (req, res) => {
  const { search, status, overdue, page = 1, limit = 20 } = req.query;
  const roleFilter = await getProjectFilterByRole(req.user.role, req.user._id, req.user);
  const query = { ...roleFilter };
  if (status) query.status = status;
  if (overdue === 'true') {
    query.endDate = { $lt: new Date(), $ne: null };
    query.status = { $nin: ['completed', 'cancelled', 'on_hold'] };
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Project.countDocuments(query);
  const items = await populateProject(
    Project.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
  );
  res.json({ items, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
});

export const getOne = asyncHandler(async (req, res) => {
  const project = await findProjectForRole(req.user.role, req.user._id, req.params.id, req.user);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  const item = await populateProject(Project.findById(project._id));
  res.json(item);
});

export const create = asyncHandler(async (req, res) => {
  if (req.user.role === 'customer') {
    res.status(403);
    throw new Error('Customers cannot create projects');
  }
  if (req.user.role === 'technical') {
    res.status(403);
    throw new Error('Only admin or manager can create projects');
  }
  const { customer, name } = req.body;
  if (!customer) {
    res.status(400);
    throw new Error('Customer is required');
  }
  if (!name?.trim()) {
    res.status(400);
    throw new Error('Project name is required');
  }
  const allowed = await canAccessCustomer(req.user.role, req.user._id, customer, req.user);
  if (!allowed) {
    res.status(403);
    throw new Error('You do not have access to this customer');
  }

  const data = {
    ...req.body,
    createdBy: req.user._id,
    manager: req.body.manager || (req.user.role === 'manager' ? req.user._id : undefined),
  };

  if (data.deal && !data.dealRef) {
    data.dealRef = data.deal;
    delete data.deal;
  }

  if (!data.workflowStage) data.workflowStage = 'project_started';
  if (!data.status || data.status === 'new') {
    data.status = data.workflowStage === 'project_started' ? 'planning' : data.status || 'planning';
  }

  if (data.assignedTo?.length) {
    const User = (await import('../models/User.js')).default;
    const assignedTo = Array.isArray(data.assignedTo) ? data.assignedTo : [];
    const techCount = await User.countDocuments({
      _id: { $in: assignedTo },
      role: 'technical',
      isActive: { $ne: false },
    });
    if (techCount !== assignedTo.length) {
      res.status(400);
      throw new Error('All assignees must be active technical team members');
    }
    data.assignedTo = assignedTo;
    if (data.status === 'new' || data.status === 'planning') data.status = 'development';
    if (data.memberRoleLabels) {
      data.memberRoleLabels = parseMemberRoleLabels(data.memberRoleLabels, assignedTo);
    }
  } else {
    data.assignedTo = [];
    if (data.memberRoleLabels) delete data.memberRoleLabels;
  }

  const item = await Project.create(data);
  if (item.dealRef) {
    await copyDealRequirementsToProject(item.dealRef, item._id);
  }
  try {
    await logActivity(req.user._id, 'project', `Created project: ${item.name}`, { type: 'project', id: item._id });
  } catch { /* ignore */ }
  res.status(201).json(await populateProject(Project.findById(item._id)));
});

export const update = asyncHandler(async (req, res) => {
  if (req.user.role === 'customer') {
    res.status(403);
    throw new Error('Customers cannot update projects');
  }
  const existing = await findProjectForRole(req.user.role, req.user._id, req.params.id, req.user);
  if (!existing) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (req.body.customer) {
    const allowed = await canAccessCustomer(req.user.role, req.user._id, req.body.customer, req.user);
    if (!allowed) {
      res.status(403);
      throw new Error('You do not have access to this customer');
    }
  }

  const updates = { ...req.body };
  if (req.user.role === 'technical') {
    const allowedFields = ['name', 'description', 'status', 'budget', 'priority', 'technologyStack', 'startDate', 'endDate', 'workflowStage'];
    Object.keys(updates).forEach((key) => {
      if (!allowedFields.includes(key)) delete updates[key];
    });
    if (updates.status && !TECHNICAL_ALLOWED_STATUSES.includes(updates.status)) {
      res.status(400);
      throw new Error('Technical team cannot set this project status');
    }
  } else if (updates.assignedTo !== undefined) {
    const assignedTo = Array.isArray(updates.assignedTo) ? updates.assignedTo : [];
    if (assignedTo.length) {
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
      updates.assignedTo = assignedTo;
      if (!updates.status || updates.status === 'new' || updates.status === 'planning') updates.status = 'development';
    } else {
      updates.assignedTo = [];
    }
  }

  if (updates.manager !== undefined) {
    if (isTechnicalManager(req.user)) {
      delete updates.manager;
    } else if (updates.manager) {
      const User = (await import('../models/User.js')).default;
      const managerUser = await User.findOne({
        _id: updates.manager,
        role: 'manager',
        isActive: { $ne: false },
      });
      if (!managerUser) {
        res.status(400);
        throw new Error('Technical manager must be an active manager');
      }
    }
  }

  if (isTechnicalManager(req.user) && updates.assignedTo !== undefined) {
    const reportIds = await getTechnicalManagerReportIds(req.user._id);
    const allowedIds = new Set([...reportIds.map(String), String(req.user._id)]);
    const assignedTo = Array.isArray(updates.assignedTo) ? updates.assignedTo : [];
    if (assignedTo.some((id) => !allowedIds.has(String(id)))) {
      res.status(403);
      throw new Error('You can only assign your own team members');
    }
  }

  if (updates.status === 'completed' && !updates.workflowStage) {
    updates.workflowStage = 'completed';
  }

  const item = await populateProject(
    Project.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
  );
  if (!item) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (updates.status && existing.status !== updates.status) {
    await applyStatusChange(item, existing.status, updates.status, req.user);

    if (req.body.reviewNotes?.trim()) {
      await logActivity(
        req.user._id,
        'project',
        `Review note (${formatStatusLabel(updates.status)}): ${item.name}`,
        { type: 'project', id: item._id },
        req.body.reviewNotes.trim(),
      );
    }
  } else {
    try {
      await logActivity(req.user._id, 'project', `Updated project: ${item.name}`, { type: 'project', id: item._id });
    } catch { /* ignore */ }
  }

  const refreshed = await populateProject(Project.findById(req.params.id));
  res.json(refreshed?.toJSON?.() ?? refreshed);
});

export const remove = asyncHandler(async (req, res) => {
  if (req.user.role === 'technical') {
    res.status(403);
    throw new Error('Only admin or manager can delete projects');
  }
  const item = await Project.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Project not found');
  }
  await item.deleteOne();
  res.json({ message: 'Deleted successfully' });
});

export const getTechnicalTeam = asyncHandler(async (req, res) => {
  const User = (await import('../models/User.js')).default;
  const Team = (await import('../models/Team.js')).default;

  let members;
  if (isTechnicalManager(req.user)) {
    const reportIds = await getTechnicalManagerReportIds(req.user._id);
    members = await User.find({ _id: { $in: reportIds }, isActive: { $ne: false } })
      .select('firstName lastName email role team roleId employeeId hrProfile.designation reportsTo')
      .populate('roleId', 'name department description')
      .populate('team', 'name')
      .populate('reportsTo', 'firstName lastName employeeId')
      .sort('firstName');
  } else {
    const techTeam = await Team.findOne({
      isActive: { $ne: false },
      $or: [
        { name: { $regex: /technical/i } },
        { department: { $regex: /technical/i } },
      ],
    }).populate({
      path: 'members',
      match: { role: 'technical', isActive: { $ne: false } },
      select: 'firstName lastName email role team roleId employeeId hrProfile.designation',
      populate: { path: 'roleId', select: 'name department description' },
    });

    members = (techTeam?.members || []).filter(Boolean);
    if (!members.length) {
      members = await User.find({ role: 'technical', isActive: { $ne: false } })
        .select('firstName lastName email role team roleId employeeId hrProfile.designation')
        .populate('roleId', 'name department description')
        .populate('team', 'name')
        .sort('firstName');
    }
  }

  const techTeam = isTechnicalManager(req.user)
    ? null
    : await Team.findOne({
      isActive: { $ne: false },
      $or: [
        { name: { $regex: /technical/i } },
        { department: { $regex: /technical/i } },
      ],
    });

  res.json({
    team: techTeam ? { _id: techTeam._id, name: techTeam.name, description: techTeam.description } : null,
    members,
  });
});

export const assignProjectTeam = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  if (!['admin', 'manager'].includes(role)) {
    res.status(403);
    throw new Error('Only admin or manager can assign projects to the technical team');
  }

  const { assignedTo, manager: managerId, memberRoleLabels } = req.body;
  if (assignedTo !== undefined && !Array.isArray(assignedTo)) {
    res.status(400);
    throw new Error('assignedTo must be an array of technical user IDs');
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (isTechnicalManager(req.user)) {
    const ownsProject = String(project.manager || '') === String(userId)
      || String(project.createdBy || '') === String(userId);
    if (!ownsProject) {
      res.status(403);
      throw new Error('You can only assign team members on projects you manage');
    }
    if (managerId !== undefined && managerId && String(managerId) !== String(userId)) {
      res.status(403);
      throw new Error('Technical managers cannot reassign the project to another manager');
    }
  }

  const User = (await import('../models/User.js')).default;

  if (managerId !== undefined) {
    if (managerId) {
      const managerUser = await User.findOne({
        _id: managerId,
        role: 'manager',
        isActive: { $ne: false },
      });
      if (!managerUser) {
        res.status(400);
        throw new Error('Technical manager must be an active manager');
      }
      project.manager = managerId;
    } else if (!isTechnicalManager(req.user)) {
      project.manager = undefined;
    }
  } else if (isTechnicalManager(req.user) && !project.manager) {
    project.manager = userId;
  }

  if (assignedTo !== undefined) {
    if (assignedTo.length) {
      const techCount = await User.countDocuments({
        _id: { $in: assignedTo },
        role: 'technical',
        isActive: { $ne: false },
      });
      if (techCount !== assignedTo.length) {
        res.status(400);
        throw new Error('All assignees must be active technical team members');
      }
      project.assignedTo = assignedTo;
      if (project.status === 'new' || project.status === 'planning') project.status = 'development';
    } else {
      project.assignedTo = [];
    }
  }

  if (memberRoleLabels !== undefined) {
    const ids = assignedTo !== undefined ? assignedTo : project.assignedTo;
    project.memberRoleLabels = parseMemberRoleLabels(memberRoleLabels, ids) || undefined;
  }

  await project.save();
  try {
    await logActivity(userId, 'project', `Assigned project to technical team: ${project.name}`, { type: 'project', id: project._id });
  } catch { /* ignore */ }

  res.json(await populateProject(Project.findById(project._id)));
});

export const updateWorkflowStage = asyncHandler(async (req, res) => {
  const existing = await findProjectForRole(req.user.role, req.user._id, req.params.id, req.user);
  if (!existing) {
    res.status(404);
    throw new Error('Project not found');
  }

  const workflowStage = req.body.workflowStage;
  const previousStatus = existing.status;
  const updatePayload = { workflowStage };
  const mappedStatus = WORKFLOW_STATUS_MAP[workflowStage];
  if (mappedStatus) updatePayload.status = mappedStatus;

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    updatePayload,
    { new: true, runValidators: true },
  );
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const item = await populateProject(Project.findById(project._id));

  if (updatePayload.status && updatePayload.status !== previousStatus) {
    await applyStatusChange(item, previousStatus, updatePayload.status, req.user);
  }

  const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Team member';
  await logActivity(
    req.user._id,
    'project',
    `Project workflow: ${item.name} → ${formatStatusLabel(workflowStage)}`,
    { type: 'project', id: item._id },
  );
  await notifyProjectStakeholders(
    item,
    req.user,
    `${actorName} moved "${item.name}" to ${formatStatusLabel(workflowStage)}`,
  );

  const refreshed = await populateProject(Project.findById(project._id));
  res.json(refreshed?.toJSON?.() ?? refreshed);
});

export const uploadProjectRequirementsDocument = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  if (!['admin', 'manager'].includes(role)) {
    res.status(403);
    throw new Error('Only admin or manager can upload requirements documents');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('Requirements document file is required');
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/documents', {
    originalname: req.file.originalname,
  });
  const doc = await Document.create({
    name: req.body.name || req.file.originalname || 'Requirements Document',
    folder: 'Requirements',
    fileUrl: result.url,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    relatedTo: { type: 'project', id: project._id },
    tags: ['requirements'],
    uploadedBy: userId,
  });

  await logActivity(userId, 'document', `Uploaded requirements for project: ${project.name}`, { type: 'project', id: project._id });
  res.status(201).json(doc);
});

const customerRequirementsDocQuery = (projectId) => ({
  isActive: true,
  'relatedTo.type': 'project',
  'relatedTo.id': projectId,
  folder: 'CustomerRequirements',
  tags: { $all: ['requirements', 'customer-submission'] },
});

export const uploadCustomerRequirementsDocument = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  if (role !== 'customer') {
    res.status(403);
    throw new Error('Only customers can submit requirements documents from the portal');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('Requirements document file is required');
  }

  const project = await findProjectForRole(role, userId, req.params.id, req.user);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/documents', {
    originalname: req.file.originalname,
  });
  const doc = await Document.create({
    name: req.body.name || req.file.originalname || 'Customer Requirements Document',
    folder: 'CustomerRequirements',
    fileUrl: result.url,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    relatedTo: { type: 'project', id: project._id },
    tags: ['requirements', 'customer-submission'],
    uploadedBy: userId,
  });

  const populated = await Document.findById(doc._id).populate('uploadedBy', 'firstName lastName email role');
  await logActivity(userId, 'document', `Customer submitted requirements for project: ${project.name}`, { type: 'project', id: project._id });

  const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Customer';
  await notifyProjectStakeholders(project, req.user, {
    title: 'Customer requirements submitted',
    message: `${actorName} submitted a requirements document for "${project.name}". Review it on the project page.`,
    type: 'project',
    linkPath: `/projects/${project._id}`,
  });

  res.status(201).json(populated);
});

export const getProjectCustomerRequirementsDocuments = asyncHandler(async (req, res) => {
  const project = await findProjectForRole(req.user.role, req.user._id, req.params.id, req.user);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const documents = await Document.find(customerRequirementsDocQuery(project._id))
    .populate('uploadedBy', 'firstName lastName email role')
    .sort('-createdAt');

  res.json(documents);
});

export const listCustomerRequirementsDocuments = asyncHandler(async (req, res) => {
  const roleFilter = await getProjectFilterByRole(req.user.role, req.user._id, req.user);
  const projects = await Project.find(roleFilter).select('name customer').lean();
  const projectIds = projects.map((p) => p._id);

  if (!projectIds.length) {
    res.json([]);
    return;
  }

  const nameById = Object.fromEntries(projects.map((p) => [String(p._id), p.name]));
  const documents = await Document.find({
    isActive: true,
    'relatedTo.type': 'project',
    'relatedTo.id': { $in: projectIds },
    folder: 'CustomerRequirements',
    tags: { $all: ['requirements', 'customer-submission'] },
  })
    .populate('uploadedBy', 'firstName lastName email role')
    .sort('-createdAt')
    .lean();

  res.json(documents.map((doc) => ({
    ...doc,
    projectName: nameById[String(doc.relatedTo?.id)] || 'Project',
  })));
});

const requirementsDocQuery = (projectId) => ({
  isActive: true,
  'relatedTo.type': 'project',
  'relatedTo.id': projectId,
  $and: [
    { $or: [{ folder: 'Requirements' }, { tags: 'requirements' }] },
    { tags: { $ne: 'customer-submission' } },
  ],
});

export const getProjectRequirementsDocuments = asyncHandler(async (req, res) => {
  const project = await findProjectForRole(req.user.role, req.user._id, req.params.id, req.user);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const documents = await Document.find(requirementsDocQuery(project._id))
    .populate('uploadedBy', 'firstName lastName email role')
    .sort('-createdAt');

  res.json(documents);
});

export const listAssignedRequirementsDocuments = asyncHandler(async (req, res) => {
  const roleFilter = await getProjectFilterByRole(req.user.role, req.user._id, req.user);
  const projects = await Project.find(roleFilter).select('name').lean();
  const projectIds = projects.map((p) => p._id);

  if (!projectIds.length) {
    res.json([]);
    return;
  }

  const nameById = Object.fromEntries(projects.map((p) => [String(p._id), p.name]));
  const documents = await Document.find({
    isActive: true,
    'relatedTo.type': 'project',
    'relatedTo.id': { $in: projectIds },
    $or: [{ folder: 'Requirements' }, { tags: 'requirements' }],
    tags: { $ne: 'customer-submission' },
  })
    .populate('uploadedBy', 'firstName lastName email role')
    .sort('-createdAt')
    .lean();

  res.json(documents.map((doc) => ({
    ...doc,
    projectName: nameById[String(doc.relatedTo?.id)] || 'Project',
  })));
});

const deliveryDocQuery = (projectId) => ({
  isActive: true,
  'relatedTo.type': 'project',
  'relatedTo.id': projectId,
  $or: [{ folder: 'Delivery' }, { tags: 'delivery' }, { tags: 'submission' }],
});

export const getProjectDeliveryDocuments = asyncHandler(async (req, res) => {
  const project = await findProjectForRole(req.user.role, req.user._id, req.params.id, req.user);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const documents = await Document.find(deliveryDocQuery(project._id))
    .populate('uploadedBy', 'firstName lastName email role')
    .sort('-createdAt');

  res.json(documents);
});

export const listAssignedDeliveryDocuments = asyncHandler(async (req, res) => {
  const roleFilter = await getProjectFilterByRole(req.user.role, req.user._id, req.user);
  const projects = await Project.find(roleFilter).select('name').lean();
  const projectIds = projects.map((p) => p._id);

  if (!projectIds.length) {
    res.json([]);
    return;
  }

  const nameById = Object.fromEntries(projects.map((p) => [String(p._id), p.name]));
  const documents = await Document.find({
    isActive: true,
    'relatedTo.type': 'project',
    'relatedTo.id': { $in: projectIds },
    $or: [
      { folder: 'Delivery' },
      { tags: 'delivery' },
      { tags: 'submission' },
      { tags: 'shared-with-support' },
      { folder: 'Support' },
    ],
  })
    .populate('uploadedBy', 'firstName lastName email role')
    .sort('-createdAt')
    .lean();

  res.json(documents.map((doc) => ({
    ...doc,
    projectName: nameById[String(doc.relatedTo?.id)] || 'Project',
  })));
});

export const uploadProjectDeliveryDocument = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  if (!['admin', 'manager', 'technical'].includes(role)) {
    res.status(403);
    throw new Error('Not authorized to upload project delivery documents');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('Project document file is required');
  }

  const project = await findProjectForRole(role, userId, req.params.id, req.user);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/documents', {
    originalname: req.file.originalname,
  });
  const doc = await Document.create({
    name: req.body.name || req.file.originalname || 'Project Delivery Document',
    folder: 'Delivery',
    fileUrl: result.url,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    relatedTo: { type: 'project', id: project._id },
    tags: ['delivery', 'submission'],
    uploadedBy: userId,
  });

  const populated = await Document.findById(doc._id).populate('uploadedBy', 'firstName lastName email role');
  await logActivity(userId, 'document', `Submitted delivery document for project: ${project.name}`, { type: 'project', id: project._id });

  const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Team member';
  await notifyProjectStakeholders(project, req.user, {
    title: 'Technical document submitted',
    message: `${actorName} submitted a completion document for "${project.name}". Open the project to view and download.`,
    type: 'project',
    linkPath: `/projects/${project._id}`,
  });

  res.status(201).json(populated);
});

const scheduleSupportFollowUp = async (Followup, { customer, project, assigneeId, userId, notes }) => {
  if (!customer) return;
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 1);
  followUpDate.setHours(10, 0, 0, 0);
  await Followup.create({
    customer: customer._id,
    project: project._id,
    workflowStage: 'customer',
    activityType: 'phone_call',
    title: `Post-delivery follow-up: ${project.name}`,
    notes: notes || 'Project handed off to support. Contact customer for satisfaction and ongoing support.',
    scheduledAt: followUpDate,
    assignedTo: assigneeId,
    createdBy: userId,
    status: 'scheduled',
    contactName: `${customer.firstName} ${customer.lastName}`,
    contactEmail: customer.email,
    contactPhone: customer.phone,
    company: customer.companyName,
  });
};

export const getSupportTeam = asyncHandler(async (req, res) => {
  const User = (await import('../models/User.js')).default;
  const users = await User.find({ role: { $in: ['support', 'manager'] }, isActive: { $ne: false } })
    .select('firstName lastName email phone role avatar departmentName staffRole roleId')
    .populate('staffRole', 'name code teamGroup department')
    .populate('roleId', 'name department')
    .sort('firstName')
    .lean();

  const members = users
    .filter((u) => isSupportHandoffAssignee(u))
    .map((u) => ({
      ...u,
      assigneeType: u.role === 'manager' ? 'Support Manager' : 'Support Agent',
    }))
    .sort((a, b) => {
      if (a.role === 'manager' && b.role !== 'manager') return -1;
      if (b.role === 'manager' && a.role !== 'manager') return 1;
      return `${a.firstName || ''}`.localeCompare(`${b.firstName || ''}`);
    });

  res.json({ members });
});

export const handoffProjectToSupport = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  if (!['admin', 'manager'].includes(role)) {
    res.status(403);
    throw new Error('Only admin or manager can hand off projects to support');
  }

  const {
    supportAssignee,
    supportManager,
    supportExecutive,
    supportTeamAssignees,
    notes,
    tmHandoffChecklist,
  } = req.body;

  const User = (await import('../models/User.js')).default;
  const Followup = (await import('../models/Followup.js')).default;
  const Customer = (await import('../models/Customer.js')).default;

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (isTechnicalManager(req.user)) {
    const ownsProject = String(project.manager || '') === String(userId)
      || String(project.createdBy || '') === String(userId);
    if (!ownsProject) {
      res.status(403);
      throw new Error('You can only submit projects you manage to support');
    }

    const checklist = tmHandoffChecklist || {};
    if (!checklist.developmentCompleted || !checklist.testingCompleted || !checklist.documentationUploaded) {
      res.status(400);
      throw new Error('Complete the handoff checklist: development, testing, and documentation must be confirmed');
    }
    project.tmHandoffChecklist = {
      developmentCompleted: true,
      testingCompleted: true,
      documentationUploaded: true,
      completedAt: new Date(),
    };
  }

  const handoffStages = ['delivered', 'support', 'completed', 'invoiced', 'payment_received'];
  const handoffStatuses = ['completed', 'development', 'testing', 'deployment'];
  if (!handoffStages.includes(project.workflowStage) && !handoffStatuses.includes(project.status)) {
    res.status(400);
    throw new Error('Project should be delivered or near completion before support handoff');
  }

  const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Manager';

  const resetHandoffFields = () => {
    project.supportHandoffAt = new Date();
    project.supportHandoffNotes = notes || '';
    project.supportHandoffBy = userId;
    project.workflowStage = 'support';
    project.supportReviewedAt = undefined;
    project.supportReviewedBy = undefined;
    project.supportReviewNotes = undefined;
    project.activeUpdateRequest = undefined;
    project.supportClosedAt = undefined;
    if (!['completed'].includes(project.status)) {
      project.status = 'completed';
    }
  };

  /** Admin assigns Support Manager + support employee(s) in one step */
  const isAdminDualHandoff = role === 'admin' && supportManager && supportExecutive;

  if (isAdminDualHandoff) {
    const managerUser = await User.findOne({ _id: supportManager, isActive: { $ne: false } })
      .populate('staffRole', 'name code teamGroup department');
    if (!managerUser || !isSupportManager(managerUser)) {
      res.status(400);
      throw new Error('Support manager must be an active support department manager');
    }

    const executiveUser = await User.findOne({
      _id: supportExecutive,
      role: 'support',
      isActive: { $ne: false },
    });
    if (!executiveUser) {
      res.status(400);
      throw new Error('Primary support employee must be an active support agent');
    }

    const extraIds = (Array.isArray(supportTeamAssignees) ? supportTeamAssignees : [])
      .map(String)
      .filter((id) => id && id !== String(supportExecutive));
    const teamIds = [...new Set([String(supportExecutive), ...extraIds])];

    if (teamIds.length) {
      const teamCount = await User.countDocuments({
        _id: { $in: teamIds },
        role: 'support',
        isActive: { $ne: false },
      });
      if (teamCount !== teamIds.length) {
        res.status(400);
        throw new Error('All assigned support employees must be active support agents');
      }
    }

    resetHandoffFields();
    project.supportAssignee = supportManager;
    project.supportExecutiveAssignee = supportExecutive;
    project.supportTeamAssignees = teamIds;
    project.supportReviewStatus = 'in_support';
    project.supportReviewedAt = new Date();
    project.supportReviewedBy = userId;
    await project.save();

    await Document.updateMany(
      deliveryDocQuery(project._id),
      { $addToSet: { tags: 'shared-with-support' } },
    );

    const customer = await Customer.findByIdAndUpdate(
      project.customer,
      { supportAssignee: supportExecutive },
      { new: true },
    ).populate('portalUser', '_id');

    await scheduleSupportFollowUp(Followup, {
      customer,
      project,
      assigneeId: supportExecutive,
      userId,
      notes,
    });

    await createNotification(
      supportManager,
      'Project delivered to support management',
      `${actorName} assigned you support management for "${project.name}" with ${teamIds.length} support employee(s).`,
      'project',
      `/projects/${project._id}`,
    );

    await createNotification(
      supportExecutive,
      'Project assigned for customer support',
      `${actorName} assigned you as primary support contact for "${project.name}".`,
      'project',
      `/projects/${project._id}`,
    );

    for (const memberId of teamIds) {
      if (String(memberId) === String(supportExecutive)) continue;
      await createNotification(
        memberId,
        'Added to project support team',
        `${actorName} added you to the support team for "${project.name}".`,
        'project',
        `/projects/${project._id}`,
      );
    }

    if (project.manager) {
      await createNotification(
        project.manager,
        'Project handed off to support',
        `"${project.name}" was delivered to support by admin.`,
        'project',
        `/projects/${project._id}`,
      );
    }

    if (customer?.portalUser) {
      await createNotification(
        customer.portalUser._id || customer.portalUser,
        'Your support contact is assigned',
        `${executiveUser.firstName} ${executiveUser.lastName} is your MYTHISOFT support contact for "${project.name}".`,
        'project',
        '/dashboard',
      );
    }

    await logActivity(userId, 'project', `Admin delivered "${project.name}" to support (manager + team)`, { type: 'project', id: project._id });

    const populated = await populateProject(Project.findById(project._id));
    const documents = await Document.find({
      isActive: true,
      'relatedTo.type': 'project',
      'relatedTo.id': project._id,
      tags: 'shared-with-support',
    })
      .populate('uploadedBy', 'firstName lastName email role')
      .sort('-createdAt');

    return res.json({ project: populated, documents, supportUser: managerUser, supportExecutive: executiveUser });
  }

  if (!supportAssignee) {
    res.status(400);
    throw new Error('Support team member is required');
  }

  const supportUser = await User.findOne({ _id: supportAssignee, isActive: { $ne: false } })
    .populate('staffRole', 'name code teamGroup department');
  if (!supportUser || !isSupportHandoffAssignee(supportUser)) {
    res.status(400);
    throw new Error('Assignee must be an active support agent or support manager');
  }

  resetHandoffFields();
  project.supportAssignee = supportAssignee;
  project.supportExecutiveAssignee = undefined;
  project.supportTeamAssignees = undefined;

  const submittedToSupportManager = isSupportManager(supportUser);
  project.supportReviewStatus = submittedToSupportManager ? 'pending_review' : 'in_support';
  if (!submittedToSupportManager) {
    project.supportExecutiveAssignee = supportAssignee;
  }

  await project.save();

  const customer = submittedToSupportManager
    ? await Customer.findById(project.customer).populate('portalUser', '_id')
    : await Customer.findByIdAndUpdate(
      project.customer,
      { supportAssignee },
      { new: true },
    ).populate('portalUser', '_id');

  await Document.updateMany(
    deliveryDocQuery(project._id),
    { $addToSet: { tags: 'shared-with-support' } },
  );

  if (customer && !submittedToSupportManager) {
    await scheduleSupportFollowUp(Followup, {
      customer,
      project,
      assigneeId: supportAssignee,
      userId,
      notes,
    });
  }

  await createNotification(
    supportAssignee,
    submittedToSupportManager
      ? 'Project submitted for your review'
      : (isSupportManager(supportUser) ? 'Project submitted to support management' : 'Project handed off to support'),
    submittedToSupportManager
      ? `${actorName} submitted "${project.name}" for support review. Review delivery documents and approve or request changes.`
      : `${actorName} assigned you customer support for "${project.name}". Review delivery documents and follow up with the customer.`,
    'project',
    submittedToSupportManager ? '/projects/support-review' : `/projects/${project._id}`,
  );

  if (customer?.portalUser && !submittedToSupportManager) {
    await createNotification(
      customer.portalUser._id || customer.portalUser,
      'Your support contact is assigned',
      `${supportUser.firstName} ${supportUser.lastName} is your MYTHISOFT support contact for "${project.name}".`,
      'project',
      '/dashboard',
    );
  }

  await logActivity(userId, 'project', `Handed off "${project.name}" to support team`, { type: 'project', id: project._id });

  const populated = await populateProject(Project.findById(project._id));
  const documents = await Document.find({
    isActive: true,
    'relatedTo.type': 'project',
    'relatedTo.id': project._id,
    tags: 'shared-with-support',
  })
    .populate('uploadedBy', 'firstName lastName email role')
    .sort('-createdAt');

  res.json({ project: populated, documents, supportUser });
});

export const getSupportReviewQueue = asyncHandler(async (req, res) => {
  const { queue = 'review' } = req.query;
  const roleFilter = await getProjectFilterByRole(req.user.role, req.user._id, req.user);

  let statusFilter = {};
  if (queue === 'review') {
    if (!isSupportManager(req.user) && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Support review queue is for support managers only');
    }
    statusFilter = { supportReviewStatus: { $in: ['pending_review', 'resubmitted'] } };
  } else if (queue === 'tasks') {
    if (!isSupportManager(req.user) && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Support tasks queue is for support managers only');
    }
    statusFilter = { supportReviewStatus: { $in: ['support_tasks_assigned', 'support_tasks_in_progress', 'support_tasks_complete'] } };
  } else if (queue === 'customer') {
    statusFilter = { supportReviewStatus: 'submitted_to_customer' };
  } else if (queue === 'updates') {
    statusFilter = { supportReviewStatus: { $in: ['changes_required', 'fix_in_progress'] } };
  } else if (queue === 'submitted') {
    statusFilter = { supportHandoffAt: { $exists: true } };
  } else if (queue === 'active') {
    statusFilter = { supportReviewStatus: { $in: ['in_support', 'support_active', 'support_tasks_assigned', 'support_tasks_in_progress'] } };
  } else if (queue === 'closed') {
    statusFilter = { supportReviewStatus: { $in: ['closed', 'verified'] } };
  } else {
    statusFilter = { supportReviewStatus: { $exists: true, $ne: null } };
  }

  const items = await populateProject(
    Project.find({ ...roleFilter, ...statusFilter, supportHandoffAt: { $exists: true } }).sort('-supportHandoffAt'),
  );
  res.json({ items });
});

export const reviewSupportHandoff = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can review project submissions');
  }

  const {
    decision,
    notes,
    updateRequest,
  } = req.body;
  if (!['approve', 'changes_required'].includes(decision)) {
    res.status(400);
    throw new Error('Decision must be approve or changes_required');
  }

  const project = await Project.findById(req.params.id);
  if (!project?.supportHandoffAt) {
    res.status(404);
    throw new Error('Project handoff not found');
  }
  if (project.supportReviewStatus !== 'pending_review') {
    res.status(400);
    throw new Error('Project is not awaiting support review');
  }

  const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Support Manager';

  if (decision === 'approve') {
    project.supportReviewStatus = 'in_support';
    project.supportReviewedAt = new Date();
    project.supportReviewedBy = userId;
    if (notes?.trim()) project.supportReviewNotes = notes.trim();

    await project.save();

    if (project.manager) {
      await createNotification(
        project.manager,
        'Support team accepted project',
        `${actorName} accepted "${project.name}" — support is now active.`,
        'project',
        `/projects/${project._id}`,
      );
    }

    await logActivity(userId, 'project', `Support team accepted "${project.name}"`, { type: 'project', id: project._id });
  } else {
    const { type, title, description } = updateRequest || {};
    if (!type || !title?.trim()) {
      res.status(400);
      throw new Error('Update request type and title are required');
    }
    if (!['bug', 'enhancement'].includes(type)) {
      res.status(400);
      throw new Error('Update request type must be bug or enhancement');
    }

    const ticket = await SupportTicket.create({
      subject: title.trim(),
      description: description?.trim() || notes?.trim() || '',
      customer: project.customer,
      project: project._id,
      category: type,
      requestKind: 'update_request',
      updateRequestType: type,
      supportReviewPhase: 'open',
      priority: type === 'bug' ? 'high' : 'medium',
      status: 'open',
      technicalStatus: 'unassigned',
      createdBy: userId,
      supportAssignee: userId,
    });

    project.activeUpdateRequest = ticket._id;
    project.supportReviewStatus = 'changes_required';
    project.supportReviewedAt = new Date();
    project.supportReviewedBy = userId;
    project.supportReviewNotes = notes || '';
    await project.save();

    if (project.manager) {
      await createNotification(
        project.manager,
        'Update request from support',
        `${actorName} requested ${type === 'bug' ? 'bug fixes' : 'enhancements'} on "${project.name}": ${title.trim()}`,
        'project',
        `/projects/support-updates`,
      );
    }

    await logActivity(userId, 'project', `Requested changes on "${project.name}" — update request ${ticket.ticketNumber}`, {
      type: 'project',
      id: project._id,
    });
  }

  res.json(await populateProject(Project.findById(project._id)));
});

export const startUpdateRequestFix = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (isTechnicalManager(req.user)) {
    const ownsProject = String(project.manager || '') === String(userId)
      || String(project.createdBy || '') === String(userId);
    if (!ownsProject) {
      res.status(403);
      throw new Error('You can only manage update requests on your projects');
    }
  } else if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not allowed');
  }

  if (!['changes_required', 'fix_in_progress'].includes(project.supportReviewStatus)) {
    res.status(400);
    throw new Error('No active update request on this project');
  }

  const { technicalAssignee } = req.body;
  if (!technicalAssignee) {
    res.status(400);
    throw new Error('Select a developer to assign');
  }

  const User = (await import('../models/User.js')).default;
  const developer = await User.findOne({ _id: technicalAssignee, role: 'technical', isActive: { $ne: false } });
  if (!developer) {
    res.status(400);
    throw new Error('Assignee must be an active developer');
  }

  project.supportReviewStatus = 'fix_in_progress';
  await project.save();

  if (project.activeUpdateRequest) {
    await SupportTicket.findByIdAndUpdate(project.activeUpdateRequest, {
      technicalAssignee,
      technicalStatus: 'assigned',
      supportReviewPhase: 'assigned',
      status: 'assigned',
    });
  }

  await createNotification(
    technicalAssignee,
    'Update request assigned',
    `You were assigned to fix "${project.name}". Complete work, then tech manager will resubmit to support.`,
    'project',
    project.activeUpdateRequest ? `/tickets/${project.activeUpdateRequest}` : `/projects/${project._id}`,
  );

  await logActivity(userId, 'project', `Assigned developer to update request on "${project.name}"`, { type: 'project', id: project._id });

  res.json(await populateProject(Project.findById(project._id)));
});

export const resubmitProjectToSupport = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  if (!isTechnicalManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only technical manager can resubmit to support');
  }

  const { notes } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const ownsProject = String(project.manager || '') === String(userId)
    || String(project.createdBy || '') === String(userId);
  if (isTechnicalManager(req.user) && !ownsProject) {
    res.status(403);
    throw new Error('You can only resubmit projects you manage');
  }

  if (!['changes_required', 'fix_in_progress'].includes(project.supportReviewStatus)) {
    res.status(400);
    throw new Error('Project is not ready to resubmit — complete the update request first');
  }

  project.supportReviewStatus = 'resubmitted';
  if (notes?.trim()) {
    project.supportReviewNotes = notes.trim();
  }
  await project.save();

  if (project.activeUpdateRequest) {
    await SupportTicket.findByIdAndUpdate(project.activeUpdateRequest, {
      supportReviewPhase: 'resubmitted',
      technicalStatus: 'testing',
      status: 'working',
    });
  }

  const reviewerId = project.supportAssignee;
  const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Technical Manager';

  if (reviewerId) {
    await createNotification(
      reviewerId,
      'Project resubmitted for verification',
      `${actorName} resubmitted "${project.name}" after completing the update request. Please verify the fix.`,
      'project',
      '/projects/support-review',
    );
  }

  await logActivity(userId, 'project', `Resubmitted "${project.name}" to support for verification`, { type: 'project', id: project._id });

  res.json(await populateProject(Project.findById(project._id)));
});

export const verifySupportFix = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can verify fixes');
  }

  const { decision, notes } = req.body;
  if (!['approve', 'reopen'].includes(decision)) {
    res.status(400);
    throw new Error('Decision must be approve or reopen');
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  if (project.supportReviewStatus !== 'resubmitted') {
    res.status(400);
    throw new Error('Project is not awaiting verification');
  }

  const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Support Manager';

  if (decision === 'approve') {
    const closedTicketId = project.activeUpdateRequest;

    project.supportReviewStatus = 'pending_review';
    project.supportReviewNotes = notes || project.supportReviewNotes || '';
    project.supportReviewedAt = new Date();
    project.supportReviewedBy = userId;
    project.activeUpdateRequest = undefined;
    await project.save();

    if (closedTicketId) {
      await SupportTicket.findByIdAndUpdate(closedTicketId, {
        status: 'closed',
        technicalStatus: 'closed',
        supportReviewPhase: 'closed',
        closedAt: new Date(),
        resolvedAt: new Date(),
      });
    }

    if (project.manager) {
      await createNotification(
        project.manager,
        'Update request verified',
        `${actorName} approved the fix for "${project.name}". Support manager will submit to the customer next.`,
        'project',
        `/projects/${project._id}`,
      );
    }

    await logActivity(userId, 'project', `Verified fix on "${project.name}" — awaiting customer handoff`, { type: 'project', id: project._id });
  } else {
    project.supportReviewStatus = 'changes_required';
    if (notes?.trim()) project.supportReviewNotes = notes.trim();
    await project.save();

    if (project.activeUpdateRequest) {
      await SupportTicket.findByIdAndUpdate(project.activeUpdateRequest, {
        supportReviewPhase: 'reopened',
        status: 'open',
        technicalStatus: 'assigned',
      });
    }

    if (project.manager) {
      await createNotification(
        project.manager,
        'Update request reopened',
        `${actorName} reopened the update request on "${project.name}". Additional changes are required.`,
        'project',
        `/projects/support-updates`,
      );
    }

    await logActivity(userId, 'project', `Reopened update request on "${project.name}"`, { type: 'project', id: project._id });
  }

  res.json(await populateProject(Project.findById(project._id)));
});

export const listSupportHandoffDocuments = asyncHandler(async (req, res) => {
  const roleFilter = await getProjectFilterByRole(req.user.role, req.user._id, req.user);
  const projects = await Project.find(roleFilter).select('name customer').lean();
  const projectIds = projects.map((p) => p._id);

  if (!projectIds.length) {
    res.json([]);
    return;
  }

  const nameById = Object.fromEntries(projects.map((p) => [String(p._id), p.name]));
  const documents = await Document.find({
    isActive: true,
    'relatedTo.type': 'project',
    'relatedTo.id': { $in: projectIds },
    tags: 'shared-with-support',
  })
    .populate('uploadedBy', 'firstName lastName email role')
    .sort('-createdAt')
    .lean();

  res.json(documents.map((doc) => ({
    ...doc,
    projectName: nameById[String(doc.relatedTo?.id)] || 'Project',
  })));
});

export const acceptProject = asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') {
    res.status(403);
    throw new Error('Only customers can accept project delivery');
  }

  const customerId = getCustomerRefId(req.user);
  const project = await Project.findById(req.params.id);
  if (!project || String(project.customer) !== String(customerId)) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.deliveryChecklist?.clientAcceptance) {
    res.status(400);
    throw new Error('Project has already been accepted');
  }

  const submittedForAcceptance = project.supportReviewStatus === 'submitted_to_customer'
    || Boolean(project.submittedToCustomerAt);
  const deliverableStatuses = ['delivered', 'completed', 'support'];
  const deliverableReviewStatuses = ['in_support', 'support_active'];
  if (
    !submittedForAcceptance
    && !deliverableStatuses.includes(project.workflowStage)
    && !['delivered', 'completed'].includes(project.status)
    && !deliverableReviewStatuses.includes(project.supportReviewStatus)
  ) {
    res.status(400);
    throw new Error('Project is not ready for customer acceptance yet');
  }

  const { comments } = req.body;
  project.deliveryChecklist = {
    ...(project.deliveryChecklist?.toObject?.() || project.deliveryChecklist || {}),
    clientAcceptance: true,
    clientAcceptanceAt: new Date(),
    clientAcceptanceNotes: comments?.trim() || '',
    clientAcceptedBy: req.user._id,
  };
  project.supportReviewStatus = 'support_active';
  await project.save();

  const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Customer';
  const notifyIds = [project.supportAssignee, project.supportExecutiveAssignee, project.manager].filter(Boolean);

  await Promise.all(notifyIds.map((uid) => createNotification(
    uid,
    'Project accepted by customer',
    `${actorName} accepted delivery of "${project.name}".`,
    'project',
    `/projects/${project._id}`,
  )));

  await logActivity(req.user._id, 'project', `Accepted project delivery: ${project.name}`, { type: 'project', id: project._id });

  res.json(await populateProject(Project.findById(project._id)));
});

export const markCustomerAcceptanceByManager = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can record customer acceptance');
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.deliveryChecklist?.clientAcceptance) {
    res.status(400);
    throw new Error('Project has already been accepted');
  }

  if (project.supportReviewStatus !== 'submitted_to_customer' && !project.submittedToCustomerAt) {
    res.status(400);
    throw new Error('Project is not pending customer acceptance');
  }

  const { comments } = req.body;
  const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Support Manager';

  project.deliveryChecklist = {
    ...(project.deliveryChecklist?.toObject?.() || project.deliveryChecklist || {}),
    clientAcceptance: true,
    clientAcceptanceAt: new Date(),
    clientAcceptanceNotes: comments?.trim() || `Recorded by ${actorName}`,
    clientAcceptedBy: req.user._id,
  };
  project.supportReviewStatus = 'support_active';
  await project.save();

  const Customer = (await import('../models/Customer.js')).default;
  const customer = await Customer.findById(project.customer).populate('portalUser', '_id');
  const notifyIds = [
    project.supportAssignee,
    project.supportExecutiveAssignee,
    project.manager,
    customer?.portalUser?._id,
  ].filter(Boolean);

  await Promise.all(notifyIds.map((uid) => createNotification(
    uid,
    'Project marked as customer accepted',
    `${actorName} recorded customer acceptance for "${project.name}".`,
    'project',
    `/projects/${project._id}`,
  )));

  await logActivity(req.user._id, 'project', `Recorded customer acceptance for "${project.name}"`, { type: 'project', id: project._id });

  res.json(await populateProject(Project.findById(project._id)));
});

/** Support manager assigns a logical support team (StaffRole) to a handed-off project */
export const assignSupportTeamToProject = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can assign teams to projects');
  }

  const { staffRoleId, startDate, notes } = req.body;
  if (!staffRoleId) {
    res.status(400);
    throw new Error('Select a support team');
  }

  const StaffRole = (await import('../models/StaffRole.js')).default;
  const User = (await import('../models/User.js')).default;
  const Followup = (await import('../models/Followup.js')).default;
  const Customer = (await import('../models/Customer.js')).default;

  const team = await StaffRole.findById(staffRoleId);
  if (!team || team.teamGroup !== 'support' || team.status === 'inactive') {
    res.status(400);
    throw new Error('Invalid or inactive support team');
  }

  if (isSupportManager(req.user)) {
    const owned = await StaffRole.findOne({ _id: staffRoleId, ...getSupportManagerStaffRoleFilter(req.user._id) });
    if (!owned) {
      res.status(403);
      throw new Error('You can only assign teams you manage');
    }
  }

  const members = await User.find({
    staffRole: staffRoleId,
    role: 'support',
    isActive: { $ne: false },
  }).select('_id firstName lastName email');

  if (!members.length) {
    res.status(400);
    throw new Error('Team has no active support executives');
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  if (!project.supportHandoffAt) {
    res.status(400);
    throw new Error('Project must be submitted to support before assigning a team');
  }

  const memberIds = members.map((m) => m._id);
  const leadId = team.teamLeader || team.teamManager || memberIds[0];
  const actorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Support Manager';
  const awaitingReview = ['pending_review', 'resubmitted'].includes(project.supportReviewStatus);

  project.supportStaffRole = staffRoleId;
  project.supportTeamAssignees = memberIds;
  project.supportAssignee = req.user._id;
  if (startDate) project.supportTeamStartDate = new Date(startDate);
  project.supportTeamAssignmentNotes = notes || '';

  if (awaitingReview) {
    project.supportExecutiveAssignee = undefined;
  } else {
    project.supportExecutiveAssignee = leadId;
    project.supportReviewStatus = project.supportReviewStatus || 'in_support';
  }

  await project.save();

  if (awaitingReview) {
    await logActivity(req.user._id, 'project', `Linked support team "${team.name}" to "${project.name}" (awaiting review)`, { type: 'project', id: project._id });
    return res.json(await populateProject(Project.findById(project._id)));
  }

  const customer = await Customer.findByIdAndUpdate(
    project.customer,
    { supportAssignee: leadId },
    { new: true },
  ).populate('portalUser', '_id');

  await scheduleSupportFollowUp(Followup, {
    customer,
    project,
    assigneeId: leadId,
    userId: req.user._id,
    notes,
  });

  for (const member of members) {
    await createNotification(
      member._id,
      'Project assigned to your support team',
      `${actorName} assigned "${project.name}" to team "${team.name}".`,
      'project',
      `/projects/${project._id}`,
    );
  }

  await logActivity(req.user._id, 'project', `Assigned support team "${team.name}" to "${project.name}"`, { type: 'project', id: project._id });

  res.json(await populateProject(Project.findById(project._id)));
});
