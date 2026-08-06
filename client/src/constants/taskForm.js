/** Task-level statuses — separate from project delivery pipeline */

export const TASK_TYPES = [
  'Feature',
  'Development',
  'Bug Fix',
  'Testing',
  'Code Review',
  'Documentation',
  'Deployment',
  'Research',
  'Design',
  'Other',
];

export const TASK_FORM_STATUSES = [
  'new',
  'pending',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
];

export const TASK_STATUS_OPTIONS = [
  { value: 'new', label: 'New', hint: 'Not started yet' },
  { value: 'pending', label: 'Pending', hint: 'Waiting to be picked up' },
  { value: 'in_progress', label: 'In Progress', hint: 'Currently being worked on' },
  { value: 'on_hold', label: 'On Hold', hint: 'Paused or blocked' },
  { value: 'completed', label: 'Completed', hint: 'Work finished' },
  { value: 'cancelled', label: 'Cancelled', hint: 'No longer needed' },
];

export const TASK_STATUS_LABELS = Object.fromEntries(
  TASK_STATUS_OPTIONS.map((s) => [s.value, s.label])
);

export const normalizeTaskStatus = (status) => {
  if (status === 'pending') return 'pending';
  if (!status || status === 'new') return 'new';
  if (TASK_FORM_STATUSES.includes(status)) return status;
  return 'new';
};

export const taskStatusLabel = (status) =>
  TASK_STATUS_LABELS[normalizeTaskStatus(status)] || String(status || 'New').replace(/_/g, ' ');
