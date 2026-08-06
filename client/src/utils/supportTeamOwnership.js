const idOf = (ref) => {
  if (!ref) return '';
  return String(ref._id || ref);
};

/** Support working group managed or created by the current support manager */
export function isMySupportTeam(team, userId) {
  if (!team || !userId) return false;
  const uid = String(userId);
  const managerId = idOf(team.teamManager || team.teamLeader);
  const creatorId = idOf(team.createdBy);
  return managerId === uid || creatorId === uid;
}

export function filterSupportTeamsByScope(teams, userId) {
  if (!userId) return teams || [];
  return (teams || []).filter((t) => t.teamGroup === 'support' && isMySupportTeam(t, userId));
}
