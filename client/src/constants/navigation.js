/** Role-based sidebar navigation — nested groups */
import { getManagerDepartment } from '../utils/roleContext';
import { TECH_MANAGER_NAV } from './technicalManagerNav';
import { SUPPORT_MANAGER_NAV } from './supportManagerNav';
import { SUPPORT_PERSON_NAV } from './supportPersonNav';
import { TECH_PERSON_NAV } from './technicalPersonNav';
import { CUSTOMER_ASSIGNMENT_SEGMENTS } from './customerNav';
import { CUSTOMER_PORTAL_NAV } from './customerPortalNav';

const profile = { key: 'profile', label: 'Profile', path: '/profile', module: 'notifications' };
const notifications = { key: 'notifications', label: 'Notifications', path: '/notifications', module: 'notifications' };

const customersAssignmentNav = CUSTOMER_ASSIGNMENT_SEGMENTS.map((s) => ({
  key: `customers-${s.key}`,
  label: s.label,
  path: s.path,
  module: 'customers',
  roles: ['admin', 'manager'],
}));

const leadsGroupAdmin = {
  key: 'leads-group',
  label: 'Leads',
  module: 'leads',
  children: [
    { key: 'leads-all', label: 'All Leads', path: '/leads', module: 'leads' },
    { key: 'leads-assigned', label: 'Assigned Leads', path: '/leads/assigned', module: 'leads' },
    { key: 'leads-unsigned', label: 'Unsigned Leads', path: '/leads/unsigned', module: 'leads', roles: ['admin', 'manager'] },
    { key: 'qualified', label: 'Qualified Leads', path: '/qualified-leads', module: 'leads' },
    { key: 'followups', label: 'Follow-ups', path: '/leads/follow-ups', module: 'followups' },
    { key: 'leads-analytics', label: 'Lead Analytics', path: '/reports/leads', module: 'reports' },
  ],
};

const dealsGroupAdmin = {
  key: 'deals-group',
  label: 'Deals',
  module: 'deals',
  children: [
    { key: 'deals-pipeline', label: 'All Deals', path: '/deals', module: 'deals' },
    { key: 'deals-assigned', label: 'Assigned Deals', path: '/deals/assigned', module: 'deals' },
    { key: 'deals-unassigned', label: 'Unassigned Deals', path: '/deals/unassigned', module: 'deals', roles: ['admin', 'manager'] },
    { key: 'deals-followups', label: 'Follow-ups', path: '/deals/follow-ups', module: 'followups' },
    { key: 'deals-won', label: 'Won Deals', path: '/deals/list?stage=won', module: 'deals' },
    { key: 'deals-lost', label: 'Lost Deals', path: '/deals/list?stage=lost', module: 'deals' },
  ],
};

const projectsGroupAdmin = {
  key: 'projects-group',
  label: 'Projects',
  module: 'projects',
  children: [
    { key: 'projects-all', label: 'All Projects', path: '/projects', module: 'projects' },
    { key: 'projects-assign', label: 'Assign Projects', path: '/projects/assign', module: 'projects', roles: ['admin', 'manager'] },
    { key: 'projects-allocation', label: 'Team Allocation', path: '/projects/team-allocation', module: 'projects', roles: ['admin', 'manager'] },
    { key: 'projects-milestones', label: 'Milestones', path: '/projects/milestones', module: 'projects' },
    { key: 'projects-milestones-completed', label: 'Complete Milestones', path: '/projects/milestones/completed', module: 'projects' },
    { key: 'projects-tasks', label: 'Tasks', path: '/projects/tasks', module: 'projects' },
    { key: 'projects-code-review', label: 'Code Review', path: '/projects/status/code_review', module: 'projects' },
    { key: 'projects-tech-submissions', label: 'Tech Submissions', path: '/projects/tech-submissions', module: 'projects', roles: ['admin', 'manager'] },
    { key: 'projects-customer-requirements', label: 'Customer Requirements', path: '/projects/customer-requirements', module: 'projects', roles: ['admin', 'manager'] },
  ],
};

const projectsGroupTechnical = {
  key: 'projects-group',
  label: 'Projects',
  module: 'projects',
  children: [
    { key: 'projects-all', label: 'My Projects', path: '/projects', module: 'projects' },
    { key: 'projects-milestones', label: 'Milestones', path: '/projects/milestones', module: 'projects' },
    { key: 'projects-milestones-completed', label: 'Complete Milestones', path: '/projects/milestones/completed', module: 'projects' },
    { key: 'projects-tasks', label: 'Tasks', path: '/projects/tasks', module: 'projects' },
    { key: 'projects-code-review', label: 'Code Review', path: '/projects/status/code_review', module: 'projects' },
    { key: 'projects-workload', label: 'My Workload', path: '/projects/team-allocation', module: 'projects' },
  ],
};

