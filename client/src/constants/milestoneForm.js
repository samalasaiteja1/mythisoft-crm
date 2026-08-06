/** Milestone types in delivery pipeline order */
export const MILESTONE_TYPE_OPTIONS = [
  { value: 'Requirement Analysis', order: 1 },
  { value: 'UI/UX Design', order: 2 },
  { value: 'Database Design', order: 3 },
  { value: 'Backend Development', order: 4 },
  { value: 'Frontend Development', order: 5 },
  { value: 'API Integration', order: 6 },
  { value: 'Testing', order: 7 },
  { value: 'Bug Fixing', order: 8 },
  { value: 'UAT', order: 9 },
  { value: 'Deployment', order: 10 },
  { value: 'Maintenance', order: 11 },
  { value: 'Other', order: 12 },
];

export const MILESTONE_TYPES = MILESTONE_TYPE_OPTIONS.map((t) => t.value);

const typeOrderMap = Object.fromEntries(
  MILESTONE_TYPE_OPTIONS.map((t) => [t.value, t.order])
);

/** Legacy type names for sorting older milestones */
const legacyTypeOrder = {
  Design: 1.5,
  Development: 4,
  'Code Review': 6.5,
  Testing: 7,
  UAT: 9,
  Documentation: 9.5,
  Deployment: 10,
  Release: 10.5,
  Other: 12,
};

export const milestoneTypeOrder = (type) => typeOrderMap[type] ?? legacyTypeOrder[type] ?? 99;

export const sortMilestonesByType = (milestones = []) =>
  [...milestones].sort((a, b) => {
    const orderDiff = milestoneTypeOrder(a.milestoneType) - milestoneTypeOrder(b.milestoneType);
    if (orderDiff !== 0) return orderDiff;
    const aStart = a.startDate ? new Date(a.startDate).getTime() : 0;
    const bStart = b.startDate ? new Date(b.startDate).getTime() : 0;
    return aStart - bStart;
  });

export const MILESTONE_PRIORITIES = {
  low: { label: 'Low', color: 'bg-gray-500/20 text-gray-300' },
  medium: { label: 'Medium', color: 'bg-blue-500/20 text-blue-300' },
  high: { label: 'High', color: 'bg-amber-500/20 text-amber-400' },
  urgent: { label: 'Urgent', color: 'bg-red-500/20 text-red-400' },
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400' },
};

/** Priority options shown on create/edit forms */
export const MILESTONE_FORM_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const MILESTONE_STATUSES = {
  not_started: { label: 'Not Started', color: 'bg-gray-500/20 text-gray-300' },
  pending: { label: 'Pending', color: 'bg-gray-500/20 text-gray-300' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-300' },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  delayed: { label: 'Delayed', color: 'bg-amber-500/20 text-amber-400' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-500/20 text-yellow-300' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
};

/** Status options on create/edit forms */
export const MILESTONE_FORM_STATUSES = ['not_started', 'in_progress', 'on_hold', 'completed'];

export const normalizeMilestoneStatus = (status) => {
  if (status === 'pending') return 'not_started';
  return status || 'not_started';
};

/** Map legacy urgent → critical for form display */
export const normalizeMilestonePriority = (priority) => {
  if (priority === 'urgent') return 'critical';
  return priority || 'medium';
};

export const milestonePriorityForApi = (priority) => {
  if (priority === 'critical') return 'critical';
  return priority || 'medium';
};
