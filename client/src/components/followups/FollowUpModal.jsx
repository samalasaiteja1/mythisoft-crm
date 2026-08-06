import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import { followupsAPI, usersAPI } from '../../services/api';
import {
  ACTIVITY_TYPES,
  FOLLOWUP_PRIORITIES,
  WORKFLOW_STAGES,
  defaultFollowUpForm,
} from '../../constants/followups';

const stageOptions = WORKFLOW_STAGES.filter((s) => s.key !== 'all');

export default function FollowUpModal({ isOpen, onClose, onSaved, initial = null }) {
  const [form, setForm] = useState(defaultFollowUpForm());
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      usersAPI.getAll().then(({ data }) => setUsers(Array.isArray(data) ? data : data.users || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setForm({
        ...defaultFollowUpForm(),
        activityType: initial.activityType || 'task',
        title: initial.title || '',
        notes: initial.notes || '',
        scheduledAt: initial.scheduledAt
          ? new Date(initial.scheduledAt).toISOString().slice(0, 16)
          : defaultFollowUpForm().scheduledAt,
        contactName: initial.contactName || '',
        contactEmail: initial.contactEmail || '',
        contactPhone: initial.contactPhone || '',
        company: initial.company || '',
        meetingLink: initial.meetingLink || '',
        duration: initial.duration || 30,
        priority: initial.priority || 'medium',
        workflowStage: initial.workflowStage || 'lead',
        lead: initial.lead?._id || initial.lead || '',
        deal: initial.deal?._id || initial.deal || '',
        customer: initial.customer?._id || initial.customer || '',
        assignedTo: initial.assignedTo?._id || initial.assignedTo || '',
      });
    } else {
      setForm(defaultFollowUpForm());
    }
  }, [isOpen, initial]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        lead: form.lead || undefined,
        deal: form.deal || undefined,
        customer: form.customer || undefined,
        assignedTo: form.assignedTo || undefined,
      };
      if (initial?._id && !initial.virtual) {
        await followupsAPI.update(initial._id, payload);
        toast.success('Follow-up updated');
      } else {
        await followupsAPI.create(payload);
        toast.success('Activity logged');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save follow-up');
    } finally {
      setSaving(false);
    }
  };

  const isMeeting = form.activityType === 'meeting';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial?._id && !initial.virtual ? 'Edit follow-up' : 'Log activity'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Activity type</label>
            <select className="input" value={form.activityType} onChange={(e) => set('activityType', e.target.value)}>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Workflow stage</label>
            <select className="input" value={form.workflowStage} onChange={(e) => set('workflowStage', e.target.value)}>
              {stageOptions.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Discovery call with client" />
        </div>

        <div>
          <label className="label">Notes / outcome</label>
          <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Call summary, email content, meeting agenda..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Scheduled at</label>
            <input type="datetime-local" className="input" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {FOLLOWUP_PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border border-myth-border rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-white">Contact information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Contact name" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
            <input className="input" placeholder="Company" value={form.company} onChange={(e) => set('company', e.target.value)} />
            <input className="input" type="email" placeholder="Email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            <input className="input" placeholder="Phone" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
          </div>
        </div>

        {isMeeting && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Meeting link / location</label>
              <input className="input" value={form.meetingLink} onChange={(e) => set('meetingLink', e.target.value)} placeholder="Zoom / Teams / office address" />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" className="input" min={15} step={15} value={form.duration} onChange={(e) => set('duration', Number(e.target.value))} />
            </div>
          </div>
        )}

        <div>
          <label className="label">Assigned to</label>
          <select className="input" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
            <option value="">Current user</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
