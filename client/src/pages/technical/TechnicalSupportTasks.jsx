import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SupportTaskActions from '../../components/support/SupportTaskActions';
import SupportTaskStatusUpdate from '../../components/support/SupportTaskStatusUpdate';
import { ASSIGNEE_CATEGORIES } from '../../constants/supportProjectTasks';
import { taskStatusBadge } from '../../constants/supportTaskStatusFlows';
import { normalizeTaskStatus } from '../../constants/supportExecutive';
import { TechPersonPageHeader, TechPersonContentCard, TechPersonEmptyState } from '../../components/technical/technicalPersonUi';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

function statusBadge(task) {
  const meta = taskStatusBadge(task.taskType || task.taskKey, task.status);
  return <span className={meta.className}>{meta.label}</span>;
}

export default function TechnicalSupportTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = () => projectsAPI.getMySupportTasks()
    .then(({ data }) => setTasks(Array.isArray(data) ? data : []))
    .catch(() => toast.error('Failed to load tasks'))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechPersonPageHeader
        icon={ClipboardList}
        title="Support Handoff Tasks"
        subtitle="Deployment, server configuration, email/SSL, and technical verification tasks assigned to you."
      />

      {tasks.length === 0 ? (
        <TechPersonEmptyState icon={ClipboardList} message="No handoff tasks assigned yet." />
      ) : (
        <TechPersonContentCard>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-myth-border">
                <th className="pb-3 pr-4">Task</th>
                <th className="pb-3 pr-4">Project</th>
                <th className="pb-3 pr-4">Priority</th>
                <th className="pb-3 pr-4">Due Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className="border-b border-myth-border/50 hover:bg-myth-surface/30">
                  <td className="py-3 pr-4">
                    <p className="text-white font-medium">{task.title}</p>
                    {task.assigneeCategory && (
                      <p className="text-xs text-gray-500">{ASSIGNEE_CATEGORIES[task.assigneeCategory] || task.assigneeCategory}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Link to={`/projects/${task.project?._id || task.project}`} className="text-myth-accent hover:underline">{task.project?.name || '—'}</Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 capitalize">{PRIORITY_LABELS[task.priority] || task.priority || 'Medium'}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">{task.dueDate ? formatDateTime(task.dueDate) : '—'}</td>
                  <td className="py-3 pr-4 min-w-[200px]">
                    {normalizeTaskStatus(task.status) === 'completed' ? (
                      statusBadge(task)
                    ) : (
                      <SupportTaskStatusUpdate
                        task={task}
                        busy={busyId === task._id}
                        compact
                        onUpdate={(status) => updateTask(task, status)}
                      />
                    )}
                  </td>
                  <td className="py-3">
                    <SupportTaskActions
                      task={task}
                      busy={busyId === task._id}
                      onUpdate={(t, status) => updateTask(t, status)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TechPersonContentCard>
      )}
    </div>
  );
}
