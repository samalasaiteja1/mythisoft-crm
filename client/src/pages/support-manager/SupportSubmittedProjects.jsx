import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, PROJECT_STATUSES } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { projectCode, projectVersion } from '../../constants/customerPortalNav';
import { SUPPORT_REVIEW_STATUSES, SUPPORT_PROJECT_WORKFLOW } from '../../constants/supportWorkflow';
import { SUPPORT_MANAGER_DELIVERY_TABS } from '../../constants/supportManagerNav';
import {
  SupportManagerPageShell,
  SupportManagerPageHeader,
  SupportManagerStatStrip,
  SupportManagerTabBar,
  SupportManagerContentCard,
  SupportManagerEmptyState,
} from '../../components/supportManager/supportManagerUi';

const personName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—');

export default function SupportSubmittedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', customer: '', version: '', search: '' });

  useEffect(() => {
    projectsAPI.getSupportReviewQueue({ queue: 'submitted' })
      .then(({ data }) => setProjects(data?.items || []))
      .catch(() => toast.error('Failed to load submitted projects'))
      .finally(() => setLoading(false));
  }, []);

  const customers = useMemo(() => [...new Map(projects.filter((p) => p.customer).map((p) => {
    const c = p.customer;
    const id = String(c._id || c);
    return [id, c.companyName || personName(c)];
  })).entries()], [projects]);

  const versions = useMemo(() => [...new Set(projects.map(projectVersion))], [projects]);

  const filtered = projects.filter((p) => {
    if (filters.search && !p.name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status && p.supportReviewStatus !== filters.status) return false;
    if (filters.customer && String(p.customer?._id || p.customer) !== filters.customer) return false;
    if (filters.version && projectVersion(p) !== filters.version) return false;
    return true;
  });

  const stats = useMemo(() => {
    const byStatus = {};
    projects.forEach((p) => {
      const key = p.supportReviewStatus || 'unknown';
      byStatus[key] = (byStatus[key] || 0) + 1;
    });
    return [
      { label: 'Total submitted', value: projects.length, color: 'text-white' },
      { label: 'Pending review', value: byStatus.pending_review || 0, color: 'text-amber-400' },
      { label: 'In delivery', value: (byStatus.support_tasks_assigned || 0) + (byStatus.support_tasks_in_progress || 0), color: 'text-blue-400' },
      { label: 'With customer', value: byStatus.submitted_to_customer || 0, color: 'text-purple-400' },
      { label: 'Active support', value: byStatus.in_support || 0, color: 'text-green-400', link: '/projects/support-active' },
    ];
  }, [projects]);

  if (loading) return <LoadingSpinner />;

  return (
    <SupportManagerPageShell>
      <SupportManagerPageHeader
        icon={Send}
        title="Submitted Projects"
        subtitle="Projects received from the Technical Manager — review, assign, and deliver to customers."
        workflow={SUPPORT_PROJECT_WORKFLOW.slice(0, 4)}
      />

      <SupportManagerStatStrip stats={stats} />

      <SupportManagerTabBar tabs={SUPPORT_MANAGER_DELIVERY_TABS} activeKey="submitted" />

      <SupportManagerContentCard
        title={`Projects (${filtered.length})`}
        toolbar={(
          <>
            <input type="search" placeholder="Search project…" className="input-field sm:max-w-[200px]" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <select className="input-field sm:max-w-[180px]" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              {Object.entries(SUPPORT_REVIEW_STATUSES).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select className="input-field sm:max-w-[200px]" value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })}>
              <option value="">All customers</option>
              {customers.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <select className="input-field sm:max-w-[140px]" value={filters.version} onChange={(e) => setFilters({ ...filters, version: e.target.value })}>
              <option value="">All versions</option>
              {versions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </>
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">Project Name</th>
                <th className="table-header">Code</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Version</th>
                <th className="table-header">Submitted By</th>
                <th className="table-header">Submitted Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><SupportManagerEmptyState message="No submitted projects match your filters." icon={FolderKanban} /></td></tr>
              ) : filtered.map((p) => {
                const reviewMeta = SUPPORT_REVIEW_STATUSES[p.supportReviewStatus];
                return (
                  <tr key={p._id} className="border-t border-myth-border hover:bg-myth-surface/30 transition-colors">
                    <td className="table-cell text-white font-medium">
                      <Link to={`/projects/${p._id}`} className="hover:text-myth-accent inline-flex items-center gap-1">
                        <FolderKanban size={14} className="text-orange-400" /> {p.name}
                      </Link>
                    </td>
                    <td className="table-cell font-mono text-gray-400 text-xs">{projectCode(p)}</td>
                    <td className="table-cell text-gray-300">{personName(p.customer)}</td>
                    <td className="table-cell text-gray-400">{projectVersion(p)}</td>
                    <td className="table-cell text-gray-300">{personName(p.manager)}</td>
                    <td className="table-cell text-gray-400">
                      {p.supportHandoffAt ? new Date(p.supportHandoffAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="table-cell">
                      {reviewMeta ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${reviewMeta.color}`}>{reviewMeta.label}</span>
                      ) : (
                        <StatusBadge status={p.status} config={PROJECT_STATUSES} />
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/projects/${p._id}`} className="text-myth-accent hover:underline text-xs">View</Link>
                        <Link to="/support/project-delivery" className="text-orange-300 hover:underline text-xs">Deliver</Link>
                        <Link to="/projects/support-review" className="text-myth-accent hover:underline text-xs">Review</Link>
                        <Link to="/documents" className="text-gray-400 hover:underline text-xs">Documents</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SupportManagerContentCard>
    </SupportManagerPageShell>
  );
}
