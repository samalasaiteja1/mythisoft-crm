import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ListTodo } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate, TASK_PRIORITIES } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { useTechnicalPersonData } from '../../hooks/useTechnicalPersonData';
import { TECH_WORK_STATUS_LABELS, normalizeWorkStatus } from '../../constants/technicalPersonForm';
import { TechPersonPageHeader, TechPersonContentCard, TechPersonEmptyState } from '../../components/technical/technicalPersonUi';

const projectName = (task, projects) => {
  const pid = task.relatedTo?.type === 'project' ? String(task.relatedTo.id?._id || task.relatedTo.id || '') : '';
  const p = projects.find((pr) => String(pr._id) === pid);
  return p?.name || task.milestone?.project?.name || '—';
};

export default function TechnicalMyTasks() {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') || '';
  const [search, setSearch] = useState('');
  const { tasks, projects, loading } = useTechnicalPersonData();

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === 'pending') list = list.filter((t) => ['new', 'pending'].includes(t.status));
    if (filter === 'in_progress') list = list.filter((t) => t.status === 'in_progress' || ['development', 'in_progress', 'planning', 'bug_fixing'].includes(t.workStatus));
    if (filter === 'completed') list = list.filter((t) => t.status === 'completed');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    return list;
  }, [tasks, filter, search]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechPersonPageHeader
        icon={ListTodo}
        title="My Assigned Tasks"
        subtitle="View, update status, and upload work for your tasks"
      />

      <TechPersonContentCard title="Search tasks">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-full"
            placeholder="Search by task name…"
          />
        </div>
      </TechPersonContentCard>

      <TechPersonContentCard>
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Task Name</th>
              <th className="table-header">Project</th>
              <th className="table-header">Status</th>
              <th className="table-header">Priority</th>
              <th className="table-header">Due</th>
              <th className="table-header" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center text-gray-500 py-10">No tasks found</td></tr>
            ) : filtered.map((task) => (
              <tr key={task._id} className="border-t border-myth-border">
                <td className="table-cell font-medium text-white">{task.title}</td>
                <td className="table-cell text-gray-400">{projectName(task, projects)}</td>
                <td className="table-cell">
                  <span className="badge bg-myth-surface text-gray-300 text-xs">
                    {TECH_WORK_STATUS_LABELS[normalizeWorkStatus(task)] || normalizeWorkStatus(task)}
                  </span>
                </td>
                <td className="table-cell"><StatusBadge status={task.priority} config={TASK_PRIORITIES} /></td>
                <td className="table-cell text-gray-400 text-sm">{task.dueDate ? formatDate(task.dueDate) : '—'}</td>
                <td className="table-cell">
                  <Link to={`/technical/tasks/${task._id}`} className="text-sm text-myth-accent hover:underline">View Task</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TechPersonContentCard>
    </div>
  );
}
