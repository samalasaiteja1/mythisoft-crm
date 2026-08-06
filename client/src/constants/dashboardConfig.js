import {
  Users, UserPlus, Handshake, FolderKanban, Headphones, DollarSign,
  TrendingUp, CheckSquare, Calendar, Activity, Shield, Star, Timer, Clock,
} from 'lucide-react';
import { DASHBOARD_KEYS } from '../utils/roleContext';

export const DASHBOARD_META = {
  [DASHBOARD_KEYS.admin]: {
    title: 'Admin Dashboard',
    subtitle: 'Main control center — organization, employees, CRM overview & system settings',
  },
  [DASHBOARD_KEYS.salesManager]: {
    title: 'Sales Manager Dashboard',
    subtitle: 'Monitor sales pipeline, assign leads, track deals & team performance',
  },
  [DASHBOARD_KEYS.techManager]: {
    title: 'Technical Manager Dashboard',
    subtitle: 'What needs attention today — your projects, teams, and delivery pipeline',
  },
  [DASHBOARD_KEYS.supportManager]: {
    title: 'Support Manager Dashboard',
    subtitle: 'Delivery pipeline, team follow-ups, ticket assignment & customer acceptance',
  },
  [DASHBOARD_KEYS.sales]: {
    title: 'Sales Dashboard',
    subtitle: "Today's follow-ups, new leads, active deals, sales targets & monthly revenue",
  },
  [DASHBOARD_KEYS.technical]: {
    title: 'Technical Person Dashboard',
    subtitle: 'Your projects, tasks, code review, testing, and bug assignments',
  },
  [DASHBOARD_KEYS.support]: {
    title: 'Support Executive Dashboard',
    subtitle: 'Accept tickets, complete tasks, reply to customers, and support active projects',
  },
  [DASHBOARD_KEYS.customer]: {
    title: 'Customer Dashboard',
    subtitle: 'Review deliveries, accept projects, confirm ticket fixes, and manage support',
  },
};

export const DASHBOARD_STAT_CARDS = {
  [DASHBOARD_KEYS.salesManager]: [
    { label: 'Team Leads', key: 'teamLeads', icon: UserPlus, color: 'text-myth-accent', link: '/teams/sales/leads', roleKey: true },
    { label: 'Active Deals', key: 'activeDeals', icon: Handshake, color: 'text-purple-400', link: '/teams/sales/deals', roleKey: true },
    { label: 'Pending Approvals', key: 'pendingApprovals', icon: CheckSquare, color: 'text-amber-400', link: '/deals/unassigned', roleKey: true },
    { label: 'Monthly Sales', key: 'monthlySales', icon: TrendingUp, color: 'text-myth-accent', link: '/reports/sales', roleKey: true },
    { label: 'Team Performance', key: 'employeePerformance', icon: Users, color: 'text-blue-400', link: '/teams/sales/performance', format: 'percent', roleKey: true },
    { label: 'Revenue', key: 'totalRevenue', icon: DollarSign, color: 'text-green-400', link: '/reports', format: 'currency', roleKey: true },
  ],
  [DASHBOARD_KEYS.techManager]: [
    { label: 'Total Projects', key: 'totalProjects', icon: FolderKanban, color: 'text-indigo-400', link: '/projects', roleKey: true },
    { label: 'Active Projects', key: 'activeProjects', icon: FolderKanban, color: 'text-blue-400', link: '/teams/technical/active', roleKey: true },
    { label: 'Completed Projects', key: 'completedProjects', icon: CheckSquare, color: 'text-green-400', link: '/projects/status/completed', roleKey: true },
    { label: 'Delayed Projects', key: 'delayedProjects', icon: Timer, color: 'text-red-400', link: '/projects/overdue', roleKey: true },
    { label: 'Total Teams', key: 'totalTeams', icon: Users, color: 'text-cyan-400', link: '/teams/technical/overview', roleKey: true },
    { label: 'Team Members', key: 'totalTeamMembers', icon: Users, color: 'text-sky-400', link: '/teams/technical/members', roleKey: true },
    { label: 'Total Tasks', key: 'totalTasks', icon: CheckSquare, color: 'text-violet-300', link: '/tasks', roleKey: true },
    { label: 'Pending Tasks', key: 'pendingTasks', icon: CheckSquare, color: 'text-amber-400', link: '/tasks?status=new', roleKey: true },
    { label: 'Overdue Tasks', key: 'overdueTasks', icon: Timer, color: 'text-orange-400', link: '/tasks/overdue', roleKey: true },
    { label: 'Project Progress', key: 'projectProgress', icon: TrendingUp, color: 'text-emerald-400', link: '/reports/projects', format: 'percent', roleKey: true },
  ],
  [DASHBOARD_KEYS.supportManager]: [
    { label: 'Open Tickets', key: 'openTickets', icon: Headphones, color: 'text-orange-400', link: '/teams/support/open-tickets', roleKey: true },
    { label: 'Assigned Tickets', key: 'assignedTickets', icon: Activity, color: 'text-yellow-400', link: '/teams/support/assigned-tickets', roleKey: true },
    { label: 'SLA Breached', key: 'slaBreached', icon: Shield, color: 'text-red-400', link: '/escalations', roleKey: true },
    { label: 'Avg Response', key: 'avgResponseTime', icon: Timer, color: 'text-blue-400', link: '/reports', format: 'hours', roleKey: true },
    { label: 'Customer Rating', key: 'customerRating', icon: Star, color: 'text-yellow-400', link: '/teams/support/performance', format: 'rating', roleKey: true },
    { label: 'Team Members', key: 'teamMembers', icon: Users, color: 'text-green-400', link: '/teams/support/members', roleKey: true },
  ],
  [DASHBOARD_KEYS.sales]: [
    { label: "Today's Follow-ups", key: 'pendingFollowUps', icon: CheckSquare, color: 'text-myth-accent', link: '/follow-ups/today', roleKey: true },
    { label: 'New Leads', key: 'newLeads', icon: UserPlus, color: 'text-blue-400', link: '/leads', roleKey: true },
    { label: 'Active Deals', key: 'activeDeals', icon: Handshake, color: 'text-purple-400', link: '/deals', roleKey: true },
    { label: 'Sales Target', key: 'salesTargetProgress', icon: TrendingUp, color: 'text-yellow-400', link: '/reports', format: 'percent', roleKey: true },
    { label: 'Monthly Revenue', key: 'revenue', icon: DollarSign, color: 'text-green-400', link: '/reports', format: 'currency', roleKey: true },
    { label: "Today's Meetings", key: 'todayMeetings', icon: Calendar, color: 'text-indigo-400', link: '/calendar', roleKey: true },
  ],
};

