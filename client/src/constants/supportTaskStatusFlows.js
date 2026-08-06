import { SUPPORT_EXECUTIVE_TASK_STATUSES, normalizeTaskStatus } from './supportExecutive';

const DEFAULT_FLOW = {
  labels: {},
  actions: {
    assigned: [{ status: 'accepted', label: 'Accept', icon: 'accept' }],
    accepted: [{ status: 'in_progress', label: 'Start', icon: 'start' }],
    in_progress: [
      { status: 'waiting_customer', label: 'Waiting for customer', icon: 'wait' },
      { status: 'completed', label: 'Complete', primary: true, icon: 'complete' },
    ],
    waiting_customer: [
      { status: 'in_progress', label: 'Resume', icon: 'start' },
      { status: 'completed', label: 'Complete', primary: true, icon: 'complete' },
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
      assigned: [{ status: 'accepted', label: 'Accept task', icon: 'accept' }],
      accepted: [{ status: 'in_progress', label: 'Schedule training', icon: 'start' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Customer unavailable', icon: 'wait' },
        { status: 'completed', label: 'Training completed', primary: true, icon: 'complete' },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume training', icon: 'start' },
        { status: 'completed', label: 'Training completed', primary: true, icon: 'complete' },
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
      assigned: [{ status: 'accepted', label: 'Accept task', icon: 'accept' }],
      accepted: [{ status: 'in_progress', label: 'Start setup', icon: 'start' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Need customer info', icon: 'wait' },
        { status: 'completed', label: 'Setup complete', primary: true, icon: 'complete' },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume setup', icon: 'start' },
        { status: 'completed', label: 'Setup complete', primary: true, icon: 'complete' },
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
      assigned: [{ status: 'accepted', label: 'Accept ticket', icon: 'accept' }],
      accepted: [{ status: 'in_progress', label: 'Start support', icon: 'start' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Waiting on customer', icon: 'wait' },
        { status: 'completed', label: 'Mark resolved', primary: true, icon: 'complete' },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume support', icon: 'start' },
        { status: 'completed', label: 'Mark resolved', primary: true, icon: 'complete' },
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
      assigned: [{ status: 'accepted', label: 'Accept task', icon: 'accept' }],
      accepted: [{ status: 'in_progress', label: 'Start drafting', icon: 'start' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Send for review', icon: 'wait' },
        { status: 'completed', label: 'Publish docs', primary: true, icon: 'complete' },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Revise draft', icon: 'start' },
        { status: 'completed', label: 'Publish docs', primary: true, icon: 'complete' },
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
      assigned: [{ status: 'accepted', label: 'Accept task', icon: 'accept' }],
      accepted: [{ status: 'in_progress', label: 'Start deployment', icon: 'start' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Blocked / waiting', icon: 'wait' },
        { status: 'completed', label: 'Mark deployed', primary: true, icon: 'complete' },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume deployment', icon: 'start' },
        { status: 'completed', label: 'Mark deployed', primary: true, icon: 'complete' },
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
      assigned: [{ status: 'accepted', label: 'Accept task', icon: 'accept' }],
      accepted: [{ status: 'in_progress', label: 'Start configuration', icon: 'start' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Need server access', icon: 'wait' },
        { status: 'completed', label: 'Configuration done', primary: true, icon: 'complete' },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume configuration', icon: 'start' },
        { status: 'completed', label: 'Configuration done', primary: true, icon: 'complete' },
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
      assigned: [{ status: 'accepted', label: 'Accept task', icon: 'accept' }],
      accepted: [{ status: 'in_progress', label: 'Start setup', icon: 'start' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Waiting on DNS/credentials', icon: 'wait' },
        { status: 'completed', label: 'Setup complete', primary: true, icon: 'complete' },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Resume setup', icon: 'start' },
        { status: 'completed', label: 'Setup complete', primary: true, icon: 'complete' },
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
      assigned: [{ status: 'accepted', label: 'Accept task', icon: 'accept' }],
      accepted: [{ status: 'in_progress', label: 'Start verification', icon: 'start' }],
      in_progress: [
        { status: 'waiting_customer', label: 'Report issues', icon: 'wait' },
        { status: 'completed', label: 'Mark verified', primary: true, icon: 'complete' },
      ],
      waiting_customer: [
        { status: 'in_progress', label: 'Re-verify', icon: 'start' },
        { status: 'completed', label: 'Mark verified', primary: true, icon: 'complete' },
      ],
    },
    description: 'Assigned → Accepted → Verifying → Verified',
    initialStatuses: ['assigned', 'accepted'],
  },
};

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

export function taskStatusMeta(taskType, status) {
  const key = normalizeTaskStatus(status);
  const base = SUPPORT_EXECUTIVE_TASK_STATUSES[key] || SUPPORT_EXECUTIVE_TASK_STATUSES.assigned;
  const customLabel = flowForTaskType(taskType).labels?.[key];
  return {
    ...base,
    label: customLabel || base.label,
  };
}

export function taskStatusBadge(taskType, status, size = 'xs') {
  const meta = taskStatusMeta(taskType, status);
  const pad = size === 'sm' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5';
  return { className: `${pad} rounded-full ${meta.color}`, label: meta.label };
}

export function actionsForTaskStatus(taskType, status) {
  const key = normalizeTaskStatus(status);
  if (key === 'completed') return [];
  const flow = flowForTaskType(taskType);
  return flow.actions?.[key] || DEFAULT_FLOW.actions[key] || [];
}

export function flowDescriptionForTaskType(taskType) {
  return flowForTaskType(taskType).description;
}

export function initialStatusesForTaskType(taskType) {
  return flowForTaskType(taskType).initialStatuses || DEFAULT_FLOW.initialStatuses;
}

export function isValidStatusTransition(taskType, fromStatus, toStatus) {
  const from = normalizeTaskStatus(fromStatus);
  const to = normalizeTaskStatus(toStatus);
  if (from === to) return true;
  if (to === 'completed') {
    return ['in_progress', 'waiting_customer', 'accepted'].includes(from);
  }
  const actions = actionsForTaskStatus(taskType, from);
  return actions.some((a) => a.status === to);
}

const BASE_STATUSES = ['assigned', 'accepted', 'in_progress', 'waiting_customer', 'completed'];

/** Status options for support person dropdown (current + allowed next statuses). */
export function statusUpdateOptions(taskType, currentStatus) {
  const current = normalizeTaskStatus(currentStatus);
  if (current === 'completed') {
    return [{ value: 'completed', label: taskStatusMeta(taskType, 'completed').label }];
  }
  const nextActions = actionsForTaskStatus(taskType, current);
  const values = new Set([current, ...nextActions.map((a) => a.status)]);
  return [...values].map((value) => ({
    value,
    label: taskStatusMeta(taskType, value).label,
  }));
}

/** All workflow statuses with disabled flag for invalid transitions. */
export function allStatusDropdownOptions(taskType, currentStatus) {
  const current = normalizeTaskStatus(currentStatus);
  return BASE_STATUSES.map((value) => ({
    value,
    label: taskStatusMeta(taskType, value).label,
    disabled: value !== current && !isValidStatusTransition(taskType, current, value),
  }));
}

export function createFormStatusOptions(taskType) {
  const allowed = initialStatusesForTaskType(taskType);
  return allowed.map((value) => ({
    value,
    label: taskStatusMeta(taskType, value).label,
  }));
}
