export const PROJECT_STATUS_KEYS = [
  'new',
  'planning',
  'development',
  'in_progress',
  'code_review',
  'testing',
  'bug_fixing',
  'on_hold',
  'deployment',
  'completed',
  'cancelled',
];

export const PROJECT_STATUS_LABELS = {
  new: 'New',
  planning: 'Planning',
  development: 'Development',
  in_progress: 'In Progress',
  code_review: 'Code Review',
  testing: 'Testing',
  bug_fixing: 'Bug Fixing',
  on_hold: 'On Hold',
  deployment: 'Deployment',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Statuses technical staff can set when updating delivery */
export const TECHNICAL_PROJECT_STATUSES = [
  'development',
  'in_progress',
  'code_review',
  'testing',
  'bug_fixing',
  'on_hold',
  'deployment',
  'completed',
];

export const ACTIVE_PROJECT_STATUSES = [
  'development',
  'in_progress',
  'code_review',
  'testing',
  'bug_fixing',
  'deployment',
];

export const WORKFLOW_TO_STATUS = {
  project_started: 'planning',
  development: 'development',
  testing: 'testing',
  deployment: 'deployment',
  delivered: 'completed',
  support: 'in_progress',
  completed: 'completed',
};
