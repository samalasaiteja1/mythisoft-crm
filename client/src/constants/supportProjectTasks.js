/** Support handoff task types — client mirror of server/constants/supportProjectTasks.js */

export const ASSIGNEE_CATEGORIES = {
  support_executive: 'Support Executive',
  technical_support_engineer: 'Technical Support Engineer',
};

export const TASK_CATEGORY_OPTIONS = [
  { value: 'support_executive', label: 'Customer Support' },
];

export const CATEGORY_MEMBER_LABELS = {
  support_executive: 'Support Executives',
  technical_support_engineer: 'Technical Support Engineers',
};

export const SUPPORT_EXECUTIVE_TASK_TYPES = [
  { value: 'customer_training', label: 'Customer Training' },
  { value: 'user_account_setup', label: 'User Account Setup' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'customer_follow_up', label: 'Customer Follow-up' },
  { value: 'documentation_support', label: 'Documentation Support' },
  { value: 'ticket_verification', label: 'Ticket Verification' },
  { value: 'user_guidance', label: 'User Guidance' },
  { value: 'basic_application_support', label: 'Basic Application Support' },
];

export const TECHNICAL_SUPPORT_TASK_TYPES = [
  { value: 'application_deployment', label: 'Application Deployment' },
  { value: 'server_configuration', label: 'Server Configuration' },
  { value: 'ssl_configuration', label: 'SSL Configuration' },
  { value: 'email_configuration', label: 'Email Configuration' },
  { value: 'database_configuration', label: 'Database Configuration' },
  { value: 'performance_check', label: 'Performance Check' },
  { value: 'backup_configuration', label: 'Backup Configuration' },
  { value: 'technical_investigation', label: 'Technical Investigation' },
];

export const ALL_TASK_TYPES = [
  ...SUPPORT_EXECUTIVE_TASK_TYPES,
  ...TECHNICAL_SUPPORT_TASK_TYPES,
];

export const CREATE_TASK_TYPE_GROUPS = [
  { label: 'Customer Support', options: SUPPORT_EXECUTIVE_TASK_TYPES },
  { label: 'Technical Support', options: TECHNICAL_SUPPORT_TASK_TYPES },
];

export const TASK_TYPES_BY_CATEGORY = {
  support_executive: ALL_TASK_TYPES,
  technical_support_engineer: TECHNICAL_SUPPORT_TASK_TYPES,
};

const TASK_TYPE_CATEGORY = Object.fromEntries([
  ...SUPPORT_EXECUTIVE_TASK_TYPES.map((t) => [t.value, 'support_executive']),
  ...TECHNICAL_SUPPORT_TASK_TYPES.map((t) => [t.value, 'technical_support_engineer']),
]);

export function categoryForTaskType(taskType) {
  return TASK_TYPE_CATEGORY[taskType] || null;
}

export const SUPPORT_PROJECT_WORKFLOW = [
  'Technical Manager submits project',
  'Support Manager reviews project',
  'Create tasks & assign Support Executive + Technical Support Engineer',
  'Support Executive: training, setup, follow-up, documentation',
  'Technical Support Engineer: deployment, server, SSL, email, database',
  'Complete all tasks → Support Manager verifies',
  'Submit project to customer',
  'Customer accepts, requests changes, or creates support ticket',
];

export const SUPPORT_HANDOFF_TASK_SPLIT = {
  support_executive: SUPPORT_EXECUTIVE_TASK_TYPES.map((t) => t.label),
  technical_support_engineer: TECHNICAL_SUPPORT_TASK_TYPES.map((t) => t.label),
};

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const TASK_STATUS_OPTIONS = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_customer', label: 'Waiting for Customer' },
];

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

export function memberTaskCategory(member, team = null) {
  if (!member) return null;

  const labels = team?.memberRoleLabels || member.staffRole?.memberRoleLabels;
  if (labels) {
    const raw = labels instanceof Map ? Object.fromEntries(labels.entries()) : labels;
    const label = raw[String(member._id || member.id)];
    if (label) {
      const hay = String(label).toLowerCase();
      if (/technical/i.test(hay)) return 'technical_support_engineer';
      if (/customer|executive|support/i.test(hay)) return 'support_executive';
    }
  }

  const designation = String(member.hrProfile?.designation || member.designation || '').toLowerCase();
  const roleName = String(member.roleId?.name || member.roleTitle || '').toLowerCase();
  const primarySkill = String(member.hrProfile?.primarySkill || '').toLowerCase();
  const secondarySkill = String(member.hrProfile?.secondarySkill || '').toLowerCase();
  const assignedRole = String(member.assignedProjectRole || '').toLowerCase();
  const hay = `${designation} ${roleName} ${primarySkill} ${secondarySkill} ${assignedRole}`;

  if (/technical support engineer|tech support engineer|technical supporter|technical support|\btse\b|deployment engineer|technical engineer|devops|server engineer|ssl|infrastructure/.test(hay)) {
    return 'technical_support_engineer';
  }
  if (/support executive|customer support|customer supporter|helpdesk|help desk|customer-facing/.test(hay)) {
    return 'support_executive';
  }

  const fromTeam = teamTaskCategory(member.staffRole || team);
  if (fromTeam) return fromTeam;

  if (member.role === 'technical') return 'technical_support_engineer';
  if (member.role === 'support') return 'support_executive';
  return null;
}

export function taskTypesForTeam(team, member = null) {
  const cat = teamTaskCategory(team) || memberTaskCategory(member, team);
  if (cat === 'technical_support_engineer') return TECHNICAL_SUPPORT_TASK_TYPES;
  if (cat === 'support_executive') return SUPPORT_EXECUTIVE_TASK_TYPES;
  return ALL_TASK_TYPES;
}

export function membersForCategory(members, category, team = null) {
  if (!category) return members;
  return members.filter((m) => memberTaskCategory(m, team) === category);
}

export function supportCategoryLabel(category) {
  if (category === 'technical_support_engineer') return 'Technical Support';
  if (category === 'support_executive') return 'Customer Support';
  return '—';
}
