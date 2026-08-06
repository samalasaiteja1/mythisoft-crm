import User from '../models/User.js';
import Team from '../models/Team.js';

export async function getSalesTeamMembers() {
  const salesTeam = await Team.findOne({
    isActive: { $ne: false },
    $or: [
      { name: { $regex: /sales/i } },
      { department: { $regex: /sales/i } },
    ],
  }).populate({
    path: 'members',
    match: { role: 'sales', isActive: { $ne: false } },
    select: 'firstName lastName email role',
  });

  let members = (salesTeam?.members || []).filter(Boolean);
  if (!members.length) {
    members = await User.find({ role: 'sales', isActive: { $ne: false } })
      .select('firstName lastName email role')
      .sort('firstName');
  }

  return {
    team: salesTeam ? { _id: salesTeam._id, name: salesTeam.name } : null,
    members,
  };
}
