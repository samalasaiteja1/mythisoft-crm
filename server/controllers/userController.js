import User from '../models/User.js';
import Team from '../models/Team.js';
import StaffRole from '../models/StaffRole.js';
import WorkTeam from '../models/WorkTeam.js';
import { asyncHandler, conflictError, getDuplicateKeyMessage } from '../utils/helpers.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';
import { sanitizeUserPayload } from '../utils/userPayload.js';
import { getSalesTeamMembers } from '../utils/salesTeam.js';
import { canPerformAction } from '../constants/permissions.js';
import { isTechnicalManager, getTechnicalManagerReportIds, getTechnicalManagerAssignableMemberIds, getTechnicalManagerProjectFilter, isSupportManager, getSupportManagerAssignableMemberIds } from '../utils/managerScope.js';
import Project from '../models/Project.js';

const syncTeamMembership = async (userId, teamId, previousTeamId) => {
  if (previousTeamId && String(previousTeamId) !== String(teamId || '')) {
    await Team.findByIdAndUpdate(previousTeamId, { $pull: { members: userId } });
  }
  if (teamId) {
    await Team.findByIdAndUpdate(teamId, { $addToSet: { members: userId } });
  }
};

export const getSalesTeam = asyncHandler(async (req, res) => {
  const { role } = req.user;
  if (!canPerformAction(role, 'leads', 'assign')
    && !canPerformAction(role, 'deals', 'assign')
    && !canPerformAction(role, 'customers', 'update')) {
    res.status(403);
    throw new Error('Not allowed to load sales team');
  }
  res.json(await getSalesTeamMembers());
});

export const getManagers = asyncHandler(async (req, res) => {
  const { role } = req.user;
  if (!canPerformAction(role, 'leads', 'assign')
    && !canPerformAction(role, 'leads', 'update')
    && !canPerformAction(role, 'deals', 'assign')
    && !canPerformAction(role, 'customers', 'update')
    && role !== 'sales') {
    res.status(403);
    throw new Error('Not allowed to load managers');
  }
  const managers = await User.find({ role: 'manager', isActive: { $ne: false } })
    .select('firstName lastName email role staffRole')
    .populate('staffRole', 'name teamGroup department')
    .sort('firstName');
  res.json(managers);
});

export const getUsers = asyncHandler(async (req, res) => {
  let query = { isActive: { $ne: false } };
  const { projectId, forTeamPick } = req.query;

  if (isTechnicalManager(req.user)) {
    const memberIds = await getTechnicalManagerAssignableMemberIds(
      req.user._id,
      projectId || null,
    );
    if (!memberIds.length) {
      return res.json([]);
    }
    query._id = { $in: memberIds };
    if (forTeamPick === '1' || forTeamPick === 'true') {
      query.role = 'technical';
    }
  } else if (isSupportManager(req.user) && (forTeamPick === '1' || forTeamPick === 'true')) {
    const memberIds = await getSupportManagerAssignableMemberIds();
    if (!memberIds.length) {
      return res.json([]);
    }
    query._id = { $in: memberIds };
    query.role = { $in: ['support', 'technical'] };
  }

  const users = await User.find(query).select('-password')
    .populate('department', 'name')
    .populate('team', 'name')
    .populate('roleId', 'name department')
    .populate('staffRole', 'code name teamGroup department')
    .populate('workTeam', 'code name manager sales technical support')
    .populate({
      path: 'reportsTo',
      select: 'firstName lastName employeeId role phone staffRole',
      populate: { path: 'staffRole', select: 'name teamGroup' },
    })
    .sort('-createdAt')
    .lean();

  if (projectId && isTechnicalManager(req.user) && users.length) {
    const projectFilter = await getTechnicalManagerProjectFilter(req.user._id);
    const project = await Project.findOne({ _id: projectId, ...projectFilter })
      .select('memberRoleLabels')
      .lean();
    const labelsRaw = project?.memberRoleLabels;
    const labels = labelsRaw instanceof Map
      ? Object.fromEntries(labelsRaw.entries())
      : (labelsRaw || {});
    const enriched = users.map((u) => ({
      ...u,
      assignedProjectRole: labels[String(u._id)] || null,
    }));
    return res.json(enriched);
  }

  res.json(users);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password')
    .populate('department', 'name')
    .populate('team')
    .populate('roleId', 'name department')
    .populate('staffRole', 'code name teamGroup department')
    .populate('workTeam', 'code name manager sales technical support')
    .populate({
      path: 'reportsTo',
      select: 'firstName lastName employeeId role phone staffRole',
      populate: { path: 'staffRole', select: 'name teamGroup' },
    });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
});

