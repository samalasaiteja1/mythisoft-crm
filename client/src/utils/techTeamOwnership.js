const idOf = (ref) => {
  if (!ref) return '';
  return String(ref._id || ref);
};

/** Team managed or created by the current technical manager */
export function isMyTechnicalTeam(team, userId) {
  if (!team || !userId) return false;
  const uid = String(userId);
  const managerId = idOf(team.teamManager || team.teamLeader);
  const creatorId = idOf(team.createdBy);
  return managerId === uid || creatorId === uid;
}

/** Technical team created by admin (or not owned by current tech manager) */
export function isAdminCreatedTechnicalTeam(team, userId) {
  if (!team || !userId) return false;
  if (isMyTechnicalTeam(team, userId)) return false;
  const creatorRole = team.createdBy?.role;
  if (creatorRole === 'admin') return true;
  const creatorId = idOf(team.createdBy);
  if (creatorId && creatorId !== String(userId)) return true;
  const managerId = idOf(team.teamManager || team.teamLeader);
  return managerId && managerId !== String(userId);
}

export function filterTechnicalTeamsByScope(teams, scope, userId) {
  const list = teams || [];
  if (!userId || scope === 'all') return list;
  if (scope === 'my') return list.filter((t) => isMyTechnicalTeam(t, userId));
  if (scope === 'admin') return list.filter((t) => isAdminCreatedTechnicalTeam(t, userId));
  return list;
}

export const TECH_TEAM_LIST_SCOPE = {
  MY: 'my',
  ADMIN: 'admin',
  ALL: 'all',
};
