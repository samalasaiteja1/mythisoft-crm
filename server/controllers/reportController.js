import Lead from '../models/Lead.js';
import Deal from '../models/Deal.js';
import Customer from '../models/Customer.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import SupportTicket from '../models/SupportTicket.js';
import { asyncHandler } from '../utils/helpers.js';
import { getLeadFilterByRole, getDealFilterByRole } from '../utils/roleFilters.js';
import {
  isTechnicalManager,
  getTechnicalManagerProjectFilter,
  getTechnicalManagerTaskFilter,
  getTechnicalManagerTicketFilter,
} from '../utils/managerScope.js';

export const getReports = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const user = req.user;

  if (isTechnicalManager(user)) {
    const [projectFilter, taskFilter, ticketFilter] = await Promise.all([
      getTechnicalManagerProjectFilter(userId),
      getTechnicalManagerTaskFilter(userId),
      getTechnicalManagerTicketFilter(userId),
    ]);
    const [projectsByStatus, tasksByStatus, ticketSummary, totalProjects, activeProjects, completedProjects] = await Promise.all([
      Project.aggregate([{ $match: projectFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: taskFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      SupportTicket.aggregate([
        { $match: ticketFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Project.countDocuments(projectFilter),
      Project.countDocuments({ ...projectFilter, status: { $in: ['development', 'code_review', 'testing', 'planning', 'new'] } }),
      Project.countDocuments({ ...projectFilter, status: { $in: ['completed', 'delivered'] } }),
    ]);
    return res.json({
      role: 'technical-manager',
      summary: { totalProjects, activeProjects, completedProjects },
      projectsByStatus,
      tasksByStatus,
      ticketSummary,
      generatedAt: new Date(),
    });
  }

  const leadFilter = role === 'sales' ? getLeadFilterByRole(role, userId) : {};
  const dealFilter = role === 'sales' ? getDealFilterByRole(role, userId) : {};

  const [leads, deals, customers, projects, tickets] = await Promise.all([
    Lead.countDocuments(leadFilter),
    Deal.countDocuments(dealFilter),
    Customer.countDocuments(role === 'sales' ? { assignedTo: userId } : {}),
    Project.countDocuments(role === 'technical' ? { assignedTo: userId } : {}),
    SupportTicket.countDocuments(role === 'support' ? { supportAssignee: userId } : role === 'technical' ? { technicalAssignee: userId } : {}),
  ]);

  res.json({
    summary: { leads, deals, customers, projects, tickets },
    role,
    generatedAt: new Date(),
  });
});

export const getSalesReport = getReports;
export const getLeadReport = getReports;
export const getProjectReport = getReports;
