import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectsAPI, tasksAPI, ticketsAPI, usersAPI, staffRolesAPI, milestonesAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import {
  DELIVERY_REVIEW_MODES,
  workflowStageForProjectStatus,
} from '../../constants/deliveryWorkflow';

export {
  emptyTaskForm,
  buildTaskPayload,
  parseTaskToForm,
} from './TechManagerCreateTaskForm';

export function ProjectReviewForm({ mode = 'code_review', onDone }) {
  const config = DELIVERY_REVIEW_MODES[mode] || DELIVERY_REVIEW_MODES.code_review;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ projectId: '', notes: '', decision: 'approve' });

  const loadProjects = () => {
    setLoading(true);
    return projectsAPI.getAll({ status: config.loadStatus, limit: 100 })
      .then(({ data }) => setProjects(data.items || []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId) return toast.error('Select a project');
    setSubmitting(true);
    try {
      let nextStatus = config.approve.nextStatus;
      if (form.decision === 'changes') nextStatus = config.changes.nextStatus;
      if (form.decision === 'reject') nextStatus = 'on_hold';
      const workflowStage = workflowStageForProjectStatus(nextStatus);
      if (mode === 'deployment' && form.decision === 'approve') {
        await projectsAPI.update(form.projectId, {
          status: nextStatus,
          ...(workflowStage ? { workflowStage } : {}),
          reviewNotes: form.notes.trim() || undefined,
        });
        toast.success(config.successMessage);
      } else {
        await projectsAPI.update(form.projectId, {
          status: nextStatus,
          ...(workflowStage ? { workflowStage } : {}),
          reviewNotes: form.notes.trim() || undefined,
        });
        toast.success(config.successMessage);
      }
      setForm({ projectId: '', notes: '', decision: 'approve' });
      await loadProjects();
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit} className="card border-myth-accent/20 space-y-4">
      <h3 className="text-white font-semibold">{config.title}</h3>
      {projects.length === 0 && (
        <p className="text-sm text-amber-400/90">{config.emptyHint}</p>
      )}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Project *</label>
        <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="input-field" required>
          <option value="">Select project</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        {form.projectId && (
          <Link
            to={`/projects/${form.projectId}`}
            className="inline-block mt-2 text-sm text-myth-accent hover:underline"
          >
            View project details →
          </Link>
        )}
        {mode === 'bug_fixing' && (
          <Link
            to="/bug-tracker"
            className="inline-block mt-2 ml-4 text-sm text-orange-400 hover:underline"
          >
            Open Bug Tracker →
          </Link>
        )}
        {mode === 'deployment' && (
          <Link
            to="/deployment"
            className="inline-block mt-2 ml-4 text-sm text-purple-400 hover:underline"
          >
            Deployment requests →
          </Link>
        )}
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1">Decision</label>
        <select value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} className="input-field">
          <option value="approve">{config.approve.label}</option>
          <option value="changes">{config.changes.label}</option>
          <option value="reject">Reject / On Hold</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1">Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field h-20" placeholder="Review comments, test results, bug notes…" />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary text-sm">
        {submitting ? 'Saving…' : 'Submit'}
      </button>
    </form>
  );
}

