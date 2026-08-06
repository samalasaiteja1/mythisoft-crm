import Project from '../models/Project.js';
import {
  isTechnicalManager,
  isSupportManager,
  getTechnicalManagerProjectFilter,
  getTechnicalManagerCustomerIds,
  getTechnicalManagerTicketFilter,
} from './managerScope.js';

export const getCustomerRefId = (user) => {
  if (!user) return null;
  const ref = user.customerRef;
  if (!ref) return null;
  return String(ref._id || ref);
};

export const getCustomerFilterByRole = async (role, userId, user = null) => {
  if (role === 'customer') {
    const customerId = getCustomerRefId(user || { customerRef: null });
    return customerId ? { _id: customerId } : { _id: null };
  }
  switch (role) {
    case 'admin':
      return {};
    case 'manager':
      if (user && isTechnicalManager(user)) {
        const customerIds = await getTechnicalManagerCustomerIds(userId);
        return customerIds.length ? { _id: { $in: customerIds } } : { _id: null };
      }
      return {};
    case 'support': {
      const SupportTicket = (await import('../models/SupportTicket.js')).default;
      const fromProjects = await Project.distinct('customer', {
        $or: [
          { supportExecutiveAssignee: userId },
          { supportTeamAssignees: userId },
        ],
        customer: { $ne: null },
      });
      const fromTickets = await SupportTicket.distinct('customer', {
        supportAssignee: userId,
        customer: { $ne: null },
      });
      const linkedIds = [...new Set([
        ...fromProjects.map(String),
        ...fromTickets.map(String),
      ])];
      const or = [{ supportAssignee: userId }];
      if (linkedIds.length) or.push({ _id: { $in: linkedIds } });
      return { $or: or };
    }
    case 'sales':
      return { $or: [{ assignedTo: userId }, { createdBy: userId }] };
    case 'technical':
      return {};
    default:
      return { assignedTo: userId };
  }
};

export const getLeadFilterByRole = (role, userId) => {
  if (role === 'customer') return { _id: null };
  switch (role) {
    case 'admin':
      return {};
    case 'manager':
      // Full manager scope is applied async in leadController.buildLeadQuery
      return {};
    case 'sales':
      return { $or: [{ assignedTo: userId }, { createdBy: userId }] };
    default:
      return { _id: null };
  }
};

export const getManagerLeadScope = async (userId) => {
  const User = (await import('../models/User.js')).default;
  const reportIds = await User.find({ reportsTo: userId, isActive: { $ne: false } }).distinct('_id');
  const or = [
    { assignedManager: userId },
    { assignedTo: userId },
    { createdBy: userId },
  ];
  if (reportIds.length) or.push({ assignedTo: { $in: reportIds } });
  return { $or: or };
};

export const managerCanAccessLead = async (userId, lead) => {
  if (!lead) return false;
  const User = (await import('../models/User.js')).default;
  if (String(lead.assignedManager) === String(userId)) return true;
  if (String(lead.createdBy) === String(userId)) return true;
  if (lead.assignedTo && String(lead.assignedTo) === String(userId)) return true;
  if (lead.assignedTo) {
    const assignee = await User.findById(lead.assignedTo).select('reportsTo');
    if (assignee && String(assignee.reportsTo) === String(userId)) return true;
  }
  return false;
};

export const findLeadForRole = async (role, userId, leadId) => {
  if (role === 'customer') return null;
  const Lead = (await import('../models/Lead.js')).default;
  const lead = await Lead.findById(leadId);
  if (!lead) return null;
  if (role === 'admin') return lead;
  if (role === 'manager') {
    return managerCanAccessLead(userId, lead) ? lead : null;
  }
  if (role === 'sales') {
    const ownsLead =
      (lead.assignedTo && String(lead.assignedTo) === String(userId)) ||
      (lead.createdBy && String(lead.createdBy) === String(userId));
    return ownsLead ? lead : null;
  }
  return null;
};

export const getDealFilterByRole = (role, userId) => {
  if (role === 'customer') return { _id: null };
  switch (role) {
    case 'admin':
    case 'manager':
      return {};
    case 'sales':
      return { $or: [{ assignedTo: userId }, { createdBy: userId }] };
    default:
      return { _id: null };
  }
};

export const findDealForRole = async (role, userId, dealId) => {
  if (role === 'customer') return null;
  const Deal = (await import('../models/Deal.js')).default;
  const deal = await Deal.findById(dealId);
  if (!deal) return null;
  if (role === 'admin' || role === 'manager') return deal;
  if (role === 'sales') {
    const ownsDeal =
      (deal.assignedTo && String(deal.assignedTo) === String(userId)) ||
      (deal.createdBy && String(deal.createdBy) === String(userId));
    return ownsDeal ? deal : null;
  }
  return null;
};

