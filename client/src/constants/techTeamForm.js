export const TECH_TEAM_TYPES = [
  'Development Team',
  'QA Team',
  'UI/UX Team',
  'DevOps Team',
  'Full Stack Team',
  'Cross-functional Team',
];

export const TECH_MEMBER_ROLE_OPTIONS = [
  'Backend Developer',
  'Frontend Developer',
  'UI/UX Designer',
  'QA Tester',
  'DevOps Engineer',
  'Full Stack Developer',
  'Team Lead',
];

/** Admin job roles that should not appear when picking team members */
export const isExcludedTeamPickRole = (role) => {
  const name = String(role?.name || role || '').trim().toLowerCase();
  if (!name) return false;
  return (
    name.includes('tech manager')
    || name.includes('technical manager')
    || name === 'technical managers'
    || name === 'tech managers'
  );
};

export const filterTeamPickRoles = (roles = []) =>
  roles.filter((r) => !isExcludedTeamPickRole(r));

export const isTechnicalDepartmentName = (name) =>
  String(name || '').trim().toLowerCase().includes('tech');

/** Find the Technical department from Settings → Departments */
export const findTechnicalDepartment = (departments = []) =>
  departments.find((d) => isTechnicalDepartmentName(d.name));

/** Job roles configured under the Technical department (excludes Tech Manager). */
export const filterRolesForTechnicalDepartment = (roles = [], technicalDepartmentId = '') => {
  let list = roles.filter((r) => r.status !== 'inactive');
  if (technicalDepartmentId) {
    list = list.filter((r) => {
      const deptId = r.department?._id || r.department;
      return String(deptId) === String(technicalDepartmentId);
    });
  } else {
    list = list.filter((r) => isTechnicalDepartmentName(r.department?.name));
  }
  return filterTeamPickRoles(list);
};

export const getEmployeeJobRoleName = (employee) =>
  employee?.roleId?.name || employee?.hrProfile?.designation || employee?.roleTitle || '';

export const memberMatchesJobRole = (member, role) => {
  if (!role) return true;
  const roleId = String(role._id || '');
  const roleName = String(role.name || '').trim().toLowerCase();
  const empRoleId = String(member?.roleId?._id || member?.roleId || '');
  if (roleId && empRoleId && empRoleId === roleId) return true;
  const assignedLabel = String(member?.assignedProjectRole || '').trim().toLowerCase();
  if (roleName && assignedLabel && assignedLabel === roleName) return true;
  const empRoleName = getEmployeeJobRoleName(member).trim().toLowerCase();
  if (roleName && empRoleName === roleName) return true;
  if (roleName && empRoleName && (empRoleName.includes(roleName) || roleName.includes(empRoleName))) return true;
  if (roleName && assignedLabel && (assignedLabel.includes(roleName) || roleName.includes(assignedLabel))) return true;
  return false;
};

/** Roles present among admin-assigned project members (for team create pickers) */
export const buildRolesFromAssignedMembers = (members = [], departmentRoles = []) => {
  const roleByKey = new Map();
  members.forEach((emp) => {
    const matched = departmentRoles.find((r) => memberMatchesJobRole(emp, r));
    if (matched) {
      roleByKey.set(String(matched._id), matched);
      return;
    }
    const label = emp.assignedProjectRole || getEmployeeJobRoleName(emp);
    if (label) {
      const key = `label:${label}`;
      if (!roleByKey.has(key)) {
        roleByKey.set(key, { _id: key, name: label, virtual: true });
      }
    }
  });
  return [...roleByKey.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const mergeTeamMemberRecords = (list) => {
  const map = {};
  list.filter(Boolean).forEach((u) => {
    const id = String(u._id);
    const prev = map[id];
    if (!prev) {
      map[id] = u;
      return;
    }
    map[id] = {
      ...prev,
      ...u,
      roleId: u.roleId || prev.roleId,
      hrProfile: { ...(prev.hrProfile || {}), ...(u.hrProfile || {}) },
    };
  });
  return Object.values(map).sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
};

export const defaultMemberRole = (employee, roleNames = []) => {
  const fromRole = getEmployeeJobRoleName(employee);
  if (fromRole && (roleNames.includes(fromRole) || TECH_MEMBER_ROLE_OPTIONS.includes(fromRole))) return fromRole;
  if (roleNames.length) return roleNames[0];
  if (employee?.role === 'technical') return 'Backend Developer';
  return TECH_MEMBER_ROLE_OPTIONS[0];
};

/** Normalize memberRoleLabels from API (Map or plain object) to { userId: roleName } */
export const mapMemberRoleLabels = (source) => {
  const raw = source?.memberRoleLabels ?? source;
  if (!raw) return {};
  if (raw instanceof Map) return Object.fromEntries(raw.entries());
  return { ...raw };
};
