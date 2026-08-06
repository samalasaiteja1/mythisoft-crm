import SupportProjectTask from '../models/SupportProjectTask.js';
import Project from '../models/Project.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/helpers.js';
import { createNotification, logActivity } from './authController.js';
import { isSupportManager } from '../utils/managerScope.js';
import {
  SUPPORT_EXECUTIVE_TASK_TYPES,
  TECHNICAL_SUPPORT_TASK_TYPES,
  SUPPORT_TASK_TYPE_META,
  defaultDueDate,
  teamTaskCategory,
  categoryForTaskType,
} from '../constants/supportProjectTasks.js';
import {
  findUsersForAssigneeCategory,
  assigneeCategoryForUser,
  ensureTeamMemberRoleLabels,
} from '../utils/supportTaskAssignees.js';
import { isValidStatusTransition } from '../constants/supportTaskStatusFlows.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';
import { sendProjectDeliveryEmail } from '../utils/sendEmail.js';

const populateTasks = (query) => query
  .populate('assignedTo', 'firstName lastName email role')
  .populate('createdBy', 'firstName lastName email')
  .populate('smApprovedBy', 'firstName lastName email')
  .populate('progressUpdates.author', 'firstName lastName email')
  .populate({
    path: 'project',
    select: 'name customer supportReviewStatus',
    populate: { path: 'customer', select: 'firstName lastName companyName' },
  });

