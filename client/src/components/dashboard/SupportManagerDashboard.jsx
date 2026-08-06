import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Headphones, ClipboardCheck, CheckCircle2, AlertTriangle, Users, Layers,
  Bell, Crown, Ticket, UserPlus, FolderKanban, ArrowRight,
  Send, Star, Clock, FileEdit, Truck, UserCheck, XCircle, Calendar,
  ListTodo, PlusCircle, ClipboardList, Radio, Inbox,
} from 'lucide-react';
import { DEPARTMENT_LABELS } from '../../utils/roleContext';
import {
  SUPPORT_MANAGER_WORKFLOW,
  SUPPORT_MANAGER_DELIVERY_FLOW,
  SUPPORT_MANAGER_TICKET_FLOW,
  SUPPORT_MANAGER_QUICK_ACTIONS,
} from '../../constants/supportManagerNav';
import { SUPPORT_REVIEW_STATUSES } from '../../constants/supportWorkflow';
import CustomerAcceptanceBadge from '../projects/CustomerAcceptanceBadge';
import MarkCustomerAcceptedButton from '../projects/MarkCustomerAcceptedButton';
import StatusBadge from '../StatusBadge';
import { TICKET_PRIORITIES, TICKET_STATUSES, formatDateTime } from '../../services/api';
import { isPendingCustomerAcceptance } from '../../utils/customerAcceptance';
import { projectVersion } from '../../constants/customerPortalNav';

const SUMMARY_CARDS = [
  { key: 'totalProjectsReceived', label: 'Projects Received', icon: Send, link: '/support/submitted-projects', color: 'text-indigo-400' },
  { key: 'projectsAwaitingDelivery', label: 'Awaiting Delivery', icon: Truck, link: '/support/project-delivery', color: 'text-amber-400' },
  { key: 'pendingCustomerAcceptance', label: 'Awaiting Acceptance', icon: UserCheck, link: '/support/customer-acceptance', color: 'text-yellow-400' },
  { key: 'inSupport', label: 'Support Active', icon: Radio, link: '/projects/support-active', color: 'text-blue-400' },
  { key: 'openTickets', label: 'Open Tickets', icon: Ticket, link: '/support/tickets/all', color: 'text-orange-400' },
  { key: 'inProgressTickets', label: 'In Progress', icon: Clock, link: '/support/tickets/assigned', color: 'text-cyan-400' },
  { key: 'escalations', label: 'Escalated', icon: AlertTriangle, link: '/support/tickets/escalated', color: 'text-rose-400' },
  { key: 'pendingChangeRequests', label: 'Change Requests', icon: FileEdit, link: '/support/change-requests', color: 'text-purple-400' },
];

const QUICK_ICONS = {
  delivery: Truck,
  review: ClipboardCheck,
  acceptance: UserCheck,
  task: PlusCircle,
  ticket: Ticket,
  followups: ListTodo,
  today: Calendar,
  team: Users,
};

function formatMetric(value) {
  if (value == null) return '0';
  return String(value);
}

function personName(user) {
  if (!user) return '—';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—';
}

function reviewLabel(status) {
  const meta = SUPPORT_REVIEW_STATUSES[status];
  return meta?.label || status?.replace(/_/g, ' ') || '—';
}

