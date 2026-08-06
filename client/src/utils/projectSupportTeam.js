const idOf = (ref) => {
  if (!ref) return '';
  return String(ref._id || ref);
};

/** Resolve support executives pickable for a project (from assigned team when available). */
export function getProjectSupportExecutiveOptions(project, allSupportAgents = []) {
  const agents = (allSupportAgents || []).filter((m) => m.role === 'support');

  const assignees = project?.supportTeamAssignees;
  if (Array.isArray(assignees) && assignees.length) {
    const resolved = assignees
      .map((u) => {
        if (u && typeof u === 'object' && u._id) return u;
        return agents.find((a) => idOf(a) === idOf(u));
      })
      .filter((u) => u && u.role === 'support');
    if (resolved.length) return resolved;
  }

  const staffRoleId = idOf(project?.supportStaffRole);
  if (staffRoleId) {
    const fromRole = agents.filter((a) => idOf(a.staffRole) === staffRoleId);
    if (fromRole.length) return fromRole;
  }

  return agents;
}

/** Technical Support Engineers on the project's support team (for technical issue tickets). */
export function getProjectTechnicalSupportEngineerOptions(project, allSupportAgents = []) {
  const agents = (allSupportAgents || []).filter((m) => ['support', 'technical'].includes(m.role));

  const pickTse = (members) => members.filter((m) => {
    const tse = project?.technicalSupportAssignee;
    if (tse && idOf(tse) === idOf(m)) return true;
    const labels = project?.supportStaffRole?.memberRoleLabels;
    if (labels) {
      const raw = labels instanceof Map ? Object.fromEntries(labels.entries()) : labels;
      const label = raw[String(m._id || m.id)];
      if (label && /technical/i.test(String(label))) return true;
    }
    const hay = `${m.hrProfile?.designation || ''} ${m.designation || ''} ${m.roleId?.name || ''}`.toLowerCase();
    if (/technical support|tse|devops|deployment|server|ssl|infrastructure/.test(hay)) return true;
    if (m.role === 'technical') return true;
    return false;
  });

  const assignees = project?.supportTeamAssignees;
  if (Array.isArray(assignees) && assignees.length) {
    const resolved = assignees
      .map((u) => {
        if (u && typeof u === 'object' && u._id) return u;
        return agents.find((a) => idOf(a) === idOf(u));
      })
      .filter(Boolean);
    const tse = pickTse(resolved);
    if (tse.length) return tse;
  }

  const tseRef = project?.technicalSupportAssignee;
  if (tseRef && typeof tseRef === 'object' && tseRef._id) {
    return [tseRef];
  }
  if (tseRef) {
    const found = agents.find((a) => idOf(a) === idOf(tseRef));
    if (found) return [found];
  }

  const staffRoleId = idOf(project?.supportStaffRole);
  if (staffRoleId) {
    const fromRole = pickTse(agents.filter((a) => idOf(a.staffRole) === staffRoleId));
    if (fromRole.length) return fromRole;
  }

  return pickTse(agents);
}

export function getProjectSupportTeamLabel(project) {
  const role = project?.supportStaffRole;
  if (role && typeof role === 'object' && role.name) {
    return `${role.name}${role.code ? ` (${role.code})` : ''}`;
  }
  if (Array.isArray(project?.supportTeamAssignees) && project.supportTeamAssignees.length) {
    return 'Assigned support team';
  }
  return null;
}

export function projectHasAssignedSupportTeam(project) {
  return Boolean(
    getProjectSupportTeamLabel(project)
    || (Array.isArray(project?.supportTeamAssignees) && project.supportTeamAssignees.length),
  );
}