function buildTaskPayload({
  projectId,
  taskType,
  title,
  description,
  assignedTo,
  assigneeCategory,
  createdBy,
  priority,
  dueDate,
  estimatedHours,
  taskKey,
  status,
}) {
  const meta = SUPPORT_TASK_TYPE_META[taskType] || SUPPORT_TASK_TYPE_META.custom;
  const row = {
    project: projectId,
    taskKey: taskKey || (taskType === 'custom' ? `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : taskType),
    taskType,
    assigneeCategory,
    title: title || meta.label,
    description: description?.trim() || '',
    assignedTo,
    createdBy,
    status: status || 'assigned',
    priority: priority || meta.priority || 'medium',
    dueDate: dueDate ? new Date(dueDate) : defaultDueDate(),
  };
  if (estimatedHours != null && estimatedHours !== '' && !Number.isNaN(Number(estimatedHours))) {
    row.estimatedHours = Number(estimatedHours);
  }
  return row;
}

function parseAssigneeIds(body) {
  const { assignedTo, assignedToIds } = body;
  if (assignedToIds) {
    if (Array.isArray(assignedToIds)) {
      return [...new Set(assignedToIds.map(String).filter(Boolean))];
    }
    if (typeof assignedToIds === 'string') {
      try {
        const parsed = JSON.parse(assignedToIds);
        if (Array.isArray(parsed)) {
          return [...new Set(parsed.map(String).filter(Boolean))];
        }
      } catch {
        return [...new Set(assignedToIds.split(',').map((s) => s.trim()).filter(Boolean))];
      }
    }
  }
  if (assignedTo) return [String(assignedTo)];
  return [];
}

async function createOneSupportProjectTask({
  project,
  team,
  assigneeId,
  title,
  taskType,
  priority,
  dueDate,
  description,
  estimatedHours,
  status,
  attachments,
  createdBy,
  reqUserId,
  taskKeySuffix = '',
  mainTaskBatchId,
}) {
  const assignee = await User.findById(assigneeId)
    .select('role staffRole isActive departmentName hrProfile designation')
    .populate('staffRole', 'name code memberRoleLabels')
    .lean();
  if (!assignee || assignee.isActive === false) {
    const err = new Error('Team member not found or inactive');
    err.statusCode = 400;
    throw err;
  }
  if (String(assignee.staffRole?._id || assignee.staffRole) !== String(team._id)) {
    const err = new Error('Selected member must belong to the chosen support team');
    err.statusCode = 400;
    throw err;
  }

  const resolvedType = taskType && SUPPORT_TASK_TYPE_META[taskType] ? taskType : 'custom';
  const typeCategory = categoryForTaskType(resolvedType);
  const resolvedCategory = typeCategory
    || assigneeCategoryForUser(assignee, team)
    || 'support_executive';

  const allowedStatuses = ['assigned', 'accepted', 'in_progress', 'waiting_customer'];
  const initialStatus = allowedStatuses.includes(status) ? status : 'assigned';

  const uniqueKey = resolvedType === 'custom'
    ? `custom_${Date.now()}_${assigneeId}_${taskKeySuffix || Math.random().toString(36).slice(2, 8)}`
    : `${resolvedType}_${assigneeId}`;

  const payload = buildTaskPayload({
    projectId: project._id,
    taskType: resolvedType,
    taskKey: uniqueKey,
    title: title.trim(),
    description: description?.trim() || '',
    assignedTo: assigneeId,
    assigneeCategory: resolvedCategory,
    createdBy,
    priority,
    dueDate,
    estimatedHours,
    status: initialStatus,
  });

  let task;
  let isUpdate = false;

  if (resolvedType !== 'custom') {
    const existing = await SupportProjectTask.findOne({ project: project._id, taskKey: payload.taskKey });
    if (existing) {
      isUpdate = true;
      existing.title = payload.title;
      existing.description = payload.description;
      existing.assignedTo = assigneeId;
      existing.assigneeCategory = resolvedCategory;
      existing.priority = payload.priority;
      existing.dueDate = payload.dueDate;
      existing.status = initialStatus;
      if (estimatedHours != null && estimatedHours !== '' && !Number.isNaN(Number(estimatedHours))) {
        existing.estimatedHours = Number(estimatedHours);
      }
      if (attachments.length) {
        existing.attachments = [...(existing.attachments || []), ...attachments];
      }
      await existing.save();
      task = existing;
    }
  }

  if (!task) {
    task = await SupportProjectTask.create({
      ...payload,
      attachments,
      ...(mainTaskBatchId ? { mainTaskBatchId } : {}),
    });
  } else if (mainTaskBatchId && !task.mainTaskBatchId) {
    task.mainTaskBatchId = mainTaskBatchId;
    await task.save();
  }

  const taskPath = assignee?.role === 'technical' ? '/technical/support-tasks' : '/support/my-tasks';
  await createNotification(
    assigneeId,
    isUpdate ? 'Support task updated' : 'New support task assigned',
    `"${payload.title}" on ${project.name}`,
    'project',
    taskPath,
  );

  return { task, isUpdate };
}

export async function createSplitDefaultSupportTasks(projectId, supportExecutiveId, technicalSupportEngineerId, createdBy) {
  const existing = await SupportProjectTask.countDocuments({ project: projectId });
  if (existing) {
    return SupportProjectTask.find({ project: projectId });
  }

  const due = defaultDueDate();
  const rows = [];

  for (const taskType of SUPPORT_EXECUTIVE_TASK_TYPES) {
    rows.push(buildTaskPayload({
      projectId,
      taskType,
      assignedTo: supportExecutiveId,
      assigneeCategory: 'support_executive',
      createdBy,
      dueDate: due,
    }));
  }

  for (const taskType of TECHNICAL_SUPPORT_TASK_TYPES) {
    rows.push(buildTaskPayload({
      projectId,
      taskType,
      assignedTo: technicalSupportEngineerId,
      assigneeCategory: 'technical_support_engineer',
      createdBy,
      dueDate: due,
    }));
  }

  return SupportProjectTask.insertMany(rows);
}

/** @deprecated use createSplitDefaultSupportTasks */
export async function createDefaultSupportTasks(projectId, assigneeId, createdBy) {
  return createSplitDefaultSupportTasks(projectId, assigneeId, assigneeId, createdBy);
}

async function syncProjectTaskStatus(projectId) {
  const tasks = await SupportProjectTask.find({ project: projectId });
  if (!tasks.length) return null;

  const project = await Project.findById(projectId);
  if (!project) return null;

  const allCompleted = tasks.every((t) => t.status === 'completed');
  const anyInProgress = tasks.some((t) => ['in_progress', 'accepted', 'waiting_customer'].includes(t.status));
  const anyCompleted = tasks.some((t) => t.status === 'completed');

  if (allCompleted && !['support_tasks_complete', 'submitted_to_customer', 'support_active'].includes(project.supportReviewStatus)) {
    project.supportReviewStatus = 'support_tasks_complete';
    if (project.smReviewChecklist) {
      project.smReviewChecklist.tasksVerified = false;
    }
    await project.save();

    const smId = project.supportAssignee;
    if (smId) {
      await createNotification(
        smId,
        'Support tasks completed',
        `All support tasks are done for "${project.name}" — verify and submit to the customer`,
        'project',
        '/support/project-delivery',
      );
    }
  } else if (anyInProgress && ['support_tasks_assigned', 'support_tasks_in_progress'].includes(project.supportReviewStatus)) {
    project.supportReviewStatus = 'support_tasks_in_progress';
    await project.save();
  } else if (anyCompleted && !allCompleted && project.supportReviewStatus === 'support_tasks_assigned') {
    project.supportReviewStatus = 'support_tasks_in_progress';
    await project.save();
  }

  return project;
}

export const getSupportTaskTeamMembers = asyncHandler(async (req, res) => {
  const { staffRoleId, category } = req.query;
  if (!staffRoleId) {
    res.status(400);
    throw new Error('staffRoleId is required');
  }

  const StaffRole = (await import('../models/StaffRole.js')).default;
  const team = await StaffRole.findById(staffRoleId).lean();
  if (!team || team.teamGroup !== 'support' || team.status === 'inactive') {
    res.status(400);
    throw new Error('Invalid support team');
  }

  let users = await User.find({
    staffRole: staffRoleId,
    role: { $in: ['support', 'technical'] },
    isActive: { $ne: false },
  })
    .select('firstName lastName email role staffRole departmentName hrProfile designation roleId assignedProjectRole')
    .populate('staffRole', 'name code teamGroup description memberRoleLabels')
    .populate('roleId', 'name')
    .sort('firstName')
    .lean();

  const teamWithLabels = await ensureTeamMemberRoleLabels(team, users);

  if (['support_executive', 'technical_support_engineer'].includes(category)) {
    users = users.filter((u) => assigneeCategoryForUser(u, teamWithLabels) === category);
  }

  res.json({ team: teamWithLabels, members: users });
});

export const getSupportTaskAssignees = asyncHandler(async (req, res) => {
  const { category } = req.query;
  if (!['support_executive', 'technical_support_engineer'].includes(category)) {
    res.status(400);
    throw new Error('category must be support_executive or technical_support_engineer');
  }
  const users = await findUsersForAssigneeCategory(category);
  res.json(users);
});

export const getSupportTaskProjects = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const projects = await Project.find({
    supportHandoffAt: { $ne: null },
    supportReviewStatus: {
      $nin: ['closed', 'verified'],
    },
  })
    .populate('customer', 'firstName lastName companyName')
    .select('name customer supportReviewStatus supportExecutiveAssignee technicalSupportAssignee')
    .sort('-supportHandoffAt')
    .limit(200)
    .lean();

  res.json(projects);
});

export const createSupportProjectTask = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can create support tasks');
  }

  const project = await Project.findById(req.params.id).populate('customer', 'firstName lastName companyName');
  if (!project?.supportHandoffAt) {
    res.status(404);
    throw new Error('Project not found or not in support delivery');
  }

  const {
    title,
    taskType,
    assignedTo,
    staffRoleId,
    priority,
    dueDate,
    description,
    status,
    estimatedHours,
  } = req.body;

  const assigneeIds = parseAssigneeIds(req.body);

  if (!title?.trim()) {
    res.status(400);
    throw new Error('Task title is required');
  }
  if (!dueDate) {
    res.status(400);
    throw new Error('Due date is required');
  }
  if (!assigneeIds.length) {
    res.status(400);
    throw new Error('Select at least one team member');
  }
  if (!staffRoleId) {
    res.status(400);
    throw new Error('Support team is required');
  }

  const StaffRole = (await import('../models/StaffRole.js')).default;
  const team = await StaffRole.findById(staffRoleId);
  if (!team || team.teamGroup !== 'support' || team.status === 'inactive') {
    res.status(400);
    throw new Error('Invalid support team');
  }

  const attachments = [];
  const file = req.file;
  if (file?.buffer) {
    const uploaded = await uploadBufferToCloudinary(file.buffer, 'support-tasks', { originalname: file.originalname });
    attachments.push({
      name: file.originalname,
      url: uploaded.url,
      mimeType: file.mimetype,
      uploadedBy: req.user._id,
    });
  }

  const createdTasks = [];
  let anyUpdate = false;
  const mainTaskBatchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  for (let i = 0; i < assigneeIds.length; i += 1) {
    const { task, isUpdate } = await createOneSupportProjectTask({
      project,
      team,
      assigneeId: assigneeIds[i],
      title,
      taskType: taskType?.trim() || 'custom',
      priority,
      dueDate,
      description,
      estimatedHours,
      status,
      attachments,
      createdBy: req.user._id,
      reqUserId: req.user._id,
      taskKeySuffix: String(i),
      mainTaskBatchId,
    });
    createdTasks.push(task);
    if (isUpdate) anyUpdate = true;
  }

  if (['pending_review', 'support_tasks_complete', 'submitted_to_customer', 'support_active'].includes(project.supportReviewStatus)) {
    project.supportReviewStatus = 'support_tasks_assigned';
    await project.save();
  } else if (project.supportReviewStatus === 'support_tasks_assigned') {
    project.supportReviewStatus = 'support_tasks_in_progress';
    await project.save();
  }

  await logActivity(
    req.user._id,
    'project',
    `${anyUpdate ? 'Updated' : 'Created'} ${createdTasks.length} task(s) "${title.trim()}" for "${project.name}"`,
    { type: 'project', id: project._id },
  );

  const populated = await populateTasks(
    SupportProjectTask.find({ _id: { $in: createdTasks.map((t) => t._id) } }),
  );

  if (createdTasks.length === 1) {
    res.status(201).json(populated[0] || populated);
    return;
  }

  res.status(201).json({ items: populated, count: populated.length });
});

export const getMySupportTasks = asyncHandler(async (req, res) => {
  const tasks = await populateTasks(
    SupportProjectTask.find({ assignedTo: req.user._id }).sort('-updatedAt'),
  );
  res.json(tasks);
});

/** Tasks created by the logged-in support manager (read-only status tracking). */
export const getSupportManagerCreatedTasks = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
  const { status, projectId } = req.query;
  if (status) query.status = status;
  if (projectId) query.project = projectId;

  const tasks = await populateTasks(
    SupportProjectTask.find(query).sort('-createdAt'),
  );
  res.json(tasks);
});

export const getSupportProjectTask = asyncHandler(async (req, res) => {
  const task = await SupportProjectTask.findById(req.params.taskId);
  if (!task || String(task.project) !== String(req.params.id)) {
    res.status(404);
    throw new Error('Task not found');
  }

  const isAssignee = String(task.assignedTo) === String(req.user._id);
  const isSm = isSupportManager(req.user) || req.user.role === 'admin';
  if (!isAssignee && !isSm) {
    res.status(403);
    throw new Error('Not authorized to view this task');
  }

  const populated = await populateTasks(SupportProjectTask.findById(task._id));
  res.json(populated);
});

export const getProjectSupportTasks = asyncHandler(async (req, res) => {
  const tasks = await populateTasks(
    SupportProjectTask.find({ project: req.params.id }).sort('assigneeCategory taskKey'),
  );
  res.json(tasks);
});

export const completeSupportProjectTask = asyncHandler(async (req, res) => {
  const task = await SupportProjectTask.findById(req.params.taskId);
  if (!task || String(task.project) !== String(req.params.id)) {
    res.status(404);
    throw new Error('Task not found');
  }

  const isAssignee = String(task.assignedTo) === String(req.user._id);
  const isSm = isSupportManager(req.user) || req.user.role === 'admin';
  const isWorker = ['support', 'technical'].includes(req.user.role);

  if (!isAssignee && !isSm) {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }
  if (isWorker && !isAssignee && !isSm) {
    res.status(403);
    throw new Error('Only the assigned team member can update this task');
  }

  const { status, completionNotes } = req.body;
  const statusMap = {
    assigned: 'assigned',
    pending: 'assigned',
    accepted: 'accepted',
    in_progress: 'in_progress',
    waiting_customer: 'waiting_customer',
    completed: 'completed',
    start: 'in_progress',
    accept: 'accepted',
  };
  const nextStatus = statusMap[status] || status;
  const allowed = ['assigned', 'accepted', 'in_progress', 'waiting_customer', 'completed'];
  if (!allowed.includes(nextStatus)) {
    res.status(400);
    throw new Error('Invalid task status');
  }
  if (!isSm && !isValidStatusTransition(task.taskType || task.taskKey, task.status, nextStatus)) {
    res.status(400);
    throw new Error('This status change is not allowed for this task type');
  }
  task.status = nextStatus;
  if (task.status === 'completed') {
    task.completedAt = new Date();
    task.completionNotes = completionNotes?.trim() || '';
  } else {
    task.completedAt = undefined;
    if (completionNotes?.trim()) task.completionNotes = completionNotes.trim();
  }
  await task.save();

  await syncProjectTaskStatus(task.project);

  const populated = await populateTasks(SupportProjectTask.findById(task._id));
  res.json(populated);
});

/** Add progress comment and/or file without changing status */
export const addSupportTaskProgress = asyncHandler(async (req, res) => {
  const task = await SupportProjectTask.findById(req.params.taskId);
  if (!task || String(task.project) !== String(req.params.id)) {
    res.status(404);
    throw new Error('Task not found');
  }

  const isAssignee = String(task.assignedTo) === String(req.user._id);
  const isSm = isSupportManager(req.user) || req.user.role === 'admin';
  if (!isAssignee && !isSm) {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  const comment = req.body?.comment?.trim() || req.body?.text?.trim() || '';
  const fileAttachments = [];

  const file = req.file;
  if (file?.buffer) {
    const uploaded = await uploadBufferToCloudinary(file.buffer, 'support-tasks', { originalname: file.originalname });
    const attachment = {
      name: file.originalname,
      url: uploaded.url,
      mimeType: file.mimetype,
      uploadedBy: req.user._id,
    };
    fileAttachments.push(attachment);
    task.attachments = [...(task.attachments || []), attachment];
  }

  if (!comment && !fileAttachments.length) {
    res.status(400);
    throw new Error('Add a comment or upload a file');
  }

  task.progressUpdates = [
    ...(task.progressUpdates || []),
    {
      text: comment,
      author: req.user._id,
      attachments: fileAttachments.map(({ name, url, mimeType }) => ({ name, url, mimeType })),
      createdAt: new Date(),
    },
  ];
  await task.save();

  const project = await Project.findById(task.project).select('name').lean();
  const smId = task.createdBy;
  if (smId && String(smId) !== String(req.user._id)) {
    const authorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Team member';
    await createNotification(
      smId,
      'Task progress updated',
      `${authorName} updated "${task.title}" on ${project?.name || 'project'}`,
      'project',
      `/support/task-status/${task.project}/${task._id}`,
    );
  }

  const populated = await populateTasks(SupportProjectTask.findById(task._id));
  res.json(populated);
});

/** Main task batch — all member tasks created together */
export const getSupportMainTaskBatch = asyncHandler(async (req, res) => {
  const { id: projectId, batchId } = req.params;
  const tasks = await populateTasks(
    SupportProjectTask.find({ project: projectId, mainTaskBatchId: batchId }).sort('assigneeCategory assignedTo'),
  );

  if (!tasks.length) {
    res.status(404);
    throw new Error('Main task not found');
  }

  const isSm = isSupportManager(req.user) || req.user.role === 'admin';
  const isMember = tasks.some((t) => String(t.assignedTo?._id || t.assignedTo) === String(req.user._id));
  if (!isSm && !isMember) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const allCompleted = tasks.every((t) => t.status === 'completed');
  const approved = Boolean(tasks[0]?.smApprovedAt);

  res.json({
    batchId,
    title: tasks[0]?.title,
    description: tasks[0]?.description,
    project: tasks[0]?.project,
    priority: tasks[0]?.priority,
    dueDate: tasks[0]?.dueDate,
    createdAt: tasks[0]?.createdAt,
    createdBy: tasks[0]?.createdBy,
    allCompleted,
    approved,
    smApprovedAt: tasks[0]?.smApprovedAt,
    smApprovedBy: tasks[0]?.smApprovedBy,
    members: tasks,
  });
});

/** Support Manager approves completed main task after all members finish */
export const approveSupportMainTaskBatch = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can approve tasks');
  }

  const { id: projectId, batchId } = req.params;
  const tasks = await SupportProjectTask.find({ project: projectId, mainTaskBatchId: batchId });
  if (!tasks.length) {
    res.status(404);
    throw new Error('Main task not found');
  }

  const allCompleted = tasks.every((t) => t.status === 'completed');
  if (!allCompleted) {
    res.status(400);
    throw new Error('All team members must complete their tasks before approval');
  }

  const alreadyApproved = tasks.every((t) => t.smApprovedAt);
  if (alreadyApproved) {
    res.status(400);
    throw new Error('This main task is already approved');
  }

  const approvedAt = new Date();
  await SupportProjectTask.updateMany(
    { project: projectId, mainTaskBatchId: batchId },
    { smApprovedAt: approvedAt, smApprovedBy: req.user._id },
  );

  const project = await Project.findById(projectId).select('name').lean();
  for (const task of tasks) {
    if (task.assignedTo) {
      await createNotification(
        task.assignedTo,
        'Task approved',
        `Your work on "${task.title}" was approved by the support manager`,
        'project',
        '/support/my-tasks',
      );
    }
  }

  await logActivity(
    req.user._id,
    'project',
    `Approved main task "${tasks[0].title}" (${tasks.length} members) on "${project?.name || 'project'}"`,
    { type: 'project', id: projectId },
  );

  const populated = await populateTasks(
    SupportProjectTask.find({ project: projectId, mainTaskBatchId: batchId }),
  );

  res.json({
    approved: true,
    smApprovedAt: approvedAt,
    smApprovedBy: req.user._id,
    members: populated,
  });
});

export const deleteSupportProjectTask = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can delete support tasks');
  }

  const task = await SupportProjectTask.findById(req.params.taskId);
  if (!task || String(task.project) !== String(req.params.id)) {
    res.status(404);
    throw new Error('Task not found');
  }

  const projectId = task.project;
  const title = task.title;
  const assigneeId = task.assignedTo;

  await task.deleteOne();
  await syncProjectTaskStatus(projectId);

  if (assigneeId) {
    try {
      await createNotification(
        assigneeId,
        'Support task removed',
        `"${title}" was removed by your support manager`,
        'project',
        '/support/my-tasks',
      );
    } catch { /* ignore */ }
  }

  try {
    await logActivity(req.user._id, 'project', `Deleted support task: ${title}`, { type: 'support_task', id: req.params.taskId });
  } catch { /* ignore */ }

  res.json({ message: 'Task deleted successfully' });
});

export const verifySupportProjectTasks = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can verify support tasks');
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  if (project.supportReviewStatus !== 'support_tasks_complete') {
    res.status(400);
    throw new Error('All support tasks must be completed before verification');
  }

  const tasks = await SupportProjectTask.find({ project: project._id });
  if (!tasks.length || !tasks.every((t) => t.status === 'completed')) {
    res.status(400);
    throw new Error('All support tasks must be completed');
  }

  project.smReviewChecklist = {
    ...(project.smReviewChecklist?.toObject?.() || project.smReviewChecklist || {}),
    tasksVerified: true,
    verifiedAt: new Date(),
    verifiedBy: req.user._id,
  };
  await project.save();

  await logActivity(req.user._id, 'project', `Verified support tasks for "${project.name}"`, { type: 'project', id: project._id });

  res.json(project);
});

export const submitProjectToCustomer = asyncHandler(async (req, res) => {
  if (!isSupportManager(req.user) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only support manager can submit projects to customers');
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const allowedStatuses = ['support_tasks_complete', 'pending_review', 'in_support'];
  if (!allowedStatuses.includes(project.supportReviewStatus)) {
    res.status(400);
    throw new Error('Project is not ready to submit to the customer');
  }

  const tasks = await SupportProjectTask.find({ project: project._id });
  if (tasks.length) {
    if (!tasks.every((t) => t.status === 'completed')) {
      res.status(400);
      throw new Error('All support tasks must be completed first');
    }
    if (!project.smReviewChecklist?.tasksVerified) {
      res.status(400);
      throw new Error('Verify completed support tasks before submitting to the customer');
    }
  }

  if (!project.supportExecutiveAssignee) {
    res.status(400);
    throw new Error('Assign a support executive before submitting to the customer');
  }

  const {
    notes,
    deliveryNotes,
    deliveryVersion,
    deliveryDate,
    documentsIncluded,
    sendEmail = true,
    sendPortalNotification = true,
  } = req.body;

  const docsIncluded = {
    userManual: documentsIncluded?.userManual !== false,
    releaseNotes: documentsIncluded?.releaseNotes !== false,
    deploymentGuide: documentsIncluded?.deploymentGuide !== false,
  };

  const resolvedDeliveryDate = deliveryDate ? new Date(deliveryDate) : (project.endDate || new Date());
  const resolvedNotes = (deliveryNotes ?? notes)?.trim() || '';

  project.supportReviewStatus = 'submitted_to_customer';
  project.submittedToCustomerAt = new Date();
  project.submittedToCustomerBy = req.user._id;
  project.deliveredAt = resolvedDeliveryDate;
  if (resolvedNotes) project.supportReviewNotes = resolvedNotes;

  project.customerSubmission = {
    deliveryVersion: deliveryVersion?.trim() || 'v1.0.0',
    deliveryDate: resolvedDeliveryDate,
    deliveryNotes: resolvedNotes,
    documentsIncluded: docsIncluded,
    notifyEmail: sendEmail !== false,
    notifyPortal: sendPortalNotification !== false,
  };

  project.deliveryChecklist = {
    ...(project.deliveryChecklist?.toObject?.() || project.deliveryChecklist || {}),
    userManual: docsIncluded.userManual,
    releaseNotes: docsIncluded.releaseNotes,
    deploymentGuide: docsIncluded.deploymentGuide,
  };

  if (project.workflowStage !== 'delivered' && project.workflowStage !== 'support') {
    project.workflowStage = 'delivered';
  }

  await project.save();

  const customer = await Customer.findById(project.customer).populate('portalUser', '_id email firstName lastName');
  const executive = await User.findById(project.supportExecutiveAssignee).select('firstName lastName');
  const customerName = customer
    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.companyName
    : 'Customer';
  const reviewUrl = `${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}/projects/${project._id}/review`;

  if (sendPortalNotification !== false && customer?.portalUser) {
    await createNotification(
      customer.portalUser._id || customer.portalUser,
      'Your project is ready for review',
      `"${project.name}" has been delivered — please review and accept, request changes, or open a support ticket.`,
      'project',
      `/projects/${project._id}/review`,
    );
  }

  let emailResult = { sent: false };
  const customerEmail = customer?.email || customer?.portalUser?.email;
  if (sendEmail !== false && customerEmail) {
    try {
      emailResult = await sendProjectDeliveryEmail({
        to: customerEmail,
        customerName,
        projectName: project.name,
        deliveryVersion: project.customerSubmission.deliveryVersion,
        deliveryDate: resolvedDeliveryDate,
        deliveryNotes: resolvedNotes,
        reviewUrl,
      });
    } catch (err) {
      console.error('Project delivery email failed:', err.message);
    }
  }

  if (project.supportExecutiveAssignee) {
    await createNotification(
      project.supportExecutiveAssignee,
      'Project submitted to customer',
      `"${project.name}" was submitted to the customer — pending acceptance.`,
      'project',
      `/projects/${project._id}`,
    );
  }

  await logActivity(
    req.user._id,
    'project',
    `Submitted "${project.name}" to customer (Pending Customer Acceptance)`,
    { type: 'project', id: project._id },
  );

  const populated = await Project.findById(project._id)
    .populate('customer', 'firstName lastName companyName email')
    .populate('submittedToCustomerBy', 'firstName lastName email');

  res.json({
    project: populated,
    notifications: {
      email: emailResult.sent ? 'sent' : (sendEmail === false ? 'skipped' : 'failed_or_dev_mode'),
      portal: sendPortalNotification !== false && customer?.portalUser ? 'sent' : 'skipped',
    },
  });
});
