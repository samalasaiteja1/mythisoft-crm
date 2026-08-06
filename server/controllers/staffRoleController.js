import User from '../models/User.js';
import Department from '../models/Department.js';
import Role from '../models/Role.js';
import StaffRole, { TEAM_GROUPS, inferTeamDepartment } from '../models/StaffRole.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from './authController.js';
import { isTechnicalManager, getTechnicalManagerStaffRoleFilter, assertAdminOrTeamManager, getTechnicalManagerAssignableMemberIds, getTechnicalManagerProjectFilter, isSupportManager, getSupportManagerStaffRoleFilter, getSupportManagerAssignableMemberIds } from '../utils/managerScope.js';
import { buildMemberRoleLabelsForUsers, memberRoleLabelsFromTeam } from '../utils/supportMemberCategory.js';

const TEAM_GROUP_LABELS = {
  manager: 'Managers',
  sales: 'Sales Team',
  technical: 'Tech Team',
  support: 'Support Team',
};

const CODE_BASE = { manager: 100, sales: 200, technical: 1000, support: 500 };

const inferTeamGroupFromDepartmentName = (name) => {
  const n = String(name || '').trim().toLowerCase();
  if (n.includes('tech')) return 'technical';
  if (n.includes('support')) return 'support';
  return 'sales';
};

const nextCodeForGroup = async (teamGroup) => {
  const base = CODE_BASE[teamGroup] ?? 900;
  const existing = await StaffRole.find({ teamGroup }).select('code').lean();
  const nums = existing.map((e) => parseInt(e.code, 10)).filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : base - 1;
  return String(max + 1);
};

const populateQuery = (query) => query
  .populate('createdBy', 'firstName lastName role')
  .populate('teamLeader', 'firstName lastName email employeeId role')
  .populate('teamManager', 'firstName lastName email employeeId role')
  .populate('departmentRef', 'name description manager')
  .populate('projectRef', 'name code status')
  .populate('roleRef', 'name description status');

const validateTeamLeader = async (teamLeaderId, teamId) => {
  if (!teamLeaderId) return undefined;
  const leader = await User.findById(teamLeaderId).select('staffRole isActive role');
  if (!leader || leader.isActive === false) {
    const err = new Error('Team leader must be an active employee');
    err.statusCode = 400;
    throw err;
  }
  if (teamId && String(leader.staffRole) !== String(teamId)) {
    const err = new Error('Team leader must be assigned to this team');
    err.statusCode = 400;
    throw err;
  }
  return teamLeaderId;
};

const validateTeamManager = async (teamManagerId) => {
  if (!teamManagerId) {
    const err = new Error('Team manager is required');
    err.statusCode = 400;
    throw err;
  }
  const manager = await User.findById(teamManagerId).select('role isActive');
  if (!manager || manager.isActive === false || manager.role !== 'manager') {
    const err = new Error('Team manager must be an active manager');
    err.statusCode = 400;
    throw err;
  }
  return teamManagerId;
};

const resolveDepartment = async (departmentId, teamGroup) => {
  if (!departmentId) {
    const err = new Error('Department is required');
    err.statusCode = 400;
    throw err;
  }
  const dept = await Department.findById(departmentId).select('name isActive');
  if (!dept) {
    const err = new Error('Department not found');
    err.statusCode = 400;
    throw err;
  }
  const inferredGroup = inferTeamGroupFromDepartmentName(dept.name);
  if (teamGroup && teamGroup !== 'manager' && inferredGroup !== teamGroup) {
    const err = new Error('Selected department does not match team type');
    err.statusCode = 400;
    throw err;
  }
  return { dept, inferredGroup };
};

const resolveTeamRole = async (roleId, departmentRef) => {
  if (!roleId) return { roleRef: undefined, teamType: undefined };
  const role = await Role.findById(roleId).select('name department status');
  if (!role) {
    const err = new Error('Selected role not found');
    err.statusCode = 400;
    throw err;
  }
  if (role.status === 'inactive') {
    const err = new Error('Selected role is inactive');
    err.statusCode = 400;
    throw err;
  }
  if (departmentRef && role.department && String(role.department) !== String(departmentRef)) {
    const err = new Error('Selected role does not belong to this department');
    err.statusCode = 400;
    throw err;
  }
  return { roleRef: role._id, teamType: role.name };
};

