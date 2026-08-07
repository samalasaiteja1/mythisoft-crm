import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Headphones, FolderKanban, ClipboardList, Ticket, MessageSquare, Bell,
  CheckCircle2, Loader2, ArrowRight, Activity, Clock, Users, FileText,
  AlertCircle, PlayCircle, ThumbsUp, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';
import SupportTaskActions from '../support/SupportTaskActions';
import {
  SUPPORT_PERSON_WORKFLOW,
  SUPPORT_PERSON_TASK_FLOW,
  SUPPORT_PERSON_TICKET_FLOW,
  SUPPORT_PERSON_QUICK_ACTIONS,
} from '../../constants/supportPersonNav';
import { normalizeTaskStatus } from '../../constants/supportExecutive';
import { taskStatusBadge } from '../../constants/supportTaskStatusFlows';
import { ticketStatusMeta, TICKET_WORKER_NEXT_STATUSES } from '../../constants/ticketStatusFlows';
import { supportTaskDetailPath } from '../../utils/supportTaskPaths';
import { SUPPORT_REVIEW_STATUSES } from '../../constants/supportWorkflow';
import SupportStaffDashboardCharts from './SupportStaffDashboardCharts';

const SUMMARY = [
  { key: 'pendingSupportTasks', label: 'New Tasks', icon: ClipboardList, link: '/support/my-tasks', color: 'text-blue-400' },
  { key: 'inProgressTasks', label: 'Tasks In Progress', icon: Loader2, link: '/support/my-tasks', color: 'text-cyan-400' },
  { key: 'completedSupportTasks', label: 'Completed Tasks', icon: CheckCircle2, link: '/support/my-tasks?tab=completed', color: 'text-green-400' },
  { key: 'ticketsToAccept', label: 'Tickets to Accept', icon: ThumbsUp, link: '/support/tickets/assigned?tab=accept', color: 'text-yellow-400' },
  { key: 'ticketsInProgress', label: 'Tickets In Progress', icon: PlayCircle, link: '/support/tickets/assigned?tab=progress', color: 'text-cyan-400' },
  { key: 'ticketsAwaitingReview', label: 'Awaiting Review', icon: Clock, link: '/support/tickets/assigned?tab=completed', color: 'text-purple-400' },
  { key: 'activeTickets', label: 'Active Tickets', icon: Ticket, link: '/support/tickets/assigned', color: 'text-orange-400' },
  { key: 'resolvedTickets', label: 'Resolved Tickets', icon: CheckCircle2, link: '/support/tickets/assigned?tab=resolved', color: 'text-emerald-400' },
  { key: 'myProjects', label: 'My Projects', icon: FolderKanban, link: '/support/my-projects', color: 'text-indigo-400' },
  { key: 'myCustomers', label: 'My Customers', icon: Users, link: '/support/my-customers', color: 'text-purple-400' },
];

function taskBadge(task) {
  const meta = taskStatusBadge(task.taskType || task.taskKey, task.status);
  return <span className={meta.className}>{meta.label}</span>;
}

function ticketBadge(status) {
  const meta = ticketStatusMeta(status);
  return <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>;
}

function projectStatusBadge(status) {
  const meta = SUPPORT_REVIEW_STATUSES[status];
  if (!meta) return <span className="text-xs text-gray-500 capitalize">{status?.replace(/_/g, ' ') || '—'}</span>;
  return <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>;
}

function ticketActionHint(status) {
  const next = TICKET_WORKER_NEXT_STATUSES[status];
  if (next === 'accepted') return 'Accept ticket';
  if (next === 'working') return 'Start work';
  if (next === 'completed') return 'Mark completed';
  if (status === 'completed' || status === 'reviewed') return 'Awaiting manager review';
  return null;
}

function isDueSoon(dueDate) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return due <= end;
}

const QUICK_ICONS = {
  'My Tasks': ClipboardList,
  'Tasks to Accept': ThumbsUp,
  'Active Tickets': Ticket,
  'Accept Tickets': ThumbsUp,
  'My Projects': FolderKanban,
  'Customer Requests': MessageSquare,
  Documents: FileText,
  'Follow-ups Today': Calendar,
};

