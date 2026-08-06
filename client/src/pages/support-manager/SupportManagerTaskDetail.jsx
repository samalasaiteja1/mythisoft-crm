import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ClipboardList, CheckCircle, FolderKanban, Calendar, Flag, Paperclip, ExternalLink, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { normalizeTaskStatus } from '../../constants/supportExecutive';
import { ASSIGNEE_CATEGORIES, ALL_TASK_TYPES } from '../../constants/supportProjectTasks';
import { taskStatusBadge, taskStatusMeta, flowDescriptionForTaskType } from '../../constants/supportTaskStatusFlows';
import SupportTaskProgressPanel from '../../components/support/SupportTaskProgressPanel';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const TYPE_LABELS = Object.fromEntries(ALL_TASK_TYPES.map((t) => [t.value, t.label]));

export default function SupportManagerTaskDetail() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    projectsAPI.getSupportTask(projectId, taskId)
      .then(({ data }) => setTask(data))
      .catch(() => {
        toast.error('Task not found');
        navigate('/support/task-status');
      })
      .finally(() => setLoading(false));
  }, [projectId, taskId, navigate]);

  const deleteTask = async () => {
    if (!task) return;
    const confirmed = window.confirm(`Delete task "${task.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await projectsAPI.deleteSupportTask(projectId, taskId);
      toast.success('Task deleted');
      navigate('/support/task-status');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!task) return null;

  const taskType = task.taskType || task.taskKey;
  const st = normalizeTaskStatus(task.status);
  const isCompleted = st === 'completed';
  const project = task.project;
  const customer = project?.customer;
  const customerName = customer
    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.companyName
    : null;
  const badge = taskStatusBadge(taskType, task.status, 'sm');
  const assignee = task.assignedTo;
  const creator = task.createdBy;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/support/task-status" className="btn-secondary p-2 inline-flex" title="Back to Task Status">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 truncate">
            <ClipboardList size={22} className="text-orange-400 shrink-0" />
            {task.title}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{flowDescriptionForTaskType(taskType)}</p>
        </div>
        <span className={badge.className}>{badge.label}</span>
      </div>

      {isCompleted && (
        <div className="card border-green-500/30 bg-green-500/5 flex items-start gap-3">
          <CheckCircle size={20} className="text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-green-300 font-medium">{taskStatusMeta(taskType, 'completed').label}</p>
            {task.completedAt && (
              <p className="text-sm text-gray-400 mt-0.5">Completed {formatDateTime(task.completedAt)}</p>
            )}
          </div>
        </div>
      )}

      <div className="card space-y-4">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Task type</p>
            <p className="text-white">{TYPE_LABELS[taskType] || taskType || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
            <span className={badge.className}>{badge.label}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Assigned to</p>
            <p className="text-white">
              {assignee ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() : '—'}
            </p>
            {assignee?.email && <p className="text-xs text-gray-500">{assignee.email}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created by</p>
            <p className="text-white">
              {creator ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() : 'Support Manager'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Priority</p>
            <p className="text-white flex items-center gap-1">
              <Flag size={14} className="text-gray-400" />
              {PRIORITY_LABELS[task.priority] || task.priority || 'Medium'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due date</p>
            <p className="text-white flex items-center gap-1">
              <Calendar size={14} className="text-gray-400" />
              {task.dueDate ? formatDateTime(task.dueDate) : '—'}
            </p>
          </div>
          {task.estimatedHours != null && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Estimated hours</p>
              <p className="text-white">{task.estimatedHours}h</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Role category</p>
            <p className="text-white">{ASSIGNEE_CATEGORIES[task.assigneeCategory] || '—'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Project</p>
          <Link to={`/projects/${projectId}`} className="text-myth-accent hover:underline inline-flex items-center gap-1">
            <FolderKanban size={14} /> {project?.name || 'View project'}
            <ExternalLink size={12} />
          </Link>
          {customerName && <p className="text-xs text-gray-500 mt-1">Customer: {customerName}</p>}
        </div>

        {task.description && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {(task.completionNotes || isCompleted) && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Completion notes</p>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{task.completionNotes || '—'}</p>
          </div>
        )}

        {task.attachments?.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Paperclip size={12} /> Attachments
            </p>
            <ul className="space-y-1">
              {task.attachments.map((file, i) => (
                <li key={i}>
                  <a href={file.url} target="_blank" rel="noreferrer" className="text-sm text-myth-accent hover:underline">
                    {file.name || 'Attachment'}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {task.mainTaskBatchId && (
        <div className="card border-myth-border/80">
          <p className="text-sm text-gray-400">
            Part of a main task with multiple assignees.{' '}
            <Link
              to={`/support/task-status/${projectId}/batch/${task.mainTaskBatchId}`}
              className="text-myth-accent hover:underline"
            >
              View all members →
            </Link>
          </p>
        </div>
      )}

      <SupportTaskProgressPanel
        projectId={projectId}
        taskId={taskId}
        progressUpdates={task.progressUpdates}
        readOnly
      />

      <div className="flex flex-wrap gap-3">
        <Link to="/support/task-status" className="btn-secondary text-sm">← Back to Task Status</Link>
        <Link to="/support/create-task" className="btn-primary text-sm">Create another task</Link>
        <button
          type="button"
          onClick={deleteTask}
          disabled={deleting}
          className="btn-secondary text-sm text-red-400 border-red-500/30 hover:bg-red-500/10 inline-flex items-center gap-1"
        >
          <Trash2 size={14} />
          {deleting ? 'Deleting…' : 'Delete task'}
        </button>
      </div>
    </div>
  );
}