const syncTeamMembers = async (teamId, memberIds = [], maxMembers, reqUser = null, projectId = null) => {
  const ids = [...new Set((memberIds || []).map(String))];
  if (maxMembers && ids.length > maxMembers) {
    const err = new Error(`Team cannot have more than ${maxMembers} members`);
    err.statusCode = 400;
    throw err;
  }

  if (reqUser && isTechnicalManager(reqUser) && ids.length) {
    const allowed = new Set(
      (await getTechnicalManagerAssignableMemberIds(reqUser._id, projectId || null)).map(String)
    );
    const blocked = ids.find((id) => !allowed.has(id));
    if (blocked) {
      const err = new Error('One or more members are not assigned to your projects or team');
      err.statusCode = 403;
      throw err;
    }
  }

  if (reqUser && isSupportManager(reqUser) && ids.length) {
    const allowed = new Set((await getSupportManagerAssignableMemberIds()).map(String));
    const blocked = ids.find((id) => !allowed.has(id));
    if (blocked) {
      const err = new Error('Only active Support department employees can be added to the team');
      err.statusCode = 403;
      throw err;
    }
  }

  const current = await User.find({ staffRole: teamId }).select('_id').lean();
  const currentIds = current.map((u) => String(u._id));
  const toAdd = ids.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id) => !ids.includes(id));

  if (toRemove.length) {
    await User.updateMany({ _id: { $in: toRemove } }, { $unset: { staffRole: 1 } });
  }
  if (toAdd.length) {
    const members = await User.find({ _id: { $in: toAdd } }).select('role isActive');
    const invalid = members.find((m) => m.isActive === false || m.role === 'manager' || m.role === 'admin');
    if (invalid) {
      const err = new Error('Only active staff employees can be assigned as team members');
      err.statusCode = 400;
      throw err;
    }
    await User.updateMany({ _id: { $in: toAdd } }, { staffRole: teamId });
  }
};

const persistSupportTeamMemberLabels = async (teamId, explicitLabels = null) => {
  const team = await StaffRole.findById(teamId).lean();
  if (!team || team.teamGroup !== 'support') return;

  const users = await User.find({
    staffRole: teamId,
    role: { $in: ['support', 'technical'] },
    isActive: { $ne: false },
  })
    .select('role hrProfile designation roleId assignedProjectRole staffRole')
    .populate('roleId', 'name')
    .populate('staffRole', 'code name')
    .lean();

  const existing = memberRoleLabelsFromTeam(team);
  const fromExplicit = explicitLabels && typeof explicitLabels === 'object'
    ? Object.fromEntries(
      Object.entries(explicitLabels)
        .filter(([, label]) => label?.trim())
        .map(([uid, label]) => [String(uid), label.trim()]),
    )
    : {};
  const merged = buildMemberRoleLabelsForUsers(users, { ...existing, ...fromExplicit });

  if (!Object.keys(merged).length) return;

  const labelMap = new Map(Object.entries(merged));
  await StaffRole.findByIdAndUpdate(teamId, { memberRoleLabels: labelMap });
};

