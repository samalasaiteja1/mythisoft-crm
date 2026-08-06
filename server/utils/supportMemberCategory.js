/** Map team member labels / profile fields → support task assignee category */

export const SUPPORT_MEMBER_ROLE_LABELS = {
  support_executive: 'Customer Support',
  technical_support_engineer: 'Technical Support',
};

export function memberRoleLabelsFromTeam(team) {
  const raw = team?.memberRoleLabels;
  if (!raw) return {};
  const entries = typeof raw.entries === 'function' ? [...raw.entries()] : Object.entries(raw);
  const out = {};
  entries.forEach(([key, label]) => {
    if (label?.trim()) out[String(key)] = label.trim();
  });
  return out;
}

export function labelToSupportCategory(label) {
  const hay = String(label || '').toLowerCase().trim();
  if (!hay) return null;
  if (
    /technical support engineer|tech support engineer|technical supporter|technical support|\btse\b|deployment engineer|technical engineer/.test(hay)
  ) {
    return 'technical_support_engineer';
  }
  if (
    /support executive|customer support|customer supporter|basic application|executive|customer-facing/.test(hay)
  ) {
    return 'support_executive';
  }
  return null;
}

function profileHaystack(user) {
  const designation = String(user?.hrProfile?.designation || user.designation || '').toLowerCase();
  const roleName = String(user?.roleId?.name || user?.roleTitle || '').toLowerCase();
  const primarySkill = String(user?.hrProfile?.primarySkill || '').toLowerCase();
  const secondarySkill = String(user?.hrProfile?.secondarySkill || '').toLowerCase();
  const assignedRole = String(user?.assignedProjectRole || '').toLowerCase();
  const teamName = String(user?.staffRole?.name || '').toLowerCase();
  const teamCode = String(user?.staffRole?.code || '').toLowerCase();
  return `${designation} ${roleName} ${primarySkill} ${secondarySkill} ${assignedRole} ${teamName} ${teamCode}`;
}

/** Infer category from employee HR / job role (no team labels required). */
export function inferSupportCategoryFromProfile(user) {
  if (!user || user.isActive === false) return null;

  const fromAssigned = labelToSupportCategory(user.assignedProjectRole);
  if (fromAssigned) return fromAssigned;

  const hay = profileHaystack(user);

  if (
    /technical support engineer|tech support engineer|technical supporter|technical support|\btse\b|deployment engineer|technical engineer|devops engineer|server engineer|system engineer|infrastructure engineer|deployment specialist|server admin|ssl engineer|database engineer|technical supporter/.test(hay)
  ) {
    return 'technical_support_engineer';
  }

  if (
    /support executive|customer support|customer supporter|support desk|customer-facing|helpdesk|help desk|customer care|client support/.test(hay)
  ) {
    return 'support_executive';
  }

  if (user.role === 'technical') {
    const dept = String(user.departmentName || user.department?.name || '').toLowerCase();
    if (dept.includes('support') || /support|deployment|server|ssl|devops|infrastructure/.test(hay)) {
      return 'technical_support_engineer';
    }
    return null;
  }

  if (user.role !== 'support') return null;

  const code = String(user.staffRole?.code || '').toLowerCase();
  if (code === 'support501') return 'technical_support_engineer';
  if (code === 'support500') return 'support_executive';

  if (/technical|engineer|deployment|server|ssl|devops|infrastructure|database admin/.test(hay)
    && !/executive|customer.support|customer supporter|helpdesk|help desk/.test(hay)) {
    return 'technical_support_engineer';
  }

  return 'support_executive';
}

export function assigneeCategoryForUser(user, team = null) {
  if (!user || user.isActive === false) return null;

  const uid = String(user._id || user.id || '');
  const labels = memberRoleLabelsFromTeam(team);
  const fromTeamLabel = labelToSupportCategory(labels[uid]);
  if (fromTeamLabel) return fromTeamLabel;

  return inferSupportCategoryFromProfile(user);
}

/** Build or merge memberRoleLabels from explicit picks + profile inference. */
export function buildMemberRoleLabelsForUsers(users = [], existingLabels = {}) {
  const labels = { ...existingLabels };
  users.forEach((user) => {
    const uid = String(user._id || user.id || '');
    if (!uid || labels[uid]) return;
    const cat = inferSupportCategoryFromProfile(user);
    if (cat) labels[uid] = SUPPORT_MEMBER_ROLE_LABELS[cat];
  });
  return labels;
}

export async function ensureTeamMemberRoleLabels(team, users = []) {
  if (!team?._id || team.teamGroup !== 'support') return team;

  const existing = memberRoleLabelsFromTeam(team);
  const merged = buildMemberRoleLabelsForUsers(users, existing);
  const changed = Object.keys(merged).some((key) => merged[key] !== existing[key])
    || Object.keys(merged).length !== Object.keys(existing).length;

  if (!changed) return team;

  const StaffRole = (await import('../models/StaffRole.js')).default;
  const labelMap = new Map();
  Object.entries(merged).forEach(([uid, label]) => {
    if (label?.trim()) labelMap.set(uid, label.trim());
  });
  await StaffRole.findByIdAndUpdate(team._id, { memberRoleLabels: labelMap });
  return { ...team, memberRoleLabels: merged };
}

export function isTechnicalSupportEngineerUser(user, team = null) {
  return assigneeCategoryForUser(user, team) === 'technical_support_engineer';
}

export function isSupportExecutiveUser(user, team = null) {
  return assigneeCategoryForUser(user, team) === 'support_executive';
}