const syncTeamLead = async (staffRoleId, userId, isTeamLead) => {
  if (!staffRoleId) return;
  if (isTeamLead) {
    const member = await User.findById(userId).select('staffRole isActive');
    if (!member || member.isActive === false || String(member.staffRole) !== String(staffRoleId)) {
      const err = new Error('Team lead must be an active member of the selected team');
      err.statusCode = 400;
      throw err;
    }
    await StaffRole.findByIdAndUpdate(staffRoleId, { teamLeader: userId });
  } else {
    await StaffRole.updateMany({ _id: staffRoleId, teamLeader: userId }, { $unset: { teamLeader: 1 } });
  }
};

const ROLE_TO_SLOT = { manager: 'manager', sales: 'sales', technical: 'technical', support: 'support' };

const syncWorkTeamSlot = async (userId, workTeamId, role, previousWorkTeamId) => {
  const slot = ROLE_TO_SLOT[role];
  if (!slot) return;

  if (previousWorkTeamId && String(previousWorkTeamId) !== String(workTeamId || '')) {
    const prev = await WorkTeam.findById(previousWorkTeamId);
    if (prev && String(prev[slot]) === String(userId)) {
      prev[slot] = undefined;
      await prev.save();
    }
  }

  if (!workTeamId) {
    await User.findByIdAndUpdate(userId, { $unset: { workTeam: 1 } });
    return;
  }

  const team = await WorkTeam.findById(workTeamId);
  if (!team) return;

  await WorkTeam.updateMany({ [slot]: userId, _id: { $ne: team._id } }, { $unset: { [slot]: 1 } });
  team[slot] = userId;
  await team.save();
  await User.findByIdAndUpdate(userId, { workTeam: workTeamId });
};

async function assertNewUserIdentity(payload) {
  const email = payload.email;
  if (email) {
    const byEmail = await User.findOne({ email }).select('firstName lastName role employeeId');
    if (byEmail) {
      throw conflictError(
        `Email "${email}" is already used by ${byEmail.firstName} ${byEmail.lastName} (${byEmail.role}). Use a different email or edit that person under Settings → Hired Staff.`
      );
    }
  }
  const empId = String(payload.employeeId || '').trim();
  if (empId) {
    const byId = await User.findOne({ employeeId: empId }).select('firstName lastName email role');
    if (byId) {
      throw conflictError(
        `Employee ID "${empId}" is already assigned to ${byId.firstName} ${byId.lastName} (${byId.email}).`
      );
    }
  }
}

export const checkEmailAvailable = asyncHandler(async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.json({ available: false, message: 'Enter a valid email address.' });
  }
  const existing = await User.findOne({ email }).select('firstName lastName role employeeId');
  if (!existing) {
    return res.json({ available: true });
  }
  res.json({
    available: false,
    message: `Email "${email}" is already used by ${existing.firstName} ${existing.lastName} (${existing.role}).`,
    existing: { firstName: existing.firstName, lastName: existing.lastName, role: existing.role, employeeId: existing.employeeId },
  });
});

export const changeUserPassword = asyncHandler(async (req, res) => {
  const { role } = req.user;
  if (role !== 'admin') {
    res.status(403);
    throw new Error('Only admins can change user passwords');
  }

  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.password = password;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});

