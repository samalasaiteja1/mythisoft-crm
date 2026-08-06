import Milestone from '../models/Milestone.js';
import { asyncHandler } from '../utils/helpers.js';
import { isTechnicalManager, getTechnicalManagerMilestoneFilter } from '../utils/managerScope.js';

const populateQuery = (query) => query
  .populate({
    path: 'project',
    select: 'name code status customer manager assignedTo supportAssignee memberRoleLabels',
    populate: [
      { path: 'customer', select: 'firstName lastName email supportAssignee assignedTo' },
      { path: 'manager', select: 'firstName lastName email role departmentName staffRole' },
      { path: 'assignedTo', select: 'firstName lastName email role' },
      { path: 'supportAssignee', select: 'firstName lastName email role' },
    ],
  })
  .populate('staffRole', 'name code teamGroup projectRef')
  .populate('assignedTo', 'firstName lastName employeeId email role')
  .populate('technicalManager', 'firstName lastName email role departmentName staffRole', {
    populate: { path: 'staffRole', select: 'name code teamGroup department' },
  })
  .populate('assignedMembers', 'firstName lastName employeeId email role roleId')
  .populate('createdBy', 'firstName lastName role')
  .populate('parentMilestone', 'name status')
  .populate('dependsOn', 'name status');

const parseMemberRoleLabels = (memberRoleLabels, memberIds = []) => {
  if (!memberRoleLabels || typeof memberRoleLabels !== 'object') return undefined;
  const labels = new Map();
  const validIds = new Set((memberIds || []).map(String));
  Object.entries(memberRoleLabels).forEach(([uid, label]) => {
    const trimmed = String(label || '').trim();
    if (!trimmed) return;
    const id = String(uid);
    if (validIds.size && !validIds.has(id)) return;
    labels.set(id, trimmed);
  });
  return labels.size ? labels : undefined;
};

const parseDate = (value) => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const buildMilestoneFields = (body, { partial = false } = {}) => {
  const fields = {};
  const set = (key, value) => {
    if (partial && value === undefined) return;
    fields[key] = value;
  };

  const {
    name,
    description,
    projectId,
    staffRoleId,
    milestoneType,
    priority,
    startDate,
    endDate,
    dueDate,
    estimatedDurationDays,
    progress,
    status,
    parentMilestoneId,
    dependsOnId,
    assignedTo,
    technicalManager,
    assignedMembers,
    memberRoleLabels,
    remarks,
    attachments,
  } = body;

  if (name !== undefined) set('name', name?.trim());
  if (description !== undefined) set('description', description?.trim() || undefined);
  if (projectId !== undefined) set('project', projectId || null);
  if (staffRoleId !== undefined) set('staffRole', staffRoleId || null);
  if (milestoneType !== undefined) set('milestoneType', milestoneType?.trim() || undefined);
  if (priority !== undefined) set('priority', priority || 'medium');
  if (startDate !== undefined) set('startDate', startDate ? parseDate(startDate) : null);
  if (endDate !== undefined) {
    const end = endDate ? parseDate(endDate) : null;
    set('endDate', end);
    set('dueDate', end);
  }
  if (dueDate !== undefined && endDate === undefined) {
    const due = dueDate ? parseDate(dueDate) : null;
    set('dueDate', due);
    set('endDate', due);
  }
  if (estimatedDurationDays !== undefined) {
    const days = estimatedDurationDays === '' || estimatedDurationDays === null
      ? undefined
      : Number(estimatedDurationDays);
    set('estimatedDurationDays', Number.isFinite(days) ? days : undefined);
  }
  if (progress !== undefined) {
    const pct = Number(progress);
    set('progress', Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0);
  }
  if (status !== undefined) set('status', status || 'not_started');
  if (parentMilestoneId !== undefined) set('parentMilestone', parentMilestoneId || null);
  if (dependsOnId !== undefined) set('dependsOn', dependsOnId || null);
  if (technicalManager !== undefined) set('technicalManager', technicalManager || null);
  if (assignedMembers !== undefined) {
    const members = Array.isArray(assignedMembers) ? assignedMembers.filter(Boolean) : [];
    set('assignedMembers', members);
    if (memberRoleLabels !== undefined) {
      set('memberRoleLabels', parseMemberRoleLabels(memberRoleLabels, members));
    }
    if (assignedTo === undefined && members.length) {
      set('assignedTo', members[0]);
    }
  } else if (memberRoleLabels !== undefined) {
    set('memberRoleLabels', parseMemberRoleLabels(memberRoleLabels));
  }
  if (remarks !== undefined) set('remarks', remarks?.trim() || undefined);
  if (attachments !== undefined) set('attachments', Array.isArray(attachments) ? attachments : []);

  return fields;
};

