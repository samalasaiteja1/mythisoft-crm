import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import FollowUpListTable from '../../../components/followups/FollowUpListTable';
import { useFollowUpList } from '../../../components/followups/useFollowUpList';
import { usePermissions } from '../../../hooks/usePermissions';
import { ADMIN_DEAL_NAV } from '../../../constants/adminDealViews';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

export default function AllDealFollowUps() {
  const { isAdmin } = usePermissions();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const assigned = params.get('assigned');
  const query = { workflowStage: 'deal', includeAllDeals: true };
  if (assigned === 'true') query.assigned = 'true';
  if (assigned === 'false') query.assigned = 'false';

  const { items, loading, refresh } = useFollowUpList(query);

  if (loading) return <LoadingSpinner />;

  const title = assigned === 'true'
    ? 'Assigned deal follow-ups'
    : assigned === 'false'
      ? 'Unassigned deal follow-ups'
      : (isAdmin ? ADMIN_DEAL_NAV.followups.title : 'All deal follow-ups');
  const subtitle = assigned === 'true'
    ? 'Deal follow-ups assigned to staff.'
    : assigned === 'false'
      ? 'Deal follow-ups not yet assigned — assign from the list or deal pipeline.'
      : (isAdmin
        ? ADMIN_DEAL_NAV.followups.subtitle
        : 'Every deal converted from a lead appears here with contact info and pipeline stage');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {assigned && (
            <Link to={FOLLOW_UP_PATHS.deal.list} className="btn-secondary text-sm">Clear filter</Link>
          )}
          <Link to={FOLLOW_UP_PATHS.deal.add} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add follow-up
          </Link>
        </div>
      </div>
      {isAdmin && (
        <div className="card text-sm text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
          <span>Deal queues:</span>
          <Link to="/deals" className="text-myth-accent hover:underline">All Deals</Link>
          <Link to="/deals/unassigned" className="text-myth-accent hover:underline">Unassigned</Link>
          <Link to="/deals/assigned" className="text-myth-accent hover:underline">Assigned</Link>
          <Link to="/deals/list?stage=won" className="text-myth-accent hover:underline">Won</Link>
        </div>
      )}
      <FollowUpListTable
        items={items}
        stage="deal"
        onRefresh={refresh}
        emptyMessage="No deals converted from leads yet. Convert a qualified lead to see it here."
      />
    </div>
  );
}
