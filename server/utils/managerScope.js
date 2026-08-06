import { inferTeamDepartment } from '../models/StaffRole.js';

export function getManagerDepartmentFromUser(user) {
  const fromTeam = inferTeamDepartment(user?.staffRole);
  if (fromTeam && fromTeam !== 'manager') return fromTeam;
  const deptName = String(user?.departmentName || '').trim().toLowerCase();
  if (deptName.includes('tech')) return 'technical';
  if (deptName.includes('support')) return 'support';
  if (deptName.includes('sale')) return 'sales';
  return 'sales';
}

export function isTechnicalManager(user) {
  if (user?.role !== 'manager') return false;
  if (getManagerDepartmentFromUser(user) === 'technical') return true;
  const teamDept = user?.staffRole?.department;
  if (teamDept === 'technical') return true;
  const code = String(user?.staffRole?.code || '').toLowerCase();
  const name = String(user?.staffRole?.name || '').toLowerCase();
  if (/^(tm|mt|tech)/.test(code) || /\btech/.test(name)) return true;
  return false;
}

export function isSupportManager(user) {
  return user?.role === 'manager' && getManagerDepartmentFromUser(user) === 'support';
}

export function isSupportHandoffAssignee(user) {
  if (!user || user.isActive === false) return false;
  if (user.role === 'support') return true;
  return isSupportManager(user);
}

export function assertAdminOrTechnicalManager(user) {
  if (user?.role === 'admin' || isTechnicalManager(user)) return;
  const err = new Error('Not authorized for this action');
  err.statusCode = 403;
  throw err;
}

export function assertAdminOrSupportManager(user) {
  if (user?.role === 'admin' || isSupportManager(user)) return;
  const err = new Error('Not authorized for this action');
  err.statusCode = 403;
  throw err;
}

export function assertAdminOrTeamManager(user, teamGroup) {
  if (user?.role === 'admin') return;
  if (teamGroup === 'technical' && isTechnicalManager(user)) return;
  if (teamGroup === 'support' && isSupportManager(user)) return;
  if (!teamGroup && (isTechnicalManager(user) || isSupportManager(user))) return;
  const err = new Error('Not authorized for this action');
  err.statusCode = 403;
  throw err;
}

/** Active support department staff for team assignment (customer + technical support) */
export async function getSupportManagerAssignableMemberIds() {
  const User = (await import('../models/User.js')).default;
  const users = await User.find({
    isActive: { $ne: false },
    $or: [
      { role: 'support' },
      {
        role: 'technical',
        $or: [
          { departmentName: { $regex: /support/i } },
          { 'hrProfile.designation': { $regex: /support/i } },
        ],
      },
    ],
  }).distinct('_id');
  return users.map(String);
}

/** Customer follow-ups visible to support manager — all work by support team members */
export async function getSupportTeamFollowupFilter() {
  const Customer = (await import('../models/Customer.js')).default;
  const teamIds = await getSupportManagerAssignableMemberIds();
  if (!teamIds.length) {
    return { workflowStage: 'customer', _id: null };
  }
  const customerIds = await Customer.find({ supportAssignee: { $in: teamIds } }).distinct('_id');
  const or = [
    { createdBy: { $in: teamIds } },
    { assignedTo: { $in: teamIds } },
  ];
  if (customerIds.length) or.push({ customer: { $in: customerIds } });
  return { workflowStage: 'customer', $or: or };
}

/** Customer follow-ups for a support executive — own work + assigned customers */
export async function getSupportPersonFollowupFilter(userId) {
  const Customer = (await import('../models/Customer.js')).default;
  const customerIds = await Customer.find({ supportAssignee: userId }).distinct('_id');
  const or = [{ assignedTo: userId }, { createdBy: userId }];
  if (customerIds.length) or.push({ customer: { $in: customerIds } });
  return { workflowStage: 'customer', $or: or };
}

/** Support working groups managed or created by this support manager */
export function getSupportManagerStaffRoleFilter(userId) {
  return {
    teamGroup: 'support',
    $or: [
      { teamManager: userId },
      { createdBy: userId },
    ],
  };
}

/** Direct-report technical engineers for this manager */
export async function getTechnicalManagerReportIds(userId) {
  const User = (await import('../models/User.js')).default;
  return User.find({ reportsTo: userId, isActive: { $ne: false } }).distinct('_id');
}

/** Staff a technical manager may add to teams: direct reports + admin-assigned project members */
export async function getTechnicalManagerAssignableMemberIds(userId, projectId = null) {
  const Project = (await import('../models/Project.js')).default;
  const reportIds = await getTechnicalManagerReportIds(userId);
  const ids = new Set(reportIds.map(String));

  if (projectId) {
    const projectFilter = await getTechnicalManagerProjectFilter(userId);
    const project = await Project.findOne({ _id: projectId, ...projectFilter })
      .select('assignedTo')
      .lean();
    if (project) {
      (project.assignedTo || []).forEach((id) => ids.add(String(id)));
    }
  } else {
    const projectFilter = await getTechnicalManagerProjectFilter(userId);
    const projects = await Project.find(projectFilter).select('assignedTo').lean();
    projects.forEach((p) => {
      (p.assignedTo || []).forEach((id) => ids.add(String(id)));
    });
  }

  return [...ids];
}

