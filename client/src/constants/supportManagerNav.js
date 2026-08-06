/** Support Manager sidebar — project delivery, tickets, team, customers, follow-ups */

const nav = (key, label, path, module) => ({ key, label, path, module });

export const SUPPORT_MANAGER_WORKFLOW = [
  'Tech Manager submits project',
  'Support Manager reviews (verify build & docs)',
  'Create tasks — Support Executive + Technical Support Engineer',
  'Both teams complete tasks',
  'SM verifies tasks → submit to customer',
  'Customer acceptance / changes / support ticket',
];

export const SUPPORT_MANAGER_DELIVERY_FLOW = [
  'Submitted',
  'Review',
  'Tasks',
  'Submit to Customer',
  'Accepted',
  'Support Active',
];

export const SUPPORT_MANAGER_TICKET_FLOW = [
  'Open',
  'Assigned',
  'In Progress',
  'Reviewed',
  'Resolved',
  'Closed',
];

export const SUPPORT_MANAGER_QUICK_ACTIONS = [
  { label: 'Project Delivery', path: '/support/project-delivery', icon: 'delivery', primary: true },
  { label: 'Review Projects', path: '/projects/support-review', icon: 'review', badgeKey: 'pendingReview' },
  { label: 'Customer Acceptance', path: '/support/customer-acceptance', icon: 'acceptance', badgeKey: 'pendingCustomerAcceptance' },
  { label: 'Create Task', path: '/support/create-task', icon: 'task' },
  { label: 'Assign Ticket', path: '/support/tickets/all', icon: 'ticket', badgeKey: 'openTickets' },
  { label: 'Team Follow-ups', path: '/support/follow-ups', icon: 'followups', badgeKey: 'customerFollowUps' },
  { label: 'Follow-ups Today', path: '/support/follow-ups/today', icon: 'today', badgeKey: 'todayFollowUps' },
  { label: 'Support Team', path: '/teams/support/members', icon: 'team' },
];

export const SUPPORT_MANAGER_TICKET_TABS = [
  { key: 'all', label: 'All Tickets', path: '/support/tickets/all' },
  { key: 'assigned', label: 'Assigned', path: '/support/tickets/assigned' },
  { key: 'escalated', label: 'Escalated', path: '/support/tickets/escalated' },
  { key: 'closed', label: 'Closed', path: '/support/tickets/closed' },
];

export const SUPPORT_MANAGER_DELIVERY_TABS = [
  { key: 'submitted', label: 'Submitted', path: '/support/submitted-projects' },
  { key: 'delivery', label: 'Delivery Queue', path: '/support/project-delivery' },
  { key: 'review', label: 'Review', path: '/projects/support-review' },
  { key: 'acceptance', label: 'Acceptance', path: '/support/customer-acceptance' },
  { key: 'active', label: 'Support Active', path: '/projects/support-active' },
];

export const SUPPORT_MANAGER_TASK_TABS = [
  { key: 'create', label: 'Create Task', path: '/support/create-task' },
  { key: 'status', label: 'Task Status', path: '/support/task-status' },
];

export const SUPPORT_MANAGER_NAV = [
  nav('dashboard', 'Dashboard', '/dashboard', 'dashboard'),
  {
    key: 'sm-delivery-group',
    label: 'Project Delivery',
    module: 'projects',
    children: [
      nav('submitted-projects', 'Submitted Projects', '/support/submitted-projects', 'projects'),
      nav('project-delivery', 'Project Delivery', '/support/project-delivery', 'projects'),
      nav('review-projects', 'Review Projects', '/projects/support-review', 'projects'),
      nav('customer-acceptance', 'Customer Acceptance', '/support/customer-acceptance', 'projects'),
      nav('sm-support-active', 'Support Active', '/projects/support-active', 'projects'),
    ],
  },
  {
    key: 'sm-tasks-group',
    label: 'Support Tasks',
    module: 'supportTasks',
    children: [
      nav('create-task', 'Create Task', '/support/create-task', 'supportTasks'),
      nav('task-status', 'Task Status', '/support/task-status', 'supportTasks'),
    ],
  },
  {
    key: 'support-tickets-group',
    label: 'Support Tickets',
    module: 'tickets',
    children: [
      nav('tickets-all', 'All Tickets', '/support/tickets/all', 'tickets'),
      nav('tickets-assigned', 'Assigned Tickets', '/support/tickets/assigned', 'tickets'),
      nav('tickets-escalated', 'Escalated Tickets', '/support/tickets/escalated', 'tickets'),
      nav('tickets-closed', 'Closed Tickets', '/support/tickets/closed', 'tickets'),
      nav('tickets-history', 'Ticket History', '/support-logs', 'tickets'),
    ],
  },
  nav('change-requests', 'Change Requests', '/support/change-requests', 'tickets'),
  nav('documents', 'Documents', '/documents', 'documents'),
  nav('customers', 'Customers', '/support/customers', 'customers'),
  {
    key: 'support-followups-group',
    label: 'Follow-ups',
    module: 'followups',
    children: [
      nav('support-followups-today', 'Today', '/support/follow-ups/today', 'followups'),
      nav('support-followups-all', 'Team Follow-ups', '/support/follow-ups', 'followups'),
      nav('support-followups-overdue', 'Overdue', '/support/follow-ups/overdue', 'followups'),
      nav('support-followups-completed', 'Completed', '/support/follow-ups/completed', 'followups'),
      nav('support-followups-add', 'Add Follow-up', '/support/follow-ups/add', 'followups'),
      nav('support-followups-history', 'History', '/support/follow-ups/history', 'followups'),
    ],
  },
  {
    key: 'support-team-group',
    label: 'Support Team',
    module: 'tickets',
    children: [
      nav('team-create', 'Create Team', '/teams/support/manage', 'tickets'),
      nav('team-members', 'Team Members', '/teams/support/members', 'tickets'),
      nav('team-workload', 'Team Workload', '/teams/support/workload', 'tickets'),
      nav('team-performance', 'Team Performance', '/teams/support/performance', 'tickets'),
    ],
  },
  {
    key: 'reports-group',
    label: 'Reports',
    module: 'reports',
    children: [
      nav('reports-hub', 'All Reports', '/support/reports', 'reports'),
      nav('reports-delivery', 'Project Delivery', '/support/reports#delivery', 'reports'),
      nav('reports-acceptance', 'Customer Acceptance', '/support/reports#acceptance', 'reports'),
      nav('reports-tickets', 'Ticket Report', '/support/reports#tickets', 'reports'),
      nav('reports-sla', 'SLA Report', '/teams/support/performance', 'reports'),
      nav('reports-team', 'Team Performance', '/teams/support/performance', 'reports'),
    ],
  },
  nav('notifications', 'Notifications', '/notifications', 'notifications'),
  nav('profile', 'Profile', '/profile', 'settings'),
];