export const MANAGER_QUICK_LINKS = {
  sales: [
    { label: 'Team Members', path: '/teams/sales/members' },
    { label: 'Assigned Leads', path: '/teams/sales/leads' },
    { label: 'Active Deals', path: '/teams/sales/deals' },
    { label: 'Performance', path: '/teams/sales/performance' },
    { label: 'Unsigned Leads', path: '/leads/unsigned' },
    { label: 'Assign Leads', path: '/leads/assign' },
    { label: 'Deals', path: '/deals' },
    { label: 'Reports', path: '/reports/sales' },
  ],
  technical: [
    { label: 'Assigned Projects', path: '/projects' },
    { label: 'Create Task', path: '/tasks?create=1' },
    { label: 'Task Board', path: '/dev-board' },
    { label: 'Team List', path: '/teams/technical/overview' },
    { label: 'Milestones', path: '/projects/milestones' },
    { label: 'Code Review', path: '/projects/status/code_review' },
    { label: 'Bug Tracker', path: '/bug-tracker' },
    { label: 'Deployment', path: '/deployment' },
    { label: 'Reports', path: '/reports/projects' },
    { label: 'Team Workload', path: '/teams/technical/workload' },
  ],
  support: [
    { label: 'Team Members', path: '/teams/support/members' },
    { label: 'Open Tickets', path: '/teams/support/open-tickets' },
    { label: 'Assigned Tickets', path: '/teams/support/assigned-tickets' },
    { label: 'Resolved Tickets', path: '/teams/support/resolved-tickets' },
    { label: 'Escalations', path: '/escalations' },
    { label: 'Performance', path: '/teams/support/performance' },
    { label: 'Knowledge Base', path: '/knowledge-base' },
    { label: 'Customers', path: '/customers/all' },
  ],
};

