import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Filter, Plus, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { normalizeTaskStatus, SUPPORT_EXECUTIVE_TASK_STATUSES } from '../../constants/supportExecutive';
import { taskStatusBadge } from '../../constants/supportTaskStatusFlows';
import { SUPPORT_MANAGER_TASK_TABS } from '../../constants/supportManagerNav';
import {
  SupportManagerPageShell,
  SupportManagerPageHeader,
  SupportManagerStatStrip,
  SupportManagerTabBar,
  SupportManagerContentCard,
  SupportManagerEmptyState,
} from '../../components/supportManager/supportManagerUi';

const PRIORITY_META = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

function StatusBadge({ task }) {
  const meta = taskStatusBadge(task.taskType || task.taskKey, task.status, 'sm');
  return <span className={meta.className}>{meta.label}</span>;
}

function batchSummary(members) {
  const completed = members.filter((t) => normalizeTaskStatus(t.status) === 'completed').length;
  const allCompleted = completed === members.length;
  const approved = members.every((t) => t.smApprovedAt);
  const anyInProgress = members.some((t) => ['accepted', 'in_progress', 'waiting_customer'].includes(normalizeTaskStatus(t.status)));
  return { completed, total: members.length, allCompleted, approved, anyInProgress };
}

export default function SupportManagerTaskStatus() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (projectFilter) params.projectId = projectFilter;
    return projectsAPI.getSupportManagerTasks(params)
      .then(({ data }) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, projectFilter]);

  const { mainTasks, standaloneTasks } = useMemo(() => {
    const batchMap = new Map();
    const standalone = [];

    tasks.forEach((task) => {
      if (task.mainTaskBatchId) {
        const key = `${task.project?._id || task.project}::${task.mainTaskBatchId}`;
        if (!batchMap.has(key)) batchMap.set(key, []);
        batchMap.get(key).push(task);
      } else {
        standalone.push(task);
      }
    });

    const mainTasks = [...batchMap.values()].map((members) => {
      const sorted = [...members].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return {
        key: `${sorted[0].project?._id || sorted[0].project}::${sorted[0].mainTaskBatchId}`,
        batchId: sorted[0].mainTaskBatchId,
        projectId: sorted[0].project?._id || sorted[0].project,
        title: sorted[0].title,
        description: sorted[0].description,
        project: sorted[0].project,
        priority: sorted[0].priority,
        dueDate: sorted[0].dueDate,
        createdAt: sorted[0].createdAt,
        members: sorted,
        ...batchSummary(sorted),
      };
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return { mainTasks, standaloneTasks: standalone };
  }, [tasks]);

  const projects = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      const id = String(t.project?._id || t.project || '');
      if (id && !map.has(id)) map.set(id, t.project?.name || 'Project');
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const counts = useMemo(() => ({
    total: mainTasks.length + standaloneTasks.length,
    assigned: tasks.filter((t) => normalizeTaskStatus(t.status) === 'assigned').length,
    inProgress: tasks.filter((t) => ['accepted', 'in_progress', 'waiting_customer'].includes(normalizeTaskStatus(t.status))).length,
    completed: tasks.filter((t) => normalizeTaskStatus(t.status) === 'completed').length,
    readyForReview: mainTasks.filter((m) => m.allCompleted && !m.approved).length,
  }), [tasks, mainTasks, standaloneTasks]);

  const deleteTask = async (task) => {
    const projectId = task.project?._id || task.project;
    if (!projectId || !task._id) return;
    const confirmed = window.confirm(`Delete task "${task.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(task._id);
    try {
      await projectsAPI.deleteSupportTask(projectId, task._id);
      toast.success('Task deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeletingId('');
    }
  };

  const filteredMain = useMemo(() => {
    let list = [...mainTasks];
    if (projectFilter) {
      list = list.filter((m) => String(m.projectId) === projectFilter);
    }
    if (statusFilter) {
      list = list.filter((m) => {
        if (statusFilter === 'completed') return m.allCompleted;
        return m.members.some((t) => normalizeTaskStatus(t.status) === statusFilter);
      });
    }
    return list;
  }, [mainTasks, projectFilter, statusFilter]);

  const filteredStandalone = useMemo(() => {
    let list = [...standaloneTasks];
    if (projectFilter) {
      list = list.filter((t) => String(t.project?._id || t.project) === projectFilter);
    }
    if (statusFilter) {
      list = list.filter((t) => normalizeTaskStatus(t.status) === statusFilter);
    }
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [standaloneTasks, projectFilter, statusFilter]);

  const hasResults = filteredMain.length > 0 || filteredStandalone.length > 0;

  if (loading && tasks.length === 0) return <LoadingSpinner />;

  const statItems = [
    { label: 'Main tasks', value: counts.total, color: 'text-white' },
    { label: 'Assigned', value: counts.assigned, color: 'text-gray-300' },
    { label: 'In progress', value: counts.inProgress, color: 'text-blue-400' },
    { label: 'Completed', value: counts.completed, color: 'text-green-400' },
    { label: 'Ready to approve', value: counts.readyForReview, color: 'text-amber-400', highlight: counts.readyForReview > 0 },
  ];

  return (
    <SupportManagerPageShell>
      <SupportManagerPageHeader
        icon={ClipboardList}
        title="Task Status"
        subtitle="Monitor main tasks and member progress. Approve when all members complete their work."
        workflow={['Create task', 'Assign members', 'Track progress', 'Approve & submit']}
        actions={(
          <Link to="/support/create-task" className="btn-primary text-sm inline-flex items-center gap-2 shrink-0">
            <Plus size={16} /> Create Task
          </Link>
        )}
      />

      <SupportManagerStatStrip stats={statItems} />

      <SupportManagerTabBar tabs={SUPPORT_MANAGER_TASK_TABS} activeKey="status" />

      <SupportManagerContentCard
        toolbar={(
          <>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-500" />
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
            <select
              className="input-field text-sm py-1.5 sm:max-w-xs"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </>
        )}
      >
      {!hasResults ? (
        <SupportManagerEmptyState
          message={tasks.length === 0
            ? 'No tasks created yet. Use Create Task to assign work to your support team.'
            : 'No tasks match the selected filters.'}
          icon={ClipboardList}
        />
      ) : (
        <div className="space-y-4">
          {filteredMain.map((main) => (
            <div key={main.key} className="card border border-myth-border/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white font-semibold">{main.title}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-myth-surface text-gray-400 inline-flex items-center gap-1">
                      <Users size={12} /> {main.total} members
                    </span>
                    {main.approved ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">Approved</span>
                    ) : main.allCompleted ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Ready for review</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                        {main.completed}/{main.total} completed
                      </span>
                    )}
                  </div>
                  {main.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-2xl">{main.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    <Link to={`/projects/${main.projectId}`} className="text-myth-accent hover:underline">
                      {main.project?.name || 'Project'}
                    </Link>
                    {' · '}
                    Due {main.dueDate ? formatDateTime(main.dueDate) : '—'}
                    {' · '}
                    {PRIORITY_META[main.priority] || main.priority}
                  </p>
                </div>
                <Link
                  to={`/support/task-status/${main.projectId}/batch/${main.batchId}`}
                  className="btn-primary text-sm shrink-0"
                >
                  {main.allCompleted && !main.approved ? 'Review & approve' : 'Monitor progress'}
                </Link>
              </div>

              <div className="overflow-x-auto border border-myth-border/50 rounded-lg">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-gray-500 bg-myth-surface/40">
                      <th className="py-2 px-3">Member</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Progress</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {main.members.map((task) => {
                      const assignee = task.assignedTo;
                      const assigneeName = assignee
                        ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim()
                        : '—';
                      return (
                        <tr key={task._id} className="border-t border-myth-border/40">
                          <td className="py-2 px-3 text-gray-300">{assigneeName}</td>
                          <td className="py-2 px-3"><StatusBadge task={task} /></td>
                          <td className="py-2 px-3 text-xs text-gray-500">
                            {task.progressUpdates?.length || 0} update{(task.progressUpdates?.length || 0) !== 1 ? 's' : ''}
                          </td>
                          <td className="py-2 px-3">
                            <Link
                              to={`/support/task-status/${main.projectId}/${task._id}`}
                              className="text-myth-accent hover:underline text-xs"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {filteredStandalone.length > 0 && (
            <div className="card overflow-x-auto">
              <p className="text-sm font-medium text-white mb-3">Individual tasks</p>
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-myth-border">
                    <th className="pb-3 pr-4">Task</th>
                    <th className="pb-3 pr-4">Project</th>
                    <th className="pb-3 pr-4">Assigned to</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStandalone.map((task) => {
                    const projectId = task.project?._id || task.project;
                    const assignee = task.assignedTo;
                    const assigneeName = assignee
                      ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim()
                      : '—';
                    return (
                      <tr key={task._id} className="border-b border-myth-border/50 hover:bg-myth-surface/30 align-top">
                        <td className="py-3 pr-4 text-white font-medium">{task.title}</td>
                        <td className="py-3 pr-4">
                          <Link to={`/projects/${projectId}`} className="text-myth-accent hover:underline">
                            {task.project?.name || '—'}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-gray-300">{assigneeName}</td>
                        <td className="py-3 pr-4"><StatusBadge task={task} /></td>
                        <td className="py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/support/task-status/${projectId}/${task._id}`}
                              className="text-myth-accent hover:underline text-xs"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => deleteTask(task)}
                              disabled={deletingId === task._id}
                              className="text-red-400 hover:text-red-300 text-xs inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                              {deletingId === task._id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </SupportManagerContentCard>
    </SupportManagerPageShell>
  );
}
