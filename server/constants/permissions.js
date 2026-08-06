export const ROLES = ['admin', 'manager', 'sales', 'support', 'technical', 'customer'];

export const ACTIONS = ['create', 'read', 'update', 'delete', 'export', 'import', 'assign', 'approve'];

export const ACTION_LABELS = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
  export: 'Export',
  import: 'Import',
  assign: 'Assign',
  approve: 'Approve',
};

export const ADMIN_PAGES = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
  { key: 'leads-all', label: 'All Leads', path: '/leads', module: 'leads' },
  { key: 'leads-assigned', label: 'Assigned Leads', path: '/leads/assigned', module: 'leads' },
  { key: 'leads-unsigned', label: 'Unassigned Leads', path: '/leads/unsigned', module: 'leads' },
  { key: 'qualified', label: 'Qualified Leads', path: '/qualified-leads', module: 'leads' },
  { key: 'followups', label: 'Follow-ups', path: '/follow-ups/today', module: 'followups' },
  { key: 'deals-pipeline', label: 'All Deals', path: '/deals', module: 'deals' },
  { key: 'customers-all', label: 'All Customers', path: '/customers/all', module: 'customers' },
  { key: 'projects-all', label: 'All Projects', path: '/projects', module: 'projects' },
  { key: 'projects-assign', label: 'Assign Projects', path: '/projects/assign', module: 'projects' },
  { key: 'tickets', label: 'Tickets', path: '/tickets', module: 'tickets' },
  { key: 'support-logs', label: 'Support Logs', path: '/support-logs', module: 'supportLogs' },
  { key: 'escalations', label: 'Escalations', path: '/escalations', module: 'escalations' },
  { key: 'reports', label: 'Reports', path: '/reports', module: 'reports' },
  { key: 'roles', label: 'Roles & Permissions', path: '/permissions', module: 'roles' },
  { key: 'settings', label: 'Settings', path: '/settings', module: 'settings' },
  { key: 'users', label: 'Users / Hired Staff', path: '/settings?tab=hired-staff', module: 'users' },
];

export const ADMIN_RESPONSIBILITIES = [
  'Org setup: departments, job roles, hired staff, teams',
  'Create users & assign system roles',
  'Lead & deal pipeline: assign managers/sales, follow-ups, qualified leads',
  'Customer & project oversight: tech assignment, milestones, support handoff',
  'Support operations: tickets, escalations, support logs',
  'Reports, performance, settings, roles & permissions, audit',
];

export const MANAGER_PAGES = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
  { key: 'leads', label: 'Leads', path: '/leads', module: 'leads' },
  { key: 'deals', label: 'Deals', path: '/deals', module: 'deals' },
  { key: 'followups', label: 'Follow-ups', path: '/follow-ups/today', module: 'followups' },
  { key: 'customers', label: 'Customers', path: '/customers/all', module: 'customers' },
  { key: 'projects', label: 'Projects', path: '/projects', module: 'projects' },
  { key: 'teams', label: 'Teams', path: '/teams', module: 'teams' },
  { key: 'reports', label: 'Reports', path: '/reports', module: 'reports' },
  { key: 'performance', label: 'Performance', path: '/performance', module: 'performance' },
];

export const MANAGER_RESPONSIBILITIES = [
  'Department sidebar: Sales, Support, or Technical manager',
  'Assign leads/deals or projects/tickets to team members',
  'Monitor follow-ups, pipeline, and team workload',
  'Review delivery, support handoffs, and escalations',
  'Team performance and department reports',
];

export const SALES_PAGES = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
  { key: 'leads', label: 'My Leads', path: '/leads', module: 'leads' },
  { key: 'followups', label: 'Follow-ups', path: '/follow-ups/today', module: 'followups' },
  { key: 'qualified', label: 'Qualified Leads', path: '/qualified-leads', module: 'leads' },
  { key: 'deals', label: 'Deals', path: '/deals', module: 'deals' },
  { key: 'customers', label: 'Customers', path: '/customers/all', module: 'customers' },
];

export const SALES_RESPONSIBILITIES = [
  'Work assigned leads & qualified leads',
  'Schedule follow-ups and meetings',
  'Create & move deals through pipeline',
  'Convert qualified leads to deals and customers',
];

export const SUPPORT_PAGES = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
  { key: 'tickets', label: 'My Tickets', path: '/support/my-tickets', module: 'tickets' },
  { key: 'customers', label: 'My Customers', path: '/support/my-customers', module: 'customers' },
  { key: 'followups', label: 'Follow-ups', path: '/support/follow-ups/today', module: 'followups' },
  { key: 'documents', label: 'Documents', path: '/support/documents', module: 'documents' },
];