export const getProjectFilterByRole = async (role, userId, user = null) => {
  if (role === 'customer') {
    const customerId = getCustomerRefId(user);
    return customerId ? { customer: customerId } : { _id: null };
  }
  if (role === 'support') {
    const Customer = (await import('../models/Customer.js')).default;
    const customerIds = await Customer.find({ supportAssignee: userId }).distinct('_id');
    const or = [
      { supportAssignee: userId },
      { supportExecutiveAssignee: userId },
      { supportTeamAssignees: userId },
    ];
    if (customerIds.length) or.push({ customer: { $in: customerIds } });
    return { $or: or };
  }
  switch (role) {
    case 'admin':
      return {};
    case 'manager':
      if (user && isTechnicalManager(user)) {
        return await getTechnicalManagerProjectFilter(userId);
      }
      if (user && isSupportManager(user)) {
        return {
          $or: [
            { supportAssignee: userId },
            { supportHandoffBy: userId },
          ],
        };
      }
      return {};
    case 'sales':
      return {};
    case 'technical':
      return {
        $or: [
          { assignedTo: userId },
          { manager: userId },
          { createdBy: userId },
        ],
      };
    default:
      return {};
  }
};

export const getTicketFilterByRole = async (role, user, userId) => {
  if (role === 'customer') {
    const customerId = getCustomerRefId(user);
    return customerId ? { customer: customerId } : { _id: null };
  }
  if (role === 'support') {
    return { supportAssignee: userId };
  }
  if (role === 'manager' && user && isTechnicalManager(user)) {
    return await getTechnicalManagerTicketFilter(userId);
  }
  if (role === 'technical') {
    return {
      $or: [
        { technicalAssignee: userId },
        { createdBy: userId },
      ],
    };
  }
  return {};
};

export const getInvoiceFilterByRole = (role, user) => {
  if (role === 'customer') {
    const customerId = getCustomerRefId(user);
    return customerId ? { customer: customerId } : { _id: null };
  }
  return {};
};

export const getMeetingFilterByRole = (role, userId, user = null) => {
  if (role === 'customer') {
    const customerId = getCustomerRefId(user);
    return customerId ? { customer: customerId } : { _id: null };
  }
  switch (role) {
    case 'admin':
    case 'manager':
      return {};
    case 'sales':
      return { $or: [{ assignedTo: userId }, { createdBy: userId }] };
    default:
      return { assignedTo: userId };
  }
};

export const canAccessCustomer = async (role, userId, customerId, user = null) => {
  if (!customerId) return true;
  if (role === 'customer') {
    return String(customerId) === getCustomerRefId(user);
  }
  const Customer = (await import('../models/Customer.js')).default;
  if (role === 'manager' && user && isTechnicalManager(user)) {
    const roleFilter = await getCustomerFilterByRole(role, userId, user);
    return Boolean(await Customer.findOne({ _id: customerId, ...roleFilter }));
  }
  if (role === 'admin' || role === 'manager' || role === 'support' || role === 'technical') {
    return Boolean(await Customer.findById(customerId));
  }
  const filter = { _id: customerId, ...(await getCustomerFilterByRole(role, userId, user)) };
  if (role === 'sales') {
    return Boolean(await Customer.findOne({
      _id: customerId,
      $or: [{ assignedTo: userId }, { createdBy: userId }],
    }));
  }
  return Boolean(await Customer.findOne(filter));
};

export const getCustomerIdsForProjects = async (role, userId, user = null) => {
  const filter = await getCustomerFilterByRole(role, userId, user);
  const Customer = (await import('../models/Customer.js')).default;

  if (role === 'technical') {
    const projectCustomerIds = await Project.distinct('customer', {
      $or: [{ assignedTo: userId }, { manager: userId }, { createdBy: userId }],
      customer: { $ne: null },
    });
    if (projectCustomerIds.length) {
      return { _id: { $in: projectCustomerIds } };
    }
  }

  return filter;
};

export const findProjectForRole = async (role, userId, projectId, user = null) => {
  if (role === 'customer') {
    const customerId = getCustomerRefId(user);
    if (!customerId) return null;
    return Project.findOne({ _id: projectId, customer: customerId });
  }
  if (role === 'admin' || role === 'support' || role === 'sales') {
    return Project.findById(projectId);
  }
  if (role === 'manager') {
    if (user && isTechnicalManager(user)) {
      const roleFilter = await getTechnicalManagerProjectFilter(userId);
      return Project.findOne({ _id: projectId, ...roleFilter });
    }
    return Project.findById(projectId);
  }
  if (role === 'technical') {
    const roleFilter = await getProjectFilterByRole(role, userId, user);
    return Project.findOne({ _id: projectId, ...roleFilter });
  }
  return Project.findById(projectId);
};
