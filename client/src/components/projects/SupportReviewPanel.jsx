import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import RequirementsDocLinks from './RequirementsDocLinks';
import { UPDATE_REQUEST_TYPES } from '../../constants/supportWorkflow';
import { taskStatusBadge } from '../../constants/supportTaskStatusFlows';

function SupportReviewForm({ project, mode, onDone }) {
  const [showChangesForm, setShowChangesForm] = useState(false);
  const [updateType, setUpdateType] = useState('bug');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [deliveryDocs, setDeliveryDocs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [verifyDecision, setVerifyDecision] = useState('approve');
  const [notes, setNotes] = useState('');
  const [supportTasks, setSupportTasks] = useState([]);

  useEffect(() => {
    projectsAPI.getDeliveryDocuments(project._id)
      .then(({ data }) => setDeliveryDocs(Array.isArray(data) ? data : []))
      .catch(() => {});
    projectsAPI.getSupportTasks(project._id)
      .then(({ data }) => setSupportTasks(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [project._id, project.supportReviewStatus]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await projectsAPI.reviewSupportHandoff(project._id, { decision: 'approve' });
      toast.success('Project accepted — support team is active');
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Accept failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyTasks = async () => {
    setSubmitting(true);
    try {
      await projectsAPI.verifySupportTasks(project._id);
      toast.success('Support tasks verified — you can submit to the customer');
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitToCustomerPath = `/support/submit-to-customer/${project._id}`;

  const handleRequestChanges = async () => {
    if (!updateTitle.trim()) {
      toast.error('Enter an update request title');
      setShowChangesForm(true);
      return;
    }
    setSubmitting(true);
    try {
      await projectsAPI.reviewSupportHandoff(project._id, {
        decision: 'changes_required',
        updateRequest: {
          type: updateType,
          title: updateTitle.trim(),
          description: updateDescription.trim(),
        },
      });
      toast.success('Change request sent to technical team');
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setSubmitting(true);
    try {
      await projectsAPI.verifySupportFix(project._id, { decision: verifyDecision, notes: notes.trim() });
      toast.success(
        verifyDecision === 'approve'
          ? 'Fix verified — accept the project when ready'
          : 'Update request reopened',
      );
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'tasks') {
    const tasksVerified = Boolean(project.smReviewChecklist?.tasksVerified);
    const allTasksDone = supportTasks.length > 0 && supportTasks.every((t) => t.status === 'completed');

    return (
      <div className="space-y-4 mt-4 pt-4 border-t border-myth-border/60">
        <p className="text-sm text-gray-400">
          Verify all support tasks are complete, then submit to the customer.
        </p>
        <ul className="space-y-2 text-sm">
          {supportTasks.map((task) => {
            const badge = taskStatusBadge(task.taskType || task.taskKey, task.status, 'xs');
            return (
              <li key={task._id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-myth-surface/40 border border-myth-border">
                <div>
                  <span className="text-gray-300">{task.title}</span>
                  <p className="text-xs text-gray-500">
                    {task.assigneeCategory === 'technical_support_engineer' ? 'Technical Support Engineer' : 'Support Executive'}
                    {task.assignedTo ? ` · ${task.assignedTo.firstName || ''} ${task.assignedTo.lastName || ''}`.trim() : ''}
                  </p>
                </div>
                <span className={badge.className}>{badge.label}</span>
              </li>
            );
          })}
        </ul>
        {!allTasksDone && (
          <p className="text-amber-300 text-sm">Waiting for all team members to complete their tasks.</p>
        )}
        {allTasksDone && !tasksVerified && (
          <button type="button" onClick={handleVerifyTasks} disabled={submitting} className="btn-primary text-sm w-full">
            {submitting ? 'Verifying…' : 'Verify Completed Tasks'}
          </button>
        )}
        {tasksVerified && (
          <div className="space-y-3">
            <p className="text-sm text-green-300/90">All tasks verified — ready to submit to customer.</p>
            <Link
              to={submitToCustomerPath}
              className="btn-primary text-sm w-full inline-flex items-center justify-center gap-2"
            >
              <Send size={14} />
              Submit Project to Customer
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'verify') {
    return (
      <div className="space-y-4 mt-4 pt-4 border-t border-myth-border/60">
        <p className="text-sm text-gray-400">
          Approving the fix closes the update request and returns the project to review so you can accept it for support.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setVerifyDecision('approve')}
            className={`text-sm px-4 py-2 rounded-lg border ${verifyDecision === 'approve' ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-myth-border text-gray-400'}`}
          >
            <CheckCircle2 size={14} className="inline mr-1" /> Approve fix
          </button>
          <button
            type="button"
            onClick={() => setVerifyDecision('reopen')}
            className={`text-sm px-4 py-2 rounded-lg border ${verifyDecision === 'reopen' ? 'border-red-500/50 bg-red-500/10 text-red-300' : 'border-myth-border text-gray-400'}`}
          >
            <XCircle size={14} className="inline mr-1" /> Reopen request
          </button>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Notes</label>
          <textarea className="input-field w-full min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Verification notes…" />
        </div>
        <button type="button" onClick={handleVerify} disabled={submitting} className="btn-primary text-sm inline-flex items-center gap-2">
          <Send size={14} />
          {submitting ? 'Saving…' : (verifyDecision === 'approve' ? 'Approve fix & continue' : 'Reopen request')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-myth-border/60">
      <p className="text-sm text-gray-400">
        Accept the project to activate support, or request changes from the technical team.
      </p>

      {deliveryDocs.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Delivery documents</p>
          <RequirementsDocLinks documents={deliveryDocs} compact />
        </div>
      )}

      {showChangesForm && (
        <div className="space-y-3 p-4 rounded-lg border border-orange-500/30 bg-orange-500/5">
          <p className="text-sm font-medium text-orange-200 flex items-center gap-2">
            <AlertCircle size={16} /> Request changes from technical team
          </p>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Request type</label>
            <select className="input-field w-full" value={updateType} onChange={(e) => setUpdateType(e.target.value)}>
              {UPDATE_REQUEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title *</label>
            <input className="input-field w-full" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} placeholder="Brief summary of required changes" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea className="input-field w-full min-h-[80px]" value={updateDescription} onChange={(e) => setUpdateDescription(e.target.value)} placeholder="Details for the technical manager…" />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="button"
          onClick={handleAccept}
          disabled={submitting}
          className="btn-primary text-sm inline-flex items-center gap-2"
        >
          <CheckCircle2 size={14} />
          {submitting ? 'Accepting…' : 'Support Team Accepted'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (showChangesForm) handleRequestChanges();
            else setShowChangesForm(true);
          }}
          disabled={submitting}
          className="btn-secondary text-sm inline-flex items-center gap-2 border-orange-500/40 text-orange-300 hover:bg-orange-500/10"
        >
          <AlertCircle size={14} />
          {showChangesForm ? (submitting ? 'Sending…' : 'Send change request') : 'Request Changes'}
        </button>
      </div>
    </div>
  );
}

export default function SupportReviewPanel({ project, mode, onDone }) {
  return (
    <SupportReviewForm
      project={project}
      mode={mode}
      onDone={onDone}
    />
  );
}

export { SupportReviewForm };
