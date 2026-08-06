import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileEdit } from 'lucide-react';
import { ticketsAPI, TICKET_STATUSES, TICKET_PRIORITIES, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import {
  SupportManagerPageShell,
  SupportManagerPageHeader,
  SupportManagerStatStrip,
  SupportManagerContentCard,
  SupportManagerEmptyState,
} from '../../components/supportManager/supportManagerUi';

const personName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—');

export default function SupportManagerChangeRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '' });

  useEffect(() => {
    ticketsAPI.getAll({ requestKind: 'change_request', limit: 100 })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.priority && item.priority !== filters.priority) return false;
    return true;
  });

  if (loading) return <LoadingSpinner />;

  const open = items.filter((i) => !['closed', 'resolved'].includes(i.status));
  const pending = items.filter((i) => ['open', 'new', 'pending'].includes(i.status));
  const stats = [
    { label: 'Total requests', value: items.length, color: 'text-white' },
    { label: 'Open', value: open.length, color: 'text-amber-400', highlight: open.length > 0 },
    { label: 'Pending review', value: pending.length, color: 'text-orange-400' },
    { label: 'High priority', value: open.filter((i) => ['high', 'urgent'].includes(i.priority)).length, color: 'text-rose-400' },
    { label: 'Closed', value: items.filter((i) => i.status === 'closed').length, color: 'text-gray-400' },
  ];

  return (
    <SupportManagerPageShell>
      <SupportManagerPageHeader
        icon={FileEdit}
        title="Change Requests"
        subtitle="Customer feature requests and modifications — review, approve, or send to technical team."
        workflow={['Customer submits', 'Support review', 'Approve or escalate', 'Deliver update']}
      />

      <SupportManagerStatStrip stats={stats} />

      <SupportManagerContentCard
        title={`Requests (${filtered.length})`}
        toolbar={(
          <>
            <select className="input-field sm:max-w-[180px]" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              {Object.entries(TICKET_STATUSES).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select className="input-field sm:max-w-[160px]" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All priorities</option>
              {Object.entries(TICKET_PRIORITIES).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </>
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">Request ID</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Project</th>
                <th className="table-header">Title</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Status</th>
                <th className="table-header">Submitted</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><SupportManagerEmptyState message="No change requests match your filters." icon={FileEdit} /></td></tr>
              ) : filtered.map((item) => (
                <tr key={item._id} className="border-t border-myth-border hover:bg-myth-surface/30 transition-colors">
                  <td className="table-cell font-mono text-myth-accent">{item.ticketNumber}</td>
                  <td className="table-cell text-gray-300">{personName(item.customer)}</td>
                  <td className="table-cell text-gray-400">{item.project?.name || '—'}</td>
                  <td className="table-cell text-white">{item.subject}</td>
                  <td className="table-cell"><StatusBadge status={item.priority} config={TICKET_PRIORITIES} /></td>
                  <td className="table-cell"><StatusBadge status={item.status} config={TICKET_STATUSES} /></td>
                  <td className="table-cell text-gray-400">{formatDateTime(item.createdAt)}</td>
                  <td className="table-cell">
                    <Link to={`/tickets/${item._id}`} className="text-myth-accent hover:underline text-sm">Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SupportManagerContentCard>
    </SupportManagerPageShell>
  );
}
