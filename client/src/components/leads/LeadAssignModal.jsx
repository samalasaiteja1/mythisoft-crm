import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import { leadsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { assignedTo: '', priority: 'medium', assignmentDueDate: '', assignmentRemarks: '' };

export default function LeadAssignModal({ lead, isOpen, onClose, onAssigned }) {
  const { user } = useAuth();
  const [salesUsers, setSalesUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSales = async () => {
      try {
        const { data: allUsers } = await usersAPI.getAll();
        const all = Array.isArray(allUsers) ? allUsers : [];
        let members = all.filter((u) => u.role === 'sales' && u.isActive !== false);
        if (user?.role === 'manager') {
          members = members.filter((u) => String(u.reportsTo?._id || u.reportsTo) === String(user._id));
        }
        setSalesUsers(members.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || '')));
      } catch {
        toast.error('Failed to load sales team');
      }
    };
    fetchSales();
  }, [isOpen, user]);

  useEffect(() => {
    if (!lead) return;
    setForm({
      assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
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
      const { data } = await leadsAPI.assign(lead._id, form);
      toast.success('Lead assigned to salesperson');
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
    <Modal isOpen onClose={onClose} title={`Assign to Sales: ${lead.firstName} ${lead.lastName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-400">
          Step 11 — Manager assigns this lead to a salesperson on their team.
        </p>
        {lead.assignedManager && (
          <p className="text-xs text-myth-accent">
            Manager: {lead.assignedManager.firstName} {lead.assignedManager.lastName}
          </p>
        )}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Select Salesperson *</label>
          <select
            className="input-field w-full"
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            required
          >
            <option value="">Select salesperson</option>
            {salesUsers.map((u) => (
              <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
          {!salesUsers.length && (
            <p className="text-xs text-amber-400/80 mt-1">No salespeople on your team. Hire employees first.</p>
          )}
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
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Assigning…' : 'Assign to Sales'}</button>
        </div>
      </form>
    </Modal>
  );
}