const supportGroupAdmin = {
  key: 'support-group',
  label: 'Support',
  module: 'tickets',
  children: [
    { key: 'tickets', label: 'Tickets', path: '/tickets', module: 'tickets' },
    { key: 'support-logs', label: 'Support Logs', path: '/support-logs', module: 'tickets' },
    { key: 'escalations', label: 'Escalations', path: '/escalations', module: 'tickets' },
  ],
};

const customersGroupAdmin = {
  key: 'customers-group',
  label: 'Customers',
  module: 'customers',
  children: [
    { key: 'customers-all', label: 'All Customers', path: '/customers/all', module: 'customers' },
    ...customersAssignmentNav,
    { key: 'customers-active', label: 'Active Customers', path: '/customers/active', module: 'customers' },
    { key: 'customers-projects', label: 'Customer Projects', path: '/customers/project', module: 'customers' },
    { key: 'customers-followups', label: 'Follow-ups', path: '/customers/follow-ups', module: 'followups' },
    { key: 'customers-history', label: 'Customer History', path: '/customers/follow-ups/history', module: 'followups' },
  ],
};

const adminNav = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
  leadsGroupAdmin,
  { key: 'followups', label: 'Follow-ups', path: '/follow-ups/today', module: 'followups' },
  dealsGroupAdmin,
  customersGroupAdmin,
  projectsGroupAdmin,
  supportGroupAdmin,
  { key: 'reports', label: 'Reports', path: '/reports', module: 'reports' },
  notifications,
  profile,
];

/** Manager dashboard navigation tree */
const dashboardGroupManager = {
  key: 'dashboard-group',
  label: 'Dashboard',
  module: 'dashboard',
  children: [
    { key: 'dashboard-overview', label: 'Overview', path: '/dashboard', module: 'dashboard' },
    { key: 'dashboard-performance', label: 'Team Performance', path: '/performance', module: 'performance' },
    { key: 'dashboard-activities', label: 'Recent Activities', path: '/dashboard#recent-activities', module: 'dashboard' },
  ],
};

const leadsGroupManager = {
  key: 'leads-group',
  label: 'Leads',
  module: 'leads',
  children: [
    { key: 'leads-all', label: 'All Leads', path: '/leads', module: 'leads' },
    { key: 'leads-assigned', label: 'Assigned Leads', path: '/leads/assigned', module: 'leads' },
    { key: 'leads-unsigned', label: 'Unsigned Leads', path: '/leads/unsigned', module: 'leads', roles: ['admin', 'manager'] },
    { key: 'qualified', label: 'Qualified Leads', path: '/qualified-leads', module: 'leads' },
    { key: 'followups', label: 'Follow-ups', path: '/leads/follow-ups', module: 'followups' },
    { key: 'leads-analytics', label: 'Lead Analytics', path: '/reports/leads', module: 'reports' },
  ],
};

const dealsGroupManager = {
  key: 'deals-group',
  label: 'Deals',
  module: 'deals',
  children: [
    { key: 'deals-pipeline', label: 'All Deals', path: '/deals', module: 'deals' },
    { key: 'deals-assigned', label: 'Assigned Deals', path: '/deals/assigned', module: 'deals' },
    { key: 'deals-unassigned', label: 'Unassigned Deals', path: '/deals/unassigned', module: 'deals', roles: ['admin', 'manager'] },
    { key: 'deals-followups', label: 'Follow-ups', path: '/deals/follow-ups', module: 'followups' },
    { key: 'deals-won', label: 'Won Deals', path: '/deals/list?stage=won', module: 'deals' },
    { key: 'deals-lost', label: 'Lost Deals', path: '/deals/list?stage=lost', module: 'deals' },
  ],
};

const customersGroupManager = {
  key: 'customers-group',
  label: 'Customers',
  module: 'customers',
  children: [
    { key: 'customers-all', label: 'All Customers', path: '/customers/all', module: 'customers' },
    ...customersAssignmentNav,
    { key: 'customers-active', label: 'Active Customers', path: '/customers/active', module: 'customers' },
    { key: 'customers-projects', label: 'Customer Projects', path: '/customers/project', module: 'customers' },
    { key: 'customers-followups', label: 'Follow-ups', path: '/customers/follow-ups', module: 'followups' },
    { key: 'customers-history', label: 'Customer History', path: '/customers/follow-ups/history', module: 'followups' },
  ],
};

