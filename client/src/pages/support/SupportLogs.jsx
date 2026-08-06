import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Plus, MessageSquare, Activity, Ticket, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SearchBar from '../../components/SearchBar';
import TicketHistoryCard, { LOG_META } from '../../components/support/TicketHistoryCard';
import { useAuth } from '../../context/AuthContext';

const FILTER_TABS = [
  { key: 'all', label: 'All activity', icon: History },
  { key: 'created', label: 'Opened', icon: Ticket },
  { key: 'comment', label: 'Replies', icon: MessageSquare },
  { key: 'activity', label: 'Updates', icon: Activity },
  { key: 'internal_note', label: 'Internal notes', icon: UserCog, staffOnly: true },
];

export default function SupportLogs() {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';
  const [logs, setLogs] = useState([]);
  const [ticketCount, setTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    ticketsAPI.getSupportLogs()
      .then(({ data }) => {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setTicketCount(data.ticketCount || 0);
      })
      .catch(() => toast.error('Failed to load ticket history'))
      .finally(() => setLoading(false));
  }, []);

  const visibleTabs = useMemo(
    () => FILTER_TABS.filter((tab) => !tab.staffOnly || !isCustomer),
    [isCustomer],
  );

  const counts = useMemo(() => {
    const map = { all: logs.length };
    Object.keys(LOG_META).forEach((key) => {
      map[key] = logs.filter((log) => log.logType === key).length;
    });
    return map;
  }, [logs]);

  const filtered = useMemo(() => logs.filter((log) => {
    if (typeFilter !== 'all' && log.logType !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [log.ticketNumber, log.subject, log.message, log.title, log.author?.firstName, log.author?.lastName]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  }), [logs, search, typeFilter]);

  const stats = useMemo(() => [
    { label: 'Total events', value: logs.length, color: 'text-white' },
    { label: 'Tickets', value: ticketCount, color: 'text-cyan-400' },
    { label: 'Replies', value: counts.comment || 0, color: 'text-green-400' },
    { label: 'Updates', value: counts.activity || 0, color: 'text-purple-400' },
    {
      label: 'Internal notes',
      value: counts.internal_note || 0,
      color: 'text-amber-400',
      hidden: isCustomer,
    },
  ].filter((s) => !s.hidden), [logs.length, ticketCount, counts, isCustomer]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="card border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <History size={22} className="text-orange-400" />
              Ticket History
            </h1>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">
              Full timeline of support tickets — openings, replies, status changes, and team notes.
              {ticketCount > 0 && (
                <span className="text-gray-500">
                  {' '}
                  · {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} tracked
                </span>
              )}
            </p>
          </div>
          {!isCustomer && (
            <Link to="/tickets/create" className="btn-primary text-sm inline-flex items-center gap-2 shrink-0">
              <Plus size={16} />
              New ticket
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-xl bg-myth-surface/50 border border-myth-border hover:border-orange-500/25 transition-colors"
          >
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by ticket #, subject, message, or author..."
      />

      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = typeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeFilter(tab.key)}
              className={`text-sm px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 transition-colors ${
                active
                  ? 'border-orange-500/50 bg-orange-500/10 text-orange-200'
                  : 'border-myth-border text-gray-400 hover:text-gray-200 hover:border-myth-border/80'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              <span className="text-xs opacity-75">({counts[tab.key] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center border-dashed border-myth-border">
          <History size={40} className="text-gray-600 mb-3" />
          <p className="text-gray-300 font-medium">No history entries found</p>
          <p className="text-sm text-gray-500 mt-1 max-w-md">
            {search || typeFilter !== 'all'
              ? 'Try a different search or filter to see more activity.'
              : 'Open a support ticket to start building your timeline.'}
          </p>
          {!isCustomer && !search && typeFilter === 'all' && (
            <Link to="/tickets/create" className="btn-primary text-sm mt-4">
              Create first ticket
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <TicketHistoryCard key={log._id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
