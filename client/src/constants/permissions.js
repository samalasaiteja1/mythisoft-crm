import { ROLE_NAV, CRM_WORKFLOW_STEPS } from './navigation.js';

export const ROLES = ['admin', 'manager', 'sales', 'support', 'technical', 'customer'];

export const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  support: 'Support',
  technical: 'Technical',
  customer: 'Customer',
};

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

export const MODULE_LABELS = {
  dashboard: 'Dashboard',
  leads: 'Leads & Qualified',
  followups: 'Follow-ups',
  deals: 'Deals',
  customers: 'Customers',
  projects: 'Projects',
  tasks: 'Dev Tasks',
  supportTasks: 'Support Tasks',
  tickets: 'Support Tickets',
  supportLogs: 'Ticket History',
  escalations: 'Escalations',
  quotations: 'Quotations',
  invoices: 'Invoices',
  payments: 'Payments',
  expenses: 'Expenses',
  transactions: 'Transactions',
  reports: 'Reports',
  users: 'Users / Hired Staff',
  roles: 'Roles & Permissions',
  departments: 'Departments',
  teams: 'Teams',
  settings: 'Settings',
  performance: 'Performance',
  calendar: 'Calendar',
  documents: 'Project Documents',
  deployment: 'Deployment',
  bugtracker: 'Bug Tracker',
  knowledgebase: 'Knowledge Base',
  notifications: 'Notifications',
  meetings: 'Meetings',
  attendance: 'Attendance',
  audit: 'Audit Logs',
};

/** Flatten nested sidebar nav into page list for role guide */
export function flattenNavItems(items = [], acc = []) {
  for (const item of items) {
    if (!item) continue;
    if (item.path) {
      acc.push({
        key: item.key,
        label: item.label,
        path: item.path,
        module: item.module || item.key,
      });
    }
    if (item.children?.length) flattenNavItems(item.children, acc);
  }
  return acc;
}

export const ADMIN_PAGES = flattenNavItems(ROLE_NAV.admin);
export const MANAGER_PAGES = flattenNavItems(ROLE_NAV.manager);
export const SALES_PAGES = flattenNavItems(ROLE_NAV.sales);
export const SUPPORT_PAGES = flattenNavItems(ROLE_NAV.support);
export const TECHNICAL_PAGES = flattenNavItems(ROLE_NAV.technical);
export const CUSTOMER_PAGES = flattenNavItems(ROLE_NAV.customer);

export const ADMIN_RESPONSIBILITIES = [
  'Org setup: departments, job roles, hired staff, teams',
  'Create users & assign system roles (Admin, Manager, Sales, Support, Technical, Customer)',
  'Lead pipeline: assign to managers/sales, qualified leads, follow-ups',
  'Deal pipeline: assign sales, monitor stages through customer conversion',
  'Customer & project oversight: assign tech teams, milestones, support handoff',
  'Support operations: tickets, escalations, support logs, SM review queues',
  'Reports, performance, settings, roles & permissions, audit',
];

export const MANAGER_RESPONSIBILITIES = [
  'Department sidebar varies: Sales, Support, or Technical manager',
  'Assign leads/deals (sales) or projects/tickets (support/tech) to team',
  'Monitor follow-ups, pipeline, and team workload',
  'Review project delivery, support handoffs, and escalations',
  'Team performance, attendance, and department reports',
];

export const SALES_RESPONSIBILITIES = [
  'Work assigned leads & qualified leads pipeline',
  'Schedule follow-ups, meetings, and log outcomes',
  'Create & move deals through sales pipeline',
  'Convert qualified leads to deals and customers',
  'View customers linked to own deals',
];

export const SUPPORT_RESPONSIBILITIES = [
  'Handle assigned support tickets & customer follow-ups',
  'Complete support tasks from Support Manager',
  'Upload documents and log ticket history',
  'Escalate to Support Manager when technical help is needed',
  'View assigned customers and active support projects',
];

export const TECHNICAL_RESPONSIBILITIES = [
  'Deliver assigned projects: milestones, dev tasks, code review',
  'Bug fixes, testing, and deployment stages',
  'Complete support-engineer tasks from Support Manager',
  'Submit projects for support handoff when delivery is ready',
  'Team workload and technical documentation',
];

export const CUSTOMER_RESPONSIBILITIES = [
  'Review and accept delivered projects',
  'Create support tickets and confirm resolutions',
  'Submit change requests for active projects',
  'View project status, documents, and invoices',
  'Profile and notification preferences',
];

export const SALES_WORKFLOW = [
  'New Lead', 'Contacted', 'Follow-up', 'Qualified', 'Deal Created', 'Won', 'Customer',
];

export const TECHNICAL_WORKFLOW = [
  'Project Assigned', 'Development', 'Code Review', 'Testing', 'Deployment', 'Support Handoff',
];

export const CRM_WORKFLOW = CRM_WORKFLOW_STEPS;

/** Production permission matrix — Module × Role */
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

export const MODULE_GROUPS = [
  { label: 'Sales & CRM', modules: ['dashboard', 'leads', 'followups', 'deals', 'customers', 'meetings', 'calendar', 'quotations'] },
  { label: 'Projects & Delivery', modules: ['projects', 'tasks', 'documents', 'deployment', 'bugtracker'] },
  { label: 'Support', modules: ['tickets', 'supportLogs', 'escalations', 'supportTasks', 'knowledgebase'] },
  { label: 'Finance', modules: ['invoices', 'payments', 'expenses', 'transactions'] },
  { label: 'Organization', modules: ['users', 'roles', 'departments', 'teams', 'settings', 'audit', 'performance', 'attendance'] },
  { label: 'Insights', modules: ['reports', 'notifications'] },
];

export const ACCESS_DISPLAY = {
  full: 'Full access',
  view: 'View only',
  limited: 'Own / limited',
  assigned: 'Assigned only',
  create: 'Create',
  update: 'Update',
  own: 'Own records',
  false: 'No access',
};

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

export const canWrite = (role, module) => canPerformAction(role, module, 'create') || canPerformAction(role, module, 'update');

export const isAdmin = (role) => role === 'admin';
export const isManager = (role) => role === 'manager';
export const isSales = (role) => role === 'sales';
export const isSupport = (role) => role === 'support';
export const isTechnical = (role) => role === 'technical';
export const isCustomer = (role) => role === 'customer';
