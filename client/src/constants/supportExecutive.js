/** Support Executive UI constants */

export const SUPPORT_EXECUTIVE_TASK_STATUSES = {
  assigned: { label: 'Assigned', color: 'bg-gray-500/20 text-gray-300' },
  pending: { label: 'Assigned', color: 'bg-gray-500/20 text-gray-300' },
  accepted: { label: 'Accepted', color: 'bg-indigo-500/20 text-indigo-300' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-300' },
  waiting_customer: { label: 'Waiting for Customer', color: 'bg-amber-500/20 text-amber-300' },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
};

export const SUPPORT_EXECUTIVE_TICKET_STATUSES = {
  assigned: { label: 'Assigned', color: 'bg-yellow-500/20 text-yellow-300' },
  open: { label: 'New', color: 'bg-blue-500/20 text-blue-400' },
  reopened: { label: 'Reopened', color: 'bg-orange-500/20 text-orange-300' },
  accepted: { label: 'Accepted', color: 'bg-indigo-500/20 text-indigo-300' },
  working: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-300' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-300' },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-300' },
  reviewed: { label: 'Reviewed', color: 'bg-violet-500/20 text-violet-300' },
  waiting_customer: { label: 'Waiting for Customer', color: 'bg-amber-500/20 text-amber-300' },
  resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-400' },
  closed: { label: 'Resolved', color: 'bg-green-500/20 text-green-400' },
};

export const SUPPORT_EXECUTIVE_PERMISSIONS = [
  { module: 'Dashboard', view: true, create: false, edit: false, delete: false },
  { module: 'My Projects', view: true, create: false, edit: false, delete: false },
  { module: 'My Tasks', view: true, create: false, edit: true, delete: false },
  { module: 'My Tickets', view: true, create: false, edit: true, delete: false },
  { module: 'Customer Requests', view: true, create: true, edit: true, delete: false },
  { module: 'Documents', view: true, create: true, edit: false, delete: false, createLabel: 'Upload support files' },
  { module: 'Notifications', view: true, create: false, edit: true, delete: false, editLabel: 'Mark read' },
  { module: 'Reports', view: true, create: false, edit: false, delete: false },
  { module: 'Profile', view: true, create: false, edit: true, delete: false },
];

export const DOCUMENT_CATEGORIES = [
  { key: 'user_manual', label: 'User Manual' },
  { key: 'release_notes', label: 'Release Notes' },
  { key: 'deployment_guide', label: 'Deployment Guide' },
  { key: 'api_documentation', label: 'API Documentation' },
  { key: 'other', label: 'Other / Handoff Files' },
];

export function normalizeTaskStatus(status) {
  if (status === 'pending') return 'assigned';
  return status || 'assigned';
}

export function projectVersion(project) {
  const date = project?.submittedToCustomerAt || project?.supportHandoffAt || project?.updatedAt;
  if (!date) return 'v1.0';
  const d = new Date(date);
  return `v${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}
