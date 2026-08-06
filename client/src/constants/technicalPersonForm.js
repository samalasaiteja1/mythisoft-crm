export const TECH_WORK_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'planning', label: 'Planning' },
  { value: 'development', label: 'Development' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'code_review', label: 'Code Review' },
  { value: 'testing', label: 'Testing' },
  { value: 'bug_fixing', label: 'Bug Fixing' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'deployment', label: 'Deployment' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const TECH_WORK_STATUS_LABELS = Object.fromEntries(
  TECH_WORK_STATUSES.map((s) => [s.value, s.label])
);

export const TECH_WORK_TYPES = ['Code', 'Document', 'Screenshot', 'Build File'];

export const mapWorkStatusToDevStage = (workStatus) => {
  const map = {
    new: 'todo',
    planning: 'backlog',
    development: 'in_progress',
    in_progress: 'in_progress',
    code_review: 'code_review',
    testing: 'testing',
    bug_fixing: 'in_progress',
    on_hold: 'todo',
    deployment: 'testing',
    completed: 'completed',
    cancelled: 'todo',
  };
  return map[workStatus] || 'todo';
};

export const normalizeWorkStatus = (task) => {
  if (task?.workStatus) return task.workStatus;
  if (task?.devStage === 'code_review') return 'code_review';
  if (task?.devStage === 'testing') return 'testing';
  if (task?.devStage === 'completed') return 'completed';
  if (task?.status === 'in_progress') return 'in_progress';
  if (task?.status === 'new' || task?.status === 'pending') return 'new';
  return task?.status || 'new';
};
