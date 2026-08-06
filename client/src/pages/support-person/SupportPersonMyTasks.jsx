import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ClipboardList, Clock, Filter, CheckCircle2, MessageSquare, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SupportTaskActions from '../../components/support/SupportTaskActions';
import SupportTaskStatusUpdate from '../../components/support/SupportTaskStatusUpdate';
import { normalizeTaskStatus, SUPPORT_EXECUTIVE_TASK_STATUSES } from '../../constants/supportExecutive';
import { ASSIGNEE_CATEGORIES } from '../../constants/supportProjectTasks';
import { taskStatusBadge } from '../../constants/supportTaskStatusFlows';
import { supportTaskDetailPath } from '../../utils/supportTaskPaths';
import { SUPPORT_PERSON_TASK_TABS } from '../../constants/supportPersonNav';

const PRIORITY_META = {
  low: { label: 'Low', className: 'text-gray-400' },
  medium: { label: 'Medium', className: 'text-blue-400' },
  high: { label: 'High', className: 'text-orange-400' },
  urgent: { label: 'Urgent', className: 'text-red-400' },
};

const WORKFLOW_STEPS = ['Assigned', 'Accepted', 'In Progress', 'Completed'];

function tabMatchesTask(tabKey, status) {
  const st = normalizeTaskStatus(status);
  const tab = SUPPORT_PERSON_TASK_TABS.find((t) => t.key === tabKey) || SUPPORT_PERSON_TASK_TABS[0];
  if (tab.key === 'all') return true;
  if (tab.key === 'open') return st !== 'completed';
  if (!tab.statuses) return true;
  return tab.statuses.includes(st);
}

function dueLabel(dueDate) {
  if (!dueDate) return { text: '—', className: 'text-gray-500', urgent: false };
  const due = new Date(dueDate);
  const now = new Date();
  const endToday = new Date(now);
  endToday.setHours(23, 59, 59, 999);
  if (due < now && due.toDateString() !== now.toDateString()) {
    return { text: formatDateTime(dueDate), className: 'text-red-400', urgent: true };
  }
  if (due <= endToday) {
    return { text: formatDateTime(dueDate), className: 'text-amber-400', urgent: true };
  }
  return { text: formatDateTime(dueDate), className: 'text-gray-500', urgent: false };
}

function StatusBadge({ task }) {
  const meta = taskStatusBadge(task.taskType || task.taskKey, task.status);
  return <span className={meta.className}>{meta.label}</span>;
}

