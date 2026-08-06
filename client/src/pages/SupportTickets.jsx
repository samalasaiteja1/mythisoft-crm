import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Headphones } from 'lucide-react';
import EntityPage from '../components/EntityPage';
import { ticketsAPI, TICKET_STATUSES, TICKET_PRIORITIES, formatDateTime } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { CUSTOMER_TICKET_TABS } from '../constants/customerPortalNav';
import { ticketStatusMeta } from '../constants/ticketStatusFlows';

const statusOptions = Object.entries(TICKET_STATUSES).map(([value, { label }]) => ({ value, label }));
const emptyForm = { subject: '', description: '', priority: 'medium', status: 'open' };
const staffFormFields = [
  { name: 'subject', label: 'Subject' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'priority', label: 'Priority', type: 'select', options: Object.entries(TICKET_PRIORITIES).map(([value, { label }]) => ({ value, label })) },
  { name: 'status', label: 'Status', type: 'select', options: statusOptions },
];

function CustomerTicketsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ priority: '', project: '' });

  useEffect(() => {
    ticketsAPI.getAll({ limit: 100, excludeChangeRequests: 'true' })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const tabConfig = CUSTOMER_TICKET_TABS.find((t) => t.key === activeTab) || CUSTOMER_TICKET_TABS[0];

  const filtered = useMemo(() => items.filter((item) => {
    if (tabConfig.statuses && !tabConfig.statuses.includes(item.status)) return false;
    if (filters.priority && item.priority !== filters.priority) return false;
    if (filters.project && String(item.project?._id || item.project) !== filters.project) return false;
    return true;
  }), [items, tabConfig, filters]);

  const setTab = (key) => {
    if (key === 'all') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab: key }, { replace: true });
    }
  };

  const projectOptions = [...new Map(items.filter((i) => i.project).map((i) => {
    const p = i.project;
    return [String(p._id || p), p.name || 'Project'];
  })).entries()];

  if (loading) return <LoadingSpinner />;

  const execName = (u) => u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tickets</h1>
          <p className="text-gray-400 mt-1">Track your support requests and replies.</p>
        </div>
        <Link to="/tickets/create" className="btn-primary inline-flex items-center gap-2 text-sm">
          <Plus size={16} /> Create Ticket
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4 border-b border-myth-border pb-3">
          {CUSTOMER_TICKET_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-myth-accent/15 text-myth-accent border border-myth-accent/30'
                  : 'text-gray-400 hover:text-white hover:bg-myth-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <select className="input-field sm:max-w-[160px]" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All priorities</option>
            {Object.entries(TICKET_PRIORITIES).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select className="input-field sm:max-w-[200px]" value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })}>
            <option value="">All projects</option>
            {projectOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">Ticket ID</th>
                <th className="table-header">Project</th>
                <th className="table-header">Subject</th>
                <th className="table-header">Category</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Status</th>
                <th className="table-header">Support Executive</th>
                <th className="table-header">Created</th>
                <th className="table-header">Updated</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="table-cell text-center text-gray-500 py-8">No tickets yet</td></tr>
              ) : filtered.map((item) => (
                <tr key={item._id} className="border-t border-myth-border">
                  <td className="table-cell font-mono text-myth-accent">{item.ticketNumber}</td>
                  <td className="table-cell text-gray-300">{item.project?.name || 'General'}</td>
                  <td className="table-cell text-white">{item.subject}</td>
                  <td className="table-cell text-gray-400">{item.category || '—'}</td>
                  <td className="table-cell"><StatusBadge status={item.priority} config={TICKET_PRIORITIES} /></td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ticketStatusMeta(item.status).color}`}>
                      {ticketStatusMeta(item.status).label}
                    </span>
                  </td>
                  <td className="table-cell text-gray-300">{execName(item.supportAssignee)}</td>
                  <td className="table-cell text-gray-400">{formatDateTime(item.createdAt)}</td>
                  <td className="table-cell text-gray-400">{formatDateTime(item.updatedAt)}</td>
                  <td className="table-cell">
                    <Link to={`/tickets/${item._id}`} className="text-myth-accent hover:underline text-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function SupportTickets() {
  const { canWrite, isCustomer } = usePermissions();

  if (isCustomer) return <CustomerTicketsList />;

  return (
    <EntityPage
      icon={Headphones}
      title="Support Tickets"
      subtitle="Manage customer support requests and SLA tracking"
      api={ticketsAPI}
      columns={[
        {
          key: 'ticketNumber',
          label: 'Ticket #',
          render: (item) => (
            <Link to={`/tickets/${item._id}`} className="text-myth-accent hover:underline font-mono text-sm">
              {item.ticketNumber}
            </Link>
          ),
        },
        {
          key: 'subject',
          label: 'Subject',
          render: (item) => (
            <Link to={`/tickets/${item._id}`} className="text-white hover:text-myth-accent">
              {item.subject}
            </Link>
          ),
        },
        { key: 'priority', label: 'Priority', statusMap: TICKET_PRIORITIES },
        { key: 'status', label: 'Status', statusMap: TICKET_STATUSES },
      ]}
      formFields={staffFormFields}
      emptyForm={emptyForm}
      statusOptions={statusOptions}
      canCreate={canWrite('tickets')}
      canEdit={canWrite('tickets')}
      canDelete={canWrite('tickets')}
    />
  );
}
