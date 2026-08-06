/** Job role configured by Admin on the employee (Settings → Roles) */
export function supportAssigneeRoleLabel(user) {
  if (!user || typeof user !== 'object') return 'Support Executive';
  const fromRoleId = user.roleId?.name?.trim();
  if (fromRoleId) return fromRoleId;
  return 'Support Executive';
}

/** Dropdown label: Role Name: Person Name · email */
export function formatSupportAssigneeOption(user) {
  if (!user || typeof user !== 'object') return '';
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
  const role = supportAssigneeRoleLabel(user);
  return `${role}: ${name}${user.email ? ` · ${user.email}` : ''}`;
}

export function formatSupportAssigneeLine(user, { useRoleName = false } = {}) {
  if (!user || typeof user !== 'object') return '';
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
  if (!name) return '';
  const label = useRoleName ? supportAssigneeRoleLabel(user) : 'Support executive';
  return `${label}: ${name}`;
}
