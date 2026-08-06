import LoadingSpinner from '../../../components/LoadingSpinner';
import FollowUpListTable from '../../../components/followups/FollowUpListTable';
import { useFollowUpList } from '../../../components/followups/useFollowUpList';

export default function CustomerFollowUpHistory() {
  const { items, loading, refresh } = useFollowUpList({ workflowStage: 'customer', status: 'completed' });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Customer follow-up history</h2>
        <p className="text-sm text-gray-500">Completed customer activities and check-ins</p>
      </div>
      <FollowUpListTable
        items={items}
        stage="customer"
        onRefresh={refresh}
        emptyMessage="No completed customer follow-ups yet."
      />
    </div>
  );
}
