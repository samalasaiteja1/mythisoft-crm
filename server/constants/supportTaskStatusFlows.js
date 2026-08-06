/** Per task-type status labels, actions, and transition rules */

const BASE_STATUSES = ['assigned', 'accepted', 'in_progress', 'waiting_customer', 'completed'];

const DEFAULT_FLOW = {
  labels: {},
  actions: {
    assigned: [{ status: 'accepted', label: 'Accept' }],
    accepted: [{ status: 'in_progress', label: 'Start' }],
    in_progress: [
      { status: 'waiting_customer', label: 'Waiting for customer' },
      { status: 'completed', label: 'Complete', primary: true },
    ],
    waiting_customer: [
      { status: 'in_progress', label: 'Resume' },
      { status: 'completed', label: 'Complete', primary: true },
    ],
  },
  description: 'Assigned → Accepted → In Progress → Completed',
  initialStatuses: ['assigned', 'accepted'],
};

export const SUPPORT_TASK_STATUS_FLOWS = {
  customer_training: {
    labels: {
      accepted: 'Training accepted',
      in_progress: 'Training scheduled',
      waiting_customer: 'Waiting for customer',
      completed: 'Training completed',
    },
    actions: {
      assigned: [{ status: 'accepted', label: 'Accept task' }],
      accepted: [{ status: 'in_progress', label: 'Schedule training' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Customer unavailable' },
        { status: 'completed', label: 'Training completed', primary: true },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume training' },
        { status: 'completed', label: 'Training completed', primary: true },
      ],
    },
    description: 'Assigned → Accepted → Training scheduled → Completed',
    initialStatuses: ['assigned', 'accepted'],
  },
  user_setup: {
    labels: {
      in_progress: 'Setting up users',
      waiting_customer: 'Waiting for credentials',
      completed: 'Setup completed',
    },
    actions: {
      assigned: [{ status: 'accepted', label: 'Accept task' }],
      accepted: [{ status: 'in_progress', label: 'Start setup' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Need customer info' },
        { status: 'completed', label: 'Setup complete', primary: true },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume setup' },
        { status: 'completed', label: 'Setup complete', primary: true },
      ],
    },
    description: 'Assigned → Accepted → User setup → Completed',
    initialStatuses: ['assigned', 'accepted'],
  },
  customer_support: {
    labels: {
      in_progress: 'Support in progress',
      waiting_customer: 'Waiting on customer',
      completed: 'Support resolved',
    },
    actions: {
      assigned: [{ status: 'accepted', label: 'Accept ticket' }],
      accepted: [{ status: 'in_progress', label: 'Start support' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Waiting on customer' },
        { status: 'completed', label: 'Mark resolved', primary: true },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume support' },
        { status: 'completed', label: 'Mark resolved', primary: true },
      ],
    },
    description: 'Assigned → Accepted → In progress → Resolved',
    initialStatuses: ['assigned', 'accepted', 'in_progress'],
  },
  documentation: {
    labels: {
      in_progress: 'Drafting docs',
      waiting_customer: 'Pending review',
      completed: 'Documentation published',
    },
    actions: {
      assigned: [{ status: 'accepted', label: 'Accept task' }],
      accepted: [{ status: 'in_progress', label: 'Start drafting' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Send for review' },
        { status: 'completed', label: 'Publish docs', primary: true },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Revise draft' },
        { status: 'completed', label: 'Publish docs', primary: true },
      ],
    },
    description: 'Assigned → Accepted → Drafting → Review → Published',
    initialStatuses: ['assigned', 'accepted', 'in_progress'],
  },
  deployment: {
    labels: {
      in_progress: 'Deploying',
      waiting_customer: 'Deployment blocked',
      completed: 'Deployed',
    },
    actions: {
      assigned: [{ status: 'accepted', label: 'Accept task' }],
      accepted: [{ status: 'in_progress', label: 'Start deployment' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Blocked / waiting' },
        { status: 'completed', label: 'Mark deployed', primary: true },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume deployment' },
        { status: 'completed', label: 'Mark deployed', primary: true },
      ],
    },
    description: 'Assigned → Accepted → Deploying → Deployed',
    initialStatuses: ['assigned', 'accepted'],
  },
  server_configuration: {
    labels: {
      in_progress: 'Configuring server',
      waiting_customer: 'Waiting for access',
      completed: 'Server configured',
    },
    actions: {
      assigned: [{ status: 'accepted', label: 'Accept task' }],
      accepted: [{ status: 'in_progress', label: 'Start configuration' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Need server access' },
        { status: 'completed', label: 'Configuration done', primary: true },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume configuration' },
        { status: 'completed', label: 'Configuration done', primary: true },
      ],
    },
    description: 'Assigned → Accepted → Configuring → Completed',
    initialStatuses: ['assigned', 'accepted'],
  },
  email_ssl_setup: {
    labels: {
      in_progress: 'Setting up email/SSL',
      waiting_customer: 'Waiting for DNS/credentials',
      completed: 'Email/SSL active',
    },
    actions: {
      assigned: [{ status: 'accepted', label: 'Accept task' }],
      accepted: [{ status: 'in_progress', label: 'Start setup' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Waiting on DNS/credentials' },
        { status: 'completed', label: 'Setup complete', primary: true },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume setup' },
        { status: 'completed', label: 'Setup complete', primary: true },
      ],
    },
    description: 'Assigned → Accepted → Email/SSL setup → Active',
    initialStatuses: ['assigned', 'accepted'],
  },
  technical_verification: {
    labels: {
      in_progress: 'Verifying',
      waiting_customer: 'Issues found',
      completed: 'Verified',
    },
    actions: {
      assigned: [{ status: 'accepted', label: 'Accept task' }],
      accepted: [{ status: 'in_progress', label: 'Start verification' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Report issues' },
        { status: 'completed', label: 'Mark verified', primary: true },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Re-verify' },
        { status: 'completed', label: 'Mark verified', primary: true },
      ],
    },
    description: 'Assigned → Accepted → Verifying → Verified',
    initialStatuses: ['assigned', 'accepted'],
  },
};

function normalizeStatus(status) {
  if (status === 'pending') return 'assigned';
  return status || 'assigned';
}

const FLOW_ALIASES = {
  user_account_setup: 'user_setup',
  password_reset: 'customer_support',
  customer_follow_up: 'customer_support',
  documentation_support: 'documentation',
  ticket_verification: 'customer_support',
  user_guidance: 'customer_training',
  basic_application_support: 'customer_support',
  application_deployment: 'deployment',
  ssl_configuration: 'email_ssl_setup',
  email_configuration: 'email_ssl_setup',
  database_configuration: 'server_configuration',
  performance_check: 'technical_verification',
  backup_configuration: 'server_configuration',
  technical_investigation: 'technical_verification',
};

export function flowForTaskType(taskType) {
  const key = FLOW_ALIASES[taskType] || taskType;
  return SUPPORT_TASK_STATUS_FLOWS[key] || DEFAULT_FLOW;
}

export function statusLabelForTaskType(taskType, status) {
  const flow = flowForTaskType(taskType);
  const key = normalizeStatus(status);
  return flow.labels?.[key] || null;
}

export function actionsForTaskStatus(taskType, status) {
  const flow = flowForTaskType(taskType);
  const key = normalizeStatus(status);
  if (key === 'completed') return [];
  return flow.actions?.[key] || DEFAULT_FLOW.actions[key] || [];
}

export function initialStatusesForTaskType(taskType) {
  return flowForTaskType(taskType).initialStatuses || DEFAULT_FLOW.initialStatuses;
}

export function isValidStatusTransition(taskType, fromStatus, toStatus) {
  const from = normalizeStatus(fromStatus);
  const to = normalizeStatus(toStatus);
  if (from === to) return true;
  if (to === 'completed') {
    return ['in_progress', 'waiting_customer', 'accepted'].includes(from);
  }
  const actions = actionsForTaskStatus(taskType, from);
  return actions.some((a) => a.status === to);
}

export function allBaseStatuses() {
  return BASE_STATUSES;
}
