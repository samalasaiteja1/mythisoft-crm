/** Post-delivery support lifecycle */

export const SUPPORT_REVIEW_STATUSES = [
  'pending_review',
  'support_tasks_assigned',
  'support_tasks_in_progress',
  'support_tasks_complete',
  'submitted_to_customer',
  'support_active',
  'in_support',
  'changes_required',
  'fix_in_progress',
  'resubmitted',
  'verified',
  'closed',
];

export const UPDATE_REQUEST_TYPES = ['bug', 'enhancement'];

export const SUPPORT_REVIEW_STATUS_LABELS = {
  pending_review: 'Awaiting Support Review',
  support_tasks_assigned: 'Support Tasks Assigned',
  support_tasks_in_progress: 'Support Tasks In Progress',
  support_tasks_complete: 'Tasks Complete — Awaiting SM Verify',
  submitted_to_customer: 'Pending Customer Acceptance',
  support_active: 'Support Active',
  in_support: 'In Support',
  changes_required: 'Changes Required',
  fix_in_progress: 'Fix In Progress',
  resubmitted: 'Resubmitted for Verification',
  verified: 'Verified',
  closed: 'Closed',
};
