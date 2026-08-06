import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Headphones, Eye, MessageSquare, ArrowUpRight, CheckCircle, PlayCircle, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsAPI, TICKET_PRIORITIES, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { SUPPORT_PERSON_TICKET_TABS } from '../../constants/supportPersonNav';
import { ticketStatusMeta, TICKET_WORKER_NEXT_STATUSES } from '../../constants/ticketStatusFlows';

const personName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—');

function ticketActionLabel(status) {
  const next = TICKET_WORKER_NEXT_STATUSES[status];
  if (next === 'accepted') return { label: 'Accept', icon: ThumbsUp, className: 'btn-primary' };
  if (next === 'working') return { label: 'Start Work', icon: PlayCircle, className: 'btn-primary' };
  if (next === 'completed') return { label: 'Complete', icon: CheckCircle, className: 'btn-primary' };
  return null;
}

export default function SupportPersonAssignedTickets() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(searchParams.get('tab') || 'active');
  const [filters, setFilters] = useState({ priority: '' });

  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'active';
    setTab(urlTab);
  }, [searchParams]);

  useEffect(() => {
    ticketsAPI.getAll({ limit: 200, excludeChangeRequests: 'true' })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, []);

  const tabConfig = useMemo(
    () => SUPPORT_PERSON_TICKET_TABS.find((t) => t.key === tab) || SUPPORT_PERSON_TICKET_TABS[0],
    [tab],
  );

  const counts = useMemo(() => {
    const map = {};
    SUPPORT_PERSON_TICKET_TABS.forEach((t) => {
      map[t.key] = items.filter((item) => t.statuses.includes(item.status)).length;
    });
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!tabConfig.statuses.includes(item.status)) return false;
      if (filters.priority && item.priority !== filters.priority) return false;
      return true;
    });
  }, [items, tabConfig, filters.priority]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Headphones size={24} className="text-orange-400" /> My Tickets
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Assigned to you — accept, update progress, complete, or escalate when needed.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUPPORT_PERSON_TICKET_TABS.map((t) => (
          <Link
            key={t.key}
            to={`/support/tickets/assigned?tab=${t.key}`}
            className={`text-sm px-3 py-1.5 rounded-lg border ${
              tab === t.key ? 'border-myth-accent bg-myth-accent/10 text-white' : 'border-myth-border text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label} ({counts[t.key] ?? 0})
          </Link>
        ))}
        <select
          className="input-field sm:max-w-[160px] text-sm"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All priorities</option>
          {Object.entries(TICKET_PRIORITIES).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No tickets in this view.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-myth-border">
                <th className="pb-3 pr-4">Ticket</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Project</th>
                <th className="pb-3 pr-4">Priority</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Due</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const statusMeta = ticketStatusMeta(t.status);
                const action = ticketActionLabel(t.status);
                const ActionIcon = action?.icon;
                return (
                  <tr key={t._id} className="border-b border-myth-border/50 hover:bg-myth-surface/30">
                    <td className="py-3 pr-4">
                      <p className="font-mono text-myth-accent text-xs">{t.ticketNumber}</p>
                      <p className="text-white mt-0.5">{t.subject}</p>
                      {t.category && <p className="text-xs text-gray-500 mt-0.5">{t.category}</p>}
                    </td>
                    <td className="py-3 pr-4 text-gray-300">{personName(t.customer)}</td>
                    <td className="py-3 pr-4 text-gray-400">{t.project?.name || '—'}</td>
                    <td className="py-3 pr-4"><StatusBadge status={t.priority} config={TICKET_PRIORITIES} /></td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusMeta.color}`}>{statusMeta.label}</span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">
                      {t.slaDeadline ? formatDateTime(t.slaDeadline) : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        <Link to={`/tickets/${t._id}`} className="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1">
                          <Eye size={12} /> View
                        </Link>
                        {action && (
                          <Link to={`/tickets/${t._id}`} className={`${action.className} text-xs py-1 px-2 inline-flex items-center gap-1`}>
                            {ActionIcon && <ActionIcon size={12} />} {action.label}
                          </Link>
                        )}
                        <Link to={`/tickets/${t._id}`} className="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1">
                          <MessageSquare size={12} /> Reply
                        </Link>
                        {!['resolved', 'closed', 'completed', 'reviewed'].includes(t.status) && (
                          <Link to={`/tickets/${t._id}`} className="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1 text-amber-300">
                            <ArrowUpRight size={12} /> Escalate
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-500">Updated {formatDateTime(new Date().toISOString())}</p>
    </div>
  );
}
