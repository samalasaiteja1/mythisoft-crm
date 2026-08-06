import { inferTeamDepartment } from '../models/StaffRole.js';

const formatName = (user) => {
  if (!user) return '';
  if (typeof user === 'string') return user;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
};

export const isTechnicalManager = (user) => {
  if (!user || user.role !== 'manager') return false;
  const dept = inferTeamDepartment(user.staffRole);
  const deptName = String(user.departmentName || '').toLowerCase();
  return dept === 'technical' || deptName.includes('tech');
};

export const isSupportManager = (user) => {
  if (!user || user.role !== 'manager') return false;
  const dept = inferTeamDepartment(user.staffRole);
  const deptName = String(user.departmentName || '').toLowerCase();
  return dept === 'support' || deptName.includes('support');
};

/** @returns {{ status: 'none'|'tech_manager'|'tech', label: string }} */
export const getCustomerTechAssignment = (customer, project = null) => {
  if (project?.manager && isTechnicalManager(project.manager)) {
    return { status: 'tech_manager', label: formatName(project.manager) };
  }

  const projectTech = (project?.assignedTo || [])
    .filter((u) => u && (typeof u === 'object' ? u.role === 'technical' : false));
  if (projectTech.length) {
    return { status: 'tech', label: projectTech.map(formatName).filter(Boolean).join(', ') };
  }

  const assigned = customer?.assignedTo;
  if (assigned && typeof assigned === 'object') {
    if (assigned.role === 'technical') {
      return { status: 'tech', label: formatName(assigned) };
    }
    if (isTechnicalManager(assigned)) {
      return { status: 'tech_manager', label: formatName(assigned) };
    }
  }

  return { status: 'none', label: '' };
};

export const customerHasTechAssignment = (customer, project = null) =>
  getCustomerTechAssignment(customer, project).status !== 'none';

/** Primary technical contact for customer portal (manager or engineer on latest project). */
export const getTechnicalContactFromProject = (project) => {
  if (!project) return null;
  if (project.manager && isTechnicalManager(project.manager)) {
    return typeof project.manager === 'object' ? project.manager : null;
  }
  const tech = (project.assignedTo || []).find((u) => u && u.role === 'technical');
  return tech || null;
};

/** Resolve customer IDs assigned to the technical team (manager or engineers on project, or customer assignee). */
export const getTechAssignedCustomerIdList = async () => {
  const User = (await import('../models/User.js')).default;
  const Project = (await import('../models/Project.js')).default;
  const Customer = (await import('../models/Customer.js')).default;

  const managers = await User.find({ role: 'manager', isActive: { $ne: false } })
    .select('_id departmentName staffRole')
    .populate('staffRole', 'name code teamGroup department')
    .lean();

  const techManagerIds = managers.filter(isTechnicalManager).map((m) => m._id);
  const technicalUserIds = await User.distinct('_id', { role: 'technical', isActive: { $ne: false } });
  const assigneeIds = [...new Set([...techManagerIds, ...technicalUserIds].map(String))];

  const projectOr = [];
  if (techManagerIds.length) projectOr.push({ manager: { $in: techManagerIds } });
  if (technicalUserIds.length) projectOr.push({ assignedTo: { $in: technicalUserIds } });

  const customerIdsFromProjects = projectOr.length
    ? await Project.distinct('customer', { $or: projectOr })
    : [];

  const customerIdsFromAssignee = assigneeIds.length
    ? await Customer.distinct('_id', { assignedTo: { $in: assigneeIds } })
    : [];

  return [...new Set([...customerIdsFromProjects, ...customerIdsFromAssignee].map(String))];
};

export const buildTechAssignedSegmentFilter = async () => {
  const ids = await getTechAssignedCustomerIdList();
  return { _id: { $in: ids } };
};

export const buildTechUnassignedSegmentFilter = async () => {
  const ids = await getTechAssignedCustomerIdList();
  if (!ids.length) return {};
  return { _id: { $nin: ids } };
};

/** @returns {{ status: 'none'|'support_manager'|'support', label: string }} */
export const getCustomerSupportAssignment = (customer, project = null) => {
  const executive = project?.supportExecutiveAssignee;
  if (executive && typeof executive === 'object') {
    return { status: 'support', label: formatName(executive) };
  }

  const supportOnProject = project?.supportAssignee;
  if (supportOnProject) {
    if (typeof supportOnProject === 'object') {
      if (supportOnProject.role === 'support') {
        return { status: 'support', label: formatName(supportOnProject) };
      }
      if (isSupportManager(supportOnProject)) {
        return { status: 'support_manager', label: formatName(supportOnProject) };
      }
    }
    return { status: 'support', label: formatName(supportOnProject) };
  }

  const supportOnCustomer = customer?.supportAssignee;
  if (supportOnCustomer && typeof supportOnCustomer === 'object') {
    return { status: 'support', label: formatName(supportOnCustomer) };
  }

  const assigned = customer?.assignedTo;
  if (assigned && typeof assigned === 'object') {
    if (assigned.role === 'support') {
      return { status: 'support', label: formatName(assigned) };
    }
    if (isSupportManager(assigned)) {
      return { status: 'support_manager', label: formatName(assigned) };
    }
  }

  return { status: 'none', label: '' };
};

export const customerHasSupportAssignment = (customer, project = null) =>
  getCustomerSupportAssignment(customer, project).status !== 'none';

/** Resolve customer IDs assigned to the support team. */
export const getSupportAssignedCustomerIdList = async () => {
  const User = (await import('../models/User.js')).default;
  const Project = (await import('../models/Project.js')).default;
  const Customer = (await import('../models/Customer.js')).default;

  const managers = await User.find({ role: 'manager', isActive: { $ne: false } })
    .select('_id departmentName staffRole')
    .populate('staffRole', 'name code teamGroup department')
    .lean();

  const supportManagerIds = managers.filter(isSupportManager).map((m) => m._id);
  const supportUserIds = await User.distinct('_id', { role: 'support', isActive: { $ne: false } });
  const assigneeIds = [...new Set([...supportManagerIds, ...supportUserIds].map(String))];

  const customerIdsFromSupportField = supportUserIds.length
    ? await Customer.distinct('_id', { supportAssignee: { $in: supportUserIds } })
    : [];

  const customerIdsFromProjects = supportUserIds.length
    ? await Project.distinct('customer', {
      $or: [
        { supportAssignee: { $in: supportUserIds } },
        { supportExecutiveAssignee: { $in: supportUserIds } },
        { supportTeamAssignees: { $in: supportUserIds } },
      ],
      customer: { $ne: null },
    })
    : [];

  const customerIdsFromAssignee = assigneeIds.length
    ? await Customer.distinct('_id', { assignedTo: { $in: assigneeIds } })
    : [];

  return [...new Set([
    ...customerIdsFromSupportField,
    ...customerIdsFromProjects,
    ...customerIdsFromAssignee,
  ].map(String))];
};

export const buildSupportAssignedSegmentFilter = async () => {
  const ids = await getSupportAssignedCustomerIdList();
  return { _id: { $in: ids } };
};

export const buildSupportUnassignedSegmentFilter = async () => {
  const ids = await getSupportAssignedCustomerIdList();
  if (!ids.length) return {};
  return { _id: { $nin: ids } };
};