export const SALES_QUICK_LINKS = [
  { label: 'My Leads', path: '/leads' },
  { label: 'Deal Pipeline', path: '/deals' },
  { label: 'Today Follow-ups', path: '/follow-ups/today' },
  { label: 'Lead Follow-ups', path: '/leads/follow-ups' },
  { label: 'Deal Follow-ups', path: '/deals/follow-ups' },
  { label: 'Customers', path: '/customers/all' },
  { label: 'Qualified Leads', path: '/qualified-leads' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Sales Reports', path: '/reports/sales' },
];

export const ADMIN_PIPELINE_STAGES = [
  { label: 'Leads', statKey: 'totalLeads', path: '/leads', accent: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30' },
  { label: 'Deals', statKey: 'totalDeals', path: '/deals', accent: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30' },
  { label: 'Customers', statKey: 'totalCustomers', path: '/customers/all', accent: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/30' },
  { label: 'Projects', statKey: 'totalProjects', path: '/projects', accent: 'from-indigo-500/20 to-indigo-600/5', border: 'border-indigo-500/30' },
  { label: 'Tickets', statKey: 'openTickets', path: '/tickets', accent: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/30' },
];

export const ADMIN_KPI_CARDS = [
  { label: 'Qualified Leads', key: 'qualifiedLeads', path: '/qualified-leads', format: 'number' },
  { label: 'Active Deals', key: 'activeDeals', path: '/deals', format: 'number' },
  { label: 'Pending Quotations', key: 'pendingQuotations', path: '/deals', format: 'number' },
  { label: 'Pending Invoices', key: 'pendingInvoices', path: '/invoices', format: 'number', roleKey: true },
  { label: 'Monthly Income', key: 'monthlyIncome', path: '/payments', format: 'currency', roleKey: true },
  { label: 'Total Revenue', key: 'totalRevenue', path: '/reports', format: 'currency' },
  { label: 'Conversion', key: 'conversionRate', path: '/reports/leads', format: 'percent' },
  { label: 'Team Present', key: 'teamPerformance', path: '/performance', format: 'percent' },
];

export const ADMIN_SUPPORT_STAT_CARDS = [
  { label: 'Projects Received', key: 'totalProjectsReceived', path: '/support/submitted-projects', color: 'text-indigo-400' },
  { label: 'Awaiting Delivery', key: 'projectsAwaitingDelivery', path: '/support/project-delivery', color: 'text-amber-400' },
  { label: 'Customer Acceptance', key: 'pendingCustomerAcceptance', path: '/support/customer-acceptance', color: 'text-yellow-400' },
  { label: 'Active Support', key: 'inSupport', path: '/projects/support-active', color: 'text-blue-400' },
  { label: 'Unassigned Tickets', key: 'unassignedTickets', path: '/support/tickets/all', color: 'text-rose-400' },
  { label: 'Escalated', key: 'escalations', path: '/support/tickets/escalated', color: 'text-orange-400' },
  { label: 'Change Requests', key: 'pendingChangeRequests', path: '/support/change-requests', color: 'text-purple-400' },
];

export const ADMIN_QUICK_LINKS = [
  { label: 'Employees', path: '/users' },
  { label: 'Roles & Permissions', path: '/permissions' },
  { label: 'Teams', path: '/settings?tab=staff-roles' },
  { label: 'Leads', path: '/leads' },
  { label: 'Deals', path: '/deals' },
  { label: 'Customers', path: '/customers/all' },
  { label: 'Projects', path: '/projects' },
  { label: 'Tech Submissions', path: '/projects/tech-submissions' },
  { label: 'Support Delivery', path: '/support/project-delivery' },
  { label: 'Support Review', path: '/projects/support-review' },
  { label: 'Customer Acceptance', path: '/support/customer-acceptance' },
  { label: 'Support Tickets', path: '/support/tickets/all' },
  { label: 'Ticket History', path: '/support-logs' },
  { label: 'Support Follow-ups', path: '/support/follow-ups/today' },
  { label: 'Tickets', path: '/tickets' },
  { label: 'Invoices', path: '/invoices' },
  { label: 'Reports', path: '/reports' },
  { label: 'Settings', path: '/settings' },
];

export const ADMIN_DASHBOARD_PANELS = [
  { label: 'Admin', subtitle: 'admin@mythisoft.com', path: '/dashboard', dept: 'all' },
  { label: 'Sales Manager', subtitle: 'manager@mythisoft.com', path: '/teams/sales/members', dept: 'sales' },
  { label: 'Tech Manager', subtitle: 'tech.manager@mythisoft.com', path: '/teams/technical/members', dept: 'technical' },
  { label: 'Support Manager', subtitle: 'Delivery, tickets & team follow-ups', path: '/support/submitted-projects', dept: 'support' },
  { label: 'Sales Rep', subtitle: 'meera · rajesh · arun', path: '/leads', dept: 'sales' },
  { label: 'Technical Staff', subtitle: 'technical · deepak · rohit', path: '/projects', dept: 'technical' },
  { label: 'Support Staff', subtitle: 'support · kavita', path: '/tickets', dept: 'support' },
  { label: 'Customer Portal', subtitle: 'customer@mythisoft.com', path: '/customers/all', dept: 'customer' },
];

export const DEPT_MODULE_LINKS = {
  sales: [
    { label: 'Leads', path: '/leads' },
    { label: 'Deals', path: '/deals' },
    { label: 'Team', path: '/teams/sales/members' },
    { label: 'Reports', path: '/reports/sales' },
  ],
  technical: [
    { label: 'Projects', path: '/projects' },
    { label: 'Active', path: '/teams/technical/active' },
    { label: 'Team', path: '/teams/technical/members' },
    { label: 'Submissions', path: '/projects/tech-submissions' },
  ],
  support: [
    { label: 'Submitted Projects', path: '/support/submitted-projects' },
    { label: 'Delivery Queue', path: '/support/project-delivery' },
    { label: 'Open Tickets', path: '/support/tickets/all' },
    { label: 'Ticket History', path: '/support-logs' },
    { label: 'Team', path: '/teams/support/members' },
    { label: 'Follow-ups', path: '/support/follow-ups/today' },
  ],
};
