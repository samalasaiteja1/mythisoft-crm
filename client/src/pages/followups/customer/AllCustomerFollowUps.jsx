import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import FollowUpListTable from '../../../components/followups/FollowUpListTable';
import { useFollowUpList } from '../../../components/followups/useFollowUpList';
import { usePermissions } from '../../../hooks/usePermissions';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

export default function AllCustomerFollowUps() {
  const { role } = usePermissions();
  const isSupport = role === 'support';
  const { items, loading, refresh } = useFollowUpList({ workflowStage: 'customer', includeAllCustomers: true });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {isSupport ? 'My customer follow-ups' : 'All customer follow-ups'}
          </h2>
          <p className="text-sm text-gray-500">
            {isSupport
              ? 'Schedule and complete follow-ups with customers assigned to you'
              : 'Post-conversion customer touchpoints — calls, meetings, and support check-ins'}
          </p>
        </div>
        <Link to={FOLLOW_UP_PATHS.customer.add} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add follow-up
        </Link>
      </div>
      <FollowUpListTable
        items={items}
        stage="customer"
        onRefresh={refresh}
        emptyMessage={isSupport
          ? 'No follow-ups yet. Use Add follow-up or schedule from a customer on your dashboard.'
          : 'No customers yet. Convert a won deal to see customer follow-ups here.'}
      />
    </div>
  );
}
