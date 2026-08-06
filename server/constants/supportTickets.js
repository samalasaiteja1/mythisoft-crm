/** Support ticket categories, modules, and workflow labels */

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
