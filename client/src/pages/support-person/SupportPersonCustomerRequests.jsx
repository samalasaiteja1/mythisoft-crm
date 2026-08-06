import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileEdit, Eye, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsAPI, TICKET_STATUSES, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

const personName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—');

export default function SupportPersonCustomerRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ticketsAPI.getAll({ requestKind: 'change_request', limit: 100 }),
      ticketsAPI.getAll({ limit: 100, excludeChangeRequests: 'true' }),
    ])
      .then(([changeRes, ticketRes]) => {
        const changes = changeRes.data?.items || [];
        const pendingReplies = (ticketRes.data?.items || []).filter((t) => {
          if (['closed', 'resolved'].includes(t.status)) return false;
          const comments = t.comments || [];
          if (!comments.length) return t.status === 'open' || t.status === 'assigned';
          const last = [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          return last?.author?.role === 'customer';
        });
        setItems([...changes, ...pendingReplies.filter((t) => t.requestKind !== 'change_request')]);
      })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileEdit size={24} className="text-purple-400" /> Customer Requests
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Change requests and customer follow-ups assigned by the Support Manager.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">No customer requests assigned to you.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-myth-border">
                <th className="pb-3 pr-4">Request ID</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Project</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-myth-border/50 hover:bg-myth-surface/30">
                  <td className="py-3 pr-4 font-mono text-myth-accent text-xs">{item.ticketNumber}</td>
                  <td className="py-3 pr-4 text-gray-300">{personName(item.customer)}</td>
                  <td className="py-3 pr-4 text-gray-400">{item.project?.name || '—'}</td>
                  <td className="py-3 pr-4 text-gray-400 capitalize">
                    {item.requestKind === 'change_request' ? 'Change request' : 'Customer reply'}
                  </td>
                  <td className="py-3 pr-4"><StatusBadge status={item.status} config={TICKET_STATUSES} /></td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      <Link to={`/tickets/${item._id}`} className="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1">
                        <Eye size={12} /> View
                      </Link>
                      <Link to={`/tickets/${item._id}`} className="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1">
                        <MessageSquare size={12} /> Add notes / Reply
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-500">Submitted requests show here when assigned to you by the Support Manager.</p>
    </div>
  );
}