/** Projects this technical manager owns or assigned to their team */
export async function getTechnicalManagerProjectFilter(userId) {
  const reportIds = await getTechnicalManagerReportIds(userId);
  const or = [
    { manager: userId },
    { createdBy: userId },
  ];
  const assigneeIds = [userId, ...reportIds];
  if (assigneeIds.length) {
    or.push({ assignedTo: { $in: assigneeIds } });
  }
  return { $or: or };
}

/** Tasks for this manager's projects and direct reports */
export async function getTechnicalManagerTaskFilter(userId) {
  const reportIds = await getTechnicalManagerReportIds(userId);
  const assigneeIds = [userId, ...reportIds];
  return {
    $or: [
      { technicalManager: userId },
      { createdBy: userId },
      { assignedTo: { $in: assigneeIds } },
    ],
  };
}

/** Milestones on manager's projects or created by them */
export async function getTechnicalManagerMilestoneFilter(userId) {
  const Project = (await import('../models/Project.js')).default;
  const projectFilter = await getTechnicalManagerProjectFilter(userId);
  const projectIds = await Project.find(projectFilter).distinct('_id');
  const or = [
    { technicalManager: userId },
    { createdBy: userId },
  ];
  if (projectIds.length) {
    or.push({ project: { $in: projectIds } });
  }
  return { $or: or };
}

/** Staff teams managed or created by this technical manager */
export function getTechnicalManagerStaffRoleFilter(userId) {
  return {
    teamGroup: 'technical',
    $or: [
      { teamManager: userId },
      { createdBy: userId },
    ],
  };
}

/** Customer IDs linked to this manager's projects */
export async function getTechnicalManagerCustomerIds(userId) {
  const Project = (await import('../models/Project.js')).default;
  const projectFilter = await getTechnicalManagerProjectFilter(userId);
  const ids = await Project.find({ ...projectFilter, customer: { $ne: null } }).distinct('customer');
  return ids.map(String);
}

/** Support / deployment tickets for this manager's projects and team */
export async function getTechnicalManagerTicketFilter(userId) {
  const Project = (await import('../models/Project.js')).default;
  const projectFilter = await getTechnicalManagerProjectFilter(userId);
  const projectIds = await Project.find(projectFilter).distinct('_id');
  const customerIds = await Project.find({ ...projectFilter, customer: { $ne: null } }).distinct('customer');
  const reportIds = await getTechnicalManagerReportIds(userId);
  const assigneeIds = [userId, ...reportIds];
  const or = [
    { createdBy: userId },
    { technicalAssignee: { $in: assigneeIds } },
  ];
  if (projectIds.length) or.push({ project: { $in: projectIds } });
  if (customerIds.length) or.push({ customer: { $in: customerIds } });
  return { $or: or };
}

/** Activities for manager's team and scoped projects/customers */
export async function getTechnicalManagerActivityFilter(userId) {
  const reportIds = await getTechnicalManagerReportIds(userId);
  const Project = (await import('../models/Project.js')).default;
  const projectFilter = await getTechnicalManagerProjectFilter(userId);
  const projectIds = await Project.find(projectFilter).distinct('_id');
  const customerIds = await getTechnicalManagerCustomerIds(userId);
  const or = [{ user: { $in: [userId, ...reportIds] } }];
  if (projectIds.length) or.push({ 'relatedTo.type': 'project', 'relatedTo.id': { $in: projectIds } });
  if (customerIds.length) or.push({ 'relatedTo.type': 'customer', 'relatedTo.id': { $in: customerIds } });
  return { $or: or };
}

/** Communications sent by manager or tied to their project customers */
export async function getTechnicalManagerCommunicationFilter(userId) {
  const customerIds = await getTechnicalManagerCustomerIds(userId);
  const or = [{ user: userId }];
  if (customerIds.length) or.push({ 'relatedTo.type': 'customer', 'relatedTo.id': { $in: customerIds } });
  return { $or: or };
}

/** Documents on manager's projects/customers or uploaded by them */
export async function getTechnicalManagerDocumentFilter(userId) {
  const Project = (await import('../models/Project.js')).default;
  const projectFilter = await getTechnicalManagerProjectFilter(userId);
  const projectIds = await Project.find(projectFilter).distinct('_id');
  const customerIds = await getTechnicalManagerCustomerIds(userId);
  const or = [{ uploadedBy: userId }];
  if (projectIds.length) or.push({ 'relatedTo.type': 'project', 'relatedTo.id': { $in: projectIds } });
  if (customerIds.length) or.push({ 'relatedTo.type': 'customer', 'relatedTo.id': { $in: customerIds } });
  return { $or: or };
}