export function BugReportForm({ onCreated }) {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: '', description: '', priority: 'high', project: '', technicalAssignee: '',
  });

  useEffect(() => {
    usersAPI.getAll().then(({ data }) => {
      const all = Array.isArray(data) ? data : [];
      setEmployees(all.filter((u) => u.role === 'technical'));
    });
    projectsAPI.getAll({ limit: 100 }).then(({ data }) => setProjects(data.items || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return toast.error('Subject is required');
    setSubmitting(true);
    try {
      await ticketsAPI.create({
        subject: form.subject.trim(),
        description: form.description,
        priority: form.priority,
        project: form.project || undefined,
        technicalAssignee: form.technicalAssignee || undefined,
        technicalStatus: form.technicalAssignee ? 'assigned' : 'unassigned',
        category: 'bug',
      });
      toast.success('Bug report created');
      setForm({ subject: '', description: '', priority: 'high', project: '', technicalAssignee: '' });
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bug');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card border-red-500/20 space-y-4">
      <h3 className="text-white font-semibold">Create Bug Report</h3>
      <div>
        <label className="block text-sm text-gray-300 mb-1">Subject *</label>
        <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field" required />
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Project</label>
          <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} className="input-field">
            <option value="">None</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Assign To</label>
          <select value={form.technicalAssignee} onChange={(e) => setForm({ ...form, technicalAssignee: e.target.value })} className="input-field">
            <option value="">Unassigned</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Creating…' : 'Create Bug'}</button>
    </form>
  );
}

export function DeploymentRequestForm({ onCreated }) {
  const [projects, setProjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ version: '', environment: 'Staging', project: '', notes: '' });

  useEffect(() => {
    projectsAPI.getAll({ limit: 100 }).then(({ data }) => setProjects(data.items || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.version.trim()) return toast.error('Version is required');
    setSubmitting(true);
    try {
      await ticketsAPI.create({
        subject: `Deployment: ${form.version} (${form.environment})`,
        description: form.notes || `Deploy ${form.version} to ${form.environment}`,
        priority: 'medium',
        project: form.project || undefined,
        category: 'deployment',
        technicalStatus: 'assigned',
      });
      toast.success('Deployment request submitted');
      setForm({ version: '', environment: 'Staging', project: '', notes: '' });
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit deployment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card border-myth-accent/20 space-y-4">
      <h3 className="text-white font-semibold">Deployment Request</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Version *</label>
          <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className="input-field" placeholder="v2.5.0" required />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Environment</label>
          <select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} className="input-field">
            <option value="Staging">Staging</option>
            <option value="Production">Production</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1">Project</label>
        <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} className="input-field">
          <option value="">Select project</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1">Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field h-20" placeholder="Release notes, checklist…" />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Submitting…' : 'Request Deployment'}</button>
    </form>
  );
}

export function SubmitToManagerForm({ projectId, projectName, onSubmitted }) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await projectsAPI.updateWorkflow(projectId, 'delivered');
      toast.success(`"${projectName}" submitted to manager for review`);
      onSubmitted?.();
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit to manager');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-white">Submit Project to Manager</h4>
      <p className="text-xs text-gray-400">Moves project to Delivered stage and notifies your manager.</p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="input-field h-20 text-sm"
        placeholder="Completion notes for manager (optional)"
      />
      <button type="submit" disabled={submitting} className="btn-primary text-sm">
        {submitting ? 'Submitting…' : 'Submit to Manager'}
      </button>
    </form>
  );
}

export function AnnouncementForm() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error('Enter announcement text');
    setSubmitting(true);
    try {
      await tasksAPI.create({
        title: `Team Announcement: ${message.trim().slice(0, 60)}`,
        description: message.trim(),
        priority: 'medium',
        isAnnouncement: true,
      });
      toast.success('Announcement posted to team tasks');
      setMessage('');
    } catch {
      toast.error('Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h3 className="text-white font-semibold">Create Announcement</h3>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-field h-24" placeholder="Message for your technical team…" />
      <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Posting…' : 'Post Announcement'}</button>
    </form>
  );
}

export function useTechManagerFormData() {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersAPI.getAll(),
      projectsAPI.getAll({ limit: 200 }),
      staffRolesAPI.getAll(),
      milestonesAPI.getAll(),
    ])
      .then(([usersRes, projectsRes, teamsRes, milestonesRes]) => {
        const all = Array.isArray(usersRes.data) ? usersRes.data : [];
        setEmployees(all.filter((u) => u.role === 'technical' && u.isActive !== false));
        setProjects(projectsRes.data?.items || []);
        setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.items || []);
        setMilestones(Array.isArray(milestonesRes.data) ? milestonesRes.data : milestonesRes.data?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return { employees, projects, teams, milestones, loading };
}
