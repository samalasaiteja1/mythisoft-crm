/** Tech manager project delivery pipeline after development */

export const DELIVERY_PIPELINE = [
  'code_review',
  'testing',
  'bug_fixing',
  'deployment',
  'completed',
];

export const DELIVERY_REVIEW_MODES = {
  code_review: {
    title: 'Code Review Form',
    loadStatus: 'code_review',
    emptyHint: 'No projects in code review — move a project to Code Review status first',
    approve: { nextStatus: 'testing', label: 'Approve → Testing' },
    changes: { nextStatus: 'development', label: 'Changes Requested → Development' },
    successMessage: 'Code review recorded',
  },
  testing: {
    title: 'Testing Form',
    loadStatus: 'testing',
    emptyHint: 'No projects in testing — approve code review first',
    approve: { nextStatus: 'bug_fixing', label: 'Pass → Bug Tracking' },
    changes: { nextStatus: 'code_review', label: 'Fail → Code Review' },
    successMessage: 'Testing passed — moved to bug tracking',
  },
  bug_fixing: {
    title: 'Bug Tracking Form',
    loadStatus: 'bug_fixing',
    emptyHint: 'No projects in bug fixing — complete testing first',
    approve: { nextStatus: 'deployment', label: 'Bugs Resolved → Deployment' },
    changes: { nextStatus: 'testing', label: 'More Issues → Testing' },
    successMessage: 'Bugs resolved — moved to deployment',
  },
  deployment: {
    title: 'Deployment Form',
    loadStatus: 'deployment',
    emptyHint: 'No projects ready for deployment — resolve bugs first',
    approve: { nextStatus: 'completed', label: 'Deployed → Completed' },
    changes: { nextStatus: 'bug_fixing', label: 'Issues Found → Bug Tracking' },
    successMessage: 'Deployment complete — submitted to admin for review',
  },
};

export const DELIVERY_REVIEW_STATUSES = Object.keys(DELIVERY_REVIEW_MODES);

export const workflowStageForProjectStatus = (status) => {
  const map = {
    development: 'development',
    code_review: 'development',
    testing: 'testing',
    bug_fixing: 'testing',
    deployment: 'deployment',
    completed: 'completed',
  };
  return map[status];
};
