import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ClipboardList, CheckCircle, Users, Flag, Calendar, FolderKanban, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { normalizeTaskStatus } from '../../constants/supportExecutive';
import { ASSIGNEE_CATEGORIES } from '../../constants/supportProjectTasks';
import { taskStatusBadge } from '../../constants/supportTaskStatusFlows';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

function memberName(m) {
  const u = m.assignedTo;
  return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—';
}

export default function SupportManagerMainTaskDetail() {
  const { projectId, batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const load = () => {
    setLoading(true);
    return projectsAPI.getSupportMainTaskBatch(projectId, batchId)
      .then(({ data }) => setBatch(data))
      .catch(() => {
        toast.error('Main task not found');
        navigate('/support/task-status');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [projectId, batchId]);

  const approve = async () => {
    if (!batch?.allCompleted) {
      toast.error('All members must complete their tasks first');
      return;
    }
    const confirmed = window.confirm(`Approve "${batch.title}" after reviewing all member work?`);
    if (!confirmed) return;

    setApproving(true);
    try {
      await projectsAPI.approveSupportMainTaskBatch(projectId, batchId);
      toast.success('Main task approved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!batch) return null;

  const completedCount = batch.members.filter((m) => normalizeTaskStatus(m.status) === 'completed').length;
  const total = batch.members.length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/support/task-status" className="btn-secondary p-2 inline-flex">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 truncate">
            <ClipboardList size={22} className="text-orange-400 shrink-0" />
            {batch.title}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <Users size={14} /> Main task · {total} member{total !== 1 ? 's' : ''}
          </p>
        </div>
        {batch.approved ? (
          <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
            Approved
          </span>
        ) : batch.allCompleted ? (
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Ready for review
          </span>
        ) : (
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {completedCount}/{total} completed
          </span>
        )}
      </div>

      <div className="card space-y-3">
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Project</p>
            <Link to={`/projects/${projectId}`} className="text-myth-accent hover:underline inline-flex items-center gap-1">
              <FolderKanban size={14} /> {batch.project?.name || '—'}
              <ExternalLink size={12} />
            </Link>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Priority</p>
            <p className="text-white flex items-center gap-1">
              <Flag size={14} className="text-gray-400" />
              {PRIORITY_LABELS[batch.priority] || batch.priority || 'Medium'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due date</p>
            <p className="text-white flex items-center gap-1">
              <Calendar size={14} className="text-gray-400" />
              {batch.dueDate ? formatDateTime(batch.dueDate) : '—'}
            </p>
          </div>
        </div>
        {batch.description && (
          <p className="text-sm text-gray-300 whitespace-pre-wrap border-t border-myth-border pt-3">{batch.description}</p>
        )}
      </div>

      <div className="card overflow-x-auto">
        <p className="text-sm font-medium text-white mb-3">Team member progress</p>
        <p className="text-xs text-gray-500 mb-4">
          Assigned → Accepted → In Progress → Completed
        </p>
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 border-b border-myth-border">
              <th className="pb-2 pr-4">Member</th>
              <th className="pb-2 pr-4">Role</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Progress updates</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batch.members.map((task) => {
              const badge = taskStatusBadge(task.taskType || task.taskKey, task.status, 'sm');
              const progressCount = task.progressUpdates?.length || 0;
              return (
                <tr key={task._id} className="border-b border-myth-border/50 align-top">
                  <td className="py-3 pr-4 text-white">{memberName(task)}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {ASSIGNEE_CATEGORIES[task.assigneeCategory] || '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={badge.className}>{badge.label}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{progressCount} update{progressCount !== 1 ? 's' : ''}</td>
                  <td className="py-3">
                    <Link
                      to={`/support/task-status/${projectId}/${task._id}`}
                      className="text-myth-accent hover:underline text-xs"
                    >
                      View work
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {batch.allCompleted && !batch.approved && (
        <div className="card border-green-500/30 bg-green-500/5 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-green-300 font-medium">All members completed their tasks</p>
              <p className="text-sm text-gray-400 mt-1">
                Review each member&apos;s work and attachments, then approve the main task.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={approve}
            disabled={approving}
            className="btn-primary"
          >
            {approving ? 'Approving…' : 'Approve completed work'}
          </button>
        </div>
      )}

      {batch.approved && batch.smApprovedAt && (
        <div className="card border-green-500/30 bg-green-500/5">
          <p className="text-green-300 font-medium">Approved {formatDateTime(batch.smApprovedAt)}</p>
          {batch.smApprovedBy && (
            <p className="text-sm text-gray-400 mt-1">
              by {`${batch.smApprovedBy.firstName || ''} ${batch.smApprovedBy.lastName || ''}`.trim()}
            </p>
          )}
        </div>
      )}

      <Link to="/support/task-status" className="btn-secondary text-sm inline-flex">← Back to Task Status</Link>
    </div>
  );
}
