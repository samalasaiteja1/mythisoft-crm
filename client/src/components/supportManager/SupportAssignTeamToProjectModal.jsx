import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';

export default function SupportAssignTeamToProjectModal({
  teams = [],
  preselectedTeamId = '',
  onCancel,
  onAssigned,
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    staffRoleId: preselectedTeamId || '',
    startDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      projectsAPI.getSupportReviewQueue({ queue: 'submitted' }),
      projectsAPI.getSupportReviewQueue({ queue: 'active' }),
      projectsAPI.getSupportReviewQueue({ queue: 'review' }),
    ])
      .then(([submitted, active, review]) => {
        const map = new Map();
        [...(submitted.data?.items || []), ...(active.data?.items || []), ...(review.data?.items || [])]
          .forEach((p) => map.set(String(p._id), p));
        setProjects([...map.values()]);
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const selectedProject = useMemo(
    () => projects.find((p) => String(p._id) === String(form.projectId)),
    [projects, form.projectId],
  );

  const activeTeams = useMemo(
    () => teams.filter((t) => t.status === 'active'),
    [teams],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId) {
      toast.error('Select a project');
      return;
    }
    if (!form.staffRoleId) {
      toast.error('Select a support team');
      return;
    }

    setSubmitting(true);
    try {
      await projectsAPI.assignSupportTeam(form.projectId, {
        staffRoleId: form.staffRoleId,
        startDate: form.startDate || undefined,
        notes: form.notes?.trim() || undefined,
      });
      toast.success('Team assigned to project');
      onAssigned?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const customerLabel = selectedProject?.customer
    ? `${selectedProject.customer.firstName || ''} ${selectedProject.customer.lastName || ''}`.trim()
      || selectedProject.customer.companyName
      || selectedProject.customer.company
      || selectedProject.customer.email
    : '—';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-300 mb-1">Project *</label>
        <select
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          className="input-field w-full"
          required
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
              {p.supportReviewStatus ? ` (${p.supportReviewStatus.replace(/_/g, ' ')})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Customer</label>
        <input value={customerLabel} className="input-field w-full bg-myth-surface/50" readOnly disabled />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Support Team *</label>
        <select
          value={form.staffRoleId}
          onChange={(e) => setForm({ ...form, staffRoleId: e.target.value })}
          className="input-field w-full"
          required
        >
          <option value="">Select team</option>
          {activeTeams.map((t) => (
            <option key={t._id} value={t._id}>{t.name} ({t.code})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Start Date</label>
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          className="input-field w-full"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="input-field w-full min-h-[80px]"
          placeholder="Optional assignment notes"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Assigning…' : 'Assign Team'}
        </button>
      </div>
    </form>
  );
}
