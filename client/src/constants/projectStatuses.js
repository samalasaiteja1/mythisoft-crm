export const PROJECT_STATUSES = {
  new: { label: 'New', color: 'bg-slate-500/20 text-slate-300' },
  planning: { label: 'Planning', color: 'bg-gray-500/20 text-gray-400' },
  development: { label: 'Development', color: 'bg-indigo-500/20 text-indigo-300' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-400' },
  code_review: { label: 'Code Review', color: 'bg-violet-500/20 text-violet-300' },
  testing: { label: 'Testing', color: 'bg-cyan-500/20 text-cyan-300' },
  bug_fixing: { label: 'Bug Fixing', color: 'bg-orange-500/20 text-orange-300' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-500/20 text-yellow-400' },
  deployment: { label: 'Deployment', color: 'bg-purple-500/20 text-purple-300' },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
  // Legacy record display
  delivered: { label: 'Completed (legacy)', color: 'bg-green-500/20 text-green-400' },
};

/** All values accepted by the API when creating/updating a project */
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

/** Delivery milestone pipeline (excludes on_hold / cancelled) */
export const PROJECT_MILESTONE_STAGES = [
  { key: 'new', label: 'New' },
  { key: 'planning', label: 'Planning' },
  { key: 'development', label: 'Development' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'code_review', label: 'Code Review' },
  { key: 'testing', label: 'Testing' },
  { key: 'bug_fixing', label: 'Bug Fixing' },
  { key: 'deployment', label: 'Deployment' },
  { key: 'completed', label: 'Completed' },
];

export const getMilestoneIndex = (status) => {
  const idx = PROJECT_MILESTONE_STAGES.findIndex((s) => s.key === status);
  if (idx >= 0) return idx;
  if (status === 'delivered') return PROJECT_MILESTONE_STAGES.findIndex((s) => s.key === 'completed');
  return 0;
};
