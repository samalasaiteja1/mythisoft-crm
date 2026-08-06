import { Link } from 'react-router-dom';
import {
  Building2, FolderKanban, Headphones, Bell, FileEdit, AlertCircle, Calendar,
  Activity, DollarSign, MessageSquare, ArrowRight, ClipboardCheck, Ticket, FileText,
  CheckCircle2, PlayCircle, ShieldCheck, LayoutGrid, Radio, Archive, Clock, ThumbsUp,
  Inbox, User, Handshake,
} from 'lucide-react';
import SupportContactCard from '../support/SupportContactCard';
import TechnicalContactCard from '../technical/TechnicalContactCard';
import StatusBadge from '../StatusBadge';
import CustomerAcceptanceBadge from '../projects/CustomerAcceptanceBadge';
import CustomerAcceptProjectButton from '../projects/CustomerAcceptProjectButton';
import { PROJECT_STATUSES, TICKET_PRIORITIES, formatDateTime } from '../../services/api';
import {
  projectVersion,
  CUSTOMER_PORTAL_WORKFLOW,
  CUSTOMER_QUICK_ACTIONS,
  CUSTOMER_PROJECT_FLOW,
  CUSTOMER_TICKET_FLOW,
} from '../../constants/customerPortalNav';
import { isPendingCustomerAcceptance } from '../../utils/customerAcceptance';
import { SUPPORT_REVIEW_STATUSES } from '../../constants/supportWorkflow';
import { ticketStatusMeta, canCustomerConfirm } from '../../constants/ticketStatusFlows';

const SUMMARY = [
  { key: 'totalProjects', label: 'My Projects', icon: FolderKanban, link: '/projects', color: 'text-indigo-400' },
  { key: 'awaitingAcceptance', label: 'Awaiting Acceptance', icon: ClipboardCheck, link: '/projects?tab=acceptance', color: 'text-amber-400' },
  { key: 'activeProjects', label: 'Active Projects', icon: Activity, link: '/projects?tab=active', color: 'text-cyan-400' },
  { key: 'inSupportProjects', label: 'In Support', icon: Radio, link: '/projects?tab=support', color: 'text-blue-400' },
  { key: 'openTickets', label: 'Open Tickets', icon: Ticket, link: '/tickets', color: 'text-orange-400' },
  { key: 'ticketsInProgress', label: 'Tickets In Progress', icon: PlayCircle, link: '/tickets?tab=progress', color: 'text-cyan-400' },
  { key: 'ticketsAwaitingConfirmation', label: 'Confirm Fix', icon: ThumbsUp, link: '/tickets?tab=confirm', color: 'text-yellow-400' },
  { key: 'pendingChangeRequests', label: 'Change Requests', icon: FileEdit, link: '/change-requests', color: 'text-purple-400' },
  { key: 'pendingInvoices', label: 'Pending Invoices', icon: DollarSign, link: '/invoices', color: 'text-emerald-400' },
  { key: 'unreadNotifications', label: 'Unread Alerts', icon: Bell, link: '/notifications', color: 'text-myth-accent' },
];

const QUICK_ICONS = {
  accept: ClipboardCheck,
  ticket: Ticket,
  confirm: ShieldCheck,
  change: FileEdit,
  documents: FileText,
  invoices: DollarSign,
};

function supportStatusBadge(status) {
  const meta = SUPPORT_REVIEW_STATUSES[status];
  if (!meta) return null;
  return <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>;
}

function ticketBadge(status) {
  const meta = ticketStatusMeta(status);
  return <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>;
}

function ticketActionHint(status) {
  if (status === 'waiting_customer') return 'Reply needed';
  if (canCustomerConfirm(status)) return 'Confirm fix';
  if (['assigned', 'accepted', 'working'].includes(status)) return 'In progress';
  if (status === 'open') return 'Awaiting assignment';
  return null;
}

function eventIcon(type) {
  if (type === 'meeting') return Calendar;
  if (type === 'invoice') return DollarSign;
  return Clock;
}

