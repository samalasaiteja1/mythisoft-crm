import { inferTeamDepartment } from './roleContext';

const formatName = (user) => {
  if (!user) return '';
  if (typeof user === 'string') return user;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
};

export const isTechnicalManagerUser = (user) => {
  if (!user || user.role !== 'manager') return false;
  const dept = inferTeamDepartment(user.staffRole);
  const deptName = String(user.departmentName || '').toLowerCase();
  return dept === 'technical' || deptName.includes('tech');
};

/** @returns {{ status: 'none'|'tech_manager'|'tech', label: string }} */
export const getCustomerTechAssignmentDisplay = (customer, techAssignmentFromApi) => {
  if (techAssignmentFromApi?.status) return techAssignmentFromApi;

  const assigned = customer?.assignedTo;
  if (assigned && typeof assigned === 'object') {
    if (assigned.role === 'technical') {
      return { status: 'tech', label: formatName(assigned) };
    }
    if (isTechnicalManagerUser(assigned)) {
      return { status: 'tech_manager', label: formatName(assigned) };
    }
  }

  return { status: 'none', label: '' };
};

export const TECH_ASSIGNMENT_COPY = {
  none: 'Not assigned to tech',
  tech_manager: 'Assigned to tech manager',
  tech: 'Assigned to tech person',
};

/** Project list / detail — uses project.manager + project.assignedTo */
export const getProjectTechAssignmentDisplay = (project) => {
  const manager = project?.manager;
  if (manager) {
    const isObj = typeof manager === 'object';
    if (!isObj || !manager.role || isTechnicalManagerUser(manager)) {
      return { status: 'tech_manager', label: formatName(manager) };
    }
  }

  const projectTech = (project?.assignedTo || [])
    .filter((u) => u && (typeof u !== 'object' || u.role === 'technical' || !u.role));
  if (projectTech.length) {
    return { status: 'tech', label: projectTech.map(formatName).filter(Boolean).join(', ') };
  }

  return { status: 'none', label: '' };
};
