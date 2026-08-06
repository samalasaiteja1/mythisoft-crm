/** Technical Person — sidebar navigation */
const nav = (key, label, path, module = key.split('-')[0]) => ({ key, label, path, module });

const techDashboardGroup = {
  key: 'tech-person-dashboard',
  label: 'Dashboard',
  module: 'dashboard',
  children: [
    nav('tp-overview', 'Overview', '/dashboard', 'dashboard'),
    nav('tp-my-projects', 'My Projects', '/projects', 'projects'),
    nav('tp-my-tasks', 'My Tasks', '/technical/tasks', 'tasks'),
    nav('tp-support-handoff', 'Support Handoff Tasks', '/technical/support-tasks', 'supportTasks'),
    nav('tp-notifications', 'Notifications', '/notifications', 'notifications'),
  ],
};

const techProjectsGroup = {
  key: 'tech-person-projects',
  label: 'Projects',
  module: 'projects',
  children: [
    nav('tp-view-project', 'View Project', '/projects', 'projects'),
    nav('tp-view-requirements', 'View Requirements', '/technical/requirements', 'projects'),
    nav('tp-view-milestones', 'View Milestones', '/technical/milestones', 'projects'),
  ],
};

const techTasksGroup = {
  key: 'tech-person-tasks',
  label: 'Tasks',
  module: 'tasks',
  children: [
    nav('tp-tasks-list', 'My Tasks', '/technical/tasks', 'tasks'),
    nav('tp-task-details', 'Task Details', '/technical/tasks', 'tasks'),
    nav('tp-update-status', 'Update Task Status', '/technical/tasks', 'tasks'),
    nav('tp-upload-work', 'Upload Work', '/technical/tasks', 'tasks'),
  ],
};

const techCodeReviewGroup = {
  key: 'tech-person-code-review',
  label: 'Code Review',
  module: 'tasks',
  children: [
    nav('tp-review-comments', 'Review Comments', '/technical/code-review', 'tasks'),
    nav('tp-resubmit', 'Resubmit Task', '/technical/code-review', 'tasks'),
  ],
};

const techTestingGroup = {
  key: 'tech-person-testing',
  label: 'Testing',
  module: 'tasks',
  children: [
    nav('tp-test-results', 'Test Results', '/technical/testing', 'tasks'),
  ],
};

const techBugsGroup = {
  key: 'tech-person-bugs',
  label: 'Bug Management',
  module: 'bugtracker',
  children: [
    nav('tp-assigned-bugs', 'Assigned Bugs', '/technical/bugs', 'bugtracker'),
    nav('tp-update-bug', 'Update Bug Status', '/technical/bugs', 'bugtracker'),
  ],
};

const techProfileGroup = {
  key: 'tech-person-profile',
  label: 'Profile',
  module: 'notifications',
  children: [
    nav('tp-my-profile', 'My Profile', '/profile', 'notifications'),
    nav('tp-change-password', 'Change Password', '/profile?tab=password', 'notifications'),
  ],
};

export const TECH_PERSON_NAV = [
  techDashboardGroup,
  techProjectsGroup,
  techTasksGroup,
  techCodeReviewGroup,
  techTestingGroup,
  techBugsGroup,
  techProfileGroup,
];

export const TECH_PERSON_WORKFLOW = [
  'View Assigned Project',
  'View Milestones & Tasks',
  'Develop Feature',
  'Update Status',
  'Upload Work',
  'Code Review',
  'Testing',
  'Fix Bugs',
  'Complete Task',
];