export const SUPPORT_RESPONSIBILITIES = [
  'Handle assigned tickets & customer follow-ups',
  'Complete support tasks from Support Manager',
  'Upload documents and log ticket history',
  'Escalate to Support Manager when needed',
];

export const TECHNICAL_PAGES = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
  { key: 'projects', label: 'My Projects', path: '/projects', module: 'projects' },
  { key: 'tasks', label: 'My Tasks', path: '/technical/my-tasks', module: 'tasks' },
  { key: 'milestones', label: 'Milestones', path: '/projects/milestones', module: 'projects' },
  { key: 'bugtracker', label: 'Bug Tracker', path: '/bug-tracker', module: 'bugtracker' },
  { key: 'deployment', label: 'Deployment', path: '/deployment', module: 'deployment' },
];

export const TECHNICAL_RESPONSIBILITIES = [
  'Deliver assigned projects: milestones, dev tasks, code review',
  'Bug fixes, testing, and deployment',
  'Complete support-engineer tasks from Support Manager',
  'Submit projects for support handoff',
];

export const CUSTOMER_PAGES = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
  { key: 'projects', label: 'My Projects', path: '/projects', module: 'projects' },
  { key: 'tickets', label: 'My Tickets', path: '/tickets', module: 'tickets' },
  { key: 'documents', label: 'Documents', path: '/documents', module: 'documents' },
  { key: 'invoices', label: 'Invoices', path: '/invoices', module: 'invoices' },
  { key: 'change-requests', label: 'Change Requests', path: '/change-requests', module: 'projects' },
];

export const CUSTOMER_RESPONSIBILITIES = [
  'Review and accept delivered projects',
  'Create support tickets and confirm resolutions',
  'Submit change requests',
  'View documents and invoices',
];

export const MODULE_ACCESS_MATRIX = [
  { module: 'dashboard', label: 'Dashboard', access: { admin: 'full', manager: 'full', sales: 'full', support: 'full', technical: 'full', customer: 'full' } },
  { module: 'leads', label: 'Leads & Qualified', access: { admin: 'full', manager: 'full', sales: 'assigned', support: false, technical: false, customer: false } },
  { module: 'followups', label: 'Follow-ups', access: { admin: 'full', manager: 'full', sales: 'full', support: 'assigned', technical: false, customer: false } },
  { module: 'deals', label: 'Deals', access: { admin: 'full', manager: 'full', sales: 'full', support: false, technical: false, customer: false } },
  { module: 'customers', label: 'Customers', access: { admin: 'full', manager: 'full', sales: 'full', support: 'view', technical: 'view', customer: false } },
  { module: 'projects', label: 'Projects', access: { admin: 'full', manager: 'full', sales: 'view', support: 'view', technical: 'full', customer: 'own' } },
  { module: 'tasks', label: 'Dev Tasks', access: { admin: 'full', manager: 'full', sales: false, support: false, technical: 'full', customer: false } },
  { module: 'supportTasks', label: 'Support Tasks', access: { admin: 'full', manager: 'full', sales: false, support: 'update', technical: 'update', customer: false } },
  { module: 'tickets', label: 'Support Tickets', access: { admin: 'full', manager: 'full', sales: 'create', support: 'full', technical: 'update', customer: 'own' } },
  { module: 'supportLogs', label: 'Ticket History', access: { admin: 'full', manager: 'view', sales: false, support: 'full', technical: 'view', customer: false } },
  { module: 'escalations', label: 'Escalations', access: { admin: 'full', manager: 'full', sales: false, support: 'full', technical: false, customer: false } },
  { module: 'quotations', label: 'Quotations', access: { admin: 'full', manager: 'full', sales: 'full', support: false, technical: false, customer: false } },
  { module: 'invoices', label: 'Invoices', access: { admin: 'full', manager: 'full', sales: 'view', support: 'view', technical: false, customer: 'view' } },
  { module: 'payments', label: 'Payments', access: { admin: 'full', manager: 'view', sales: 'view', support: false, technical: false, customer: false } },
  { module: 'expenses', label: 'Expenses', access: { admin: 'full', manager: 'view', sales: false, support: false, technical: false, customer: false } },
  { module: 'transactions', label: 'Transactions', access: { admin: 'full', manager: 'view', sales: false, support: false, technical: false, customer: false } },
  { module: 'meetings', label: 'Meetings', access: { admin: 'full', manager: 'full', sales: 'full', support: false, technical: false, customer: false } },
  { module: 'reports', label: 'Reports', access: { admin: 'full', manager: 'full', sales: 'limited', support: 'limited', technical: 'limited', customer: false } },
  { module: 'performance', label: 'Performance', access: { admin: 'full', manager: 'full', sales: false, support: 'view', technical: false, customer: false } },
  { module: 'users', label: 'Users / Hired Staff', access: { admin: 'full', manager: 'view', sales: false, support: false, technical: false, customer: false } },
  { module: 'roles', label: 'Roles & Permissions', access: { admin: 'full', manager: 'view', sales: false, support: false, technical: false, customer: false } },
  { module: 'departments', label: 'Departments', access: { admin: 'full', manager: 'view', sales: false, support: false, technical: false, customer: false } },
  { module: 'teams', label: 'Teams', access: { admin: 'full', manager: 'full', sales: false, support: 'view', technical: 'view', customer: false } },
  { module: 'settings', label: 'Settings', access: { admin: 'full', manager: 'view', sales: false, support: 'limited', technical: false, customer: 'limited' } },
  { module: 'audit', label: 'Audit Logs', access: { admin: 'full', manager: false, sales: false, support: false, technical: false, customer: false } },
  { module: 'calendar', label: 'Calendar', access: { admin: 'full', manager: 'view', sales: 'full', support: false, technical: false, customer: 'view' } },
  { module: 'documents', label: 'Project Documents', access: { admin: 'full', manager: 'view', sales: false, support: 'create', technical: 'full', customer: 'view' } },
  { module: 'deployment', label: 'Deployment', access: { admin: 'full', manager: 'view', sales: false, support: false, technical: 'full', customer: false } },
  { module: 'bugtracker', label: 'Bug Tracker', access: { admin: 'full', manager: 'view', sales: false, support: 'view', technical: 'full', customer: false } },
  { module: 'knowledgebase', label: 'Knowledge Base', access: { admin: 'full', manager: 'view', sales: false, support: 'full', technical: 'view', customer: false } },
  { module: 'notifications', label: 'Notifications', access: { admin: 'full', manager: 'full', sales: 'full', support: 'full', technical: 'full', customer: 'full' } },
  { module: 'attendance', label: 'Attendance', access: { admin: 'full', manager: 'full', sales: false, support: 'view', technical: false, customer: false } },
];

