/** Customer portal sidebar — aligned with support manager / support person workflow */

const nav = (key, label, path, module) => ({ key, label, path, module });

export const CUSTOMER_PROJECT_FLOW = [
  'Delivered',
  'Support Handoff',
  'Your Review',
  'Accepted',
  'Ongoing Support',
];

export const CUSTOMER_TICKET_FLOW = [
  'Created',
  'Assigned',
  'In Progress',
  'Fixed',
  'Your Confirmation',
  'Closed',
];

export const CUSTOMER_PORTAL_WORKFLOW = [
  'Project delivered by MYTHISOFT technical team',
  'Support team completes handoff tasks',
  'You review and accept the project',
  'Ongoing support via tickets & change requests',
];

/** Project list tabs on /projects (customer) */
export const CUSTOMER_PROJECT_TABS = [
  { key: 'all', label: 'All Projects', statuses: null },
  { key: 'acceptance', label: 'Awaiting Acceptance', match: 'pending_acceptance' },
  { key: 'active', label: 'Active', statuses: ['planning', 'in_progress', 'on_hold', 'delivered', 'support'] },
  { key: 'support', label: 'In Support', match: 'in_support' },
  { key: 'closed', label: 'Closed', statuses: ['completed', 'cancelled'] },
];

/** Ticket list tabs on /tickets (customer) */
export const CUSTOMER_TICKET_TABS = [
  { key: 'all', label: 'All Tickets', statuses: null },
  { key: 'open', label: 'Open', statuses: ['open', 'reopened', 'assigned'] },
  { key: 'progress', label: 'In Progress', statuses: ['accepted', 'working'] },
  { key: 'confirm', label: 'Awaiting Confirmation', statuses: ['waiting_customer', 'resolved'] },
  { key: 'closed', label: 'Closed', statuses: ['closed'] },
];

export const CUSTOMER_QUICK_ACTIONS = [
  { label: 'Accept Project', path: '/projects/accept', icon: 'accept', primary: true, badgeKey: 'awaitingAcceptance' },
  { label: 'Create Ticket', path: '/tickets/create', icon: 'ticket' },
  { label: 'Confirm Fix', path: '/tickets?tab=confirm', icon: 'confirm', badgeKey: 'ticketsAwaitingConfirmation' },
  { label: 'Request Changes', path: '/change-requests/new', icon: 'change' },
  { label: 'My Documents', path: '/documents', icon: 'documents' },
  { label: 'Invoices', path: '/invoices', icon: 'invoices', badgeKey: 'pendingInvoices' },
];

export const CUSTOMER_PORTAL_NAV = [
  nav('dashboard', 'Dashboard', '/dashboard', 'dashboard'),
  {
    key: 'customer-projects-group',
    label: 'My Projects',
    module: 'projects',
    children: [
      nav('customer-projects-all', 'All Projects', '/projects', 'projects'),
      nav('customer-projects-accept', 'Awaiting Acceptance', '/projects?tab=acceptance', 'projects'),
      nav('customer-projects-active', 'Active', '/projects?tab=active', 'projects'),
      nav('customer-projects-support', 'In Support', '/projects?tab=support', 'projects'),
      nav('customer-projects-closed', 'Closed', '/projects?tab=closed', 'projects'),
    ],
  },
  {
    key: 'customer-support-group',
    label: 'Support',
    module: 'tickets',
    children: [
      nav('customer-tickets-all', 'My Tickets', '/tickets', 'tickets'),
      nav('customer-tickets-open', 'Open', '/tickets?tab=open', 'tickets'),
      nav('customer-tickets-progress', 'In Progress', '/tickets?tab=progress', 'tickets'),
      nav('customer-tickets-confirm', 'Awaiting Confirmation', '/tickets?tab=confirm', 'tickets'),
      nav('tickets-create', 'Create Ticket', '/tickets/create', 'tickets'),
      nav('support-logs', 'Ticket History', '/support-logs', 'tickets'),
    ],
  },
  nav('change-requests', 'Change Requests', '/change-requests', 'tickets'),
  nav('documents', 'Documents', '/documents', 'documents'),
  nav('calendar', 'Calendar', '/calendar', 'calendar'),
  nav('invoices', 'Invoices', '/invoices', 'invoices'),
  nav('notifications', 'Notifications', '/notifications', 'notifications'),
  nav('profile', 'Profile', '/profile', 'settings'),
];

export const CUSTOMER_TICKET_CATEGORIES = [
  'Bug',
  'Login Issue',
  'Technical Support',
  'Performance Issue',
  'Configuration',
  'Deployment Issue',
  'Feature Request',
  'Change Request',
];

export const CUSTOMER_CHANGE_TYPES = [
  'Enhancement',
  'New Feature',
  'UI Change',
  'Workflow Change',
  'Report Change',
  'Integration',
  'Other',
];

export const CUSTOMER_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const projectCode = (project) => {
  if (!project) return '—';
  if (project.code) return project.code;
  const id = project._id || project.id || '';
  return `PRJ-${String(id).slice(-6).toUpperCase()}`;
};

export const projectVersion = (project) => project?.technologyStack?.[0] || project?.category?.name || 'v1.0';
