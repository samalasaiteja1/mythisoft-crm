import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { leadsAPI, LEAD_STATUSES } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import LeadManagerAssignModal from '../components/leads/LeadManagerAssignModal';
import { usePermissions } from '../hooks/usePermissions';

export default function LeadManagerAssignment() {
  const { canAction } = usePermissions();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchLeads = () => {
    setLoading(true);
    leadsAPI.getAll({ limit: 100, assignmentFilter: 'needs_manager' })
      .then(({ data }) => setLeads(data.leads || []))
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, []);

  if (loading) return <LoadingSpinner />;
  if (!canAction('leads', 'assign')) {
    return <div className="text-center text-gray-400 py-12">You do not have permission to assign leads.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Assign Lead to Manager</h1>
        <p className="text-gray-400 mt-1">
          Step 10 — Route new leads to the right department manager before sales assignment.
        </p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Lead ID</th>
            <th className="table-header">Name</th>
            <th className="table-header">Company</th>
            <th className="table-header">Status</th>
            <th className="table-header">Priority</th>
            <th className="table-header">Action</th>
          </tr></thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l._id} className="border-t border-myth-border">
                <td className="table-cell text-myth-accent">{l.leadNumber || l._id.slice(-6)}</td>
                <td className="table-cell">
                  <Link to={`/leads/${l._id}`} className="text-white hover:text-myth-accent">{l.firstName} {l.lastName}</Link>
                </td>
                <td className="table-cell">{l.company || '-'}</td>
                <td className="table-cell"><StatusBadge status={l.status} config={LEAD_STATUSES} /></td>
                <td className="table-cell capitalize">{l.priority || 'medium'}</td>
                <td className="table-cell">
                  <button type="button" onClick={() => setSelected(l)} className="btn-secondary text-xs py-1 px-3">Assign Manager</button>
                </td>
              </tr>
            ))}
            {!leads.length && (
              <tr>
                <td colSpan={6} className="table-cell text-center text-gray-500 py-8">
                  All leads have a manager assigned.{' '}
                  <Link to="/leads/create" className="text-myth-accent hover:underline">Create a lead</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <LeadManagerAssignModal
        lead={selected}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        onAssigned={() => fetchLeads()}
      />
    </div>
  );
}
