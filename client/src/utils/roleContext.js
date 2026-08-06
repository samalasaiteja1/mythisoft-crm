const TEAM_GROUPS = ['manager', 'sales', 'technical', 'support'];

export function inferTeamDepartment(team) {
  if (!team) return null;
  if (team.department && TEAM_GROUPS.includes(team.department)) {
    return team.department === 'manager' ? inferManagerDepartmentFromText(team) : team.department;
  }
  if (team.teamGroup !== 'manager') return team.teamGroup;
  return inferManagerDepartmentFromText(team) || 'sales';
}

function inferManagerDepartmentFromText(team) {
  const name = (team.name || '').trim().toLowerCase();
  const code = (team.code || '').trim().toLowerCase();
  const hay = `${name} ${code} ${team.description || ''}`.toLowerCase();
  if (/^(sm|msale|sales?\d*)/.test(name) || /\bsale/.test(hay)) return 'sales';
  if (/^(tm|mt|tech\d*)/.test(name) || /\btech/.test(hay)) return 'technical';
  if (/^support/.test(name) || /\bsupport/.test(hay)) return 'support';
  return 'sales';
}

export function getManagerDepartment(user) {
  const fromTeam = inferTeamDepartment(user?.staffRole);
  if (fromTeam && fromTeam !== 'manager') return fromTeam;
  const deptName = String(user?.departmentName || '').trim().toLowerCase();
  if (deptName.includes('tech')) return 'technical';
  if (deptName.includes('support')) return 'support';
  if (deptName.includes('sale')) return 'sales';
  return 'sales';
}

export function isTechManagerUser(user) {
  if (user?.role !== 'manager') return false;
  if (getManagerDepartment(user) === 'technical') return true;
  const teamDept = user?.staffRole?.department;
  if (teamDept === 'technical') return true;
  const code = String(user?.staffRole?.code || '').toLowerCase();
  const name = String(user?.staffRole?.name || '').toLowerCase();
  if (/^(tm|mt|tech)/.test(code) || /\btech/.test(name)) return true;
  return false;
}

export function isSupportManagerUser(user) {
  return user?.role === 'manager' && getManagerDepartment(user) === 'support';
}

export const DASHBOARD_KEYS = {
  admin: 'admin',
  salesManager: 'salesManager',
  techManager: 'techManager',
  supportManager: 'supportManager',
  sales: 'sales',
  technical: 'technical',
  support: 'support',
  customer: 'customer',
};

export function getDashboardKey(user) {
  const role = user?.role;
  if (role === 'admin') return DASHBOARD_KEYS.admin;
  if (role === 'customer') return DASHBOARD_KEYS.customer;
  if (role === 'sales') return DASHBOARD_KEYS.sales;
  if (role === 'technical') return DASHBOARD_KEYS.technical;
  if (role === 'support') return DASHBOARD_KEYS.support;
  if (role === 'manager') {
    const dept = getManagerDepartment(user);
    if (dept === 'technical') return DASHBOARD_KEYS.techManager;
    if (dept === 'support') return DASHBOARD_KEYS.supportManager;
    return DASHBOARD_KEYS.salesManager;
  }
  return DASHBOARD_KEYS.sales;
}

export function getPanelLabel(user) {
  const key = getDashboardKey(user);
  const labels = {
    [DASHBOARD_KEYS.admin]: 'Admin',
    [DASHBOARD_KEYS.salesManager]: 'Sales Manager',
    [DASHBOARD_KEYS.techManager]: 'Technical Manager',
    [DASHBOARD_KEYS.supportManager]: 'Support Manager',
    [DASHBOARD_KEYS.sales]: 'Sales',
    [DASHBOARD_KEYS.technical]: 'Tech Team',
    [DASHBOARD_KEYS.support]: 'Support',
    [DASHBOARD_KEYS.customer]: 'Customer Portal',
  };
  return labels[key] || 'CRM';
}

/** Sidebar panel icon key — mapped in Sidebar iconMap */
export function getPanelIconKey(user) {
  const key = getDashboardKey(user);
  const icons = {
    [DASHBOARD_KEYS.admin]: 'shield',
    [DASHBOARD_KEYS.salesManager]: 'briefcase',
    [DASHBOARD_KEYS.techManager]: 'cpu',
    [DASHBOARD_KEYS.supportManager]: 'headphones',
    [DASHBOARD_KEYS.sales]: 'user-plus',
    [DASHBOARD_KEYS.technical]: 'cpu',
    [DASHBOARD_KEYS.support]: 'headphones',
    [DASHBOARD_KEYS.customer]: 'circle-user',
  };
  return icons[key] || null;
}

/** Sidebar panel icon color class */
export function getPanelIconClass(user) {
  const key = getDashboardKey(user);
  const colors = {
    [DASHBOARD_KEYS.admin]: 'text-orange-400',
    [DASHBOARD_KEYS.salesManager]: 'text-blue-400',
    [DASHBOARD_KEYS.techManager]: 'text-cyan-400',
    [DASHBOARD_KEYS.supportManager]: 'text-orange-400',
    [DASHBOARD_KEYS.sales]: 'text-blue-400',
    [DASHBOARD_KEYS.technical]: 'text-cyan-400',
    [DASHBOARD_KEYS.support]: 'text-orange-400',
    [DASHBOARD_KEYS.customer]: 'text-amber-400',
  };
  return colors[key] || 'text-myth-accent';
}

export const DEPARTMENT_LABELS = {
  sales: 'Sales',
  technical: 'Technical',
  support: 'Support',
};