export const getAll = asyncHandler(async (req, res) => {
  const { projectId, staffRoleId, status } = req.query;
  const query = {};
  if (projectId) query.project = projectId;
  if (staffRoleId) query.staffRole = staffRoleId;
  if (status) query.status = status;

  if (isTechnicalManager(req.user)) {
    const scope = await getTechnicalManagerMilestoneFilter(req.user._id);
    Object.assign(query, scope);
  }

  const items = await populateQuery(
    Milestone.find(query).sort({ startDate: 1, endDate: 1, createdAt: -1 })
  );
  const typeOrder = {
    Design: 1,
    Development: 2,
    'Code Review': 3,
    Testing: 4,
    UAT: 5,
    Documentation: 6,
    Deployment: 7,
    Release: 8,
    Other: 9,
  };
  items.sort((a, b) => {
    const oa = typeOrder[a.milestoneType] ?? 99;
    const ob = typeOrder[b.milestoneType] ?? 99;
    if (oa !== ob) return oa - ob;
    const sa = a.startDate ? new Date(a.startDate).getTime() : 0;
    const sb = b.startDate ? new Date(b.startDate).getTime() : 0;
    return sa - sb;
  });
  res.json({ items, total: items.length });
});

export const getOne = asyncHandler(async (req, res) => {
  if (isTechnicalManager(req.user)) {
    const scope = await getTechnicalManagerMilestoneFilter(req.user._id);
    const allowed = await Milestone.findOne({ _id: req.params.id, ...scope });
    if (!allowed) {
      res.status(404);
      throw new Error('Milestone not found');
    }
  }
  const item = await populateQuery(Milestone.findById(req.params.id));
  if (!item) {
    res.status(404);
    throw new Error('Milestone not found');
  }
  res.json(item);
});

export const create = asyncHandler(async (req, res) => {
  const fields = buildMilestoneFields(req.body);
  if (!fields.name?.trim()) {
    res.status(400);
    throw new Error('Milestone name is required');
  }
  if (!fields.project) {
    res.status(400);
    throw new Error('Project is required');
  }
  if (!fields.milestoneType) {
    res.status(400);
    throw new Error('Milestone type is required');
  }
  if (!fields.startDate) {
    res.status(400);
    throw new Error('Start date is required');
  }
  if (!fields.endDate) {
    res.status(400);
    throw new Error('End date is required');
  }

  if (isTechnicalManager(req.user) && !fields.technicalManager) {
    fields.technicalManager = req.user._id;
  }

  const item = await Milestone.create({
    ...fields,
    name: fields.name.trim(),
    createdBy: req.user._id,
  });

  res.status(201).json(await populateQuery(Milestone.findById(item._id)));
});

export const update = asyncHandler(async (req, res) => {
  const fields = buildMilestoneFields(req.body, { partial: true });
  if (fields.name !== undefined && !fields.name?.trim()) {
    res.status(400);
    throw new Error('Milestone name is required');
  }
  if (fields.name) fields.name = fields.name.trim();

  const item = await populateQuery(
    Milestone.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true })
  );
  if (!item) {
    res.status(404);
    throw new Error('Milestone not found');
  }
  res.json(item);
});

export const remove = asyncHandler(async (req, res) => {
  const item = await Milestone.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Milestone not found');
  }
  await item.deleteOne();
  res.json({ message: 'Milestone removed' });
});