export const getAll = asyncHandler(async (req, res) => {
  const { search, status, teamGroup, page = 1, limit = 100 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (teamGroup) query.teamGroup = teamGroup;
  if (isTechnicalManager(req.user)) {
    Object.assign(query, getTechnicalManagerStaffRoleFilter(req.user._id));
  } else if (isSupportManager(req.user)) {
    Object.assign(query, getSupportManagerStaffRoleFilter(req.user._id));
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await StaffRole.countDocuments(query);
  const items = await populateQuery(
    StaffRole.find(query)
      .sort({ teamGroup: 1, code: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
  );
  res.json({
    items: items.map((item) => ({
      ...item.toObject(),
      department: inferTeamDepartment(item),
    })),
    total,
    pages: Math.ceil(total / limit),
    currentPage: Number(page),
  });
});

export const getOptions = asyncHandler(async (req, res) => {
  const { teamGroup } = req.query;
  const query = { status: 'active' };
  if (isTechnicalManager(req.user)) {
    Object.assign(query, getTechnicalManagerStaffRoleFilter(req.user._id));
  } else if (isSupportManager(req.user)) {
    Object.assign(query, getSupportManagerStaffRoleFilter(req.user._id));
  } else if (teamGroup) {
    query.teamGroup = teamGroup;
  }
  const items = await StaffRole.find(query)
    .sort({ teamGroup: 1, code: 1 })
    .select('code name teamGroup department description status teamLeader teamManager departmentRef maxMembers startDate')
    .populate('teamLeader', 'firstName lastName employeeId')
    .populate('teamManager', 'firstName lastName employeeId')
    .populate('departmentRef', 'name');
  res.json({
    items: items.map((item) => ({
      ...item.toObject(),
      department: inferTeamDepartment(item),
    })),
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const item = await populateQuery(StaffRole.findById(req.params.id));
  if (!item) {
    res.status(404);
    throw new Error('Role code not found');
  }
  res.json({
    ...item.toObject(),
    department: inferTeamDepartment(item),
  });
});

export const create = asyncHandler(async (req, res) => {
  const {
    code,
    name,
    teamGroup: bodyTeamGroup,
    department,
    departmentId,
    description,
    status,
    teamLeader,
    teamManager,
    maxMembers,
    startDate,
    endDate,
    projectId,
    roleId,
    teamType,
    remarks,
    memberIds,
    memberRoleLabels,
  } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error('Team name is required');
  }

  let teamGroup = bodyTeamGroup;
  let departmentRef;
  let resolvedDepartment = department;

  if (departmentId) {
    const { dept, inferredGroup } = await resolveDepartment(departmentId, bodyTeamGroup);
    departmentRef = dept._id;
    teamGroup = bodyTeamGroup && TEAM_GROUPS.includes(bodyTeamGroup) ? bodyTeamGroup : inferredGroup;
    if (teamGroup === 'manager') {
      resolvedDepartment = department && TEAM_GROUPS.includes(department) ? department : inferredGroup;
    } else {
      resolvedDepartment = inferredGroup;
    }
  }

  if (!teamGroup || !TEAM_GROUPS.includes(teamGroup)) {
    res.status(400);
    throw new Error('Team role is required');
  }

  assertAdminOrTeamManager(req.user, teamGroup);

  if (isTechnicalManager(req.user) && teamGroup !== 'technical') {
    res.status(403);
    throw new Error('Technical managers can only create technical teams');
  }

  if (isSupportManager(req.user) && teamGroup !== 'support') {
    res.status(403);
    throw new Error('Support managers can only create support teams');
  }

  if (isSupportManager(req.user) && teamGroup === 'support') {
    if (!projectId) {
      res.status(400);
      throw new Error('Project is required');
    }
    const Project = (await import('../models/Project.js')).default;
    const handoffProject = await Project.findById(projectId).select('supportHandoffAt name');
    if (!handoffProject?.supportHandoffAt) {
      res.status(400);
      throw new Error('Team can only be created for projects submitted to support');
    }
  }

  if (isTechnicalManager(req.user) && projectId) {
    const Project = (await import('../models/Project.js')).default;
    const projectFilter = await getTechnicalManagerProjectFilter(req.user._id);
    const allowedProject = await Project.findOne({ _id: projectId, ...projectFilter });
    if (!allowedProject) {
      res.status(403);
      throw new Error('You can only create teams for projects you manage');
    }
  }

  if (teamGroup === 'manager' && !resolvedDepartment) {
    res.status(400);
    throw new Error('Manages department is required for manager teams');
  }

  const managerId = teamManager || teamLeader
    || (isTechnicalManager(req.user) ? req.user._id : undefined)
    || (isSupportManager(req.user) ? req.user._id : undefined);
  const validatedManager = managerId ? await validateTeamManager(managerId) : undefined;

  const parsedMax = maxMembers !== undefined && maxMembers !== '' && maxMembers !== null
    ? Number(maxMembers)
    : undefined;
  if (parsedMax !== undefined && (!Number.isFinite(parsedMax) || parsedMax < 1)) {
    res.status(400);
    throw new Error('Maximum team members must be at least 1');
  }

  const resolvedRole = await resolveTeamRole(roleId, departmentRef);

  const item = await StaffRole.create({
    code: code?.trim() || await nextCodeForGroup(teamGroup),
    name: name.trim(),
    teamGroup,
    department: resolvedDepartment,
    departmentRef,
    description: description?.trim() || undefined,
    teamManager: validatedManager,
    teamLeader: validatedManager,
    maxMembers: parsedMax,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    projectRef: projectId || undefined,
    roleRef: resolvedRole.roleRef,
    teamType: resolvedRole.teamType || teamType?.trim() || undefined,
    remarks: remarks?.trim() || undefined,
    status: status || 'active',
    createdBy: req.user._id,
  });

  if (memberIds?.length) {
    await syncTeamMembers(item._id, memberIds, parsedMax, req.user, projectId || null);
  }

  if (teamGroup === 'support') {
    await persistSupportTeamMemberLabels(item._id, memberRoleLabels);
  } else if (memberRoleLabels && typeof memberRoleLabels === 'object') {
    const labels = new Map();
    Object.entries(memberRoleLabels).forEach(([uid, label]) => {
      if (label?.trim()) labels.set(uid, label.trim());
    });
    if (labels.size) {
      item.memberRoleLabels = labels;
      await item.save();
    }
  }

  try {
    await logActivity(req.user._id, 'settings', `Created staff role: ${item.code} — ${item.name}`, { type: 'staff_role', id: item._id });
  } catch { /* ignore */ }
  res.status(201).json(await populateQuery(StaffRole.findById(item._id)));
});

export const update = asyncHandler(async (req, res) => {
  const {
    code,
    name,
    teamGroup,
    department,
    departmentId,
    description,
    status,
    teamLeader,
    teamManager,
    maxMembers,
    startDate,
    endDate,
    projectId,
    roleId,
    teamType,
    remarks,
    memberIds,
    memberRoleLabels,
  } = req.body;
  const updates = {};

  if (code !== undefined) {
    if (!code?.trim()) {
      res.status(400);
      throw new Error('Role code is required');
    }
    updates.code = code.trim();
  }
  if (name !== undefined) {
    if (!name?.trim()) {
      res.status(400);
      throw new Error('Team name is required');
    }
    updates.name = name.trim();
  }
  if (teamGroup !== undefined) {
    if (!TEAM_GROUPS.includes(teamGroup)) {
      res.status(400);
      throw new Error('Invalid team role');
    }
    updates.teamGroup = teamGroup;
  }
  if (department !== undefined) {
    if (!TEAM_GROUPS.includes(department)) {
      res.status(400);
      throw new Error('Invalid department');
    }
    updates.department = department;
  }
  if (departmentId !== undefined) {
    if (!departmentId) {
      updates.departmentRef = null;
    } else {
      const { dept, inferredGroup } = await resolveDepartment(departmentId, updates.teamGroup);
      updates.departmentRef = dept._id;
      if (!updates.teamGroup || updates.teamGroup !== 'manager') {
        updates.department = inferredGroup;
        if (!updates.teamGroup) updates.teamGroup = inferredGroup;
      }
    }
  }
  if (description !== undefined) updates.description = description?.trim() || undefined;
  if (status !== undefined) updates.status = status;
  if (maxMembers !== undefined) {
    if (maxMembers === '' || maxMembers === null) {
      updates.maxMembers = undefined;
    } else {
      const parsedMax = Number(maxMembers);
      if (!Number.isFinite(parsedMax) || parsedMax < 1) {
        res.status(400);
        throw new Error('Maximum team members must be at least 1');
      }
      updates.maxMembers = parsedMax;
    }
  }
  if (startDate !== undefined) {
    updates.startDate = startDate ? new Date(startDate) : null;
  }
  if (endDate !== undefined) {
    updates.endDate = endDate ? new Date(endDate) : null;
  }
  if (projectId !== undefined) {
    updates.projectRef = projectId || null;
  }
  if (teamType !== undefined && roleId === undefined) {
    updates.teamType = teamType?.trim() || undefined;
  }
  if (remarks !== undefined) {
    updates.remarks = remarks?.trim() || undefined;
  }
  if (memberRoleLabels !== undefined && typeof memberRoleLabels === 'object') {
    const labels = new Map();
    Object.entries(memberRoleLabels).forEach(([uid, label]) => {
      if (label?.trim()) labels.set(uid, label.trim());
    });
    updates.memberRoleLabels = labels;
  }

  const existing = await StaffRole.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error('Role code not found');
  }

  if (isTechnicalManager(req.user) && existing.teamGroup !== 'technical') {
    res.status(403);
    throw new Error('Technical managers can only edit technical teams');
  }

  if (isSupportManager(req.user) && existing.teamGroup !== 'support') {
    res.status(403);
    throw new Error('Support managers can only edit support teams');
  }

  assertAdminOrTeamManager(req.user, existing.teamGroup);

  if (roleId !== undefined) {
    const deptRef = updates.departmentRef ?? existing.departmentRef;
    const resolvedRole = await resolveTeamRole(roleId, deptRef);
    updates.roleRef = resolvedRole.roleRef || null;
    if (resolvedRole.teamType) updates.teamType = resolvedRole.teamType;
  }

  if (teamManager !== undefined || teamLeader !== undefined) {
    const managerId = teamManager !== undefined ? teamManager : teamLeader;
    if (!managerId) {
      updates.teamManager = null;
      updates.teamLeader = null;
    } else {
      const validated = await validateTeamManager(managerId);
      updates.teamManager = validated;
      updates.teamLeader = validated;
    }
  }

  const nextTeamGroup = updates.teamGroup ?? existing.teamGroup;
  if (isTechnicalManager(req.user) && nextTeamGroup !== 'technical') {
    res.status(403);
    throw new Error('Technical managers can only manage technical teams');
  }
  if (isSupportManager(req.user) && nextTeamGroup !== 'support') {
    res.status(403);
    throw new Error('Support managers can only manage support teams');
  }
  const nextName = updates.name ?? existing.name;
  const nextDescription = updates.description ?? existing.description;
  if (nextTeamGroup === 'manager') {
    updates.department = updates.department
      ?? existing.department
      ?? inferTeamDepartment({ name: nextName, teamGroup: nextTeamGroup, description: nextDescription });
  } else if (!updates.department && updates.departmentRef) {
    const dept = await Department.findById(updates.departmentRef).select('name');
    if (dept) updates.department = inferTeamGroupFromDepartmentName(dept.name);
  } else if (!updates.department) {
    updates.department = nextTeamGroup;
  }

  const item = await populateQuery(
    StaffRole.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
  );
  if (!item) {
    res.status(404);
    throw new Error('Role code not found');
  }

  if (memberIds !== undefined) {
    const cap = updates.maxMembers ?? item.maxMembers;
    const projectRef = updates.projectRef ?? item.projectRef;
    await syncTeamMembers(item._id, memberIds, cap, req.user, projectRef || null);
  }

  if (item.teamGroup === 'support') {
    await persistSupportTeamMemberLabels(
      item._id,
      memberRoleLabels !== undefined ? memberRoleLabels : undefined,
    );
  }

  try {
    await logActivity(req.user._id, 'settings', `Updated staff role: ${item.code}`, { type: 'staff_role', id: item._id });
  } catch { /* ignore */ }
  res.json(item);
});

export const remove = asyncHandler(async (req, res) => {
  const item = await StaffRole.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Role code not found');
  }
  assertAdminOrTeamManager(req.user, item.teamGroup);
  if (isTechnicalManager(req.user) && item.teamGroup !== 'technical') {
    res.status(403);
    throw new Error('Technical managers can only delete technical teams');
  }
  if (isSupportManager(req.user) && item.teamGroup !== 'support') {
    res.status(403);
    throw new Error('Support managers can only delete support teams');
  }
  const inUse = await User.countDocuments({ staffRole: item._id });
  if (inUse) {
    res.status(400);
    throw new Error('Cannot delete — role code is assigned to users. Deactivate it instead.');
  }
  await item.deleteOne();
  res.json({ message: 'Deleted successfully' });
});
