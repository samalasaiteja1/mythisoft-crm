import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dealsAPI, DEAL_STAGES, formatCurrency } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import DealAssignModal from '../components/deals/DealAssignModal';
import { usePermissions } from '../hooks/usePermissions';

export default function DealAssignment() {
  const { canAction } = usePermissions();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchDeals = () => {
    setLoading(true);
    dealsAPI.getAll()
      .then(({ data }) => setDeals(data || []))
      .catch(() => toast.error('Failed to load deals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDeals(); }, []);

  if (loading) return <LoadingSpinner />;
  if (!canAction('deals', 'assign')) {
    return <div className="text-center text-gray-400 py-12">You do not have permission to assign deals.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deal Assignment</h1>
        <p className="text-gray-400 mt-1">Assign or reassign deals to sales executives</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Deal</th>
              <th className="table-header">Customer</th>
              <th className="table-header">Value</th>
              <th className="table-header">Assigned To</th>
              <th className="table-header">Stage</th>
              <th className="table-header">Action</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d._id} className="border-t border-myth-border">
                <td className="table-cell">
                  <Link to={`/deals/${d._id}`} className="text-white hover:text-myth-accent">{d.title}</Link>
                </td>
                <td className="table-cell">
                  {d.customer ? `${d.customer.firstName} ${d.customer.lastName}` : '-'}
                </td>
                <td className="table-cell text-myth-accent">{formatCurrency(d.value)}</td>
                <td className="table-cell">
                  {d.assignedTo ? `${d.assignedTo.firstName} ${d.assignedTo.lastName}` : 'Unassigned'}
                </td>
                <td className="table-cell"><StatusBadge status={d.stage} config={DEAL_STAGES} /></td>
                <td className="table-cell">
                  <button type="button" onClick={() => setSelected(d)} className="btn-secondary text-xs py-1 px-3">Assign</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DealAssignModal
        deal={selected}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        onAssigned={() => fetchDeals()}
      />
    </div>
  );
}
