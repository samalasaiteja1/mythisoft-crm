import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileEdit } from 'lucide-react';
import { ticketsAPI, TICKET_STATUSES, TICKET_PRIORITIES, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

export default function CustomerChangeRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', project: '' });

  useEffect(() => {
    ticketsAPI.getAll({ requestKind: 'change_request', limit: 100 })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.project && String(item.project?._id || item.project) !== filters.project) return false;
    return true;
  });

  const projectOptions = [...new Map(items.filter((i) => i.project).map((i) => {
    const p = i.project;
    const id = p._id || p;
    return [String(id), p.name || 'Project'];
  })).entries()];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileEdit className="text-myth-accent" size={24} /> My Change Requests
          </h1>
          <p className="text-gray-400 mt-1">Track change requests submitted for your projects.</p>
        </div>
        <Link to="/change-requests/new" className="btn-primary inline-flex items-center gap-2 text-sm">
          <Plus size={16} /> Request Change
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <select className="input-field sm:max-w-[180px]" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            {Object.entries(TICKET_STATUSES).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select className="input-field sm:max-w-[220px]" value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })}>
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
                <th className="table-header">Request ID</th>
                <th className="table-header">Project</th>
                <th className="table-header">Title</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Status</th>
                <th className="table-header">Submitted</th>
                <th className="table-header">Expected</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="table-cell text-center text-gray-500 py-8">No change requests yet</td></tr>
              ) : filtered.map((item) => (
                <tr key={item._id} className="border-t border-myth-border">
                  <td className="table-cell font-mono text-myth-accent">{item.ticketNumber}</td>
                  <td className="table-cell text-gray-300">{item.project?.name || '—'}</td>
                  <td className="table-cell text-white">{item.subject}</td>
                  <td className="table-cell"><StatusBadge status={item.priority} config={TICKET_PRIORITIES} /></td>
                  <td className="table-cell"><StatusBadge status={item.status} config={TICKET_STATUSES} /></td>
                  <td className="table-cell text-gray-400">{formatDateTime(item.createdAt)}</td>
                  <td className="table-cell text-gray-400">{item.expectedCompletion ? new Date(item.expectedCompletion).toLocaleDateString() : '—'}</td>
                  <td className="table-cell">
                    <Link to={`/change-requests/${item._id}`} className="text-myth-accent hover:underline text-sm">View</Link>
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
