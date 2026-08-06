import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import FollowUpListTable from '../../../components/followups/FollowUpListTable';
import { useFollowUpList } from '../../../components/followups/useFollowUpList';
import { usePermissions } from '../../../hooks/usePermissions';
import { ADMIN_LEAD_NAV } from '../../../constants/adminLeadViews';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

export default function AllLeadFollowUps() {
  const { isAdmin } = usePermissions();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const assigned = params.get('assigned');
  const query = { workflowStage: 'lead' };
  if (assigned === 'true') query.assigned = 'true';
  if (assigned === 'false') query.assigned = 'false';

  const { items, loading, refresh } = useFollowUpList(query);

  if (loading) return <LoadingSpinner />;

  const title = assigned === 'true'
    ? 'Assigned lead follow-ups'
    : assigned === 'false'
      ? 'Unassigned lead follow-ups'
      : (isAdmin ? ADMIN_LEAD_NAV.followups.title : 'All lead follow-ups');
  const subtitle = assigned === 'true'
    ? 'Follow-ups assigned to staff — filter shows only assigned items.'
    : assigned === 'false'
      ? 'Lead follow-ups that are not yet assigned — assign from the list.'
      : (isAdmin
        ? ADMIN_LEAD_NAV.followups.subtitle
        : 'New leads from admin, manager, and sales appear here automatically with full contact info.');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {assigned && (
            <Link to={FOLLOW_UP_PATHS.lead.list} className="btn-secondary text-sm">Clear filter</Link>
          )}
          <Link to={FOLLOW_UP_PATHS.lead.add} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add follow-up
          </Link>
        </div>
      </div>
      {isAdmin && !assigned && (
        <div className="card text-sm text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
          <span>Lead queues:</span>
          <Link to="/leads" className="text-myth-accent hover:underline">All Leads</Link>
          <Link to="/leads/unsigned" className="text-myth-accent hover:underline">Unsigned</Link>
          <Link to="/leads/assigned" className="text-myth-accent hover:underline">Assigned</Link>
          <Link to="/qualified-leads" className="text-myth-accent hover:underline">Qualified</Link>
        </div>
      )}
      <FollowUpListTable items={items} stage="lead" onRefresh={refresh} emptyMessage="No lead follow-ups yet." />
    </div>
  );
}
