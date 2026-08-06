import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { leaveAPI, formatDate } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/LoadingSpinner';

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
};

export default function Leave() {
  const { canAction } = usePermissions();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetch = () => {
    setLoading(true);
    leaveAPI.getAll({ status: statusFilter })
      .then(({ data }) => setLeaves(data.items || []))
      .catch(() => toast.error('Failed to load leave requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      await leaveAPI.approve(id);
      toast.success('Leave approved');
      fetch();
    } catch { toast.error('Approval failed'); }
  };

  const handleReject = async (id) => {
    try {
      await leaveAPI.reject(id);
      toast.success('Leave rejected');
      fetch();
    } catch { toast.error('Rejection failed'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leave Management</h1>
          <p className="text-gray-400 mt-1">Review and approve employee leave requests</p>
        </div>
        <select className="input-field sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Employee</th>
              <th className="table-header">Type</th>
              <th className="table-header">From</th>
              <th className="table-header">To</th>
              <th className="table-header">Reason</th>
              <th className="table-header">Status</th>
              {canAction('leave', 'approve') && <th className="table-header text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr><td colSpan={7} className="table-cell text-center text-gray-500 py-8">No leave requests</td></tr>
            ) : leaves.map((l) => (
              <tr key={l._id} className="border-t border-myth-border">
                <td className="table-cell">{l.user ? `${l.user.firstName} ${l.user.lastName}` : '-'}</td>
                <td className="table-cell capitalize">{l.type}</td>
                <td className="table-cell">{formatDate(l.startDate)}</td>
                <td className="table-cell">{formatDate(l.endDate)}</td>
                <td className="table-cell">{l.reason || '-'}</td>
                <td className="table-cell">
                  <span className={`badge ${statusColors[l.status]}`}>{l.status}</span>
                </td>
                {canAction('leave', 'approve') && (
                  <td className="table-cell text-right">
                    {l.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleApprove(l._id)} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg" title="Approve">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => handleReject(l._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg" title="Reject">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