const matrixToRole = (matrix, role) =>
  Object.fromEntries(matrix.map(({ module, access }) => [module, access[role] ?? false]));

const allActions = () => ACTIONS.reduce((acc, action) => ({ ...acc, [action]: true }), {});

export const ADMIN_ACTION_MATRIX = Object.fromEntries(
  MODULE_ACCESS_MATRIX.map(({ module }) => [module, allActions()]),
);

const A = { ...matrixToRole(MODULE_ACCESS_MATRIX, 'admin') };
const M = { ...matrixToRole(MODULE_ACCESS_MATRIX, 'manager') };
const S = { ...matrixToRole(MODULE_ACCESS_MATRIX, 'sales') };
const U = { ...matrixToRole(MODULE_ACCESS_MATRIX, 'support') };
const T = { ...matrixToRole(MODULE_ACCESS_MATRIX, 'technical') };
const C = { ...matrixToRole(MODULE_ACCESS_MATRIX, 'customer') };

export const ROLE_ACCESS = { admin: A, manager: M, sales: S, support: U, technical: T, customer: C };

export const canAccessModule = (role, module) => {
  if (role === 'admin') return true;
  const access = ROLE_ACCESS[role]?.[module];
  return Boolean(access && access !== false);
};

export const canPerformAction = (role, module, action) => {
  if (role === 'admin') return true;
  const access = ROLE_ACCESS[role]?.[module];
  if (!access || access === false) return false;
  if (access === 'full') return true;
  if (access === 'view') return action === 'read';
  if (access === 'limited' || access === 'assigned') {
    if (access === 'assigned' && module === 'leads') {
      return ['read', 'create', 'update', 'export'].includes(action);
    }
    if (access === 'assigned' && module === 'followups') {
      return ['read', 'create', 'update'].includes(action);
    }
    return ['read', 'export'].includes(action);
  }
  if (access === 'create') return ['read', 'create'].includes(action);
  if (access === 'update') return ['read', 'update'].includes(action);
  if (access === 'own') {
    if (module === 'tickets') return ['read', 'create', 'update'].includes(action);
    if (module === 'projects') return ['read', 'create', 'approve'].includes(action);
    return action === 'read';
  }
  if (role === 'support' && module === 'settings') {
    return ['read', 'update'].includes(action);
  }
  if (role === 'support' && module === 'documents') {
    return ['read', 'create'].includes(action);
  }
  if (role === 'support' && module === 'supportTasks') {
    return ['read', 'update'].includes(action);
  }
  if (role === 'technical' && module === 'supportTasks') {
    return ['read', 'update'].includes(action);
  }
  return action === 'read';
};

export const isAdmin = (role) => role === 'admin';
export const isManager = (role) => role === 'manager';
