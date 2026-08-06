import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ClipboardList, CheckCircle, Play, MessageSquare,
  FolderKanban, Calendar, Flag, Paperclip, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { normalizeTaskStatus } from '../../constants/supportExecutive';
import { ASSIGNEE_CATEGORIES, ALL_TASK_TYPES } from '../../constants/supportProjectTasks';
import {
  actionsForTaskStatus,
  flowDescriptionForTaskType,
  taskStatusBadge,
  taskStatusMeta,
} from '../../constants/supportTaskStatusFlows';
import { supportTaskListPath } from '../../utils/supportTaskPaths';
import SupportTaskStatusUpdate from '../../components/support/SupportTaskStatusUpdate';
import SupportTaskProgressPanel from '../../components/support/SupportTaskProgressPanel';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const TYPE_LABELS = Object.fromEntries(ALL_TASK_TYPES.map((t) => [t.value, t.label]));

const ICONS = { start: Play, complete: CheckCircle, wait: MessageSquare };

export default function SupportPersonTaskDetail() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');

  const load = () => {
    setLoading(true);
    return projectsAPI.getSupportTask(projectId, taskId)
      .then(({ data }) => {
        setTask(data);
        setNotes(data?.completionNotes || '');
      })
      .catch(() => {
        toast.error('Task not found');
        navigate(supportTaskListPath({ project: projectId }));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [projectId, taskId]);

  const updateTask = async (status, completionNotes) => {
    setBusy(true);
    try {
      const { data } = await projectsAPI.completeSupportTask(projectId, taskId, {
        status,
        completionNotes: (completionNotes ?? notes).trim() || undefined,
      });
      setTask(data);
      setNotes(data?.completionNotes || '');
      const taskType = data.taskType || data.taskKey;
      toast.success(
        normalizeTaskStatus(status) === 'completed'
          ? taskStatusMeta(taskType, 'completed').label
          : 'Task status updated',
      );
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!task) return null;

  const taskType = task.taskType || task.taskKey;
  const listPath = supportTaskListPath(task);
  const st = normalizeTaskStatus(task.status);
  const isCompleted = st === 'completed';
  const project = task.project;
  const customer = project?.customer;
  const customerName = customer
    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.companyName
    : null;
  const badge = taskStatusBadge(taskType, task.status, 'sm');
  const actions = actionsForTaskStatus(taskType, task.status);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to={listPath} className="btn-secondary p-2 inline-flex" title="Back to My Tasks">
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
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Role</p>
            <p className="text-white">{ASSIGNEE_CATEGORIES[task.assigneeCategory] || 'Support Executive'}</p>
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

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {isCompleted ? 'Completion notes' : 'Notes (optional on complete)'}
          </p>
          {isCompleted ? (
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{task.completionNotes || '—'}</p>
          ) : (
            <textarea
              className="input-field w-full min-h-[80px] text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes when completing this task…"
            />
          )}
        </div>

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

      {!isCompleted && (
        <div className="card space-y-4">
          <p className="text-sm font-medium text-white">Update task status</p>
          <p className="text-xs text-gray-500">Accept → Start work → In progress → Completed</p>
          <SupportTaskStatusUpdate
            task={task}
            busy={busy}
            notes={notes}
            showNotesOnComplete
            onUpdate={updateTask}
          />
          {actions.length > 0 && (
            <div className="pt-3 border-t border-myth-border">
              <p className="text-xs text-gray-500 mb-2">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => {
                  const Icon = ICONS[action.icon];
                  const btnClass = action.primary ? 'btn-primary' : 'btn-secondary';
                  return (
                    <button
                      key={`${action.status}-${action.label}`}
                      type="button"
                      disabled={busy}
                      onClick={() => updateTask(action.status)}
                      className={`${btnClass} text-sm inline-flex items-center gap-1`}
                    >
                      {Icon && <Icon size={14} />}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <SupportTaskProgressPanel
        projectId={projectId}
        taskId={taskId}
        progressUpdates={task.progressUpdates}
        readOnly={false}
        onUpdated={(data) => setTask(data)}
      />

      <div className="flex flex-wrap gap-3">
        <Link to={listPath} className="btn-secondary text-sm">← Back to My Tasks</Link>
        {isCompleted && (
          <Link to={`${listPath}?tab=completed`} className="btn-secondary text-sm">View all completed</Link>
        )}
      </div>
    </div>
  );
}
