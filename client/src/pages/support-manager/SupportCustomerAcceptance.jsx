import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomerAcceptanceBadge from '../../components/projects/CustomerAcceptanceBadge';
import MarkCustomerAcceptedButton from '../../components/projects/MarkCustomerAcceptedButton';
import { isPendingCustomerAcceptance, isCustomerAccepted } from '../../utils/customerAcceptance';
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

export default function SupportCustomerAcceptance() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      projectsAPI.getSupportReviewQueue({ queue: 'customer' }),
      projectsAPI.getSupportReviewQueue({ queue: 'active' }),
    ])
      .then(([customerRes, activeRes]) => {
        const pending = customerRes.data?.items || [];
        const accepted = (activeRes.data?.items || []).filter(isCustomerAccepted);
        const seen = new Set();
        const merged = [...pending, ...accepted].filter((p) => {
          if (seen.has(p._id)) return false;
          seen.add(p._id);
          return isPendingCustomerAcceptance(p) || isCustomerAccepted(p);
        });
        setProjects(merged);
      })
      .catch(() => toast.error('Failed to load acceptance data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdated = (updatedProject) => {
    if (updatedProject?._id) {
      setProjects((prev) => prev.map((p) => (p._id === updatedProject._id ? updatedProject : p)));
    } else {
      load();
    }
  };

  if (loading) return <LoadingSpinner />;

  const pending = projects.filter(isPendingCustomerAcceptance);
  const accepted = projects.filter(isCustomerAccepted);

  const stats = [
    { label: 'Awaiting acceptance', value: pending.length, color: 'text-amber-400', highlight: pending.length > 0 },
    { label: 'Accepted', value: accepted.length, color: 'text-green-400' },
    { label: 'Total tracked', value: projects.length, color: 'text-white' },
    { label: 'Delivery queue', value: pending.length, color: 'text-purple-400', link: '/support/project-delivery' },
    { label: 'Active support', value: accepted.length, color: 'text-blue-400', link: '/projects/support-active' },
  ];

  return (
    <SupportManagerPageShell>
      <SupportManagerPageHeader
        icon={UserCheck}
        title="Customer Acceptance"
        subtitle="Projects submitted to customers — track acceptance or mark as accepted when the customer confirms offline."
        workflow={['Submit to customer', 'Await acceptance', 'Mark accepted', 'Activate support']}
      />

      <SupportManagerStatStrip stats={stats} />

      <SupportManagerTabBar tabs={SUPPORT_MANAGER_DELIVERY_TABS} activeKey="acceptance" />

      <SupportManagerContentCard title={`Acceptance queue (${projects.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">Project</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Submitted Date</th>
                <th className="table-header">Acceptance</th>
                <th className="table-header">Comments</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={6}><SupportManagerEmptyState message="No projects in customer acceptance stage." icon={UserCheck} /></td></tr>
              ) : projects.map((p) => (
                <tr key={p._id} className="border-t border-myth-border hover:bg-myth-surface/30 transition-colors">
                  <td className="table-cell">
                    <Link to={`/projects/${p._id}`} className="text-white hover:text-myth-accent font-medium">{p.name}</Link>
                  </td>
                  <td className="table-cell text-gray-300">{personName(p.customer)}</td>
                  <td className="table-cell text-gray-400">
                    {p.submittedToCustomerAt ? formatDateTime(p.submittedToCustomerAt) : '—'}
                  </td>
                  <td className="table-cell"><CustomerAcceptanceBadge project={p} showWhenIdle /></td>
                  <td className="table-cell text-gray-400 max-w-xs truncate">
                    {p.deliveryChecklist?.clientAcceptanceNotes || '—'}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/projects/${p._id}`} className="text-myth-accent hover:underline text-xs">View</Link>
                      {isPendingCustomerAcceptance(p) && (
                        <>
                          <MarkCustomerAcceptedButton project={p} onDone={handleUpdated} compact />
                          <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                            <Bell size={12} /> Remind customer
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SupportManagerContentCard>

      {pending.length > 0 && (
        <p className="text-sm text-amber-300 card border-amber-500/20 bg-amber-500/5 py-3 px-4">
          {pending.length} project(s) pending customer acceptance — use <strong className="text-amber-200">Mark accepted</strong> if the customer confirmed outside the portal.
        </p>
      )}
    </SupportManagerPageShell>
  );
}
