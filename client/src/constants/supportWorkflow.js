/** Post-delivery support lifecycle — mirrors server/constants/supportWorkflow.js */

export const SUPPORT_REVIEW_STATUSES = {
  pending_review: { label: 'Awaiting Support Review', color: 'bg-amber-500/20 text-amber-300' },
  support_tasks_assigned: { label: 'Tasks Assigned', color: 'bg-indigo-500/20 text-indigo-300' },
  support_tasks_in_progress: { label: 'Tasks In Progress', color: 'bg-blue-500/20 text-blue-300' },
  support_tasks_complete: { label: 'Tasks Complete — Verify', color: 'bg-cyan-500/20 text-cyan-300' },
  submitted_to_customer: { label: 'Pending Customer Acceptance', color: 'bg-purple-500/20 text-purple-300' },
  support_active: { label: 'Support Active', color: 'bg-green-500/20 text-green-400' },
  in_support: { label: 'In Support', color: 'bg-blue-500/20 text-blue-300' },
  changes_required: { label: 'Changes Required', color: 'bg-orange-500/20 text-orange-300' },
  fix_in_progress: { label: 'Fix In Progress', color: 'bg-purple-500/20 text-purple-300' },
  resubmitted: { label: 'Resubmitted', color: 'bg-cyan-500/20 text-cyan-300' },
  verified: { label: 'Verified', color: 'bg-green-500/20 text-green-400' },
  closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-300' },
};

export const SUPPORT_PROJECT_WORKFLOW = [
  'Technical Manager submits project (dev + testing + docs checklist)',
  'Support Manager accepts project or requests changes',
  'Support Manager creates tasks and assigns team members as needed',
  'Support team completes tasks — Support Manager verifies and submits to customer',
  'Customer accepts → Support Active (or changes / support ticket)',
];

export const SUPPORT_TASK_TEMPLATES = [
  { key: 'customer_training', label: 'Customer Training', category: 'support_executive' },
  { key: 'user_account_setup', label: 'User Account Setup', category: 'support_executive' },
  { key: 'password_reset', label: 'Password Reset', category: 'support_executive' },
  { key: 'customer_follow_up', label: 'Customer Follow-up', category: 'support_executive' },
  { key: 'documentation_support', label: 'Documentation Support', category: 'support_executive' },
  { key: 'ticket_verification', label: 'Ticket Verification', category: 'support_executive' },
  { key: 'user_guidance', label: 'User Guidance', category: 'support_executive' },
  { key: 'basic_application_support', label: 'Basic Application Support', category: 'support_executive' },
  { key: 'application_deployment', label: 'Application Deployment', category: 'technical_support_engineer' },
  { key: 'server_configuration', label: 'Server Configuration', category: 'technical_support_engineer' },
  { key: 'ssl_configuration', label: 'SSL Configuration', category: 'technical_support_engineer' },
  { key: 'email_configuration', label: 'Email Configuration', category: 'technical_support_engineer' },
  { key: 'database_configuration', label: 'Database Configuration', category: 'technical_support_engineer' },
  { key: 'performance_check', label: 'Performance Check', category: 'technical_support_engineer' },
  { key: 'backup_configuration', label: 'Backup Configuration', category: 'technical_support_engineer' },
  { key: 'technical_investigation', label: 'Technical Investigation', category: 'technical_support_engineer' },
];

export const UPDATE_REQUEST_TYPES = [
  { value: 'bug', label: 'Bug Fix' },
  { value: 'enhancement', label: 'Enhancement' },
];

export const CHANGE_REQUEST_SCOPES = [
  { value: 'minor', label: 'Minor change (Support team)' },
  { value: 'development_required', label: 'Development required' },
];
