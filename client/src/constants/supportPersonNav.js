/** Support Executive & Technical Support Engineer — sidebar and workflow */

const nav = (key, label, path, module) => ({ key, label, path, module });

export const SUPPORT_PERSON_WORKFLOW = [
  'Check My Tasks — accept and complete handoff work from your manager',
  'Open My Tickets — accept assigned tickets and start work',
  'Update progress with replies and notes on each ticket',
  'Mark ticket completed when the issue is fixed',
  'Manager reviews → customer confirms → ticket closed',
  'Support customers on active projects and follow-ups',
];

export const SUPPORT_PERSON_TASK_FLOW = [
  'Assigned',
  'Accepted',
  'In Progress',
  'Completed',
];

export const SUPPORT_PERSON_TICKET_FLOW = [
  'Assigned',
  'Accepted',
  'In Progress',
  'Completed',
  'Reviewed',
  'Resolved',
  'Closed',
];

export const SUPPORT_EXECUTIVE_ESCALATION = [
  'Cannot resolve alone → escalate to Technical Support Engineer or Manager',
  'Support Manager reviews fix before customer is notified',
];

export { SUPPORT_EXECUTIVE_PERMISSIONS } from './supportExecutive.js';

export const SUPPORT_PERSON_QUICK_ACTIONS = [
  { label: 'My Tasks', path: '/support/my-tasks', primary: true },
  { label: 'Tasks to Accept', path: '/support/my-tasks?tab=assigned', badgeKey: 'pendingSupportTasks' },
  { label: 'Active Tickets', path: '/support/tickets/assigned', badgeKey: 'activeTickets' },
  { label: 'Accept Tickets', path: '/support/tickets/assigned?tab=accept', badgeKey: 'ticketsToAccept' },
  { label: 'My Projects', path: '/support/my-projects' },
  { label: 'Follow-ups Today', path: '/support/follow-ups/today', badgeKey: 'todayFollowUps' },
  { label: 'Customer Requests', path: '/support/customer-requests', badgeKey: 'pendingCustomerReplies' },
  { label: 'Documents', path: '/support/documents' },
];

/** Task list tabs on /support/my-tasks */
export const SUPPORT_PERSON_TASK_TABS = [
  { key: 'open', label: 'Active', statuses: ['assigned', 'accepted', 'in_progress', 'waiting_customer'] },
  { key: 'assigned', label: 'To Accept', statuses: ['assigned'] },
  { key: 'accepted', label: 'Accepted', statuses: ['accepted'] },
  { key: 'in_progress', label: 'In Progress', statuses: ['in_progress', 'waiting_customer'] },
  { key: 'completed', label: 'Completed', statuses: ['completed'] },
  { key: 'all', label: 'All', statuses: null },
];

/** Project list tabs on /support/my-projects */
export const SUPPORT_PERSON_PROJECT_TABS = [
  { key: 'all', label: 'All Projects', statuses: null },
  { key: 'active', label: 'Active', statuses: ['support_tasks_assigned', 'support_tasks_in_progress', 'support_tasks_complete', 'in_support', 'support_active', 'changes_required', 'fix_in_progress', 'resubmitted'] },
  { key: 'tasks', label: 'Tasks In Progress', statuses: ['support_tasks_assigned', 'support_tasks_in_progress'] },
  { key: 'customer', label: 'Pending Customer', statuses: ['submitted_to_customer'] },
  { key: 'live', label: 'Support Active', statuses: ['support_active', 'in_support'] },
  { key: 'closed', label: 'Closed', statuses: ['closed', 'verified'] },
];

export const SUPPORT_PERSON_NAV = [
  nav('dashboard', 'Dashboard', '/dashboard', 'dashboard'),
  {
    key: 'my-work-group',
    label: 'My Work',
    module: 'supportTasks',
    children: [
      {
        key: 'my-work-tasks-group',
        label: 'Tasks',
        module: 'supportTasks',
        children: [
          nav('my-tasks', 'All Tasks', '/support/my-tasks', 'supportTasks'),
          nav('tasks-accept', 'Tasks to Accept', '/support/my-tasks?tab=assigned', 'supportTasks'),
          nav('tasks-accepted', 'Accepted', '/support/my-tasks?tab=accepted', 'supportTasks'),
          nav('tasks-progress', 'In Progress', '/support/my-tasks?tab=in_progress', 'supportTasks'),
          nav('tasks-completed', 'Completed', '/support/my-tasks?tab=completed', 'supportTasks'),
        ],
      },
    ],
  },
  {
    key: 'my-projects-group',
    label: 'My Projects',
    module: 'projects',
    children: [
      nav('projects-all', 'All Projects', '/support/my-projects', 'projects'),
      nav('projects-active', 'Active', '/support/my-projects?tab=active', 'projects'),
      nav('projects-tasks', 'Tasks In Progress', '/support/my-projects?tab=tasks', 'projects'),
      nav('projects-customer', 'Pending Customer', '/support/my-projects?tab=customer', 'projects'),
      nav('projects-live', 'Support Active', '/support/my-projects?tab=live', 'projects'),
      nav('projects-closed', 'Closed', '/support/my-projects?tab=closed', 'projects'),
    ],
  },
  {
    key: 'my-tickets-group',
    label: 'My Tickets',
    module: 'tickets',
    children: [
      nav('tickets-active', 'Active Tickets', '/support/tickets/assigned', 'tickets'),
      nav('tickets-accept', 'To Accept', '/support/tickets/assigned?tab=accept', 'tickets'),
      nav('tickets-progress', 'In Progress', '/support/tickets/assigned?tab=progress', 'tickets'),
      nav('tickets-completed', 'Completed', '/support/tickets/assigned?tab=completed', 'tickets'),
      nav('tickets-resolved', 'Resolved', '/support/tickets/assigned?tab=resolved', 'tickets'),
    ],
  },
  nav('customer-requests', 'Customer Requests', '/support/customer-requests', 'tickets'),
  nav('my-customers', 'My Customers', '/support/my-customers', 'customers'),
  {
    key: 'support-followups-group',
    label: 'Follow-ups',
    module: 'followups',
    children: [
      nav('support-followups-today', 'Today', '/support/follow-ups/today', 'followups'),
      nav('support-followups-all', 'All Follow-ups', '/support/follow-ups', 'followups'),
      nav('support-followups-overdue', 'Overdue', '/support/follow-ups/overdue', 'followups'),
      nav('support-followups-add', 'Add Follow-up', '/support/follow-ups/add', 'followups'),
      nav('support-followups-history', 'History', '/support/follow-ups/history', 'followups'),
    ],
  },
  nav('documents', 'Documents', '/support/documents', 'documents'),
  nav('reports', 'Reports', '/support/reports', 'reports'),
  nav('notifications', 'Notifications', '/notifications', 'notifications'),
  nav('profile', 'Profile', '/profile', 'settings'),
];

/** Ticket list tabs on /support/tickets/assigned */
export const SUPPORT_PERSON_TICKET_TABS = [
  { key: 'active', label: 'Active', statuses: ['open', 'reopened', 'assigned', 'accepted', 'working', 'completed'] },
  { key: 'accept', label: 'To Accept', statuses: ['assigned', 'reopened'] },
  { key: 'progress', label: 'In Progress', statuses: ['accepted', 'working'] },
  { key: 'completed', label: 'Completed', statuses: ['completed', 'reviewed'] },
  { key: 'resolved', label: 'Resolved', statuses: ['resolved', 'closed', 'waiting_customer'] },
];
