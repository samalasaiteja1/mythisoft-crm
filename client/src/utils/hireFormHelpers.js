import { inferTeamDepartment, DEPARTMENT_LABELS } from './roleContext';

export const TEAM_GROUP_OPTIONS = [
  { key: 'sales', label: 'Sales Team' },
  { key: 'technical', label: 'Technical Team' },
  { key: 'support', label: 'Support Team' },
];

export const EMPLOYEE_ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'sales', label: 'Sales Person' },
  { value: 'technical', label: 'Technical Person' },
  { value: 'support', label: 'Support Person' },
];

export const HIRE_EMPLOYEE_ROLE_OPTIONS = EMPLOYEE_ROLE_OPTIONS.filter((r) => r.value !== 'manager');

export const MANAGER_DEPARTMENT_OPTIONS = [
  { key: 'sales', label: 'Sales Manager', shortLabel: 'Sales' },
  { key: 'technical', label: 'Technical Manager', shortLabel: 'Technical' },
  { key: 'support', label: 'Support Manager', shortLabel: 'Support' },
];

/** Display label for manager hire / edit — always includes "Manager" */
export function managerTypeLabel(key) {
  return MANAGER_DEPARTMENT_OPTIONS.find((d) => d.key === key)?.label
    || `${departmentLabel(key)} Manager`;
}

/** Auto-select the default manager team for a department (first active team). */
export function defaultManagerTeamId(deptKey, teamsByDept) {
  const teams = teamsByDept?.[deptKey] || [];
  return teams.length ? teams[0]._id : '';
}

export const ROLE_TO_TEAM_GROUP = {
  manager: 'manager',
  sales: 'sales',
  technical: 'technical',
  support: 'support',
};

export const ROLE_FROM_TEAM_GROUP = {
  manager: 'manager',
  sales: 'sales',
  technical: 'technical',
  support: 'support',
};

export const teamGroupLabel = (key) => TEAM_GROUP_OPTIONS.find((g) => g.key === key)?.label || key || '—';
export const roleLabel = (role) => EMPLOYEE_ROLE_OPTIONS.find((r) => r.value === role)?.label || role;

export const managerLabelForRole = (role) => ({
  manager: 'Manager',
  sales: 'Sales Manager',
  technical: 'Technical Manager',
  support: 'Support Manager',
}[role] || 'Manager');

export const managerDepartmentForRole = (role) => (role === 'manager' ? 'manager' : role);

export function getManagersForRole(role, employees, activeSettingsTeams, editId = null) {
  return employees.filter((e) => {
    if (editId && e._id === editId) return false;
    if (e.isActive === false) return false;
    if (e.role !== 'manager') return false;
    const managerTeamId = e.staffRole?._id || e.staffRole;
    if (!managerTeamId) return false;
    const managerTeam = activeSettingsTeams.find((t) => String(t._id) === String(managerTeamId))
      || (e.staffRole && typeof e.staffRole === 'object'
        ? { ...e.staffRole, department: inferTeamDepartment(e.staffRole) }
        : null);
    if (!managerTeam || managerTeam.teamGroup !== 'manager') return false;
    return inferTeamDepartment(managerTeam) === managerDepartmentForRole(role);
  });
}

export function pickManagerForTeam(role, staffRoleId, employees, activeSettingsTeams, currentReportsTo, editId) {
  const eligible = getManagersForRole(role, employees, activeSettingsTeams, editId);
  if (!eligible.length) return '';

  if (currentReportsTo && eligible.some((m) => String(m._id) === String(currentReportsTo))) {
    return currentReportsTo;
  }

  if (eligible.length === 1) return eligible[0]._id;
  return '';
}

export function pickManagerForRole(role, employees, activeSettingsTeams, editId) {
  const eligible = getManagersForRole(role, employees, activeSettingsTeams, editId);
  return eligible.length === 1 ? eligible[0]._id : '';
}

export function getManagerTeams(activeTeams) {
  return activeTeams.filter((t) => t.teamGroup === 'manager');
}

export function managerTeamsByDepartment(managerTeams) {
  const map = { sales: [], technical: [], support: [] };
  managerTeams.forEach((team) => {
    const dept = inferTeamDepartment(team);
    if (map[dept]) map[dept].push(team);
  });
  return map;
}

export function departmentLabel(key) {
  return DEPARTMENT_LABELS[key] || MANAGER_DEPARTMENT_OPTIONS.find((d) => d.key === key)?.label || key;
}

export function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '.';
  return { firstName, lastName };
}

export function inferSystemRoleFromDepartmentName(deptName) {
  const name = String(deptName || '').toLowerCase();
  if (name.includes('tech')) return 'technical';
  if (name.includes('support')) return 'support';
  return 'sales';
}

export function inferSystemRoleFromDepartment(dept) {
  if (!dept) return 'sales';
  if (typeof dept === 'object' && dept.name) {
    return inferSystemRoleFromDepartmentName(dept.name);
  }
  return 'sales';
}

/** Map Settings → Departments name to staff team group (sales / technical / support). */
export function inferTeamGroupFromDepartmentName(deptName) {
  return inferSystemRoleFromDepartmentName(deptName);
}
