import User from '../models/User.js';
import Deal from '../models/Deal.js';
import Task from '../models/Task.js';
import SupportTicket from '../models/SupportTicket.js';
import Department from '../models/Department.js';
import { asyncHandler } from '../utils/helpers.js';
import { isTechnicalManager, getTechnicalManagerReportIds, getTechnicalManagerTaskFilter, getTechnicalManagerTicketFilter } from '../utils/managerScope.js';

export const getPerformance = asyncHandler(async (req, res) => {
  if (isTechnicalManager(req.user)) {
    const userId = req.user._id;
    const reportIds = await getTechnicalManagerReportIds(userId);
    const memberIds = [userId, ...reportIds];
    const taskFilter = await getTechnicalManagerTaskFilter(userId);
    const ticketFilter = await getTechnicalManagerTicketFilter(userId);

    const [employees, taskStats, ticketStats] = await Promise.all([
      User.find({ _id: { $in: reportIds }, isActive: true })
        .select('firstName lastName email role departmentName team')
        .sort('firstName'),
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$assignedTo', pending: { $sum: { $cond: [{ $in: ['$status', ['new', 'pending', 'in_progress']] }, 1, 0] } }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, pending: 1, completed: 1 } },
      ]),
      SupportTicket.aggregate([
        { $match: { ...ticketFilter, category: 'bug' } },
        { $group: { _id: '$technicalAssignee', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ['$technicalStatus', ['resolved', 'closed']] }, 1, 0] } } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, total: 1, resolved: 1 } },
      ]),
    ]);

    return res.json({
      employees,
      salesPerformance: [],
      departmentStats: [],
      supportStats: ticketStats,
      taskStats,
      scopedTo: memberIds.length,
    });
  }

  const [employees, salesPerformance, departmentStats, supportStats] = await Promise.all([
    User.find({ isActive: true, role: { $ne: 'admin' } })
      .select('firstName lastName email role departmentName team')
      .sort('firstName'),
    Deal.aggregate([
      { $match: { stage: 'closed_won' } },
      { $group: { _id: '$assignedTo', totalDeals: { $sum: 1 }, totalRevenue: { $sum: '$value' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, role: '$user.role', totalDeals: 1, totalRevenue: 1 } },
      { $sort: { totalRevenue: -1 } },
    ]),
    Department.find({ isActive: true }).populate('manager', 'firstName lastName'),
    SupportTicket.aggregate([
      { $group: { _id: '$supportAssignee', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, total: 1, resolved: 1 } },
    ]),
  ]);

  const taskStats = await Task.aggregate([
    { $group: { _id: '$assignedTo', pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, pending: 1, completed: 1 } },
  ]);

  res.json({ employees, salesPerformance, departmentStats, supportStats, taskStats });
});
