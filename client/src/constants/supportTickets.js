/** Support ticket categories, modules, and workflow labels (mirrors server/constants/supportTickets.js) */

export const TICKET_MODULES = [
  'Dashboard',
  'Projects',
  'Customers',
  'Tickets',
  'Reports',
  'Documents',
  'Invoices',
  'Orders',
  'Inventory',
  'Users & Roles',
  'Settings',
  'General',
];

export const TICKET_ISSUE_CATEGORY_GROUPS = [
  {
    group: 'Functional Issues',
    categories: [
      'Login Issue',
      'Password Reset',
      'User Account',
      'Report Issue',
      'Data Issue',
      'Feature Usage',
      'Customer Training',
    ],
  },
  {
    group: 'Technical Issues',
    categories: [
      'Application Error',
      'Performance Issue',
      'Server Issue',
      'Deployment Issue',
      'Database Issue',
      'Email Issue',
      'SSL/Domain Issue',
      'API Issue',
    ],
  },
  {
    group: 'Change Requests',
    categories: [
      'New Feature',
      'UI Change',
      'Workflow Change',
      'Report Enhancement',
      'Integration Request',
    ],
  },
];

export const ALL_TICKET_ISSUE_CATEGORIES = TICKET_ISSUE_CATEGORY_GROUPS.flatMap((g) => g.categories);

export const TICKET_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const TICKET_WORKFLOW_STATUSES = [
  { value: 'open', label: 'New' },
  { value: 'reopened', label: 'Reopened' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'working', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'waiting_customer', label: 'Awaiting Confirmation' },
  { value: 'closed', label: 'Closed' },
];

export function issueCategoryGroup(category) {
  if (!category) return '';
  const found = TICKET_ISSUE_CATEGORY_GROUPS.find((g) => g.categories.includes(category));
  return found?.group || '';
}

export function isChangeRequestCategory(category) {
  return issueCategoryGroup(category) === 'Change Requests';
}

export function isTechnicalIssueCategory(category) {
  return issueCategoryGroup(category) === 'Technical Issues';
}
