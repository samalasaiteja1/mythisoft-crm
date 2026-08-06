import Task from '../models/Task.js';
import { asyncHandler } from '../utils/helpers.js';
import { createNotification } from '../controllers/authController.js';
import { isTechnicalManager, getTechnicalManagerTaskFilter } from '../utils/managerScope.js';

const populateTask = (query) => query
  .populate('assignedTo', 'firstName lastName email avatar employeeId staffRole role')
  .populate('createdBy', 'firstName lastName role')
  .populate('technicalManager', 'firstName lastName email role')
  .populate('milestone', 'name milestoneType status project')
  .populate('staffRole', 'name code teamGroup projectRef')
  .populate('codeReview.reviewer', 'firstName lastName');

const overdueStatuses = ['completed', 'cancelled'];

export const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo, dueDate, overdue } = req.query;
  const query = {};
  if (status) {
    query.status = status === 'new' ? { $in: ['new', 'pending'] } : status;
  }
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (overdue === 'true') {
    query.dueDate = { $lt: new Date(), $ne: null };
    query.status = { $nin: overdueStatuses };
  } else if (dueDate) {
    const start = new Date(dueDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dueDate);
    end.setHours(23, 59, 59, 999);
    query.dueDate = { $gte: start, $lte: end };
  }

  let taskQuery = query;
  if (isTechnicalManager(req.user)) {
    const scope = await getTechnicalManagerTaskFilter(req.user._id);
    taskQuery = { $and: [scope, query] };
  }

  const tasks = await populateTask(
    Task.find(taskQuery).sort({ startDate: 1, dueDate: 1, createdAt: -1 })
  );
  res.json(tasks);
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await populateTask(Task.findById(req.params.id));
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  if (isTechnicalManager(req.user)) {
    const scope = await getTechnicalManagerTaskFilter(req.user._id);
    const allowed = await Task.findOne({ _id: req.params.id, ...scope });
    if (!allowed) {
      res.status(404);
      throw new Error('Task not found');
    }
  }
  res.json(task);
});

const mapDevStage = (status) => {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'new' || status === 'pending') return 'todo';
  return 'todo';
};

const mapWorkStatusToDevStage = (workStatus) => {
  const map = {
    new: 'todo',
    planning: 'backlog',
    development: 'in_progress',
    in_progress: 'in_progress',
    code_review: 'code_review',
    testing: 'testing',
    bug_fixing: 'in_progress',
    on_hold: 'todo',
    deployment: 'testing',
    completed: 'completed',
    cancelled: 'todo',
  };
  return map[workStatus] || 'todo';
};

const mapWorkStatusToStatus = (workStatus) => {
  if (workStatus === 'completed') return 'completed';
  if (workStatus === 'cancelled') return 'cancelled';
  if (workStatus === 'on_hold') return 'on_hold';
  if (['development', 'in_progress', 'code_review', 'testing', 'bug_fixing', 'deployment', 'planning'].includes(workStatus)) {
    return 'in_progress';
  }
  return 'new';
};

const buildTaskBody = (body, { partial = false } = {}) => {
  const out = {};
  const assign = (key, val) => {
    if (partial && val === undefined) return;
    out[key] = val;
  };

  const {
    title,
    description,
    taskType,
    priority,
    status,
    startDate,
    dueDate,
    estimatedHours,
    assignedTo,
    milestoneId,
    staffRoleId,
    technicalManagerId,
    projectId,
    devStage,
    workStatus,
    remarks,
    attachments,
    workUploads,
    relatedTo,
    codeReview,
    testResult,
  } = body;

  if (title !== undefined) assign('title', title?.trim());
  if (description !== undefined) assign('description', description?.trim() || undefined);
  if (taskType !== undefined) assign('taskType', taskType?.trim() || undefined);
  if (priority !== undefined) assign('priority', priority || 'medium');
  if (status !== undefined) {
    assign('status', status || 'new');
    if (!partial || devStage === undefined) {
      out.devStage = devStage || mapDevStage(status);
    }
  }
  if (devStage !== undefined) assign('devStage', devStage);
  if (workStatus !== undefined) {
    assign('workStatus', workStatus);
    if (!partial || devStage === undefined) out.devStage = mapWorkStatusToDevStage(workStatus);
    if (!partial || status === undefined) out.status = mapWorkStatusToStatus(workStatus);
  }
  if (startDate !== undefined) assign('startDate', startDate ? new Date(startDate) : null);
  if (dueDate !== undefined) assign('dueDate', dueDate ? new Date(dueDate) : null);
  if (estimatedHours !== undefined) {
    const hrs = estimatedHours === '' || estimatedHours === null ? undefined : Number(estimatedHours);
    assign('estimatedHours', Number.isFinite(hrs) ? hrs : undefined);
  }
  if (assignedTo !== undefined) assign('assignedTo', assignedTo || null);
  if (milestoneId !== undefined) assign('milestone', milestoneId || null);
  if (staffRoleId !== undefined) assign('staffRole', staffRoleId || null);
  if (technicalManagerId !== undefined) assign('technicalManager', technicalManagerId || null);
  if (remarks !== undefined) assign('remarks', remarks?.trim() || undefined);
  if (attachments !== undefined) assign('attachments', Array.isArray(attachments) ? attachments : []);
  if (workUploads !== undefined) assign('workUploads', Array.isArray(workUploads) ? workUploads : []);
  if (codeReview !== undefined) assign('codeReview', codeReview);
  if (testResult !== undefined) assign('testResult', testResult);

  if (projectId !== undefined) {
    out.relatedTo = projectId
      ? { type: 'project', id: projectId }
      : null;
  } else if (relatedTo !== undefined) {
    out.relatedTo = relatedTo || null;
  }

  return out;
};

