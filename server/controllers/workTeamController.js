import WorkTeam, { WORK_TEAM_SLOTS, SLOT_ROLE } from '../models/WorkTeam.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from './authController.js';

const memberFields = ['manager', 'sales', 'technical', 'support'];

const populateMembers = (query) => memberFields.reduce(
  (q, field) => q.populate(field, 'firstName lastName email employeeId role phone staffRole reportsTo'),
  query.populate('createdBy', 'firstName lastName'),
);

const validateSlotUser = async (userId, slot) => {
  if (!userId) return null;
  const user = await User.findById(userId).select('role isActive');
  if (!user || user.isActive === false) {
    const err = new Error(`${slot} must be an active employee`);
    err.statusCode = 400;
    throw err;
  }
  const expectedRole = SLOT_ROLE[slot];
  if (user.role !== expectedRole) {
    const err = new Error(`${slot} slot requires role "${expectedRole}", got "${user.role}"`);
    err.statusCode = 400;
    throw err;
  }
  return userId;
};

const syncUserWorkTeams = async (teamId, slots) => {
  const memberIds = memberFields.map((f) => slots[f]).filter(Boolean);
  await User.updateMany(
    { workTeam: teamId, _id: { $nin: memberIds } },
    { $unset: { workTeam: 1 } },
  );
  for (const id of memberIds) {
    await User.findByIdAndUpdate(id, { workTeam: teamId });
  }
};

export const getAll = asyncHandler(async (req, res) => {
  const teams = await populateMembers(WorkTeam.find().sort('code'));
  res.json(teams);
});

export const getOne = asyncHandler(async (req, res) => {
  const team = await populateMembers(WorkTeam.findById(req.params.id));
  if (!team) {
    res.status(404);
    throw new Error('Work team not found');
  }
  res.json(team);
});

export const create = asyncHandler(async (req, res) => {
  const { code, name, description, manager, sales, technical, support, status } = req.body;
  if (!code?.trim() || !name?.trim()) {
    res.status(400);
    throw new Error('Code and name are required');
  }

  const slots = {};
  for (const slot of WORK_TEAM_SLOTS) {
    slots[slot] = await validateSlotUser(req.body[slot], slot);
  }

  const team = await WorkTeam.create({
    code: code.trim(),
    name: name.trim(),
    description,
    ...slots,
    status: status || 'active',
    createdBy: req.user._id,
  });

  await syncUserWorkTeams(team._id, slots);
  const populated = await populateMembers(WorkTeam.findById(team._id));
  await logActivity(req.user._id, 'system', `Work team created: ${team.name}`);
  res.status(201).json(populated);
});

export const update = asyncHandler(async (req, res) => {
  const team = await WorkTeam.findById(req.params.id);
  if (!team) {
    res.status(404);
    throw new Error('Work team not found');
  }

  const previous = team.toObject();
  const updates = { ...req.body };
  delete updates.code;

  for (const slot of WORK_TEAM_SLOTS) {
    if (updates[slot] !== undefined) {
      updates[slot] = await validateSlotUser(updates[slot] || null, slot);
    }
  }

  Object.assign(team, updates);
  await team.save();

  const slots = Object.fromEntries(WORK_TEAM_SLOTS.map((s) => [s, team[s]]));
  await syncUserWorkTeams(team._id, slots);

  const populated = await populateMembers(WorkTeam.findById(team._id));
  res.json(populated);
});

export const remove = asyncHandler(async (req, res) => {
  const team = await WorkTeam.findById(req.params.id);
  if (!team) {
    res.status(404);
    throw new Error('Work team not found');
  }
  await syncUserWorkTeams(team._id, {});
  await team.deleteOne();
  res.json({ message: 'Work team deleted' });
});

export const getOptions = asyncHandler(async (req, res) => {
  const teams = await WorkTeam.find({ status: 'active' }).select('code name manager sales technical support').sort('code');
  res.json(teams);
});
