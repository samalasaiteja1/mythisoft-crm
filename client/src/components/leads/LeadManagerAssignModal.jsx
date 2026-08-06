import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import { leadsAPI, usersAPI } from '../../services/api';

const emptyForm = { assignedManager: '', priority: 'medium', assignmentDueDate: '', assignmentRemarks: '' };

export default function LeadManagerAssignModal({ lead, isOpen, onClose, onAssigned }) {
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    usersAPI.getManagers()
      .then(({ data }) => setManagers(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load managers'));
  }, [isOpen]);

  useEffect(() => {
    if (!lead) return;
    setForm({
      assignedManager: lead.assignedManager?._id || lead.assignedManager || '',
      priority: lead.priority || 'medium',
      assignmentDueDate: '',
      assignmentRemarks: '',
    });
  }, [lead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lead?._id) return;
    setSubmitting(true);
    try {
      const { data } = await leadsAPI.assignManager(lead._id, form);
      toast.success('Lead assigned to manager');
      onAssigned?.(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <Modal isOpen onClose={onClose} title={`Assign to Manager: ${lead.firstName} ${lead.lastName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-400">
          Step 10 — Admin assigns lead to a department manager. The manager will then assign to a salesperson.
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Select Manager *</label>
          <select
            className="input-field w-full"
            value={form.assignedManager}
            onChange={(e) => setForm({ ...form, assignedManager: e.target.value })}
            required
          >
            <option value="">Select manager</option>
            {managers.map((u) => (
              <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Priority</label>
          <select className="input-field w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Due Date</label>
          <input type="date" className="input-field w-full" value={form.assignmentDueDate} onChange={(e) => setForm({ ...form, assignmentDueDate: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Remarks</label>
          <textarea className="input-field w-full h-20" value={form.assignmentRemarks} onChange={(e) => setForm({ ...form, assignmentRemarks: e.target.value })} />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Assigning…' : 'Assign to Manager'}</button>
        </div>
      </form>
    </Modal>
  );
}
