import { useState, useEffect } from 'react';
import { Bug } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsAPI, TICKET_PRIORITIES } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { BugReportForm } from '../components/techManager/TechManagerForms';

const TECH_LABELS = {
  assigned: 'Assigned', in_progress: 'In Progress', testing: 'Testing',
  need_information: 'Need Information', resolved: 'Resolved', closed: 'Closed',
};

const BUG_STATUSES = ['unassigned', 'assigned', 'in_progress', 'testing', 'need_information', 'resolved', 'closed'];

const FILTERS = [
  { key: 'open', label: 'Open Bugs', statuses: ['unassigned', 'assigned', 'in_progress', 'need_information'] },
  { key: 'assigned', label: 'Assigned', statuses: ['assigned', 'in_progress'] },
  { key: 'fixed', label: 'Fixed', statuses: ['resolved'] },
  { key: 'closed', label: 'Closed', statuses: ['closed'] },
];

export default function BugTracker() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [modal, setModal] = useState(null);
  const [editTicket, setEditTicket] = useState(null);
  const [updateForm, setUpdateForm] = useState({ technicalStatus: '', priority: '' });

  const fetch = () => {
    setLoading(true);
    ticketsAPI.getAll()
      .then(({ data }) => setTickets((data.items || []).filter((t) => t.category === 'bug' || BUG_STATUSES.includes(t.technicalStatus))))
      .catch(() => toast.error('Failed to load bugs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const activeFilter = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const filtered = tickets.filter((t) => activeFilter.statuses.includes(t.technicalStatus));

  const openUpdate = (ticket) => {
    setEditTicket(ticket);
    setUpdateForm({ technicalStatus: ticket.technicalStatus, priority: ticket.priority });
    setModal('update');
  };

  const saveUpdate = async (e) => {
    e.preventDefault();
    if (!editTicket) return;
    try {
      await ticketsAPI.update(editTicket._id, updateForm);
      toast.success('Bug updated');
      setModal(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bug className="text-red-400" size={24} /> Bug Management
          </h1>
          <p className="text-gray-400 mt-1">Create, assign, and update bug reports</p>
        </div>
        <button type="button" onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })} className="btn-primary text-sm">Create Bug</button>
      </div>

      <BugReportForm onCreated={fetch} />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === f.key ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Ticket #</th>
                <th className="table-header">Subject</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Stage</th>
                <th className="table-header">Assignee</th>
                <th className="table-header" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center text-gray-500 py-8">No bugs in this view</td></tr>
              ) : filtered.map((t) => (
                <tr key={t._id} className="border-t border-myth-border">
                  <td className="table-cell">{t.ticketNumber}</td>
                  <td className="table-cell">{t.subject}</td>
                  <td className="table-cell"><StatusBadge status={t.priority} config={TICKET_PRIORITIES} /></td>
                  <td className="table-cell">
                    <span className="badge bg-orange-500/20 text-orange-400">{TECH_LABELS[t.technicalStatus] || t.technicalStatus}</span>
                  </td>
                  <td className="table-cell">
                    {t.technicalAssignee ? `${t.technicalAssignee.firstName || ''} ${t.technicalAssignee.lastName || ''}` : 'Unassigned'}
                  </td>
                  <td className="table-cell">
                    <button type="button" onClick={() => openUpdate(t)} className="text-sm text-myth-accent hover:underline">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal === 'update'} onClose={() => setModal(null)} title="Update Bug">
        <form onSubmit={saveUpdate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Technical Status</label>
            <select value={updateForm.technicalStatus} onChange={(e) => setUpdateForm({ ...updateForm, technicalStatus: e.target.value })} className="input-field">
              {Object.entries(TECH_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Priority</label>
            <select value={updateForm.priority} onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value })} className="input-field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Save</button>
        </form>
      </Modal>
    </div>
  );
}