export default function SupportManagerDashboard({ departmentOverview, roleStats, supportManagerOverview }) {
  const deptLabel = DEPARTMENT_LABELS.support || 'Support';
  const stats = roleStats || {};
  const overview = departmentOverview || { recentEmployees: [], followupOverview: null };
  const smOverview = supportManagerOverview || {};
  const { recentEmployees = [], followupOverview, totalEmployees } = overview;
  const fu = followupOverview || {};
  const members = stats.totalTeamMembers ?? totalEmployees ?? recentEmployees.length;

  const recentDeliveries = smOverview.recentProjectDeliveries || smOverview.recentHandoffs || [];
  const recentOpenTickets = smOverview.recentOpenTickets || [];
  const recentChangeRequests = smOverview.recentChangeRequests || [];
  const recentNotifications = smOverview.recentNotifications || [];
  const pendingFromOverview = (smOverview.pendingCustomerAcceptanceProjects || []).filter(isPendingCustomerAcceptance);
  const [pendingAcceptanceProjects, setPendingAcceptanceProjects] = useState(pendingFromOverview);

  useEffect(() => {
    setPendingAcceptanceProjects(pendingFromOverview);
  }, [smOverview.pendingCustomerAcceptanceProjects]);

  const handleAcceptanceRecorded = (updatedProject) => {
    if (updatedProject?._id) {
      setPendingAcceptanceProjects((prev) => prev.filter((p) => p._id !== updatedProject._id));
    }
  };

  const followUpCards = [
    { key: 'customerFollowUps', label: 'Team Follow-ups', icon: ListTodo, link: '/support/follow-ups', color: 'text-teal-400' },
    { key: 'todayFollowUps', label: 'Today', icon: Calendar, link: '/support/follow-ups/today', color: 'text-amber-400' },
    { key: 'overdueFollowUps', label: 'Overdue', icon: AlertTriangle, link: '/support/follow-ups/overdue', color: 'text-red-400' },
    { key: 'completedFollowUps', label: 'Completed', icon: CheckCircle2, link: '/support/follow-ups/completed', color: 'text-green-400' },
  ];

  const attentionItems = [
    (stats.pendingReview ?? 0) > 0 && {
      key: 'review',
      tone: 'amber',
      title: `${stats.pendingReview} project(s) awaiting your review`,
      link: '/support/submitted-projects',
      linkLabel: 'Review now',
    },
    (stats.pendingCustomerAcceptance ?? 0) > 0 && {
      key: 'acceptance',
      tone: 'yellow',
      title: `${stats.pendingCustomerAcceptance} project(s) awaiting customer acceptance`,
      link: '/support/customer-acceptance',
      linkLabel: 'View acceptance',
    },
    (fu.overdueFollowUps ?? 0) > 0 && {
      key: 'overdue-fu',
      tone: 'red',
      title: `${fu.overdueFollowUps} overdue team follow-up(s)`,
      link: '/support/follow-ups/overdue',
      linkLabel: 'View overdue',
    },
    (stats.escalations ?? 0) > 0 && {
      key: 'escalations',
      tone: 'orange',
      title: `${stats.escalations} escalated ticket(s) need attention`,
      link: '/support/tickets/escalated',
      linkLabel: 'View escalations',
    },
  ].filter(Boolean);

  const toneClasses = {
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
    yellow: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-200',
    red: 'border-red-500/30 bg-red-500/5 text-red-200',
    orange: 'border-orange-500/30 bg-orange-500/5 text-orange-200',
  };

  return (
    <div className="space-y-4">
      <div className="card border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Crown size={16} lg:size={20} className="text-orange-400" /> Support Manager Dashboard
            </h2>
            <p className="text-xs lg:text-sm text-gray-400 mt-1">
              {deptLabel} · delivery pipeline, team follow-ups, tickets & customer acceptance
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {(stats.pendingReview ?? 0) > 0 && (
              <Link to="/support/submitted-projects" className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {stats.pendingReview} to review
              </Link>
            )}
            {(stats.pendingCustomerAcceptance ?? 0) > 0 && (
              <Link to="/support/customer-acceptance" className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300">
                {stats.pendingCustomerAcceptance} awaiting acceptance
              </Link>
            )}
            {(fu.todayFollowUps ?? 0) > 0 && (
              <Link to="/support/follow-ups/today" className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300">
                {fu.todayFollowUps} follow-up{fu.todayFollowUps !== 1 ? 's' : ''} today
              </Link>
            )}
            {(fu.overdueFollowUps ?? 0) > 0 && (
              <Link to="/support/follow-ups/overdue" className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300">
                {fu.overdueFollowUps} overdue
              </Link>
            )}
            <span className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
              {stats.inSupport ?? 0} active support
            </span>
            <span className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300">
              {members} team members
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-myth-border/60 grid sm:grid-cols-2 gap-3 lg:gap-4 text-[10px] lg:text-xs">
          <div>
            <p className="text-gray-500 uppercase tracking-wide mb-1.5">Delivery pipeline</p>
            <div className="flex flex-wrap items-center gap-1.5 text-gray-300">
              {SUPPORT_MANAGER_DELIVERY_FLOW.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight size={10} lg:size={12} className="text-gray-600" />}
                  {step}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-500 uppercase tracking-wide mb-1.5">Ticket workflow</p>
            <div className="flex flex-wrap items-center gap-1.5 text-gray-300">
              {SUPPORT_MANAGER_TICKET_FLOW.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight size={10} lg:size={12} className="text-gray-600" />}
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {attentionItems.length > 0 && (
        <div className="card border-orange-500/20">
          <h3 className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Needs Attention</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
            {attentionItems.map((item) => {
              const Icon = item.key === 'review' ? ClipboardCheck : item.key === 'acceptance' ? UserCheck : AlertTriangle;
              return (
                <Link
                  key={item.key}
                  to={item.link}
                  className={`p-2 lg:p-3 rounded-lg border ${toneClasses[item.tone]} hover:border-${item.tone}-500/50 transition-colors`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} lg:size={16} className="shrink-0" />
                    <span className="text-[10px] lg:text-xs font-medium">{item.linkLabel}</span>
                  </div>
                  <p className="text-[10px] lg:text-xs text-gray-300">{item.title}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-3">
          {SUMMARY_CARDS.map((card) => {
            const Icon = card.icon;
            const value = stats[card.key] ?? 0;
            return (
              <Link key={card.key} to={card.link} className="p-2 lg:p-3 rounded-xl bg-myth-surface/50 border border-myth-border hover:border-myth-accent/30 transition-colors">
                <Icon size={14} lg:size={16} className={`${card.color} mb-1 lg:mb-2`} />
                <p className="text-[10px] lg:text-xs text-gray-400">{card.label}</p>
                <p className="text-xl lg:text-2xl font-bold text-white mt-1">{value}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Team Follow-ups</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
          {followUpCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.key}
                to={card.link}
                className="p-2 lg:p-4 rounded-xl bg-myth-surface/50 border border-myth-border hover:border-teal-500/30 transition-colors"
              >
                <Icon size={14} lg:size={16} className={`${card.color} mb-1 lg:mb-2`} />
                <p className="text-[10px] lg:text-xs text-gray-400">{card.label}</p>
                <p className="text-xl lg:text-2xl font-bold text-white mt-1">{formatMetric(fu[card.key])}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {pendingAcceptanceProjects.length > 0 && (
        <div className="card border-yellow-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <UserCheck size={14} lg:size={18} className="text-yellow-400" /> Awaiting Customer Acceptance
            </h3>
            <Link to="/support/customer-acceptance" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {pendingAcceptanceProjects.slice(0, 5).map((p) => (
              <div
                key={p._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50"
              >
                <div>
                  <Link to={`/projects/${p._id}`} className="text-white font-medium hover:text-myth-accent text-sm lg:text-base">{p.name}</Link>
                  <p className="text-[10px] lg:text-xs text-gray-500 mt-1">{personName(p.customer)}</p>
                  <div className="mt-1">
                    <CustomerAcceptanceBadge project={p} showWhenIdle />
                  </div>
                </div>
                <MarkCustomerAcceptedButton project={p} compact onDone={handleAcceptanceRecorded} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 items-start">
        <div className="lg:col-span-2 space-y-3 lg:space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                <FolderKanban size={14} lg:size={18} className="text-orange-400" /> Recent Project Deliveries
              </h3>
              <Link to="/support/submitted-projects" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
            </div>
            {recentDeliveries.length === 0 ? (
              <p className="text-xs lg:text-sm text-gray-500 py-6 text-center">No project deliveries yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm">
                  <thead>
                    <tr>
                      <th className="table-header">Project</th>
                      <th className="table-header">Version</th>
                      <th className="table-header">Submitted By</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDeliveries.slice(0, 6).map((p) => (
                      <tr key={p._id} className="border-t border-myth-border">
                        <td className="table-cell">
                          <Link to={`/projects/${p._id}`} className="text-white hover:text-myth-accent">{p.name}</Link>
                        </td>
                        <td className="table-cell text-gray-400">{projectVersion(p)}</td>
                        <td className="table-cell text-gray-300">{personName(p.manager)}</td>
                        <td className="table-cell">
                          <span className="text-[10px] lg:text-xs text-gray-300">{reviewLabel(p.supportReviewStatus)}</span>
                          <CustomerAcceptanceBadge project={p} />
                        </td>
                        <td className="table-cell text-gray-400">
                          {p.supportHandoffAt ? new Date(p.supportHandoffAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                  <Ticket size={14} lg:size={18} className="text-orange-400" /> Recent Tickets
                </h3>
                <Link to="/support/tickets/all" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
              </div>
              {recentOpenTickets.length === 0 ? (
                <p className="text-xs lg:text-sm text-gray-500 py-4 text-center">No open tickets</p>
              ) : (
                <div className="space-y-2">
                  {recentOpenTickets.slice(0, 5).map((t) => (
                    <Link
                      key={t._id}
                      to={`/tickets/${t._id}`}
                      className="flex items-center justify-between gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50 hover:border-orange-500/30 text-xs lg:text-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-myth-accent font-mono text-[10px] lg:text-xs">{t.ticketNumber}</p>
                        <p className="text-white truncate text-sm lg:text-base">{personName(t.customer)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={t.priority} config={TICKET_PRIORITIES} />
                        <StatusBadge status={t.status} config={TICKET_STATUSES} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                  <FileEdit size={14} lg:size={18} className="text-purple-400" /> Change Requests
                </h3>
                <Link to="/support/change-requests" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
              </div>
              {recentChangeRequests.length === 0 ? (
                <p className="text-xs lg:text-sm text-gray-500 py-4 text-center">No change requests</p>
              ) : (
                <div className="space-y-2">
                  {recentChangeRequests.slice(0, 5).map((r) => (
                    <Link
                      key={r._id}
                      to={`/tickets/${r._id}`}
                      className="flex items-center justify-between gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50 hover:border-purple-500/30 text-xs lg:text-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-myth-accent font-mono text-[10px] lg:text-xs">{r.ticketNumber}</p>
                        <p className="text-white truncate">{personName(r.customer)}</p>
                      </div>
                      <StatusBadge status={r.status} config={TICKET_STATUSES} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                <Users size={14} lg:size={18} className="text-orange-400" /> Support Team
              </h3>
              <Link to="/teams/support/manage" className="text-xs lg:text-sm text-myth-accent hover:underline">Manage teams →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs lg:text-sm">
                <thead>
                  <tr>
                    <th className="table-header">Name</th>
                    <th className="table-header">ID</th>
                    <th className="table-header">Role</th>
                    <th className="table-header">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEmployees.length ? recentEmployees.slice(0, 8).map((e) => (
                    <tr key={e._id} className="border-t border-myth-border/50">
                      <td className="table-cell text-white">{e.firstName} {e.lastName}</td>
                      <td className="table-cell font-mono text-myth-accent text-[10px] lg:text-xs">{e.employeeId || '—'}</td>
                      <td className="table-cell">
                        <span className="badge text-[10px] lg:text-xs capitalize bg-orange-500/20 text-orange-300">{e.role}</span>
                      </td>
                      <td className="table-cell text-gray-500 text-[10px] lg:text-xs">{e.email}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="table-cell text-center text-gray-500 py-6">No support team members yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-3 lg:space-y-4">
          <div className="card">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ClipboardList size={14} lg:size={18} className="text-orange-400" /> Quick Actions
            </h3>
            <div className="space-y-2">
              {SUPPORT_MANAGER_QUICK_ACTIONS.map((action) => {
                const Icon = QUICK_ICONS[action.icon] || ArrowRight;
                const badgeVal = action.badgeKey
                  ? (['customerFollowUps', 'todayFollowUps', 'overdueFollowUps', 'completedFollowUps'].includes(action.badgeKey)
                    ? fu[action.badgeKey]
                    : stats[action.badgeKey])
                  : 0;
                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    className={`flex items-center justify-between gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg border transition-colors ${
                      action.primary
                        ? 'bg-orange-500/10 border-orange-500/40 text-white hover:bg-orange-500/20'
                        : 'bg-myth-surface/50 border-myth-border text-gray-300 hover:border-myth-accent/30'
                    }`}
                  >
                    <span className="flex items-center gap-2 lg:gap-3 min-w-0">
                      <Icon size={14} lg:size={18} className={action.primary ? 'text-orange-400' : 'text-gray-400'} />
                      <span className="text-xs lg:text-sm font-medium">{action.label}</span>
                    </span>
                    {Number(badgeVal) > 0 && (
                      <span className="text-[10px] lg:text-xs px-2 py-0.5 rounded-full bg-myth-accent/20 text-myth-accent shrink-0">
                        {badgeVal}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                <Bell size={14} lg:size={18} className="text-orange-400" /> Notifications
              </h3>
              <Link to="/notifications" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
            </div>
            {recentNotifications.length > 0 ? (
              <ul className="space-y-2">
                {recentNotifications.map((n) => (
                  <li key={n._id} className={`text-xs lg:text-sm px-2 lg:px-3 py-2 rounded-lg border border-myth-border/50 ${n.isRead ? 'text-gray-400' : 'bg-orange-500/5 text-white'}`}>
                    <p className="font-medium text-sm lg:text-base">{n.title}</p>
                    {n.message && <p className="text-[10px] lg:text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-[10px] lg:text-xs text-gray-600 mt-1">{formatDateTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs lg:text-sm text-gray-500">No notifications yet</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link to="/teams/support/members" className="p-2 lg:p-3 rounded-lg bg-myth-surface/50 border border-myth-border hover:border-orange-500/30 text-center">
              <Layers size={14} lg:size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-base lg:text-lg font-bold text-white">{stats.totalTeamMembers ?? 0}</p>
              <p className="text-[10px] lg:text-xs text-gray-500">Team Members</p>
            </Link>
            <Link to="/teams/support/performance" className="p-2 lg:p-3 rounded-lg bg-myth-surface/50 border border-myth-border hover:border-orange-500/30 text-center">
              <Star size={14} lg:size={16} className="text-yellow-400 mx-auto mb-1" />
              <p className="text-base lg:text-lg font-bold text-white">{stats.customerRating ? `${stats.customerRating}/5` : '—'}</p>
              <p className="text-[10px] lg:text-xs text-gray-500">Avg Rating</p>
            </Link>
          </div>

          <div className="card border-myth-border/80">
            <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-wide mb-3">Manager workflow</p>
            <ol className="space-y-2">
              {SUPPORT_MANAGER_WORKFLOW.map((step, i) => (
                <li key={step} className="flex items-start gap-2 text-xs lg:text-sm text-gray-400">
                  <span className="text-orange-400 font-mono text-[10px] lg:text-xs mt-0.5 shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