export const createTask = asyncHandler(async (req, res) => {
  if (req.body.isAnnouncement) {
    const task = await Task.create({
      title: req.body.title?.trim(),
      description: req.body.description?.trim() || req.body.title?.trim(),
      priority: req.body.priority || 'medium',
      status: 'new',
      createdBy: req.user._id,
    });
    res.status(201).json(await populateTask(Task.findById(task._id)));
    return;
  }

  const fields = buildTaskBody(req.body);
  if (!fields.title?.trim()) {
    res.status(400);
    throw new Error('Task title is required');
  }
  if (!fields.description?.trim()) {
    res.status(400);
    throw new Error('Description is required');
  }
  if (!fields.taskType) {
    res.status(400);
    throw new Error('Task type is required');
  }
  if (!fields.relatedTo?.id) {
    res.status(400);
    throw new Error('Project is required');
  }
  if (!fields.milestone) {
    res.status(400);
    throw new Error('Milestone is required');
  }

  const isAdminCreate = req.user?.role === 'admin';
  if (isAdminCreate) {
    if (!fields.technicalManager) {
      res.status(400);
      throw new Error('Technical manager is required');
    }
  } else {
    if (!fields.staffRole) {
      res.status(400);
      throw new Error('Team is required');
    }
    if (!fields.assignedTo) {
      res.status(400);
      throw new Error('Assign to is required');
    }
  }
  if (!fields.startDate) {
    res.status(400);
    throw new Error('Start date is required');
  }
  if (!fields.dueDate) {
    res.status(400);
    throw new Error('Due date is required');
  }

  const task = await Task.create({
    ...fields,
    title: fields.title.trim(),
    description: fields.description.trim(),
    createdBy: req.user._id,
  });

  if (task.assignedTo) {
    await createNotification(
      task.assignedTo,
      'New Task Assigned',
      task.title,
      'task',
      `/tasks/${task._id}`
    );
  }

  res.status(201).json(await populateTask(Task.findById(task._id)));
});

export const updateTask = asyncHandler(async (req, res) => {
  const existing = await Task.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error('Task not found');
  }

  const fields = buildTaskBody(req.body, { partial: true });
  if (fields.title !== undefined && !fields.title?.trim()) {
    res.status(400);
    throw new Error('Task title is required');
  }
  if (fields.title) fields.title = fields.title.trim();

  if (req.body.statusComment?.trim()) {
    existing.statusComments.push({
      text: req.body.statusComment.trim(),
      user: req.user._id,
    });
  }
  if (req.body.workUpload && typeof req.body.workUpload === 'object') {
    existing.workUploads.push({
      ...req.body.workUpload,
      uploadedAt: new Date(),
    });
  }
  if (req.body.codeReview && typeof req.body.codeReview === 'object') {
    existing.codeReview = {
      ...existing.codeReview?.toObject?.() || existing.codeReview || {},
      ...req.body.codeReview,
    };
  }
  if (req.body.testResult && typeof req.body.testResult === 'object') {
    existing.testResult = {
      ...existing.testResult?.toObject?.() || existing.testResult || {},
      ...req.body.testResult,
      testedAt: req.body.testResult.testedAt || new Date(),
    };
  }

  Object.assign(existing, fields);
  await existing.save();

  const task = await populateTask(Task.findById(existing._id));
  res.json(task);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  await task.deleteOne();
  res.json({ message: 'Task removed' });
});

export const getCalendarTasks = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const start = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) - 1, 1);
  const end = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), 0, 23, 59, 59);
  const tasks = await populateTask(
    Task.find({ dueDate: { $gte: start, $lte: end } })
  );
  res.json(tasks);
});
