/** Technical Manager sidebar — multi-project, multi-team, milestones + tasks */

const nav = (key, label, path, module = key.split('-')[0]) => ({ key, label, path, module });

const techDashboardGroup = {
  key: 'tech-dashboard-group',
  label: 'Dashboard',
  module: 'dashboard',
  children: [
    nav('dashboard-overview', 'Overview', '/dashboard', 'dashboard'),
    nav('dashboard-active-projects', 'Active Projects', '/projects/active', 'dashboard'),
    nav('dashboard-pending-tasks', 'Pending Tasks', '/tasks?status=new', 'dashboard'),
    nav('dashboard-overdue-tasks', 'Overdue Tasks', '/tasks/overdue', 'dashboard'),
    nav('dashboard-delayed-projects', 'Delayed Projects', '/projects/overdue', 'dashboard'),
    nav('dashboard-notifications', 'Notifications', '/notifications', 'notifications'),
  ],
};

const techProjectsGroup = {
  key: 'tech-projects-group',
  label: 'My Projects',
  module: 'projects',
  children: [
    nav('projects-all', 'All My Projects', '/projects', 'projects'),
    nav('projects-active', 'Active Projects', '/projects/active', 'projects'),
    nav('projects-completed', 'Completed', '/projects/status/completed', 'projects'),
    nav('projects-requirements', 'Customer Requirements', '/projects/customer-requirements', 'projects'),
    nav('projects-documents', 'Documents', '/documents', 'documents'),
    nav('projects-changes', 'Change Requests', '/projects/tech-submissions', 'projects'),
  ],
};

const techTeamsGroup = {
  key: 'tech-teams-group',
  label: 'Teams',
  module: 'projects',
  children: [
    nav('teams-create', 'Create Team', '/teams/technical/manage', 'settings'),
    nav('teams-my', 'My Teams', '/teams/technical/my-teams', 'projects'),
    nav('teams-assignments', 'Teams by Project', '/teams/technical/assignments', 'projects'),
    nav('teams-members', 'Team Members', '/teams/technical/members', 'projects'),
    nav('teams-workload', 'Team Workload', '/teams/technical/workload', 'projects'),
    nav('teams-performance', 'Team Performance', '/teams/technical/performance', 'performance'),
  ],
};

const techMilestonesGroup = {
  key: 'tech-milestones-group',
  label: 'Milestones',
  module: 'projects',
  children: [
    nav('milestones-all', 'All Milestones', '/projects/milestones', 'projects'),
    nav('milestones-completed', 'Completed Milestones', '/projects/milestones/completed', 'projects'),
  ],
};

const techDeliveryGroup = {
  key: 'tech-delivery-group',
  label: 'Tasks & Delivery',
  module: 'tasks',
  children: [
    nav('tasks-list', 'Task List', '/tasks', 'tasks'),
    nav('tasks-create', 'Create Task', '/tasks?create=1', 'tasks'),
    nav('tasks-board', 'Kanban Board', '/dev-board', 'tasks'),
    nav('tasks-code-review', 'Code Review', '/projects/status/code_review', 'projects'),
    nav('tasks-testing', 'Testing', '/projects/status/testing', 'projects'),
    nav('tasks-bug-fixing', 'Bug Fixing', '/projects/status/bug_fixing', 'projects'),
    nav('tasks-bugs', 'Bug Tracker', '/bug-tracker', 'bugtracker'),
    nav('tasks-deployment', 'Deployment', '/projects/status/deployment', 'projects'),
    nav('tasks-support-handoff', 'Submit to Support', '/projects/support-handoff', 'projects'),
    nav('tasks-support-updates', 'Support Updates', '/projects/support-updates', 'projects'),
    nav('tasks-deploy-requests', 'Deploy Requests', '/deployment', 'deployment'),
  ],
};

const techReportsGroup = {
  key: 'tech-reports-group',
  label: 'Reports',
  module: 'reports',
  children: [
    nav('reports-progress', 'Project Progress', '/reports/projects', 'reports'),
    nav('reports-team', 'Team Performance', '/teams/technical/performance', 'reports'),
    nav('reports-tasks', 'Task Report', '/tasks', 'tasks'),
    nav('reports-utilization', 'Resource Utilization', '/teams/technical/workload', 'reports'),
  ],
};

const techSettingsGroup = {
  key: 'tech-settings-group',
  label: 'Settings',
  module: 'settings',
  children: [
    nav('settings-profile', 'Profile', '/profile', 'settings'),
    nav('settings-notifications', 'Notifications', '/notifications', 'notifications'),
  ],
};

export const TECH_MANAGER_WORKFLOW = [
  'View Admin Teams',
  'Create New Team',
  'Add / Remove Members',
  'Create Milestones',
  'Create Tasks',
  'Assign Tasks',
  'Track Progress',
  'Code Review',
  'Testing',
  'Bug Fixing',
  'Deployment',
  'Submit to Support',
  'Support Manager Review',
  'Support Executive / Update Request',
  'Resubmit to Support',
  'Close Ticket',
];

export const TECH_MANAGER_PERMISSIONS = {
  projects: ['View assigned projects', 'Update project progress', 'Submit completed projects'],
  teams: ['Create team', 'View admin & own teams', 'Edit / delete own teams', 'Add / remove members'],
  employees: ['View team members & details', 'Cannot create or delete employees'],
  tasks: ['Create, assign, reassign tasks', 'Update status', 'Code review, testing, bugs, deployment'],
  reports: ['View and export reports'],
  communication: ['Manager chat, team chat, announcements'],
  settings: ['Manage own profile and preferences'],
};

export const TECH_MANAGER_NAV = [
  techDashboardGroup,
  techProjectsGroup,
  techTeamsGroup,
  techMilestonesGroup,
  techDeliveryGroup,
  techReportsGroup,
  techSettingsGroup,
];
