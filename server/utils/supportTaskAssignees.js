/** Resolve Support Executive vs Technical Support Engineer — re-export core helpers */

import {
  assigneeCategoryForUser,
  isTechnicalSupportEngineerUser,
  isSupportExecutiveUser,
  labelToSupportCategory,
  memberRoleLabelsFromTeam,
  buildMemberRoleLabelsForUsers,
  ensureTeamMemberRoleLabels,
  SUPPORT_MEMBER_ROLE_LABELS,
} from './supportMemberCategory.js';

export {
  assigneeCategoryForUser,
  isTechnicalSupportEngineerUser,
  isSupportExecutiveUser,
  labelToSupportCategory,
  memberRoleLabelsFromTeam,
  buildMemberRoleLabelsForUsers,
  ensureTeamMemberRoleLabels,
  SUPPORT_MEMBER_ROLE_LABELS,
};

export async function findUsersForAssigneeCategory(category) {
  const User = (await import('../models/User.js')).default;
  const users = await User.find({
    isActive: { $ne: false },
    role: { $in: ['support', 'technical'] },
  })
    .select('firstName lastName email role departmentName staffRole hrProfile designation roleId')
    .populate('staffRole', 'name code teamGroup memberRoleLabels')
    .populate('roleId', 'name')
    .sort('firstName')
    .lean();

  return users.filter((u) => assigneeCategoryForUser(u, u.staffRole) === category);
}

export async function assertUserMatchesCategory(userId, category, team = null) {
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId)
    .select('role departmentName staffRole hrProfile designation isActive roleId')
    .populate('staffRole', 'name code memberRoleLabels')
    .populate('roleId', 'name')
    .lean();
  if (!user || user.isActive === false) {
    const err = new Error('Assignee not found or inactive');
    err.statusCode = 400;
    throw err;
  }
  const resolvedTeam = team || user.staffRole;
  const cat = assigneeCategoryForUser(user, resolvedTeam);
  if (cat !== category) {
    const err = new Error(
      `Selected employee must be a ${category === 'support_executive' ? 'Support Executive (Customer Support)' : 'Technical Support Engineer'}.`,
    );
    err.statusCode = 400;
    throw err;
  }
  return user;
}
