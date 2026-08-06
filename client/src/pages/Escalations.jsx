import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsAPI, TICKET_STATUSES, TICKET_PRIORITIES, formatDateTime } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminStatStrip,
  AdminContentCard,
  AdminEmptyState,
} from '../components/admin/adminUi';

export default function Escalations() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketsAPI.getAll()
      .then(({ data }) => setTickets((data.items || []).filter((t) => t.escalated || t.priority === 'critical')))
      .catch(() => toast.error('Failed to load escalations'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const escalated = tickets.filter((t) => t.escalated);
  const critical = tickets.filter((t) => t.priority === 'critical' && !t.escalated);
  const open = tickets.filter((t) => !['closed', 'resolved'].includes(t.status));

  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={AlertTriangle}
        title="Escalations"
        subtitle="Critical and escalated support tickets requiring immediate attention"
        meta={`${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} in escalation queue`}
      />

      <AdminStatStrip stats={[
        { label: 'Total flagged', value: tickets.length, color: 'text-white', highlight: tickets.length > 0 },
        { label: 'Escalated', value: escalated.length, color: 'text-red-400', highlight: escalated.length > 0 },
        { label: 'Critical priority', value: critical.length, color: 'text-orange-400' },
        { label: 'Still open', value: open.length, color: 'text-amber-400', link: '/tickets' },
      ]} />

      <AdminContentCard title={`Escalation queue (${tickets.length})`}>
        {tickets.length === 0 ? (
          <AdminEmptyState message="No escalated or critical tickets right now." icon={AlertTriangle} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header">Ticket #</th>
                  <th className="table-header">Subject</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Flag</th>
                  <th className="table-header">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id} className="border-t border-myth-border hover:bg-myth-surface/30 transition-colors">
                    <td className="table-cell">
                      <Link to={`/tickets/${t._id}`} className="font-mono text-myth-accent hover:underline">
                        {t.ticketNumber}
                      </Link>
                    </td>
                    <td className="table-cell text-white">{t.subject}</td>
                    <td className="table-cell text-gray-400">
                      {t.customer ? `${t.customer.firstName || ''} ${t.customer.lastName || ''}`.trim() : '—'}
                    </td>
                    <td className="table-cell"><StatusBadge status={t.priority} config={TICKET_PRIORITIES} /></td>
                    <td className="table-cell"><StatusBadge status={t.status} config={TICKET_STATUSES} /></td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.escalated ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {t.escalated ? 'Escalated' : 'Critical'}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 text-xs">{formatDateTime(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminContentCard>
    </AdminPageShell>
  );
}
