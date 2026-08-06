import Lead from '../models/Lead.js';
import Customer from '../models/Customer.js';
import Deal from '../models/Deal.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import Communication from '../models/Communication.js';
import Note from '../models/Note.js';
import Notification from '../models/Notification.js';
import SupportTicket from '../models/SupportTicket.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Project from '../models/Project.js';
import Quotation from '../models/Quotation.js';
import Meeting from '../models/Meeting.js';
import Followup from '../models/Followup.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Subscription from '../models/Subscription.js';
import StaffRole from '../models/StaffRole.js';
import Document from '../models/Document.js';
import SupportProjectTask from '../models/SupportProjectTask.js';
import { ACTIVE_PROJECT_STATUSES } from '../constants/projectStatuses.js';
import { inferTeamDepartment } from '../models/StaffRole.js';
import { asyncHandler } from '../utils/helpers.js';

function getManagerDepartmentFromUser(user) {
  const fromTeam = inferTeamDepartment(user?.staffRole);
  if (fromTeam && fromTeam !== 'manager') return fromTeam;
  const deptName = String(user?.departmentName || '').trim().toLowerCase();
  if (deptName.includes('tech')) return 'technical';
  if (deptName.includes('support')) return 'support';
  if (deptName.includes('sale')) return 'sales';
  return 'sales';
}
import { sendCrmEmail } from '../utils/sendEmail.js';
import { sendCrmSms } from '../utils/sendSms.js';
import { logActivity } from '../controllers/authController.js';
import { getLeadFilterByRole, getCustomerFilterByRole, getCustomerRefId, getManagerLeadScope } from '../utils/roleFilters.js';
import { getTechnicalContactFromProject } from '../utils/customerTechAssignment.js';
import {
  getTechnicalManagerReportIds,
  getTechnicalManagerProjectFilter,
  getTechnicalManagerTaskFilter,
  getTechnicalManagerStaffRoleFilter,
  getTechnicalManagerTicketFilter,
  getTechnicalManagerActivityFilter,
  getTechnicalManagerCommunicationFilter,
  isTechnicalManager,
  getSupportTeamFollowupFilter,
  getSupportPersonFollowupFilter,
} from '../utils/managerScope.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const userId = req.user._id;

  if (role === 'customer') {
    let customerId = getCustomerRefId(req.user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!customerId) {
      const linkedCustomer = await Customer.findOne({ portalUser: req.user._id }).select('_id').lean();
      customerId = linkedCustomer?._id ? String(linkedCustomer._id) : null;
    }

    if (!customerId) {
      return res.json({
        role,
        stats: {},
        roleStats: { customer: {} },
        leadsByStatus: {},
        pipelineByStage: [],
        dealStats: [],
        recentActivities: [],
        calendarEvents: [],
        customerOverview: null,
      });
    }

    const customer = await Customer.findById(customerId)
      .populate('company', 'name')
      .populate('supportAssignee', 'firstName lastName email phone avatar role')
      .lean();
    const [projects, tickets, invoices, recentTickets, projectStatusStats, projectPipelineStats, dealPipelineStats, dealIds, ticketIds, leads, deals] = await Promise.all([
      Project.find({ customer: customerId })
        .populate('manager', 'firstName lastName email phone avatar role')
        .populate('supportAssignee', 'firstName lastName email phone avatar role')
        .populate('supportExecutiveAssignee', 'firstName lastName email phone avatar role')
        .populate('category', 'name')
        .select('name status workflowStage budget endDate startDate deliveredAt updatedAt manager supportAssignee supportExecutiveAssignee supportReviewStatus supportHandoffAt submittedToCustomerAt technologyStack category deliveryChecklist')
        .sort('-updatedAt')
        .lean(),
      SupportTicket.countDocuments({ customer: customerId }),
      Invoice.find({ customer: customerId }).select('invoiceNumber total status amountPaid dueDate').sort('-createdAt').lean(),
      SupportTicket.find({ customer: customerId, requestKind: { $ne: 'change_request' } })
        .select('ticketNumber subject status priority updatedAt')
        .sort('-updatedAt')
        .limit(5)
        .lean(),
      Project.aggregate([
        { $match: { customer: customerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: { customer: customerId } },
        { $group: { _id: '$workflowStage', count: { $sum: 1 } } },
      ]),
      Deal.aggregate([
        { $match: { customer: customerId } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
      Deal.find({ customer: customerId }).distinct('_id'),
      SupportTicket.find({ customer: customerId }).distinct('_id'),
      Lead.find({ portalUser: userId })
        .populate('assignedManager', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .select('firstName lastName email phone company title industry status workflowStage value budget score priority source assignedManager assignedTo createdAt updatedAt')
        .sort('-updatedAt')
        .limit(5)
        .lean(),
      Deal.find({ customer: customerId })
        .populate('assignedManager', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .select('title value currency stage probability expectedCloseDate actualCloseDate assignedManager assignedTo createdAt updatedAt')
        .sort('-updatedAt')
        .limit(5)
        .lean(),
    ]);

    const projectIds = projects.map((p) => p._id);
    const invoiceIds = invoices.map((i) => i._id);

    const activityOr = [
      { 'relatedTo.type': 'customer', 'relatedTo.id': customerId },
      ...(projectIds.length ? [{ 'relatedTo.type': 'project', 'relatedTo.id': { $in: projectIds } }] : []),
      ...(ticketIds.length ? [{ 'relatedTo.type': 'ticket', 'relatedTo.id': { $in: ticketIds } }] : []),
      ...(invoiceIds.length ? [{ 'relatedTo.type': 'invoice', 'relatedTo.id': { $in: invoiceIds } }] : []),
      ...(dealIds.length ? [{ 'relatedTo.type': 'deal', 'relatedTo.id': { $in: dealIds } }] : []),
    ];

    const [recentActivities, meetings, followups, recentNotifications] = await Promise.all([
      activityOr.length
        ? Activity.find({ $or: activityOr })
          .populate('user', 'firstName lastName avatar')
          .sort('-createdAt')
          .limit(10)
          .lean()
        : [],
      Meeting.find({ customer: customerId, scheduledAt: { $gte: today }, status: 'scheduled' })
        .sort('scheduledAt')
        .limit(8)
        .lean(),
      Followup.find({
        customer: customerId,
        scheduledAt: { $gte: today },
        status: { $in: ['scheduled', 'pending', 'awaiting_customer_response', 'in_progress'] },
      })
        .sort('scheduledAt')
        .limit(8)
        .lean(),
      Notification.find({ user: userId })
        .sort('-createdAt')
        .limit(5)
        .lean(),
    ]);

    const projectMilestones = projects
      .filter((p) => p.endDate && new Date(p.endDate) >= today)
      .map((p) => ({
        type: 'milestone',
        title: `${p.name} — target date`,
        scheduledAt: p.endDate,
      }));

    const invoiceDueEvents = invoices
      .filter((inv) => inv.dueDate && !['paid', 'cancelled'].includes(inv.status) && new Date(inv.dueDate) >= today)
      .map((inv) => ({
        type: 'invoice',
        title: `Invoice ${inv.invoiceNumber} due`,
        scheduledAt: inv.dueDate,
      }));

    const calendarEvents = [
      ...meetings.map((m) => ({ type: 'meeting', title: m.title, scheduledAt: m.scheduledAt, meetingType: m.type })),
      ...followups.map((f) => ({ type: 'followup', title: f.title, scheduledAt: f.scheduledAt, activityType: f.activityType })),
      ...projectMilestones,
      ...invoiceDueEvents,
    ]
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
      .slice(0, 12);

    const leadsByStatus = projectStatusStats.reduce((acc, s) => {
      if (s._id) acc[s._id] = s.count;
      return acc;
    }, {});

    if (!Object.keys(leadsByStatus).length && ticketIds.length) {
      const ticketStatusStats = await SupportTicket.aggregate([
        { $match: { customer: customerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      ticketStatusStats.forEach((s) => {
        if (s._id) leadsByStatus[s._id] = s.count;
      });
    }

    const pipelineByStage = projectPipelineStats.length
      ? projectPipelineStats
      : dealPipelineStats;

    const openTickets = await SupportTicket.countDocuments({
      customer: customerId,
      status: { $in: ['open', 'assigned', 'working', 'waiting_customer'] },
      requestKind: { $ne: 'change_request' },
    });
    const waitingOnCustomerTickets = await SupportTicket.countDocuments({
      customer: customerId,
      status: 'waiting_customer',
      requestKind: { $ne: 'change_request' },
    });
    const ticketsAwaitingConfirmation = await SupportTicket.countDocuments({
      customer: customerId,
      status: { $in: ['waiting_customer', 'resolved'] },
      requestKind: { $ne: 'change_request' },
    });
    const ticketsInProgress = await SupportTicket.countDocuments({
      customer: customerId,
      status: { $in: ['assigned', 'accepted', 'working'] },
      requestKind: { $ne: 'change_request' },
    });
    const closedTickets = await SupportTicket.countDocuments({
      customer: customerId,
      status: 'closed',
      requestKind: { $ne: 'change_request' },
    });
    const pendingChangeRequests = await SupportTicket.countDocuments({
      customer: customerId,
      requestKind: 'change_request',
      status: { $in: ['open', 'assigned', 'working', 'waiting_customer'] },
    });
    const recentChangeRequests = await SupportTicket.find({
      customer: customerId,
      requestKind: 'change_request',
    })
      .select('ticketNumber subject status priority updatedAt changeScope')
      .sort('-updatedAt')
      .limit(4)
      .lean();
    const actionTickets = await SupportTicket.find({
      customer: customerId,
      status: { $in: ['waiting_customer', 'resolved'] },
      requestKind: { $ne: 'change_request' },
    })
      .populate('project', 'name')
      .select('ticketNumber subject status priority updatedAt project')
      .sort('-updatedAt')
      .limit(6)
      .lean();
    const unreadNotifications = await Notification.countDocuments({ user: userId, isRead: { $ne: true } });
    const completedProjects = projects.filter((p) => ['completed', 'delivered'].includes(p.status)).length;
    const activeProjects = projects.filter((p) => !['completed', 'cancelled', 'delivered'].includes(p.status)).length;
    const awaitingAcceptance = projects.filter((p) => {
      if (p.deliveryChecklist?.clientAcceptance) return false;
      if (p.supportReviewStatus === 'submitted_to_customer' || p.submittedToCustomerAt) return true;
      if (p.supportHandoffAt) return true;
      if (['in_support', 'closed', 'verified', 'support_active'].includes(p.supportReviewStatus)) return true;
      if (['delivered', 'support', 'completed'].includes(p.workflowStage)) return true;
      if (['delivered', 'completed'].includes(p.status)) return true;
      return false;
    }).length;
    const inSupportProjects = projects.filter((p) =>
      ['in_support', 'support_active', 'submitted_to_customer', 'support_tasks_in_progress'].includes(p.supportReviewStatus),
    ).length;
    const pendingInvoices = invoices.filter((i) => ['sent', 'partially_paid', 'overdue'].includes(i.status)).length;
    const totalDue = invoices
      .filter((i) => !['paid', 'cancelled'].includes(i.status))
      .reduce((sum, i) => sum + Math.max(0, (i.total || 0) - (i.amountPaid || 0)), 0);

    const pendingAcceptanceProjects = projects.filter((p) => {
      if (p.deliveryChecklist?.clientAcceptance) return false;
      if (p.supportReviewStatus === 'submitted_to_customer' || p.submittedToCustomerAt) return true;
      return false;
    });

    return res.json({
      role,
      stats: {
        totalProjects: projects.length,
        activeProjects,
        completedProjects,
        openTickets,
        closedTickets,
        pendingChangeRequests,
        pendingInvoices,
        totalDue,
        unreadNotifications,
        awaitingAcceptance,
        waitingOnCustomerTickets,
        ticketsAwaitingConfirmation,
        ticketsInProgress,
        inSupportProjects,
      },
      roleStats: {
        customer: {
          totalProjects: projects.length,
          activeProjects,
          completedProjects,
          openTickets,
          closedTickets,
          pendingChangeRequests,
          pendingInvoices,
          totalDue,
          unreadNotifications,
          awaitingAcceptance,
          waitingOnCustomerTickets,
          ticketsAwaitingConfirmation,
          ticketsInProgress,
          inSupportProjects,
        },
      },
      leadsByStatus,
      pipelineByStage,
      dealStats: [],
      recentActivities,
      calendarEvents,
      customerOverview: {
        customer,
        projects,
        invoices,
        recentTickets,
        recentNotifications,
        recentChangeRequests,
        actionTickets,
        pendingAcceptanceProjects,
        leads,
        deals,
        technicalContact: getTechnicalContactFromProject(projects.find((p) => p.manager) || projects[0]),
        supportExecutiveContact: projects.find((p) => p.supportExecutiveAssignee)?.supportExecutiveAssignee
          || customer.supportAssignee,
      },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalCustomers,
    totalLeads,
    qualifiedLeads,
    totalDeals,
    activeDeals,
    pendingTasks,
    recentActivities,
    leadStats,
    dealStats,
    monthlyRevenue,
    openTickets,
    pendingInvoices,
    totalProjects,
    pendingQuotations,
    todayMeetings,
    totalExpenses,
    totalUsers,
  ] = await Promise.all([
    Customer.countDocuments(),
    Lead.countDocuments(),
    Lead.countDocuments({ $or: [{ isQualified: true }, { status: 'qualified' }] }),
    Deal.countDocuments(),
    Deal.countDocuments({ stage: { $nin: ['won', 'lost', 'closed_won', 'closed_lost', 'converted_to_customer'] } }),
    Task.countDocuments({ status: { $in: ['new', 'pending', 'in_progress'] } }),
    Activity.find().populate('user', 'firstName lastName avatar').sort('-createdAt').limit(10),
    Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Deal.aggregate([
      { $match: { stage: { $in: ['closed_won', 'won', 'converted_to_customer'] } } },
      { $group: { _id: { $month: '$actualCloseDate' }, revenue: { $sum: '$value' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Deal.aggregate([
      { $match: { stage: { $in: ['closed_won', 'won', 'converted_to_customer'] } } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]),
    SupportTicket.countDocuments({ status: { $in: ['open', 'assigned', 'working', 'waiting_customer'] } }),
    Invoice.countDocuments({ status: { $in: ['sent', 'partially_paid', 'overdue'] } }),
    Project.countDocuments({ status: { $in: [...ACTIVE_PROJECT_STATUSES, 'new', 'planning'] } }),
    Quotation.countDocuments({ status: { $in: ['draft', 'sent'] } }),
    Meeting.countDocuments({ scheduledAt: { $gte: today, $lt: tomorrow }, status: 'scheduled' }),
    Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    User.countDocuments({ isActive: true }),
  ]);

  const leadsByStatus = leadStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
  const totalRevenue = monthlyRevenue[0]?.total || 0;
  const expenseTotal = totalExpenses[0]?.total || 0;

  const resolvedTickets = await SupportTicket.find({ resolvedAt: { $exists: true } }).select('createdAt resolvedAt').lean();
  let avgResponseTimeHours = 0;
  if (resolvedTickets.length > 0) {
    const totalHours = resolvedTickets.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)) / 3600000, 0);
    avgResponseTimeHours = Math.round(totalHours / resolvedTickets.length);
  }
  const slaOnTrack = await SupportTicket.countDocuments({
    status: { $nin: ['resolved', 'closed'] },
    $or: [{ slaDeadline: { $gte: new Date() } }, { slaDeadline: { $exists: false } }],
  });
  const slaBreached = await SupportTicket.countDocuments({
    status: { $nin: ['resolved', 'closed'] },
    slaDeadline: { $lt: new Date() },
  });
  const customerRatingAvg = (await SupportTicket.aggregate([
    { $match: { rating: { $exists: true, $ne: null } } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]))[0]?.avg || 0;

  const pipelineByStage = await Deal.aggregate([
    { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
  ]);

  const roleStats = {
    admin: {
      totalEmployees: await User.countDocuments({ role: { $ne: 'admin' }, isActive: { $ne: false } }),
      managerCount: await User.countDocuments({ role: 'manager', isActive: { $ne: false } }),
      salesCount: await User.countDocuments({ role: 'sales', isActive: { $ne: false } }),
      technicalCount: await User.countDocuments({ role: 'technical', isActive: { $ne: false } }),
      supportCount: await User.countDocuments({ role: 'support', isActive: { $ne: false } }),
      totalUsers, openTickets, pendingInvoices, totalProjects, pendingQuotations,
      qualifiedLeads, activeDeals, teamPerformance: totalUsers > 0 ? 78 : 0,
      pendingPayments: pendingInvoices,
      paidInvoices: await Invoice.countDocuments({ status: 'paid' }),
      monthlyIncome: (await Payment.aggregate([
        { $match: { status: 'completed', paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]))[0]?.total || 0,
      expenses: expenseTotal,
      profit: totalRevenue - expenseTotal,
    },
    manager: {
      totalRevenue,
      totalProjects,
      pendingTasks,
      pendingApprovals: pendingQuotations,
      monthlySales: await Lead.countDocuments({ status: 'won', updatedAt: { $gte: monthStart } }),
      totalEmployees: totalUsers,
      presentToday: await (await import('../models/Attendance.js')).default.countDocuments({
        date: { $gte: today },
        status: 'present',
      }),
      employeePerformance: totalUsers > 0
        ? Math.round(((await (await import('../models/Attendance.js')).default.countDocuments({ date: { $gte: today }, status: 'present' })) / totalUsers) * 100)
        : 0,
      supportResolved: await SupportTicket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      departmentCount: await (await import('../models/Department.js')).default.countDocuments({ isActive: true }),
    },
    sales: {
      myLeads: await Lead.countDocuments(getLeadFilterByRole('sales', userId)),
      newLeads: await Lead.countDocuments({ ...getLeadFilterByRole('sales', userId), status: 'new' }),
      activeDeals: await Deal.countDocuments({ assignedTo: userId, stage: { $nin: ['closed_won', 'closed_lost', 'won', 'converted_to_customer', 'lost'] } }),
      pendingFollowUps: await Task.countDocuments({ assignedTo: userId, status: { $in: ['new', 'pending', 'in_progress'] }, dueDate: { $lte: tomorrow } }),
      salesTargetProgress: 72,
      todaysCalls: await Activity.countDocuments({ user: userId, type: 'call', createdAt: { $gte: today, $lt: tomorrow } }),
      todayMeetings: await Meeting.countDocuments({ assignedTo: userId, scheduledAt: { $gte: today, $lt: tomorrow }, status: 'scheduled' }),
      wonDeals: await Lead.countDocuments({ ...getLeadFilterByRole('sales', userId), status: { $in: ['converted_to_deal', 'won'] } }),
      lostDeals: await Lead.countDocuments({ ...getLeadFilterByRole('sales', userId), status: { $in: ['not_interested', 'lost'] } }),
      monthlySales: await Lead.countDocuments({ ...getLeadFilterByRole('sales', userId), status: { $in: ['converted_to_deal', 'won'] }, updatedAt: { $gte: monthStart } }),
      revenue: (await Lead.aggregate([
        { $match: { ...getLeadFilterByRole('sales', userId), status: { $in: ['converted_to_deal', 'won'] } } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]))[0]?.total || 0,
    },
    support: {
      activeTickets: await SupportTicket.countDocuments({
        supportAssignee: userId,
        status: { $nin: ['resolved', 'closed'] },
      }),
      openTickets: await SupportTicket.countDocuments({
        supportAssignee: userId,
        status: { $in: ['open', 'reopened', 'assigned', 'accepted', 'working', 'completed', 'waiting_customer'] },
      }),
      ticketsToAccept: await SupportTicket.countDocuments({
        supportAssignee: userId,
        status: { $in: ['assigned', 'reopened'] },
      }),
      ticketsInProgress: await SupportTicket.countDocuments({
        supportAssignee: userId,
        status: { $in: ['accepted', 'working'] },
      }),
      ticketsAwaitingReview: await SupportTicket.countDocuments({
        supportAssignee: userId,
        status: { $in: ['completed', 'reviewed'] },
      }),
      assignedTickets: await SupportTicket.countDocuments({
        supportAssignee: userId,
        status: { $nin: ['resolved', 'closed'] },
      }),
      closedTickets: await SupportTicket.countDocuments({
        supportAssignee: userId,
        status: { $in: ['resolved', 'closed'] },
      }),
      myCustomers: await Customer.countDocuments(
        (await getCustomerFilterByRole('support', userId, null)),
      ),
      myProjects: await Project.countDocuments({
        $or: [
          { supportExecutiveAssignee: userId },
          { supportTeamAssignees: userId },
        ],
      }),
      updateRequestTickets: await SupportTicket.countDocuments({
        supportAssignee: userId,
        requestKind: 'update_request',
        status: { $nin: ['resolved', 'closed'] },
      }),
      avgResponseTime: avgResponseTimeHours,
      customerRating: Math.round(customerRatingAvg * 10) / 10,
      slaOnTrack,
      slaBreached,
      slaStatus: slaBreached > 0 ? `${slaOnTrack} on track · ${slaBreached} breached` : `${slaOnTrack} on track`,
      pendingFollowUps: await Followup.countDocuments({
        ...(await getSupportPersonFollowupFilter(userId)),
        status: { $in: ['scheduled', 'pending', 'awaiting_customer_response', 'in_progress'] },
      }),
      todayFollowUps: await Followup.countDocuments({
        ...(await getSupportPersonFollowupFilter(userId)),
        scheduledAt: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'pending', 'awaiting_customer_response', 'in_progress', 'overdue'] },
      }),
      customerFollowUps: await Followup.countDocuments({
        ...(await getSupportPersonFollowupFilter(userId)),
        status: { $in: ['scheduled', 'pending', 'awaiting_customer_response', 'in_progress', 'overdue'] },
      }),
      overdueFollowUps: await Followup.countDocuments({
        ...(await getSupportPersonFollowupFilter(userId)),
        status: { $in: ['overdue', 'missed'] },
      }),
      handoffProjects: await Project.countDocuments({
        $or: [
          { supportExecutiveAssignee: userId },
          { supportAssignee: userId },
          { supportTeamAssignees: userId },
        ],
      }),
      inSupportProjects: await Project.countDocuments({
        $or: [
          { supportExecutiveAssignee: userId },
          { supportTeamAssignees: userId },
        ],
        supportReviewStatus: { $in: ['in_support', 'support_active', 'submitted_to_customer'] },
      }),
      pendingSupportTasks: await SupportProjectTask.countDocuments({
        assignedTo: userId,
        status: { $in: ['assigned', 'pending', 'accepted'] },
      }),
      inProgressTasks: await SupportProjectTask.countDocuments({
        assignedTo: userId,
        status: { $in: ['in_progress', 'waiting_customer'] },
      }),
      completedSupportTasks: await SupportProjectTask.countDocuments({
        assignedTo: userId,
        status: 'completed',
      }),
      resolvedTickets: await SupportTicket.countDocuments({
        supportAssignee: userId,
        status: { $in: ['resolved', 'closed', 'waiting_customer'] },
      }),
      pendingCustomerReplies: await SupportTicket.countDocuments({
        supportAssignee: userId,
        status: { $in: ['open', 'assigned', 'working'] },
        requestKind: { $ne: 'change_request' },
      }),
      pendingCustomerAcceptance: await Project.countDocuments({
        $or: [
          { supportExecutiveAssignee: userId },
          { supportTeamAssignees: userId },
        ],
        supportReviewStatus: { $in: ['submitted_to_customer', 'in_support'] },
        'deliveryChecklist.clientAcceptance': { $ne: true },
      }),
    },
    technical: {
      assignedTickets: await SupportTicket.countDocuments({ technicalAssignee: userId, technicalStatus: { $nin: ['resolved', 'closed'] } }),
      inProgress: await SupportTicket.countDocuments({ technicalAssignee: userId, technicalStatus: 'in_progress' }),
      inTesting: await SupportTicket.countDocuments({ technicalAssignee: userId, technicalStatus: 'testing' }),
      needInformation: await SupportTicket.countDocuments({ technicalAssignee: userId, technicalStatus: 'need_information' }),
      assignedProjects: await Project.countDocuments({ assignedTo: userId }),
      activeProjects: await Project.countDocuments({ assignedTo: userId, status: { $in: ACTIVE_PROJECT_STATUSES } }),
      pendingProjects: await Project.countDocuments({ assignedTo: userId, status: { $in: ['new', 'planning'] } }),
      resolvedThisMonth: await SupportTicket.countDocuments({ technicalAssignee: userId, technicalStatus: { $in: ['resolved', 'closed'] }, updatedAt: { $gte: monthStart } }),
    },
  };

  if (role === 'manager') {
    const dept = getManagerDepartmentFromUser(req.user);
    if (dept === 'technical') {
      const reportIds = await getTechnicalManagerReportIds(userId);
      roleStats.manager.teamMembers = reportIds.length;
    } else {
      roleStats.manager.teamMembers = await User.countDocuments({ role: dept, isActive: { $ne: false } });
    }

    if (dept === 'sales') {
      roleStats.manager.teamLeads = await Lead.countDocuments({
        status: { $nin: ['converted_to_deal', 'won', 'lost', 'not_interested'] },
      });
      roleStats.manager.activeDeals = activeDeals;
      roleStats.manager.pendingApprovals = pendingQuotations;
      roleStats.manager.totalRevenue = totalRevenue;
    } else if (dept === 'technical') {
      const reportIds = await getTechnicalManagerReportIds(userId);
      const projectFilter = await getTechnicalManagerProjectFilter(userId);
      const taskFilter = await getTechnicalManagerTaskFilter(userId);
      const teamFilter = getTechnicalManagerStaffRoleFilter(userId);
      const ticketFilter = await getTechnicalManagerTicketFilter(userId);
      const now = new Date();

      const totalProj = await Project.countDocuments({ ...projectFilter, status: { $ne: 'cancelled' } });
      const completedProj = await Project.countDocuments({ ...projectFilter, status: 'completed' });

      roleStats.manager.totalProjects = totalProj;
      roleStats.manager.newProjects = await Project.countDocuments({ ...projectFilter, status: 'new' });
      roleStats.manager.activeProjects = await Project.countDocuments({ ...projectFilter, status: { $in: ACTIVE_PROJECT_STATUSES } });
      roleStats.manager.completedProjects = completedProj;
      roleStats.manager.onHoldProjects = await Project.countDocuments({ ...projectFilter, status: 'on_hold' });
      roleStats.manager.overdueProjects = await Project.countDocuments({
        ...projectFilter,
        endDate: { $lt: now, $ne: null },
        status: { $nin: ['completed', 'cancelled', 'on_hold'] },
      });
      roleStats.manager.delayedProjects = roleStats.manager.overdueProjects;
      roleStats.manager.pendingProjects = await Project.countDocuments({ ...projectFilter, status: { $in: ['new', 'planning'] } });
      roleStats.manager.totalTeams = await StaffRole.countDocuments({ ...teamFilter, status: 'active' });
      roleStats.manager.totalTeamMembers = reportIds.length;
      roleStats.manager.totalTasks = await Task.countDocuments(taskFilter);
      roleStats.manager.pendingTasks = await Task.countDocuments({
        ...taskFilter,
        status: { $in: ['new', 'pending', 'in_progress'] },
      });
      roleStats.manager.overdueTasks = await Task.countDocuments({
        ...taskFilter,
        dueDate: { $lt: now, $ne: null },
        status: { $in: ['new', 'pending', 'in_progress'] },
      });
      roleStats.manager.projectProgress = totalProj
        ? Math.round((completedProj / totalProj) * 100)
        : 0;
      roleStats.manager.pendingCodeReviews = await Project.countDocuments({ ...projectFilter, status: 'code_review' });
      roleStats.manager.pendingTesting = await Project.countDocuments({ ...projectFilter, status: 'testing' });
      roleStats.manager.pendingBugFixing = await Project.countDocuments({ ...projectFilter, status: 'bug_fixing' });
      roleStats.manager.pendingDeployment = await Project.countDocuments({ ...projectFilter, status: 'deployment' });
      roleStats.manager.completedThisMonth = await Project.countDocuments({
        ...projectFilter,
        status: 'completed',
        updatedAt: { $gte: monthStart },
      });
      roleStats.manager.teamPerformance = roleStats.manager.employeePerformance;
      roleStats.manager.openTickets = await SupportTicket.countDocuments({
        ...ticketFilter,
        status: { $in: ['open', 'assigned', 'working', 'waiting_customer'] },
      });
      roleStats.manager.openBugs = await SupportTicket.countDocuments({
        ...ticketFilter,
        category: 'bug',
        status: { $nin: ['resolved', 'closed'] },
      });
      roleStats.manager.pendingCustomerAcceptance = await Project.countDocuments({
        ...projectFilter,
        supportHandoffAt: { $exists: true },
        supportReviewStatus: { $in: ['in_support', 'closed', 'verified'] },
        'deliveryChecklist.clientAcceptance': { $ne: true },
      });
      roleStats.manager.customerAcceptedProjects = await Project.countDocuments({
        ...projectFilter,
        'deliveryChecklist.clientAcceptance': true,
      });
    } else if (dept === 'support') {
      roleStats.manager.totalTeams = await StaffRole.countDocuments({ teamGroup: 'support', status: 'active' });
      roleStats.manager.totalTeamMembers = await User.countDocuments({ role: 'support', isActive: { $ne: false } });
      roleStats.manager.teamMembers = roleStats.manager.totalTeamMembers;
      roleStats.manager.pendingReview = await Project.countDocuments({ supportReviewStatus: 'pending_review' });
      roleStats.manager.pendingVerify = await Project.countDocuments({ supportReviewStatus: 'resubmitted' });
      roleStats.manager.openUpdateRequests = await Project.countDocuments({
        supportReviewStatus: { $in: ['changes_required', 'fix_in_progress'] },
      });
      roleStats.manager.inSupport = await Project.countDocuments({ supportReviewStatus: 'in_support' });
      roleStats.manager.closedHandoffs = await Project.countDocuments({
        supportReviewStatus: { $in: ['closed', 'verified'] },
      });
      roleStats.manager.openTickets = openTickets;
      roleStats.manager.assignedTickets = await SupportTicket.countDocuments({
        supportAssignee: { $ne: null },
        status: { $nin: ['resolved', 'closed'] },
      });
      roleStats.manager.unassignedTickets = await SupportTicket.countDocuments({
        supportAssignee: null,
        status: { $nin: ['resolved', 'closed'] },
      });
      roleStats.manager.escalations = await SupportTicket.countDocuments({
        escalated: true,
        status: { $nin: ['resolved', 'closed'] },
      });
      roleStats.manager.updateRequestTickets = await SupportTicket.countDocuments({
        requestKind: 'update_request',
        status: { $nin: ['resolved', 'closed'] },
      });
      roleStats.manager.slaBreached = slaBreached;
      roleStats.manager.avgResponseTime = avgResponseTimeHours;
      roleStats.manager.customerRating = Math.round(customerRatingAvg * 10) / 10;
      roleStats.manager.pendingCustomerAcceptance = await Project.countDocuments({
        supportReviewStatus: 'submitted_to_customer',
        'deliveryChecklist.clientAcceptance': { $ne: true },
      });
      roleStats.manager.customerAcceptedProjects = await Project.countDocuments({
        'deliveryChecklist.clientAcceptance': true,
        supportHandoffAt: { $exists: true },
      });
      roleStats.manager.totalProjectsReceived = await Project.countDocuments({
        supportHandoffAt: { $exists: true },
      });
      roleStats.manager.projectsAwaitingDelivery = await Project.countDocuments({
        supportReviewStatus: { $in: ['pending_review', 'resubmitted'] },
      });
      roleStats.manager.inProgressTickets = await SupportTicket.countDocuments({
        status: { $in: ['working', 'assigned'] },
        requestKind: { $ne: 'change_request' },
      });
      roleStats.manager.closedTickets = await SupportTicket.countDocuments({
        status: 'closed',
        requestKind: { $ne: 'change_request' },
      });
      roleStats.manager.pendingChangeRequests = await SupportTicket.countDocuments({
        requestKind: 'change_request',
        status: { $nin: ['closed', 'resolved'] },
      });
      roleStats.manager.completedChangeRequests = await SupportTicket.countDocuments({
        requestKind: 'change_request',
        status: 'closed',
      });
    }
  }

  let adminOverview = null;
  let departmentOverview = null;

  if (role === 'admin' || role === 'manager') {
    const [employees, staffTeams] = await Promise.all([
      User.find({ isActive: { $ne: false } })
        .select('firstName lastName email role employeeId staffRole reportsTo createdAt')
        .populate({
          path: 'staffRole',
          select: 'code name teamGroup department teamLeader',
          populate: { path: 'teamLeader', select: 'firstName lastName employeeId' },
        })
        .populate('reportsTo', 'firstName lastName employeeId')
        .sort('role firstName')
        .lean(),
      StaffRole.find({ status: 'active' })
        .populate('teamLeader', 'firstName lastName employeeId')
        .lean(),
    ]);

    const nonAdmin = employees.filter((e) => e.role !== 'admin');
    const managers = nonAdmin.filter((e) => e.role === 'manager');
    const managerTeams = staffTeams.filter((t) => t.teamGroup === 'manager');
    const workTeams = staffTeams.filter((t) => t.teamGroup !== 'manager');

    const deptKeys = ['sales', 'technical', 'support'];
    const departments = deptKeys.map((dept) => {
      const deptManager = managers.find((m) => {
        const team = m.staffRole;
        return team && inferTeamDepartment(team) === dept;
      });
      const staff = nonAdmin.filter((e) => e.role === dept);
      const teams = workTeams.filter((t) => t.teamGroup === dept);
      return {
        key: dept,
        label: dept.charAt(0).toUpperCase() + dept.slice(1),
        manager: deptManager
          ? { name: `${deptManager.firstName} ${deptManager.lastName}`, email: deptManager.email, employeeId: deptManager.employeeId }
          : null,
        staffCount: staff.length,
        teamCount: teams.length,
        teams: teams.map((t) => ({
          code: t.code,
          name: t.name,
          teamLeader: t.teamLeader
            ? { name: `${t.teamLeader.firstName} ${t.teamLeader.lastName}`, employeeId: t.teamLeader.employeeId }
            : null,
          memberCount: nonAdmin.filter((e) => String(e.staffRole?._id || e.staffRole) === String(t._id)).length,
        })),
      };
    });

    adminOverview = {
      totalEmployees: nonAdmin.length,
      employeesByRole: {
        manager: managers.length,
        sales: nonAdmin.filter((e) => e.role === 'sales').length,
        technical: nonAdmin.filter((e) => e.role === 'technical').length,
        support: nonAdmin.filter((e) => e.role === 'support').length,
      },
      managerTeamCount: managerTeams.length,
      departments,
      recentEmployees: nonAdmin,
    };

    const followupStatuses = ['scheduled', 'pending', 'awaiting_customer_response', 'in_progress'];
    const overdueFollowupStatuses = [...followupStatuses, 'missed'];
    const now = new Date();
    const overdueDealFilter = {
      workflowStage: 'deal',
      $or: [
        { scheduledAt: { $lt: now }, status: { $in: overdueFollowupStatuses } },
        { status: { $in: ['overdue', 'missed'] } },
      ],
    };
    const [
      assignedFollowUps,
      leadFollowUps,
      unassignedLeadFollowUps,
      dealFollowUps,
      unassignedDealFollowUps,
      overdueDealFollowUps,
    ] = await Promise.all([
      Followup.countDocuments({ assignedTo: { $ne: null }, status: { $in: followupStatuses } }),
      Followup.countDocuments({ workflowStage: 'lead', status: { $in: followupStatuses } }),
      Followup.countDocuments({
        workflowStage: 'lead',
        status: { $in: followupStatuses },
        assignedTo: null,
      }),
      Followup.countDocuments({ workflowStage: 'deal', status: { $in: followupStatuses } }),
      Followup.countDocuments({
        workflowStage: 'deal',
        status: { $in: followupStatuses },
        assignedTo: null,
      }),
      Followup.countDocuments(overdueDealFilter),
    ]);

    adminOverview.followupOverview = {
      assignedFollowUps,
      leadFollowUps,
      unassignedLeadFollowUps,
      dealFollowUps,
      unassignedDealFollowUps,
      overdueDealFollowUps,
    };

    if (role === 'admin') {
      const fuBase = { workflowStage: 'customer' };
      const [
        totalProjectsReceived,
        projectsAwaitingDelivery,
        pendingCustomerAcceptance,
        inSupport,
        unassignedTickets,
        escalations,
        pendingChangeRequests,
        supportCustomerFollowUps,
        supportTodayFollowUps,
        supportOverdueFollowUps,
        supportCompletedFollowUps,
      ] = await Promise.all([
        Project.countDocuments({ supportHandoffAt: { $exists: true } }),
        Project.countDocuments({ supportReviewStatus: { $in: ['pending_review', 'resubmitted'] } }),
        Project.countDocuments({
          supportReviewStatus: 'submitted_to_customer',
          'deliveryChecklist.clientAcceptance': { $ne: true },
        }),
        Project.countDocuments({ supportReviewStatus: 'in_support' }),
        SupportTicket.countDocuments({
          supportAssignee: null,
          status: { $nin: ['resolved', 'closed'] },
        }),
        SupportTicket.countDocuments({
          escalated: true,
          status: { $nin: ['resolved', 'closed'] },
        }),
        SupportTicket.countDocuments({
          requestKind: 'change_request',
          status: { $nin: ['closed', 'resolved'] },
        }),
        Followup.countDocuments({ ...fuBase, status: { $in: followupStatuses } }),
        Followup.countDocuments({
          ...fuBase,
          scheduledAt: { $gte: today, $lt: tomorrow },
          status: { $in: followupStatuses },
        }),
        Followup.countDocuments({
          $and: [
            fuBase,
            {
              $or: [
                { scheduledAt: { $lt: now }, status: { $in: overdueFollowupStatuses } },
                { status: { $in: ['overdue', 'missed'] } },
              ],
            },
          ],
        }),
        Followup.countDocuments({ ...fuBase, status: { $in: ['completed'] } }),
      ]);

      adminOverview.supportOverview = {
        totalProjectsReceived,
        projectsAwaitingDelivery,
        pendingCustomerAcceptance,
        inSupport,
        unassignedTickets,
        escalations,
        pendingChangeRequests,
      };
      adminOverview.supportFollowupOverview = {
        customerFollowUps: supportCustomerFollowUps,
        todayFollowUps: supportTodayFollowUps,
        overdueFollowUps: supportOverdueFollowUps,
        completedFollowUps: supportCompletedFollowUps,
      };
    }

    if (role === 'manager') {
      const dept = getManagerDepartmentFromUser(req.user);
      let deptStaff = nonAdmin.filter((e) => e.role === dept);
      let deptTeams = workTeams.filter((t) => t.teamGroup === dept);
      const deptEntry = departments.find((d) => d.key === dept);

      if (dept === 'technical') {
        const reportIds = await getTechnicalManagerReportIds(userId);
        const reportIdSet = new Set(reportIds.map(String));
        deptStaff = nonAdmin.filter((e) => e.role === 'technical' && reportIdSet.has(String(e._id)));
        const teamFilter = getTechnicalManagerStaffRoleFilter(userId);
        const scopedTeamIds = await StaffRole.find({ ...teamFilter, status: 'active' }).distinct('_id');
        const scopedIdSet = new Set(scopedTeamIds.map(String));
        deptTeams = workTeams.filter((t) => scopedIdSet.has(String(t._id)));
      }

      departmentOverview = {
        departmentKey: dept,
        totalEmployees: deptStaff.length,
        deptInfo: deptEntry
          ? {
            label: deptEntry.label,
            staffCount: deptStaff.length,
            teamCount: deptTeams.length,
            teams: deptTeams.map((t) => ({
              code: t.code,
              name: t.name,
              memberCount: deptStaff.filter(
                (e) => String(e.staffRole?._id || e.staffRole) === String(t._id)
              ).length,
              teamLeader: t.teamLeader
                ? { name: `${t.teamLeader.firstName} ${t.teamLeader.lastName}`, employeeId: t.teamLeader.employeeId }
                : null,
            })),
          }
          : null,
        recentEmployees: deptStaff,
        followupOverview: dept === 'sales'
          ? adminOverview.followupOverview
          : dept === 'technical' || dept === 'support'
            ? await (async () => {
              const fuBase = dept === 'support'
                ? await getSupportTeamFollowupFilter()
                : { workflowStage: 'customer' };
              const completedStatuses = ['completed'];
              return {
                customerFollowUps: await Followup.countDocuments({
                  ...fuBase,
                  status: { $in: followupStatuses },
                }),
                todayFollowUps: await Followup.countDocuments({
                  ...fuBase,
                  scheduledAt: { $gte: today, $lt: tomorrow },
                  status: { $in: followupStatuses },
                }),
                overdueFollowUps: await Followup.countDocuments({
                  $and: [
                    fuBase,
                    {
                      $or: [
                        { scheduledAt: { $lt: now }, status: { $in: overdueFollowupStatuses } },
                        { status: { $in: ['overdue', 'missed'] } },
                      ],
                    },
                  ],
                }),
                completedFollowUps: await Followup.countDocuments({
                  ...fuBase,
                  status: { $in: completedStatuses },
                }),
              };
            })()
            : null,
      };
      adminOverview = null;
    }
  }

  let technicalOverview = null;
  if (role === 'technical') {
    const assignedProjects = await Project.find({ assignedTo: userId })
      .populate('customer', 'firstName lastName email companyName')
      .populate('manager', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email role')
      .populate('category', 'name code')
      .sort('-updatedAt')
      .lean();

    const projectIds = assignedProjects.map((p) => p._id);
    const requirementDocs = projectIds.length
      ? await Document.find({
        'relatedTo.type': 'project',
        'relatedTo.id': { $in: projectIds },
        isActive: true,
        folder: 'Requirements',
      }).select('name fileUrl relatedTo createdAt').lean()
      : [];

    const docsByProject = requirementDocs.reduce((acc, doc) => {
      const pid = String(doc.relatedTo?.id);
      if (!acc[pid]) acc[pid] = doc;
      return acc;
    }, {});

    technicalOverview = {
      totalAssigned: assignedProjects.length,
      inProgress: assignedProjects.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status)).length,
      planning: assignedProjects.filter((p) => ['new', 'planning'].includes(p.status)).length,
      completed: assignedProjects.filter((p) => p.status === 'completed').length,
      totalTasks: await Task.countDocuments({ assignedTo: userId }),
      pendingTasks: await Task.countDocuments({
        assignedTo: userId,
        status: { $in: ['new', 'pending'] },
      }),
      inProgressTasks: await Task.countDocuments({
        assignedTo: userId,
        $or: [
          { status: 'in_progress' },
          { workStatus: { $in: ['development', 'in_progress', 'planning', 'bug_fixing'] } },
        ],
      }),
      completedTasks: await Task.countDocuments({ assignedTo: userId, status: 'completed' }),
      codeReviewPending: await Task.countDocuments({
        assignedTo: userId,
        $or: [{ workStatus: 'code_review' }, { devStage: 'code_review' }],
        status: { $nin: ['completed', 'cancelled'] },
      }),
      testingPending: await Task.countDocuments({
        assignedTo: userId,
        $or: [{ workStatus: 'testing' }, { devStage: 'testing' }],
        status: { $nin: ['completed', 'cancelled'] },
      }),
      assignedBugs: await SupportTicket.countDocuments({
        technicalAssignee: userId,
        category: 'bug',
        technicalStatus: { $nin: ['resolved', 'closed'] },
      }),
      projects: assignedProjects.map((p) => {
        const assigner = p.manager || (['admin', 'manager'].includes(p.createdBy?.role) ? p.createdBy : null);
        return {
          _id: p._id,
          name: p.name,
          status: p.status,
          workflowStage: p.workflowStage,
          priority: p.priority,
          budget: p.budget,
          description: p.description,
          scope: p.scope,
          deliverables: p.deliverables,
          technologyStack: p.technologyStack || [],
          startDate: p.startDate,
          endDate: p.endDate,
          updatedAt: p.updatedAt,
          customer: p.customer,
          category: p.category,
          assignedBy: assigner
            ? { name: `${assigner.firstName} ${assigner.lastName}`.trim(), email: assigner.email, role: assigner.role }
            : null,
          requirementsDoc: docsByProject[String(p._id)]
            ? { name: docsByProject[String(p._id)].name, fileUrl: docsByProject[String(p._id)].fileUrl }
            : null,
        };
      }),
    };
  }

  let salesOverview = null;
  if (role === 'sales') {
    const leadFilter = getLeadFilterByRole('sales', userId);
    const followupStatuses = ['scheduled', 'pending', 'awaiting_customer_response', 'in_progress'];
    const overdueFollowupStatuses = [...followupStatuses, 'missed'];
    const now = new Date();

    const [
      recentLeads,
      activeDeals,
      upcomingFollowups,
      todayMeetingsList,
      assignedFollowUps,
      leadFollowUps,
      dealFollowUps,
      todayFollowUps,
      overdueFollowUps,
    ] = await Promise.all([
      Lead.find(leadFilter)
        .select('firstName lastName email company status priority updatedAt leadNumber assignedManager')
        .populate('assignedManager', 'firstName lastName email')
        .sort('-updatedAt')
        .limit(8)
        .lean(),
      Deal.find({
        assignedTo: userId,
        stage: { $nin: ['closed_won', 'closed_lost', 'won', 'converted_to_customer', 'lost'] },
      })
        .populate('customer', 'firstName lastName companyName')
        .populate('assignedManager', 'firstName lastName email')
        .select('title stage value probability customer updatedAt assignedManager')
        .sort('-updatedAt')
        .limit(8)
        .lean(),
      Followup.find({
        assignedTo: userId,
        status: { $in: followupStatuses },
        scheduledAt: { $gte: today },
      })
        .populate('lead', 'firstName lastName company')
        .populate('deal', 'title')
        .populate('customer', 'firstName lastName companyName')
        .sort('scheduledAt')
        .limit(12)
        .lean(),
      Meeting.find({
        assignedTo: userId,
        scheduledAt: { $gte: today, $lt: tomorrow },
        status: 'scheduled',
      })
        .populate('lead', 'firstName lastName company')
        .populate('customer', 'firstName lastName companyName')
        .sort('scheduledAt')
        .limit(8)
        .lean(),
      Followup.countDocuments({ assignedTo: userId, status: { $in: followupStatuses } }),
      Followup.countDocuments({ assignedTo: userId, workflowStage: 'lead', status: { $in: followupStatuses } }),
      Followup.countDocuments({ assignedTo: userId, workflowStage: 'deal', status: { $in: followupStatuses } }),
      Followup.countDocuments({
        assignedTo: userId,
        scheduledAt: { $gte: today, $lt: tomorrow },
        status: { $in: followupStatuses },
      }),
      Followup.countDocuments({
        assignedTo: userId,
        $or: [
          { scheduledAt: { $lt: now }, status: { $in: overdueFollowupStatuses } },
          { status: { $in: ['overdue', 'missed'] } },
        ],
      }),
    ]);

    salesOverview = {
      recentLeads,
      activeDeals,
      upcomingFollowups,
      todayMeetings: todayMeetingsList,
      followupOverview: {
        assignedFollowUps,
        leadFollowUps,
        dealFollowUps,
        todayFollowUps,
        overdueFollowUps,
      },
    };
  }

  const salesDeptManager = role === 'manager' && getManagerDepartmentFromUser(req.user) === 'sales';
  if (salesDeptManager) {
    const leadFilter = await getManagerLeadScope(userId);
    const reportIds = await User.find({ reportsTo: userId, isActive: { $ne: false } }).distinct('_id');
    const activeDealStages = { $nin: ['closed_won', 'closed_lost', 'won', 'converted_to_customer', 'lost'] };

    const [recentLeads, activeDeals] = await Promise.all([
      Lead.find(leadFilter)
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedManager', 'firstName lastName email')
        .select('firstName lastName email company status priority updatedAt leadNumber assignedTo assignedManager')
        .sort('-updatedAt')
        .limit(8)
        .lean(),
      Deal.find({
        stage: activeDealStages,
        $or: [
          { assignedManager: userId },
          { assignedTo: userId },
          ...(reportIds.length ? [{ assignedTo: { $in: reportIds } }] : []),
          { createdBy: userId },
        ],
      })
        .populate('customer', 'firstName lastName companyName')
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedManager', 'firstName lastName email')
        .select('title stage value probability customer updatedAt assignedTo assignedManager')
        .sort('-updatedAt')
        .limit(8)
        .lean(),
    ]);

    salesOverview = { recentLeads, activeDeals };
  }

  let supportOverview = null;
  if (role === 'support') {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const customerFilter = await getCustomerFilterByRole('support', userId, req.user);
    const customerIds = await Customer.find(customerFilter).distinct('_id');

    const projectFilter = {
      $or: [
        { supportExecutiveAssignee: userId },
        { supportAssignee: userId },
        { supportTeamAssignees: userId },
        ...(customerIds.length ? [{ customer: { $in: customerIds } }] : []),
      ],
    };
    const projectIds = await Project.find(projectFilter).distinct('_id');

    const [
      assignedCustomers,
      assignedTickets,
      handoffProjects,
      activeProjects,
      assignedProjects,
      handoffDocs,
      upcomingFollowups,
      assignedThisWeek,
      mySupportTasks,
      recentActivities,
    ] = await Promise.all([
      Customer.find(customerFilter)
        .select('firstName lastName email phone companyName status')
        .sort('-updatedAt')
        .limit(20)
        .lean(),
      SupportTicket.find({ supportAssignee: userId, status: { $nin: ['resolved', 'closed'] } })
        .populate('customer', 'firstName lastName companyName')
        .populate('project', 'name status')
        .sort('-updatedAt')
        .limit(10)
        .lean(),
      Project.find(projectFilter)
        .populate('customer', 'firstName lastName companyName email phone')
        .populate('manager', 'firstName lastName email')
        .select('name status workflowStage supportReviewStatus supportHandoffAt supportHandoffNotes customer manager')
        .sort('-supportHandoffAt')
        .limit(10)
        .lean(),
      Project.find({
        supportExecutiveAssignee: userId,
        supportReviewStatus: { $in: ['in_support', 'support_active', 'submitted_to_customer', 'support_tasks_assigned', 'support_tasks_in_progress'] },
      })
        .populate('customer', 'firstName lastName companyName')
        .select('name status supportHandoffAt customer supportReviewStatus')
        .sort('-supportHandoffAt')
        .limit(8)
        .lean(),
      Project.find({
        $or: [
          { supportExecutiveAssignee: userId },
          { supportTeamAssignees: userId },
        ],
      })
        .populate('customer', 'firstName lastName companyName email phone')
        .populate('manager', 'firstName lastName email')
        .select('name status workflowStage supportReviewStatus supportHandoffAt supportHandoffNotes customer manager')
        .sort('-updatedAt')
        .limit(10)
        .lean(),
      projectIds.length
        ? Document.find({
          isActive: true,
          tags: 'shared-with-support',
          'relatedTo.type': 'project',
          'relatedTo.id': { $in: projectIds },
        })
          .populate('uploadedBy', 'firstName lastName')
          .sort('-createdAt')
          .limit(10)
          .lean()
        : [],
      Followup.find({
        ...(await getSupportPersonFollowupFilter(userId)),
        status: { $in: ['scheduled', 'pending', 'awaiting_customer_response', 'in_progress', 'overdue'] },
      })
        .populate('customer', 'firstName lastName companyName phone email')
        .populate('project', 'name')
        .populate('createdBy', 'firstName lastName')
        .sort('scheduledAt')
        .limit(12)
        .lean(),
      Project.countDocuments({
        $or: [
          { supportExecutiveAssignee: userId },
          { supportTeamAssignees: userId },
        ],
        updatedAt: { $gte: weekStart },
      }),
      SupportProjectTask.find({ assignedTo: userId })
        .populate('project', 'name supportReviewStatus customer')
        .sort('taskKey')
        .limit(20)
        .lean(),
      Activity.find({
        $or: [
          { user: userId },
          { type: { $in: ['ticket', 'project'] }, title: { $regex: /assign|reply|escalat|task|handoff/i } },
        ],
      })
        .populate('user', 'firstName lastName')
        .sort('-createdAt')
        .limit(15)
        .lean(),
    ]);

    supportOverview = {
      assignedCustomers,
      assignedTickets,
      handoffProjects,
      activeProjects,
      assignedProjects,
      handoffDocs,
      upcomingFollowups,
      assignedThisWeek,
      mySupportTasks,
      recentActivities: recentActivities.map((a) => ({
        _id: a._id,
        title: a.title,
        description: a.description,
        type: a.type,
        createdAt: a.createdAt,
        user: a.user,
      })),
    };
  }

  let supportManagerOverview = null;
  if (role === 'manager' && getManagerDepartmentFromUser(req.user) === 'support') {
    const [
      pendingReviewProjects,
      inSupportProjects,
      openUpdateProjects,
      recentHandoffs,
      recentUpdateTickets,
      recentOpenTickets,
      recentNotifications,
      recentProjectDeliveries,
      recentChangeRequests,
      pendingCustomerAcceptanceProjects,
    ] = await Promise.all([
      Project.find({ supportReviewStatus: 'pending_review' })
        .populate('customer', 'firstName lastName companyName')
        .populate('manager', 'firstName lastName email')
        .select('name status supportHandoffAt supportHandoffNotes customer manager deliveryChecklist supportReviewStatus')
        .sort('-supportHandoffAt')
        .limit(8)
        .lean(),
      Project.find({ supportReviewStatus: 'in_support' })
        .populate('customer', 'firstName lastName companyName')
        .populate('supportExecutiveAssignee', 'firstName lastName email')
        .populate('manager', 'firstName lastName email')
        .select('name status supportHandoffAt supportReviewStatus customer supportExecutiveAssignee manager deliveryChecklist')
        .sort('-supportHandoffAt')
        .limit(8)
        .lean(),
      Project.find({ supportReviewStatus: { $in: ['changes_required', 'fix_in_progress', 'resubmitted'] } })
        .populate('customer', 'firstName lastName companyName')
        .populate('activeUpdateRequest')
        .populate('manager', 'firstName lastName email')
        .select('name supportReviewStatus customer activeUpdateRequest manager deliveryChecklist')
        .sort('-updatedAt')
        .limit(8)
        .lean(),
      Project.find({ supportHandoffAt: { $exists: true } })
        .populate('customer', 'firstName lastName companyName')
        .populate('manager', 'firstName lastName email')
        .select('name status supportReviewStatus supportHandoffAt customer manager deliveryChecklist')
        .sort('-supportHandoffAt')
        .limit(10)
        .lean(),
      SupportTicket.find({ requestKind: 'update_request', status: { $nin: ['resolved', 'closed'] } })
        .populate('customer', 'firstName lastName companyName')
        .populate('project', 'name status')
        .sort('-createdAt')
        .limit(8)
        .lean(),
      SupportTicket.find({
        status: { $in: ['open', 'assigned', 'working', 'waiting_customer'] },
        requestKind: { $ne: 'change_request' },
      })
        .populate('customer', 'firstName lastName companyName')
        .populate('supportAssignee', 'firstName lastName')
        .sort('-updatedAt')
        .limit(8)
        .lean(),
      Notification.find({ user: req.user._id })
        .sort('-createdAt')
        .limit(5)
        .lean(),
      Project.find({ supportHandoffAt: { $exists: true } })
        .populate('customer', 'firstName lastName companyName')
        .populate('manager', 'firstName lastName')
        .select('name status supportHandoffAt supportReviewStatus manager technologyStack category deliveryChecklist')
        .sort('-supportHandoffAt')
        .limit(8)
        .lean(),
      SupportTicket.find({ requestKind: 'change_request' })
        .populate('customer', 'firstName lastName companyName')
        .populate('project', 'name')
        .sort('-createdAt')
        .limit(8)
        .lean(),
      Project.find({
        supportReviewStatus: 'submitted_to_customer',
        'deliveryChecklist.clientAcceptance': { $ne: true },
      })
        .populate('customer', 'firstName lastName companyName')
        .select('name customer supportReviewStatus submittedToCustomerAt deliveryChecklist')
        .sort('-submittedToCustomerAt')
        .limit(8)
        .lean(),
    ]);

    supportManagerOverview = {
      pendingReviewProjects,
      inSupportProjects,
      openUpdateProjects,
      recentHandoffs,
      recentUpdateTickets,
      recentOpenTickets,
      recentNotifications,
      recentProjectDeliveries,
      recentChangeRequests,
      pendingCustomerAcceptanceProjects,
    };
  }

  res.json({
    role,
    stats: {
      totalCustomers,
      totalLeads,
      qualifiedLeads,
      totalDeals,
      activeDeals,
      pendingTasks,
      totalRevenue,
      conversionRate: totalLeads > 0 ? Math.round((totalCustomers / totalLeads) * 100) : 0,
      openTickets,
      pendingInvoices,
      totalProjects,
      pendingQuotations,
      todayMeetings,
      expenses: expenseTotal,
      profit: totalRevenue - expenseTotal,
      teamPerformance: 78,
    },
    roleStats: roleStats[role] || {},
    leadsByStatus,
    pipelineByStage,
    dealStats,
    recentActivities,
    adminOverview,
    departmentOverview,
    technicalOverview,
    salesOverview,
    supportOverview,
    supportManagerOverview,
  });
});

export const getActivities = asyncHandler(async (req, res) => {
  const { type, relatedId } = req.query;
  const query = {};
  if (type) query.type = type;
  if (relatedId) query['relatedTo.id'] = relatedId;
  if (isTechnicalManager(req.user)) {
    Object.assign(query, await getTechnicalManagerActivityFilter(req.user._id));
  }
  const activities = await Activity.find(query)
    .populate('user', 'firstName lastName avatar')
    .sort('-createdAt')
    .limit(50);
  res.json(activities);
});

export const getCommunications = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const query = type ? { type } : {};
  if (isTechnicalManager(req.user)) {
    Object.assign(query, await getTechnicalManagerCommunicationFilter(req.user._id));
  }
  const communications = await Communication.find(query)
    .populate('user', 'firstName lastName')
    .sort('-createdAt')
    .limit(50);
  res.json(communications);
});

export const createCommunication = asyncHandler(async (req, res) => {
  const { type, to, subject, body, relatedTo } = req.body;

  if (type === 'email') {
    if (!to) {
      res.status(400);
      throw new Error('Recipient email (to) is required');
    }

    let status = 'sent';
    let from = process.env.SMTP_USER || '';

    try {
      const result = await sendCrmEmail({ to, subject, body });
      from = result.from;
    } catch (error) {
      status = 'failed';
      const comm = await Communication.create({
        type: 'email',
        to,
        subject,
        body,
        from,
        user: req.user._id,
        relatedTo,
        status: 'failed',
      });
      res.status(502);
      throw new Error(error.message || 'Failed to send email');
    }

    const comm = await Communication.create({
      type: 'email',
      to,
      subject,
      body,
      from,
      user: req.user._id,
      relatedTo,
      status,
    });

    await logActivity(
      req.user._id,
      'email',
      `Email sent to ${to}: ${subject || '(no subject)'}`,
      relatedTo || null,
      body.slice(0, 200)
    );

    return res.status(201).json(comm);
  }

  if (type === 'sms') {
    if (!to) {
      res.status(400);
      throw new Error('Recipient phone number (to) is required');
    }
    if (!body) {
      res.status(400);
      throw new Error('SMS message body is required');
    }

    let status = 'sent';
    let from = process.env.TWILIO_PHONE_NUMBER || '';

    try {
      const result = await sendCrmSms({ to, body });
      from = result.from;
      status = result.status === 'failed' ? 'failed' : 'sent';
    } catch (error) {
      await Communication.create({
        type: 'sms',
        to,
        body,
        from,
        user: req.user._id,
        relatedTo,
        status: 'failed',
      });
      res.status(502);
      throw new Error(error.message || 'Failed to send SMS');
    }

    const comm = await Communication.create({
      type: 'sms',
      to,
      body,
      from,
      user: req.user._id,
      relatedTo,
      status,
    });

    await logActivity(
      req.user._id,
      'call',
      `SMS sent to ${to}`,
      relatedTo || null,
      body.slice(0, 160)
    );

    return res.status(201).json(comm);
  }

  const comm = await Communication.create({ ...req.body, user: req.user._id, status: 'sent' });
  res.status(201).json(comm);
});

export const getNotes = asyncHandler(async (req, res) => {
  const { type, id } = req.query;
  const notes = await Note.find({ 'relatedTo.type': type, 'relatedTo.id': id })
    .populate('author', 'firstName lastName avatar')
    .sort('-isPinned -createdAt');
  res.json(notes);
});

export const createNote = asyncHandler(async (req, res) => {
  const note = await Note.create({ ...req.body, author: req.user._id });
  const populated = await Note.findById(note._id).populate('author', 'firstName lastName avatar');
  res.status(201).json(populated);
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(30);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ notifications, unreadCount });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ message: 'Marked as read' });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { isRead: true });
  res.json({ message: 'All marked as read' });
});

export const getReports = asyncHandler(async (req, res) => {
  if (isTechnicalManager(req.user)) {
    const userId = req.user._id;
    const [projectFilter, taskFilter, ticketFilter] = await Promise.all([
      getTechnicalManagerProjectFilter(userId),
      getTechnicalManagerTaskFilter(userId),
      getTechnicalManagerTicketFilter(userId),
    ]);
    const [projectsByStatus, tasksByStatus, ticketSummary] = await Promise.all([
      Project.aggregate([{ $match: projectFilter }, { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$budget' } } }]),
      Task.aggregate([{ $match: taskFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      SupportTicket.aggregate([{ $match: ticketFilter }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);
    return res.json({
      projectsByStatus,
      tasksByStatus,
      ticketSummary,
      salesReport: [],
      leadConversion: projectsByStatus.map((p) => ({ _id: p._id, count: p.count, value: p.value || 0 })),
      customerGrowth: [],
      revenueByMonth: [],
    });
  }

  const [salesReport, leadConversion, customerGrowth, revenueByMonth] = await Promise.all([
    Deal.aggregate([
      { $match: { stage: { $in: ['closed_won', 'won', 'converted_to_customer'] } } },
      { $group: { _id: '$assignedTo', totalDeals: { $sum: 1 }, totalRevenue: { $sum: '$value' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, totalDeals: 1, totalRevenue: 1 } },
    ]),
    Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$value' } } }]),
    Customer.aggregate([
      { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Deal.aggregate([
      { $match: { stage: { $in: ['closed_won', 'won', 'converted_to_customer'] } } },
      {
        $group: {
          _id: { year: { $year: '$actualCloseDate' }, month: { $month: '$actualCloseDate' } },
          revenue: { $sum: '$value' },
          deals: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);
  res.json({ salesReport, leadConversion, customerGrowth, revenueByMonth });
});