const projectsGroupManager = {
  key: 'projects-group',
  label: 'Projects',
  module: 'projects',
  children: [
    { key: 'projects-all', label: 'All Projects', path: '/projects', module: 'projects' },
    { key: 'projects-assign', label: 'Assign Projects', path: '/projects/assign', module: 'projects', roles: ['admin', 'manager'] },
    { key: 'projects-allocation', label: 'Team Allocation', path: '/projects/team-allocation', module: 'projects', roles: ['admin', 'manager'] },
    { key: 'projects-milestones', label: 'Milestones', path: '/projects/milestones', module: 'projects' },
    { key: 'projects-milestones-completed', label: 'Complete Milestones', path: '/projects/milestones/completed', module: 'projects' },
    { key: 'projects-tasks', label: 'Tasks', path: '/projects/tasks', module: 'projects' },
    { key: 'projects-code-review', label: 'Code Review', path: '/projects/status/code_review', module: 'projects' },
    { key: 'projects-tech-submissions', label: 'Tech Submissions', path: '/projects/tech-submissions', module: 'projects', roles: ['admin', 'manager'] },
    { key: 'projects-customer-requirements', label: 'Customer Requirements', path: '/projects/customer-requirements', module: 'projects', roles: ['admin', 'manager'] },
  ],
};

const supportGroupManager = {
  key: 'support-group',
  label: 'Support',
  module: 'tickets',
  children: [
    { key: 'support-review', label: 'Review Projects', path: '/projects/support-review', module: 'projects' },
    { key: 'tickets', label: 'Tickets', path: '/tickets', module: 'tickets' },
    { key: 'escalations', label: 'Escalations', path: '/escalations', module: 'tickets' },
    { key: 'ticket-status', label: 'Ticket Status', path: '/teams/support/open-tickets', module: 'tickets' },
    { key: 'resolution-reports', label: 'Resolution Reports', path: '/teams/support/resolved-tickets', module: 'tickets' },
  ],
};

const salesTeamGroupManager = {
  key: 'sales-team',
  label: 'Sales Team',
  module: 'performance',
  children: [
    { key: 'sales-members', label: 'Team Members', path: '/teams/sales/members', module: 'performance' },
    { key: 'sales-leads', label: 'Assigned Leads', path: '/teams/sales/leads', module: 'leads' },
    { key: 'sales-deals', label: 'Active Deals', path: '/teams/sales/deals', module: 'deals' },
    { key: 'sales-performance', label: 'Performance', path: '/teams/sales/performance', module: 'performance' },
    { key: 'sales-workload', label: 'Workload', path: '/teams/sales/workload', module: 'performance' },
  ],
};

const technicalTeamGroupManager = {
  key: 'technical-team',
  label: 'Technical Team',
  module: 'projects',
  children: [
    { key: 'tech-members', label: 'Team Members', path: '/teams/technical/members', module: 'projects' },
    { key: 'tech-assignments', label: 'Project Assignments', path: '/teams/technical/assignments', module: 'projects' },
    { key: 'tech-active', label: 'Active Projects', path: '/teams/technical/active', module: 'projects' },
    { key: 'tech-pending', label: 'Pending Projects', path: '/teams/technical/pending', module: 'projects' },
    { key: 'tech-completed', label: 'Completed Projects', path: '/teams/technical/completed', module: 'projects' },
    { key: 'tech-workload', label: 'Team Workload', path: '/teams/technical/workload', module: 'projects' },
    { key: 'tech-performance', label: 'Performance', path: '/teams/technical/performance', module: 'performance' },
    { key: 'tech-attendance', label: 'Attendance', path: '/teams/technical/attendance', module: 'performance' },
  ],
};

const supportTeamGroupManager = {
  key: 'support-team-group',
  label: 'Support Team',
  module: 'tickets',
  children: [
    { key: 'support-members', label: 'Team Members', path: '/teams/support/members', module: 'tickets' },
    { key: 'support-assigned', label: 'Assigned Tickets', path: '/teams/support/assigned-tickets', module: 'tickets' },
    { key: 'support-open', label: 'Open Tickets', path: '/teams/support/open-tickets', module: 'tickets' },
    { key: 'support-resolved', label: 'Resolved Tickets', path: '/teams/support/resolved-tickets', module: 'tickets' },
    { key: 'support-workload', label: 'Team Workload', path: '/teams/support/workload', module: 'tickets' },
    { key: 'support-performance', label: 'Performance', path: '/teams/support/performance', module: 'performance' },
    { key: 'support-attendance', label: 'Attendance', path: '/teams/support/attendance', module: 'performance' },
  ],
};