export default function SupportPersonMyTasks() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'open');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'open';
    if (SUPPORT_PERSON_TASK_TABS.some((t) => t.key === urlTab)) setTab(urlTab);
  }, [searchParams]);

  const load = () => {
    setLoading(true);
    return projectsAPI.getMySupportTasks()
      .then(({ data }) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const map = {};
    SUPPORT_PERSON_TASK_TABS.forEach((t) => {
      map[t.key] = tasks.filter((task) => tabMatchesTask(t.key, task.status)).length;
    });
    map.dueToday = tasks.filter((task) => {
      if (normalizeTaskStatus(task.status) === 'completed' || !task.dueDate) return false;
      const due = new Date(task.dueDate);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return due <= end;
    }).length;
    return map;
  }, [tasks]);

  const filtered = useMemo(() => {
    let list = tasks.filter((t) => tabMatchesTask(tab, t.status));
    if (statusFilter) {
      list = list.filter((t) => normalizeTaskStatus(t.status) === statusFilter);
    }
    return list.sort((a, b) => {
      const aDone = normalizeTaskStatus(a.status) === 'completed';
      const bDone = normalizeTaskStatus(b.status) === 'completed';
      if (aDone && !bDone) return 1;
      if (bDone && !aDone) return -1;
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return ad - bd;
    });
  }, [tasks, tab, statusFilter]);

  const updateTask = async (task, status, completionNotes) => {
    const projectId = task.project?._id || task.project;
    setBusyId(task._id);
    try {
      await projectsAPI.completeSupportTask(projectId, task._id, {
        status,
        completionNotes: completionNotes || undefined,
      });
      toast.success(
        normalizeTaskStatus(status) === 'completed' ? 'Task completed' : 'Task status updated',
      );
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setBusyId('');
    }
  };

  if (loading && tasks.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList size={24} className="text-orange-400" /> My Tasks
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Tasks assigned by your Support Manager — accept, start work, post progress, and mark complete.
        </p>
      </div>

      <div className="card border border-myth-border/80 py-3 px-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Your workflow</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {WORKFLOW_STEPS.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              {i > 0 && <ArrowRight size={14} className="text-gray-600" />}
              <span className="text-gray-300">{step}</span>
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <MessageSquare size={12} /> Add comments and files under <strong className="text-gray-400 font-normal">View task</strong>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'To accept', value: counts.assigned, color: 'text-blue-400', link: '/support/my-tasks?tab=assigned' },
          { label: 'Accepted', value: counts.accepted, color: 'text-cyan-400', link: '/support/my-tasks?tab=accepted' },
          { label: 'In progress', value: counts.in_progress, color: 'text-indigo-400', link: '/support/my-tasks?tab=in_progress' },
          { label: 'Completed', value: counts.completed, color: 'text-green-400', link: '/support/my-tasks?tab=completed' },
          { label: 'Due today', value: counts.dueToday, color: 'text-amber-400', link: '/support/my-tasks' },
        ].map((c) => (
          <Link key={c.label} to={c.link} className="card py-3 px-4 border border-myth-border/80 hover:border-myth-accent/30 transition-colors">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {SUPPORT_PERSON_TASK_TABS.map((t) => (
            <Link
              key={t.key}
              to={t.key === 'open' ? '/support/my-tasks' : `/support/my-tasks?tab=${t.key}`}
              className={`text-sm px-3 py-1.5 rounded-lg border ${
                tab === t.key
                  ? 'border-orange-500/50 bg-orange-500/10 text-orange-200'
                  : 'border-myth-border text-gray-400 hover:text-gray-300'
              }`}
            >
              {t.label} ({counts[t.key] ?? 0})
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500 shrink-0" />
          <select
            className="input-field text-sm py-1.5"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {Object.entries(SUPPORT_EXECUTIVE_TASK_STATUSES)
              .filter(([k]) => k !== 'pending')
              .map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          {tasks.length === 0
            ? 'No tasks assigned yet. Tasks appear when your Support Manager creates and assigns work to you.'
            : 'No tasks match the current filter.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const projectId = task.project?._id || task.project;
            const priority = PRIORITY_META[task.priority] || PRIORITY_META.medium;
            const due = dueLabel(task.dueDate);
            const st = normalizeTaskStatus(task.status);
            const isCompleted = st === 'completed';
            const detailPath = supportTaskDetailPath(projectId, task._id, task);
            const progressCount = task.progressUpdates?.length || 0;

            return (
              <div
                key={task._id}
                className={`card border ${
                  isCompleted ? 'border-green-500/20 bg-green-500/5' : 'border-myth-border/80'
                } space-y-4`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link to={detailPath} className="text-white font-semibold hover:text-myth-accent truncate">
                        {task.title}
                      </Link>
                      {task.smApprovedAt && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                          Approved
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <Link to={`/projects/${projectId}`} className="text-myth-accent hover:underline">
                        {task.project?.name || 'Project'}
                      </Link>
                      {task.assigneeCategory && (
                        <span>{ASSIGNEE_CATEGORIES[task.assigneeCategory] || task.assigneeCategory}</span>
                      )}
                      <span className={priority.className}>{priority.label} priority</span>
                      <span className={due.className}>
                        {due.urgent && <Clock size={11} className="inline mr-0.5 -mt-0.5" />}
                        Due {due.text}
                      </span>
                      {progressCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <MessageSquare size={11} /> {progressCount} update{progressCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isCompleted ? <StatusBadge task={task} /> : <StatusBadge task={task} />}
                  </div>
                </div>

                {!isCompleted && (
                  <div className="grid lg:grid-cols-2 gap-4 pt-2 border-t border-myth-border/60">
                    <SupportTaskStatusUpdate
                      task={task}
                      busy={busyId === task._id}
                      compact
                      onUpdate={(status) => updateTask(task, status)}
                    />
                    <SupportTaskActions
                      task={task}
                      busy={busyId === task._id}
                      onUpdate={(t, status) => updateTask(t, status)}
                      align="end"
                    />
                  </div>
                )}

                {isCompleted && task.completedAt && (
                  <p className="text-xs text-green-400/90 flex items-center gap-1 pt-1 border-t border-myth-border/40">
                    <CheckCircle2 size={14} />
                    Completed {formatDateTime(task.completedAt)}
                  </p>
                )}

                <div className="flex justify-end">
                  <Link to={detailPath} className="text-sm text-myth-accent hover:underline inline-flex items-center gap-1">
                    View task {isCompleted ? '' : '· update progress'}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