export const createUser = asyncHandler(async (req, res) => {
  const { setAsTeamLead } = req.body;
  const payload = sanitizeUserPayload(req.body);

  await assertNewUserIdentity(payload);

  // Ensure a unique username exists. If none provided, derive from email or name.
  const makeBaseUsername = () => {
    if (payload.username) return String(payload.username).trim().toLowerCase();
    if (payload.email) return String(payload.email).split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    return (String(payload.firstName || '') + String(payload.lastName || '')).toLowerCase().replace(/[^a-z0-9._-]/g, '') || `user`;
  };

  const ensureUniqueUsername = async (base) => {
    let candidate = base;
    let suffix = 0;
    // Check existence and increment suffix until unique (avoid infinite loop)
    while (await User.exists({ username: candidate })) {
      suffix += 1;
      candidate = `${base}${suffix}`;
      if (suffix > 1000) break;
    }
    return candidate;
  };

  const base = makeBaseUsername();
  payload.username = await ensureUniqueUsername(base);

  if (!payload.password) {
    const seed = payload.employeeId || payload.email?.split('@')[0] || 'emp';
    payload.password = `Mythi${String(seed).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}1!`;
  }
  if (!payload.employeeId) {
    payload.employeeId = `EMP-${Date.now().toString().slice(-6)}`;
  }

  // Attempt create, handle duplicate-key race with a retry loop
  let user;
  let attempts = 0;
  while (!user && attempts < 3) {
    attempts += 1;
    try {
      user = await User.create(payload);
    } catch (err) {
      if (err.code === 11000) {
        const dupMsg = getDuplicateKeyMessage(err);
        if (dupMsg && !String(err.message || '').includes('username')) {
          throw conflictError(dupMsg);
        }
        if (String(err.message || '').includes('username')) {
          const newBase = base + Math.floor(Math.random() * 9000 + 1000);
          payload.username = await ensureUniqueUsername(newBase);
          continue;
        }
        throw conflictError(dupMsg || 'This user could not be created because a duplicate value already exists.');
      }
      throw err;
    }
  }

  if (!user) {
    res.status(500);
    throw new Error('Failed to create user due to username conflicts');
  }

  if (user.team) {
    await syncTeamMembership(user._id, user.team);
  }
  if (setAsTeamLead && user.staffRole) {
    await syncTeamLead(user.staffRole, user._id, true);
  }
  if (user.workTeam) {
    await syncWorkTeamSlot(user._id, user.workTeam, user.role);
  }
  res.status(201).json({ _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const { password, setAsTeamLead, ...rest } = req.body;
  const updates = sanitizeUserPayload(rest, { isUpdate: true });
  const previousTeam = user.team;
  const previousStaffRole = user.staffRole;
  const previousWorkTeam = user.workTeam;
  Object.assign(user, updates);
  if (password) user.password = password;
  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'mythisoft-crm/avatars');
    user.avatar = result.url;
  }
  await user.save();
  if (updates.staffRole !== undefined && String(previousStaffRole) !== String(user.staffRole)) {
    await StaffRole.updateMany({ teamLeader: user._id }, { $unset: { teamLeader: 1 } });
  }
  if (setAsTeamLead !== undefined && user.staffRole) {
    await syncTeamLead(user.staffRole, user._id, Boolean(setAsTeamLead));
  }
  await syncTeamMembership(user._id, user.team, previousTeam);
  if (updates.workTeam !== undefined || String(previousWorkTeam || '') !== String(user.workTeam || '')) {
    await syncWorkTeamSlot(user._id, user.workTeam, user.role, previousWorkTeam);
  }
  const updated = await User.findById(user._id).select('-password')
    .populate('team', 'name')
    .populate('staffRole', 'code name teamGroup department')
    .populate('workTeam', 'code name manager sales technical support')
    .populate({
      path: 'reportsTo',
      select: 'firstName lastName employeeId role phone staffRole',
      populate: { path: 'staffRole', select: 'name teamGroup' },
    });
  res.json(updated);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }
  await StaffRole.updateMany({ teamLeader: user._id }, { $unset: { teamLeader: 1 } });
  await user.deleteOne();
  res.json({ message: 'User removed' });
});

export const getTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find()
    .populate('department', 'name')
    .populate('leader', 'firstName lastName email')
    .populate('members', 'firstName lastName email');
  res.json(teams);
});

export const createTeam = asyncHandler(async (req, res) => {
  const { name, department, description, status, leader } = req.body;
  if (!name?.trim()) {
    res.status(400);
    throw new Error('Team name is required');
  }
  if (!department) {
    res.status(400);
    throw new Error('Department is required');
  }
  const team = await Team.create({
    name: name.trim(),
    department,
    description: description?.trim() || undefined,
    status: status || 'active',
    leader: leader || undefined,
  });
  res.status(201).json(team);
});

export const updateTeam = asyncHandler(async (req, res) => {
  const { name, department, description, status, leader } = req.body;
  const updates = {};
  if (name !== undefined) {
    if (!name?.trim()) {
      res.status(400);
      throw new Error('Team name is required');
    }
    updates.name = name.trim();
  }
  if (department !== undefined) updates.department = department;
  if (description !== undefined) updates.description = description?.trim() || undefined;
  if (status !== undefined) updates.status = status;
  if (leader !== undefined) updates.leader = leader || null;

  const team = await Team.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }
  res.json(team);
});

export const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }
  await team.deleteOne();
  res.json({ message: 'Team removed' });
});
