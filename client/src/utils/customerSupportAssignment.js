import { inferTeamDepartment } from './roleContext';

const formatName = (user) => {
  if (!user) return '';
  if (typeof user === 'string') return user;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
};

export const isSupportManagerUser = (user) => {
  if (!user || user.role !== 'manager') return false;
  const dept = inferTeamDepartment(user.staffRole);
  const deptName = String(user.departmentName || '').toLowerCase();
  return dept === 'support' || deptName.includes('support');
};

/** @returns {{ status: 'none'|'support_manager'|'support', label: string }} */
export const getCustomerSupportAssignmentDisplay = (customer, supportAssignmentFromApi) => {
  if (supportAssignmentFromApi?.status) return supportAssignmentFromApi;

  const supportOnCustomer = customer?.supportAssignee;
  if (supportOnCustomer && typeof supportOnCustomer === 'object') {
    return { status: 'support', label: formatName(supportOnCustomer) };
  }

  const assigned = customer?.assignedTo;
  if (assigned && typeof assigned === 'object') {
    if (assigned.role === 'support') {
      return { status: 'support', label: formatName(assigned) };
    }
    if (isSupportManagerUser(assigned)) {
      return { status: 'support_manager', label: formatName(assigned) };
    }
  }

  return { status: 'none', label: '' };
};

export const SUPPORT_ASSIGNMENT_COPY = {
  none: 'Not assigned to support',
  support_manager: 'Assigned to support manager',
  support: 'Assigned to support',
};
