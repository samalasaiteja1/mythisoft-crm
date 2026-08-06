import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import { projectsAPI, PROJECT_STATUSES } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { projectCode, projectVersion, CUSTOMER_PROJECT_TABS } from '../../constants/customerPortalNav';
import { isPendingCustomerAcceptance } from '../../utils/customerAcceptance';

function matchesProjectTab(project, tab) {
  if (!tab || tab.key === 'all') return true;
  if (tab.match === 'pending_acceptance') return isPendingCustomerAcceptance(project);
  if (tab.match === 'in_support') {
    return ['in_support', 'support_active', 'submitted_to_customer', 'support_tasks_in_progress', 'support_tasks_assigned'].includes(project.supportReviewStatus);
  }
  if (tab.statuses) return tab.statuses.includes(project.status);
  return true;
}

export default function CustomerMyProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', version: '' });

  useEffect(() => {
    projectsAPI.getAll({ limit: 100 })
      .then(({ data }) => setProjects(data.items || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const tabConfig = CUSTOMER_PROJECT_TABS.find((t) => t.key === activeTab) || CUSTOMER_PROJECT_TABS[0];
  const versions = [...new Set(projects.map(projectVersion))];

  const filtered = useMemo(() => projects.filter((p) => {
    if (!matchesProjectTab(p, tabConfig)) return false;
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.version && projectVersion(p) !== filters.version) return false;
    return true;
  }), [projects, tabConfig, filters]);

  const setTab = (key) => {
    if (key === 'all') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab: key }, { replace: true });
    }
  };

  const supportName = (user) => user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '—';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FolderKanban className="text-myth-accent" size={24} /> My Projects
        </h1>
        <p className="text-gray-400 mt-1">View your assigned projects and delivery status.</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4 border-b border-myth-border pb-3">
          {CUSTOMER_PROJECT_TABS.map((tab) => (
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
          <input type="search" placeholder="Search projects…" className="input-field sm:max-w-[220px]" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select className="input-field sm:max-w-[180px]" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            {Object.entries(PROJECT_STATUSES).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select className="input-field sm:max-w-[160px]" value={filters.version} onChange={(e) => setFilters({ ...filters, version: e.target.value })}>
            <option value="">All versions</option>
            {versions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">Project Name</th>
                <th className="table-header">Project Code</th>
                <th className="table-header">Version</th>
                <th className="table-header">Status</th>
                <th className="table-header">Start Date</th>
                <th className="table-header">Delivery Date</th>
                <th className="table-header">Support Manager</th>
                <th className="table-header">Support Executive</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center text-gray-500 py-8">No projects found</td></tr>
              ) : filtered.map((p) => (
                <tr key={p._id} className="border-t border-myth-border">
                  <td className="table-cell text-white font-medium">{p.name}</td>
                  <td className="table-cell font-mono text-gray-400">{projectCode(p)}</td>
                  <td className="table-cell text-gray-300">{projectVersion(p)}</td>
                  <td className="table-cell"><StatusBadge status={p.status} config={PROJECT_STATUSES} /></td>
                  <td className="table-cell text-gray-400">{p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'}</td>
                  <td className="table-cell text-gray-400">{p.deliveredAt ? new Date(p.deliveredAt).toLocaleDateString() : p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}</td>
                  <td className="table-cell text-gray-300">{supportName(p.supportAssignee)}</td>
                  <td className="table-cell text-gray-300">{supportName(p.supportExecutiveAssignee)}</td>
                  <td className="table-cell">
                    <Link to={`/projects/${p._id}`} className="text-myth-accent hover:underline text-sm">View Details</Link>
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
