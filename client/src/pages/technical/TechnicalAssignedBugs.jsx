import { useState } from 'react';
import { Bug } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { ticketsAPI, TICKET_PRIORITIES } from '../../services/api';
import { useTechnicalPersonData } from '../../hooks/useTechnicalPersonData';
import { TechPersonPageHeader, TechPersonContentCard, TechPersonEmptyState } from '../../components/technical/technicalPersonUi';

const BUG_STATUS_OPTIONS = [
  { value: 'assigned', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Fixed' },
  { value: 'closed', label: 'Closed' },
];

export default function TechnicalAssignedBugs() {
  const { bugs, loading, refresh } = useTechnicalPersonData();
  const [modal, setModal] = useState(null);
  const [editBug, setEditBug] = useState(null);
  const [form, setForm] = useState({ technicalStatus: '', fixDescription: '' });
  const [submitting, setSubmitting] = useState(false);

  const openUpdate = (bug) => {
    setEditBug(bug);
    setForm({ technicalStatus: bug.technicalStatus || 'assigned', fixDescription: bug.resolutionNotes || '' });
    setModal('update');
  };

  const saveUpdate = async (e) => {
    e.preventDefault();
    if (!editBug) return;
    setSubmitting(true);
    try {
      await ticketsAPI.update(editBug._id, {
        technicalStatus: form.technicalStatus,
        resolutionNotes: form.fixDescription,
      });
      toast.success('Bug updated');
      setModal(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechPersonPageHeader
        icon={Bug}
        title="Assigned Bugs"
        subtitle="Bugs assigned to you — update status and fix description"
      />
      <TechPersonContentCard>
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Bug ID</th>
              <th className="table-header">Title</th>
              <th className="table-header">Priority</th>
              <th className="table-header">Status</th>
              <th className="table-header" />
            </tr>
          </thead>
          <tbody>
            {bugs.length === 0 ? (
              <tr><td colSpan={5} className="table-cell text-center text-gray-500 py-10">No assigned bugs</td></tr>
            ) : bugs.map((b) => (
              <tr key={b._id} className="border-t border-myth-border">
                <td className="table-cell text-gray-400">{b.ticketNumber || b._id.slice(-6)}</td>
                <td className="table-cell text-white">{b.subject}</td>
                <td className="table-cell"><StatusBadge status={b.priority} config={TICKET_PRIORITIES} /></td>
                <td className="table-cell capitalize text-gray-400">{b.technicalStatus?.replace(/_/g, ' ')}</td>
                <td className="table-cell">
                  <button type="button" onClick={() => openUpdate(b)} className="text-sm text-myth-accent hover:underline">Update Bug</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TechPersonContentCard>

      <Modal isOpen={modal === 'update'} onClose={() => setModal(null)} title="Update Bug" size="md">
        <form onSubmit={saveUpdate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Bug Title</label>
            <p className="text-white">{editBug?.subject}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Status</label>
            <select value={form.technicalStatus} onChange={(e) => setForm({ ...form, technicalStatus: e.target.value })} className="input-field w-full">
              {BUG_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Fix Description</label>
            <textarea value={form.fixDescription} onChange={(e) => setForm({ ...form, fixDescription: e.target.value })} className="input-field h-24 w-full" />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Updating…' : 'Update'}</button>
        </form>
      </Modal>
    </div>
  );
}
