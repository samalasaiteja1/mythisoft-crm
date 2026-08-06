/** Support handoff task types — split by assignee category */

export const ASSIGNEE_CATEGORIES = {
  support_executive: 'Support Executive',
  technical_support_engineer: 'Technical Support Engineer',
};

export const TASK_CATEGORY_LABELS = {
  support_executive: 'Customer Support',
  technical_support_engineer: 'Technical Support',
};

export const CATEGORY_MEMBER_LABELS = {
  support_executive: 'Support Executives',
  technical_support_engineer: 'Technical Support Engineers',
};

export const SUPPORT_EXECUTIVE_TASK_TYPES = [
  'customer_training',
  'user_account_setup',
  'password_reset',
  'customer_follow_up',
  'documentation_support',
  'ticket_verification',
  'user_guidance',
  'basic_application_support',
];

export const TECHNICAL_SUPPORT_TASK_TYPES = [
  'application_deployment',
  'server_configuration',
  'ssl_configuration',
  'email_configuration',
  'database_configuration',
  'performance_check',
  'backup_configuration',
  'technical_investigation',
];

export const SUPPORT_TASK_TYPE_META = {
  customer_training: { label: 'Customer Training', category: 'support_executive', priority: 'medium' },
  user_account_setup: { label: 'User Account Setup', category: 'support_executive', priority: 'medium' },
  password_reset: { label: 'Password Reset', category: 'support_executive', priority: 'medium' },
  customer_follow_up: { label: 'Customer Follow-up', category: 'support_executive', priority: 'medium' },
  documentation_support: { label: 'Documentation Support', category: 'support_executive', priority: 'medium' },
  ticket_verification: { label: 'Ticket Verification', category: 'support_executive', priority: 'medium' },
  user_guidance: { label: 'User Guidance', category: 'support_executive', priority: 'medium' },
  basic_application_support: { label: 'Basic Application Support', category: 'support_executive', priority: 'medium' },
  application_deployment: { label: 'Application Deployment', category: 'technical_support_engineer', priority: 'high' },
  server_configuration: { label: 'Server Configuration', category: 'technical_support_engineer', priority: 'high' },
  ssl_configuration: { label: 'SSL Configuration', category: 'technical_support_engineer', priority: 'high' },
  email_configuration: { label: 'Email Configuration', category: 'technical_support_engineer', priority: 'high' },
  database_configuration: { label: 'Database Configuration', category: 'technical_support_engineer', priority: 'high' },
  performance_check: { label: 'Performance Check', category: 'technical_support_engineer', priority: 'medium' },
  backup_configuration: { label: 'Backup Configuration', category: 'technical_support_engineer', priority: 'medium' },
  technical_investigation: { label: 'Technical Investigation', category: 'technical_support_engineer', priority: 'medium' },
  // Legacy keys (existing records)
  user_setup: { label: 'User Setup', category: 'support_executive', priority: 'medium' },
  customer_support: { label: 'Customer Support', category: 'support_executive', priority: 'medium' },
  documentation: { label: 'Documentation', category: 'support_executive', priority: 'medium' },
  deployment: { label: 'Deployment', category: 'technical_support_engineer', priority: 'high' },
  email_ssl_setup: { label: 'Email/SSL Setup', category: 'technical_support_engineer', priority: 'high' },
  technical_verification: { label: 'Technical Verification', category: 'technical_support_engineer', priority: 'medium' },
  configuration: { label: 'Configuration', category: 'technical_support_engineer', priority: 'medium' },
  final_verification: { label: 'Final Verification', category: 'technical_support_engineer', priority: 'medium' },
  custom: { label: 'Custom', category: null, priority: 'medium' },
};

export const ALL_SUPPORT_TASK_TYPE_KEYS = Object.keys(SUPPORT_TASK_TYPE_META);

export function taskTypesForCategory(category) {
  if (category === 'support_executive') return SUPPORT_EXECUTIVE_TASK_TYPES;
  if (category === 'technical_support_engineer') return TECHNICAL_SUPPORT_TASK_TYPES;
  return ALL_SUPPORT_TASK_TYPE_KEYS.filter((k) => k !== 'custom');
}

export function defaultDueDate(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/** Infer SE vs TSE from staff role team record */
export function teamTaskCategory(team) {
  if (!team) return null;
  const code = String(team.code || '').toLowerCase();
  const name = String(team.name || '').toLowerCase();
  const desc = String(team.description || '').toLowerCase();
  const hay = `${name} ${code} ${desc}`;

  if (code === 'support501' || /technical support engineer|tech support engineer|\btse\b/.test(hay)) {
    return 'technical_support_engineer';
  }
  if (code === 'support500' || /support executive|\bexecutive\b|customer-facing|desk/.test(hay)) {
    return 'support_executive';
  }
  if (/technical|engineer|deployment|server|ssl/.test(hay) && !/executive|customer-facing/.test(hay)) {
    return 'technical_support_engineer';
  }
  if (/support/.test(hay)) return null;
  return null;
}

export function categoryForTaskType(taskType) {
  return SUPPORT_TASK_TYPE_META[taskType]?.category || null;
}