export default function CustomerMainDashboard({
  customerOverview,
  roleStats,
  recentActivities = [],
  calendarEvents = [],
}) {
  if (!customerOverview?.customer) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">Your customer profile is not linked yet. Contact MYTHISOFT support.</p>
      </div>
    );
  }

  const {
    customer,
    projects = [],
    invoices = [],
    recentTickets = [],
    recentNotifications = [],
    recentChangeRequests = [],
    actionTickets = [],
    pendingAcceptanceProjects = [],
    leads = [],
    deals = [],
    technicalContact,
    supportExecutiveContact,
  } = customerOverview;

  const stats = roleStats || {};
  const supportContact = supportExecutiveContact || customer?.supportAssignee;
  const unreadNotifications = recentNotifications.filter((n) => !n.isRead);
  const overdueInvoices = invoices.filter(
    (i) => i.dueDate && !['paid', 'cancelled'].includes(i.status) && new Date(i.dueDate) < new Date(),
  );
  const acceptanceProjects = pendingAcceptanceProjects.length
    ? pendingAcceptanceProjects
    : projects.filter(isPendingCustomerAcceptance);

  const attentionItems = [
    acceptanceProjects.length > 0 && {
      key: 'acceptance',
      tone: 'amber',
      title: `${acceptanceProjects.length} project${acceptanceProjects.length > 1 ? 's' : ''} ready for your review`,
      body: 'Review delivery and confirm acceptance to activate support.',
      link: acceptanceProjects[0]
        ? `/projects/${acceptanceProjects[0]._id}/review`
        : '/projects/accept',
      linkLabel: 'Review now',
    },
    Number(stats.ticketsAwaitingConfirmation) > 0 && {
      key: 'confirm',
      tone: 'yellow',
      title: `${stats.ticketsAwaitingConfirmation} ticket${stats.ticketsAwaitingConfirmation > 1 ? 's' : ''} awaiting your confirmation`,
      body: 'Your support team has fixed the issue — please confirm or reply.',
      link: '/tickets?tab=confirm',
      linkLabel: 'Confirm fix',
    },
    Number(stats.waitingOnCustomerTickets) > 0 && {
      key: 'tickets',
      tone: 'orange',
      title: `${stats.waitingOnCustomerTickets} ticket${stats.waitingOnCustomerTickets > 1 ? 's' : ''} waiting on you`,
      body: 'Your support team needs information to continue.',
      link: '/tickets?tab=confirm',
      linkLabel: 'View tickets',
    },
    unreadNotifications.length > 0 && {
      key: 'notifications',
      tone: 'cyan',
      title: `${unreadNotifications.length} unread notification${unreadNotifications.length > 1 ? 's' : ''}`,
      body: 'Updates on your projects, tickets, and deliveries.',
      link: '/notifications',
      linkLabel: 'View all',
    },
    overdueInvoices.length > 0 && {
      key: 'invoices',
      tone: 'red',
      title: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}`,
      body: 'Please review outstanding payments.',
      link: '/invoices',
      linkLabel: 'View invoices',
    },
  ].filter(Boolean);

  const toneClasses = {
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
    yellow: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-200',
    orange: 'border-orange-500/30 bg-orange-500/5 text-orange-200',
    cyan: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-200',
    red: 'border-red-500/30 bg-red-500/5 text-red-200',
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="card border-myth-accent/20 bg-gradient-to-br from-myth-accent/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Building2 size={16} lg:size={20} className="text-myth-accent" />
              Welcome, {customer.firstName} {customer.lastName}
            </h2>
            <p className="text-xs lg:text-sm text-gray-400 mt-1">
              {customer.companyName || customer.company?.name || 'Customer'} · {customer.email}
            </p>
            <p className="text-[10px] lg:text-xs text-gray-500 mt-2 max-w-xl">
              Track project delivery, accept handoffs, raise tickets, and request changes — all in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {Number(stats.awaitingAcceptance) > 0 && (
              <Link to="/projects/accept" className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {stats.awaitingAcceptance} to accept
              </Link>
            )}
            {Number(stats.ticketsAwaitingConfirmation) > 0 && (
              <Link to="/tickets?tab=confirm" className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300">
                {stats.ticketsAwaitingConfirmation} to confirm
              </Link>
            )}
            {Number(stats.openTickets) > 0 && (
              <span className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300">
                {stats.openTickets} open ticket{stats.openTickets !== 1 ? 's' : ''}
              </span>
            )}
            <Link to="/tickets/create" className="btn-primary text-xs lg:text-sm">Create Ticket</Link>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-myth-border/60 grid sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-gray-500 uppercase tracking-wide mb-1.5">Project journey</p>
            <div className="flex flex-wrap items-center gap-1.5 text-gray-300">
              {CUSTOMER_PROJECT_FLOW.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight size={12} className="text-gray-600" />}
                  {step}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-500 uppercase tracking-wide mb-1.5">Ticket workflow</p>
            <div className="flex flex-wrap items-center gap-1.5 text-gray-300">
              {CUSTOMER_TICKET_FLOW.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight size={12} className="text-gray-600" />}
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {attentionItems.length > 0 && (
        <div className="space-y-2">
          {attentionItems.map((item) => (
            <div key={item.key} className={`card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 lg:gap-3 ${toneClasses[item.tone]}`}>
              <div className="flex items-start gap-2 lg:gap-3 min-w-0">
                <AlertCircle size={14} lg:size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs lg:text-sm font-medium">{item.title}</p>
                  <p className="text-[10px] lg:text-xs text-gray-400 mt-0.5">{item.body}</p>
                </div>
              </div>
              <Link to={item.link} className="text-xs lg:text-sm text-myth-accent hover:underline inline-flex items-center gap-1 shrink-0">
                {item.linkLabel} <ArrowRight size={12} lg:size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3">
          {SUMMARY.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.key}
                to={card.link}
                className="p-2 lg:p-4 rounded-xl bg-myth-surface/50 border border-myth-border hover:border-myth-accent/30 transition-colors"
              >
                <Icon size={14} lg:size={16} className={`${card.color} mb-1 lg:mb-2`} />
                <p className="text-[10px] lg:text-xs text-gray-400">{card.label}</p>
                <p className="text-xl lg:text-2xl font-bold text-white mt-1">{Number(stats[card.key]) || 0}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {actionTickets.length > 0 && (
        <div className="card border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Inbox size={14} lg:size={18} className="text-yellow-400" /> Needs Your Action
            </h3>
            <Link to="/tickets?tab=confirm" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {actionTickets.slice(0, 5).map((t) => {
              const hint = ticketActionHint(t.status);
              return (
                <Link
                  key={t._id}
                  to={`/tickets/${t._id}`}
                  className="flex items-center justify-between gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg bg-myth-surface/40 border border-myth-border/50 hover:border-yellow-500/30 text-xs lg:text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-white truncate">{t.ticketNumber} · {t.subject}</p>
                    <p className="text-xs text-gray-500 truncate">{t.project?.name || 'General support'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {ticketBadge(t.status)}
                    {hint && <span className="text-xs text-yellow-300">{hint}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <SupportContactCard contact={supportContact} title="Your Support Executive" />
        <TechnicalContactCard contact={technicalContact} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <FolderKanban size={14} lg:size={18} className="text-indigo-400" /> My Projects
            </h3>
            <Link to="/projects" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
          </div>
          {projects.length === 0 ? (
            <p className="text-xs lg:text-sm text-gray-500 py-6 text-center">No projects yet — your MYTHISOFT team will add them here.</p>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((p) => (
                <div
                  key={p._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50 text-xs lg:text-sm"
                >
                  <Link to={`/projects/${p._id}`} className="min-w-0 flex-1 hover:text-myth-accent">
                    <p className="text-white font-medium truncate text-sm lg:text-base">{p.name}</p>
                    <p className="text-[10px] lg:text-xs text-gray-500 mt-0.5">
                      {projectVersion(p)}
                      {p.deliveredAt && ` · Delivered ${new Date(p.deliveredAt).toLocaleDateString()}`}
                    </p>
                  </Link>
                  <div className="flex flex-wrap items-center gap-1 lg:gap-2 shrink-0">
                    <StatusBadge status={p.status} config={PROJECT_STATUSES} />
                    {supportStatusBadge(p.supportReviewStatus)}
                    <CustomerAcceptanceBadge project={p} showWhenIdle />
                    <CustomerAcceptProjectButton project={p} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Calendar size={14} lg:size={18} className="text-violet-400" /> Upcoming
            </h3>
            <Link to="/calendar" className="text-xs lg:text-sm text-myth-accent hover:underline">Calendar →</Link>
          </div>
          {calendarEvents.length === 0 ? (
            <p className="text-xs lg:text-sm text-gray-500 py-6 text-center">No upcoming meetings or due dates.</p>
          ) : (
            <div className="space-y-2">
              {calendarEvents.slice(0, 6).map((ev, i) => {
                const Icon = eventIcon(ev.type);
                return (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-myth-surface/30 text-xs lg:text-sm">
                    <Icon size={12} lg:size={14} className="text-gray-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-white truncate text-sm lg:text-base">{ev.title}</p>
                      <p className="text-[10px] lg:text-xs text-gray-500">{formatDateTime(ev.scheduledAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <User size={14} lg:size={18} className="text-emerald-400" /> My Leads
            </h3>
            <span className="text-[10px] lg:text-xs text-gray-500">{leads.length} total</span>
          </div>
          {leads.length === 0 ? (
            <p className="text-xs lg:text-sm text-gray-500 py-4 text-center">No leads found.</p>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <div
                  key={lead._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50 text-xs lg:text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm lg:text-base">{lead.firstName} {lead.lastName}</p>
                    <p className="text-[10px] lg:text-xs text-gray-500">{lead.company || lead.title || '—'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 lg:gap-2 shrink-0">
                    <span className="text-[10px] lg:text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Handshake size={14} lg:size={18} className="text-blue-400" /> My Deals
            </h3>
            <span className="text-[10px] lg:text-xs text-gray-500">{deals.length} total</span>
          </div>
          {deals.length === 0 ? (
            <p className="text-xs lg:text-sm text-gray-500 py-4 text-center">No deals found.</p>
          ) : (
            <div className="space-y-2">
              {deals.map((deal) => (
                <div
                  key={deal._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50 text-xs lg:text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate text-sm lg:text-base">{deal.title}</p>
                    <p className="text-[10px] lg:text-xs text-gray-500">₹{Number(deal.value).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 lg:gap-2 shrink-0">
                    <span className="text-[10px] lg:text-xs px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
                      {deal.stage.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] lg:text-xs text-gray-400">{deal.probability}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Headphones size={14} lg:size={18} className="text-orange-400" /> Recent Tickets
            </h3>
            <Link to="/tickets" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
          </div>
          {recentTickets.length === 0 ? (
            <p className="text-xs lg:text-sm text-gray-500 py-4 text-center">No support tickets yet.</p>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((t) => (
                <Link
                  key={t._id}
                  to={`/tickets/${t._id}`}
                  className="flex items-center justify-between gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50 hover:border-myth-accent/30 text-xs lg:text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-myth-accent font-mono text-[10px] lg:text-xs">{t.ticketNumber}</p>
                    <p className="text-white truncate">{t.subject}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={t.priority} config={TICKET_PRIORITIES} />
                    {ticketBadge(t.status)}
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
            <Link to="/change-requests" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
          </div>
          {recentChangeRequests.length === 0 ? (
            <p className="text-xs lg:text-sm text-gray-500 py-4 text-center">No change requests yet.</p>
          ) : (
            <div className="space-y-2">
              {recentChangeRequests.map((cr) => (
                <Link
                  key={cr._id}
                  to={`/tickets/${cr._id}`}
                  className="flex items-center justify-between gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50 hover:border-myth-accent/30 text-xs lg:text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-white truncate text-sm lg:text-base">{cr.subject}</p>
                    <p className="text-[10px] lg:text-xs text-gray-500 capitalize">{cr.changeScope?.replace(/_/g, ' ') || 'Change request'}</p>
                  </div>
                  {ticketBadge(cr.status)}
                </Link>
              ))}
            </div>
          )}
          <Link to="/change-requests/new" className="btn-secondary text-[10px] lg:text-xs mt-3 inline-flex">+ New change request</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Bell size={14} lg:size={18} className="text-myth-accent" /> Notifications
            </h3>
            <Link to="/notifications" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
          </div>
          {recentNotifications.length === 0 ? (
            <p className="text-xs lg:text-sm text-gray-500 py-4 text-center">No notifications yet.</p>
          ) : (
            <div className="space-y-2">
              {recentNotifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-2 lg:p-3 rounded-lg border text-xs lg:text-sm ${n.isRead ? 'bg-myth-surface/20 border-myth-border/50' : 'bg-myth-accent/5 border-myth-accent/20'}`}
                >
                  <p className="text-white font-medium text-sm lg:text-base">{n.title}</p>
                  <p className="text-[10px] lg:text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message || '—'}</p>
                  <p className="text-[10px] lg:text-xs text-gray-600 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card border-myth-accent/10">
          <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-wide mb-3">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {CUSTOMER_QUICK_ACTIONS.map((action) => {
              const Icon = QUICK_ICONS[action.icon] || ArrowRight;
              const badge = action.badgeKey ? Number(stats[action.badgeKey]) : 0;
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className={`${action.primary ? 'btn-primary' : 'btn-secondary'} text-xs lg:text-sm inline-flex items-center gap-1.5`}
                >
                  <Icon size={14} /> {action.label}
                  {badge > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">{badge}</span>
                  )}
                </Link>
              );
            })}
            <Link to="/profile" className="btn-secondary text-xs lg:text-sm">My Profile</Link>
          </div>
        </div>

        <div className="card border-myth-border/80">
          <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-wide mb-3">Your journey with MYTHISOFT</p>
          <ol className="space-y-2">
            {CUSTOMER_PORTAL_WORKFLOW.map((step, i) => (
              <li key={step} className="flex items-start gap-2 text-xs lg:text-sm text-gray-400">
                <span className="text-myth-accent font-mono text-[10px] lg:text-xs mt-0.5 shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {Number(stats.totalDue) > 0 && (
        <div className="card border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-emerald-200 font-medium">Outstanding balance</p>
            <p className="text-2xl font-bold text-white mt-1">
              ₹{Number(stats.totalDue).toLocaleString('en-IN')}
            </p>
          </div>
          <Link to="/invoices" className="btn-secondary text-sm">View invoices</Link>
        </div>
      )}
    </div>
  );
}