export default function SupportMainDashboard({ supportOverview, roleStats }) {
  const stats = roleStats || {};
  const navigate = useNavigate();
  const [taskBusyId, setTaskBusyId] = useState('');
  const [mySupportTasks, setMySupportTasks] = useState([]);

  useEffect(() => {
    setMySupportTasks(supportOverview?.mySupportTasks || []);
  }, [supportOverview?.mySupportTasks]);

  const openTasks = useMemo(
    () => mySupportTasks.filter((t) => normalizeTaskStatus(t.status) !== 'completed'),
    [mySupportTasks],
  );

  const dueTodayTasks = useMemo(
    () => openTasks.filter((t) => isDueSoon(t.dueDate)),
    [openTasks],
  );

  const newTasks = useMemo(
    () => openTasks.filter((t) => normalizeTaskStatus(t.status) === 'assigned'),
    [openTasks],
  );

  if (!supportOverview) return null;

  const {
    assignedTickets = [],
    assignedProjects = [],
    activeProjects = [],
    recentActivities = [],
    upcomingFollowups = [],
  } = supportOverview;

  const projectsPreview = (activeProjects?.length ? activeProjects : assignedProjects).slice(0, 4);

  const actionTickets = assignedTickets.filter((t) => {
    const next = TICKET_WORKER_NEXT_STATUSES[t.status];
    return Boolean(next) || ['assigned', 'accepted', 'working'].includes(t.status);
  });

  const updateTask = async (task, status) => {
    const projectId = task.project?._id || task.project;
    setTaskBusyId(task._id);
    try {
      await projectsAPI.completeSupportTask(projectId, task._id, { status });
      if (status === 'completed') {
        toast.success('Task completed');
        navigate(supportTaskDetailPath(projectId, task._id, task));
      } else {
        setMySupportTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status } : t)));
        toast.success('Task updated');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setTaskBusyId('');
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="card border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Headphones size={16} lg:size={20} className="text-orange-400" /> Support Team Dashboard
            </h2>
            <p className="text-xs lg:text-sm text-gray-400 mt-1 max-w-xl">
              Accept tickets, complete tasks, reply to customers, and keep projects moving.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {stats.slaStatus && (
              <span className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-myth-surface border border-myth-border text-gray-300">
                SLA: {stats.slaStatus}
              </span>
            )}
            {Number(stats.ticketsToAccept) > 0 && (
              <Link to="/support/tickets/assigned?tab=accept" className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300">
                {stats.ticketsToAccept} ticket{stats.ticketsToAccept !== 1 ? 's' : ''} to accept
              </Link>
            )}
            {newTasks.length > 0 && (
              <Link to="/support/my-tasks" className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
                {newTasks.length} new task{newTasks.length !== 1 ? 's' : ''}
              </Link>
            )}
            {dueTodayTasks.length > 0 && (
              <span className="text-[10px] lg:text-xs px-2 lg:px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                <Clock size={10} lg:size={12} /> {dueTodayTasks.length} due today
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-myth-border/60 grid sm:grid-cols-2 gap-3 lg:gap-4 text-[10px] lg:text-xs">
          <div>
            <p className="text-gray-500 uppercase tracking-wide mb-1.5">Task workflow</p>
            <div className="flex flex-wrap items-center gap-1.5 text-gray-300">
              {SUPPORT_PERSON_TASK_FLOW.map((step, i) => (
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
              {SUPPORT_PERSON_TICKET_FLOW.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight size={10} lg:size={12} className="text-gray-600" />}
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SupportStaffDashboardCharts />

      <div>
        <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3">
          {SUMMARY.map((item) => {
            const Icon = item.icon;
            const count = Number(stats[item.key]) || 0;
            return (
              <Link key={item.key} to={item.link} className="p-2 lg:p-4 rounded-xl bg-myth-surface/50 border border-myth-border hover:border-myth-accent/30 transition-colors">
                <Icon size={14} lg:size={16} className={`${item.color} mb-1 lg:mb-2`} />
                <p className="text-[10px] lg:text-xs text-gray-400">{item.label}</p>
                <p className="text-xl lg:text-2xl font-bold text-white mt-1">{count}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {actionTickets.length > 0 && (
        <div className="card border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle size={14} lg:size={18} className="text-yellow-400" /> Tickets Needing Action
            </h3>
            <Link to="/support/tickets/assigned" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
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
                    <p className="text-white truncate text-sm lg:text-base">{t.ticketNumber} · {t.subject}</p>
                    <p className="text-[10px] lg:text-xs text-gray-500 truncate">{t.project?.name || t.customer?.companyName || 'Customer ticket'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {ticketBadge(t.status)}
                    {hint && <span className="text-[10px] lg:text-xs text-yellow-300">{hint}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                <ClipboardList size={14} lg:size={18} className="text-orange-400" /> My Tasks
              </h3>
              <Link to="/support/my-tasks" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
            </div>
            {openTasks.length === 0 ? (
              <p className="text-xs lg:text-sm text-gray-500 py-6 text-center">No active tasks — your Support Manager will assign work when ready.</p>
            ) : (
              <div className="space-y-2">
                {openTasks.slice(0, 5).map((task) => {
                  const projectId = task.project?._id || task.project;
                  const detailPath = supportTaskDetailPath(projectId, task._id, task);
                  const progressCount = task.progressUpdates?.length || 0;
                  return (
                    <div key={task._id} className="p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50 text-xs lg:text-sm space-y-2">
                      <div className="flex items-start justify-between gap-2 lg:gap-3">
                        <div className="min-w-0">
                          <Link to={detailPath} className="text-white font-medium hover:text-myth-accent text-sm lg:text-base">{task.title}</Link>
                          <p className="text-[10px] lg:text-xs text-gray-500">{task.project?.name || 'Project'}</p>
                          <div className="flex flex-wrap gap-1 lg:gap-2 mt-1 text-[10px] lg:text-xs">
                            {task.dueDate && (
                              <span className={isDueSoon(task.dueDate) ? 'text-amber-400' : 'text-gray-600'}>
                                Due {formatDateTime(task.dueDate)}
                              </span>
                            )}
                            {progressCount > 0 && (
                              <span className="text-gray-500">{progressCount} progress update{progressCount !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                        {taskBadge(task)}
                      </div>
                      <SupportTaskActions
                        task={task}
                        busy={taskBusyId === task._id}
                        onUpdate={updateTask}
                        align="end"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                <Ticket size={14} lg:size={18} className="text-amber-400" /> Assigned Tickets
              </h3>
              <Link to="/support/tickets/assigned" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
            </div>
            {assignedTickets.length === 0 ? (
              <p className="text-xs lg:text-sm text-gray-500 py-4 text-center">No tickets assigned to you right now.</p>
            ) : (
              <div className="space-y-2">
                {assignedTickets.slice(0, 5).map((t) => (
                  <Link key={t._id} to={`/tickets/${t._id}`} className="flex items-center justify-between gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50 hover:border-myth-accent/30 text-xs lg:text-sm">
                    <div className="min-w-0">
                      <p className="text-white truncate text-sm lg:text-base">{t.ticketNumber} · {t.subject}</p>
                      <p className="text-[10px] lg:text-xs text-gray-500 truncate">{t.category || t.customer?.companyName || t.project?.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {ticketBadge(t.status)}
                      {ticketActionHint(t.status) && (
                        <span className="text-[10px] lg:text-xs text-myth-accent">{ticketActionHint(t.status)}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                <FolderKanban size={14} lg:size={18} className="text-indigo-400" /> My Projects
              </h3>
              <Link to="/support/my-projects" className="text-xs lg:text-sm text-myth-accent hover:underline">View all →</Link>
            </div>
            {projectsPreview.length === 0 ? (
              <p className="text-xs lg:text-sm text-gray-500 py-4 text-center">No projects assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {projectsPreview.map((p) => (
                  <Link
                    key={p._id}
                    to={`/projects/${p._id}`}
                    className="flex items-center justify-between gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg bg-myth-surface/30 border border-myth-border/50 hover:border-myth-accent/30 text-xs lg:text-sm"
                  >
                    <div>
                      <p className="text-white font-medium text-sm lg:text-base">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.customer?.companyName || `${p.customer?.firstName || ''} ${p.customer?.lastName || ''}`.trim() || 'Customer'}
                      </p>
                    </div>
                    {projectStatusBadge(p.supportReviewStatus)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {(Number(stats.pendingCustomerReplies) > 0 || upcomingFollowups?.length > 0 || Number(stats.todayFollowUps) > 0) && (
            <div className="card border-cyan-500/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                  <MessageSquare size={14} lg:size={18} className="text-cyan-400" /> Customer Requests & Follow-ups
                </h3>
                <div className="flex gap-2 lg:gap-3 text-xs lg:text-sm">
                  <Link to="/support/customer-requests" className="text-myth-accent hover:underline">Requests →</Link>
                  <Link to="/support/follow-ups/today" className="text-myth-accent hover:underline">Follow-ups →</Link>
                </div>
              </div>
              <ul className="text-xs lg:text-sm text-gray-400 space-y-1">
                {Number(stats.pendingCustomerReplies) > 0 && (
                  <li className="flex items-center gap-2">
                    <AlertCircle size={12} lg:size={14} className="text-cyan-400 shrink-0" />
                    {stats.pendingCustomerReplies} ticket(s) need your response
                  </li>
                )}
                {Number(stats.todayFollowUps) > 0 && (
                  <li className="flex items-center gap-2">
                    <Calendar size={12} lg:size={14} className="text-amber-400 shrink-0" />
                    {stats.todayFollowUps} follow-up(s) scheduled today
                  </li>
                )}
                {upcomingFollowups?.slice(0, 3).map((f) => (
                  <li key={f._id}>
                    <Link to={`/support/follow-ups/${f._id}`} className="text-[10px] lg:text-xs text-gray-500 hover:text-myth-accent pl-5 block">
                      {f.title || 'Follow-up'} · {f.customer?.companyName || f.customer?.firstName || 'Customer'}
                      {f.scheduledAt ? ` · ${formatDateTime(f.scheduledAt)}` : ''}
                      {f.createdBy && f.createdBy._id !== f.assignedTo?._id && (
                        <span className="text-gray-600"> · by {f.createdBy.firstName}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                <Activity size={14} lg:size={18} className="text-myth-accent" /> Recent Activity
              </h3>
            </div>
            {recentActivities.length === 0 ? (
              <p className="text-xs lg:text-sm text-gray-500 py-4 text-center">Assignments, replies, and task updates appear here.</p>
            ) : (
              <ul className="space-y-2 text-xs lg:text-sm">
                {recentActivities.slice(0, 8).map((a) => (
                  <li key={a._id} className="flex items-start gap-2 lg:gap-3 px-2 lg:px-3 py-2 rounded-lg bg-myth-surface/30 border border-myth-border/50">
                    <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-myth-accent/15 flex items-center justify-center text-myth-accent text-[10px] lg:text-xs font-bold shrink-0">
                      {a.user?.firstName?.[0] || '·'}{a.user?.lastName?.[0] || ''}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300">{a.title}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div className="card">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {SUPPORT_PERSON_QUICK_ACTIONS.map((action) => {
                const Icon = QUICK_ICONS[action.label] || ArrowRight;
                const badge = action.badgeKey ? Number(stats[action.badgeKey]) : 0;
                return (
                  <Link
                    key={action.label}
                    to={action.path}
                    className={`flex items-center justify-between gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg border ${
                      action.primary
                        ? 'bg-orange-500/10 border-orange-500/40 text-white'
                        : 'border-myth-border text-gray-300 hover:border-myth-accent/30'
                    }`}
                  >
                    <span className="flex items-center gap-2 lg:gap-3 min-w-0">
                      <Icon size={14} lg:size={18} className={action.primary ? 'text-orange-400' : 'text-gray-400'} />
                      <span className="text-xs lg:text-sm font-medium">{action.label}</span>
                    </span>
                    {badge > 0 && (
                      <span className="text-[10px] lg:text-xs px-2 py-0.5 rounded-full bg-myth-accent/20 text-myth-accent shrink-0">{badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="text-xs lg:text-sm font-semibold text-white mb-2">Daily checklist</h3>
            <ol className="text-[10px] lg:text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
              {SUPPORT_PERSON_WORKFLOW.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </div>

          <div className="card text-xs lg:text-sm">
            <h3 className="text-xs lg:text-sm font-semibold text-white mb-2">Performance</h3>
            <ul className="space-y-2 text-gray-400 text-[10px] lg:text-xs">
              <li className="flex justify-between"><span>Completed tasks</span><span className="text-white">{stats.completedSupportTasks ?? 0}</span></li>
              <li className="flex justify-between"><span>Resolved tickets</span><span className="text-white">{stats.resolvedTickets ?? 0}</span></li>
              <li className="flex justify-between"><span>Avg response</span><span className="text-white">{stats.avgResponseTime != null ? `${stats.avgResponseTime}h` : '—'}</span></li>
              <li className="flex justify-between"><span>Customer rating</span><span className="text-white">{stats.customerRating ? `${stats.customerRating}/5` : '—'}</span></li>
            </ul>
            <Link to="/support/reports" className="text-sm text-myth-accent hover:underline inline-flex items-center gap-1 mt-3">
              Full reports <ArrowRight size={14} />
            </Link>
          </div>

          <Link to="/notifications" className="card flex items-center gap-3 hover:border-myth-accent/30">
            <Bell size={18} className="text-myth-accent" />
            <span className="text-sm text-white">Notifications</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