const teamsGroupManager = {
  key: 'teams-group',
  label: 'Teams',
  module: 'performance',
  children: [salesTeamGroupManager, technicalTeamGroupManager, supportTeamGroupManager],
};

const reportsGroupManager = {
  key: 'reports-group',
  label: 'Reports',
  module: 'reports',
  children: [
    { key: 'reports-sales', label: 'Sales Reports', path: '/reports/sales', module: 'reports' },
    { key: 'reports-leads', label: 'Lead Reports', path: '/reports/leads', module: 'reports' },
    { key: 'reports-projects', label: 'Project Reports', path: '/reports/projects', module: 'reports' },
    { key: 'reports-support', label: 'Support Reports', path: '/teams/support/performance', module: 'reports' },
    { key: 'reports-team', label: 'Team Performance Reports', path: '/performance', module: 'performance' },
  ],
};

const settingsGroupManager = {
  key: 'settings-group',
  label: 'Settings',
  module: 'settings',
  children: [
    { key: 'settings-company', label: 'Company Settings', path: '/settings', module: 'settings' },
    { key: 'settings-notifications', label: 'Notifications', path: '/notifications', module: 'notifications' },
  ],
};

const managerNav = [
  dashboardGroupManager,
  leadsGroupManager,
  dealsGroupManager,
  { key: 'followups', label: 'Follow-ups', path: '/follow-ups/today', module: 'followups' },
  customersGroupManager,
  projectsGroupManager,
  supportGroupManager,
  teamsGroupManager,
  reportsGroupManager,
  profile,
  settingsGroupManager,
];

export const ROLE_NAV = {
  admin: [
    ...adminNav,
    { key: 'roles', label: 'Roles & Permissions', path: '/permissions', module: 'roles' },
    { key: 'settings', label: 'Settings', path: '/settings', module: 'settings' },
  ],
  manager: managerNav,
  sales: [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
    { key: 'leads', label: 'My Leads', path: '/leads', module: 'leads' },
    { key: 'followups', label: 'Follow-ups', path: '/follow-ups/today', module: 'followups' },
    { key: 'qualified', label: 'Qualified Leads', path: '/qualified-leads', module: 'leads' },
    { key: 'deals', label: 'Deals', path: '/deals', module: 'deals' },
    { key: 'customers', label: 'Customers', path: '/customers/all', module: 'customers' },
    notifications,
    profile,
  ],
  technical: TECH_PERSON_NAV,
  support: SUPPORT_PERSON_NAV,
  customer: CUSTOMER_PORTAL_NAV,
};

export const ROLE_PANEL_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  technical: 'Tech Team',
  support: 'Support Team',
  customer: 'Customer Portal',
};

export const CRM_WORKFLOW_STEPS = [
  'Admin: Create User & Configure CRM',
  'Lead Created',
  'Manager Reviews',
  'Assign to Sales',
  'Sales contacts lead',
  'Qualified',
  'Deal Created',
  'Customer Created',
  'Project Created',
  'Assign Tech Team',
  'Development',
  'Testing',
  'Deployment',
  'Submit to Support',
  'Support Manager Review',
  'Support Executive / Update Request',
  'Ticket Resolution',
  'Project Closed',
];

const MANAGER_NAV_BY_DEPT = {
  sales: [
    dashboardGroupManager,
    leadsGroupManager,
    dealsGroupManager,
    { key: 'followups', label: 'Follow-ups', path: '/follow-ups/today', module: 'followups' },
    customersGroupManager,
    { key: 'sales-team', label: 'Sales Team', module: 'performance', children: salesTeamGroupManager.children },
    reportsGroupManager,
    settingsGroupManager,
  ],
  technical: TECH_MANAGER_NAV,
  support: SUPPORT_MANAGER_NAV,
};

export function getNavForUser(user) {
  const role = user?.role;
  if (!role) return [];
  if (role === 'manager') {
    const dept = getManagerDepartment(user);
    return MANAGER_NAV_BY_DEPT[dept] || MANAGER_NAV_BY_DEPT.sales;
  }
  return ROLE_NAV[role] || [];
}
