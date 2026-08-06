import LoadingSpinner from '../../../components/LoadingSpinner';
import FollowUpListTable from '../../../components/followups/FollowUpListTable';
import { useFollowUpList } from '../../../components/followups/useFollowUpList';

export default function DealFollowUpHistory() {
  const { items, loading, refresh } = useFollowUpList({ workflowStage: 'deal', status: 'completed' });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Deal follow-up history</h2>
        <p className="text-sm text-gray-500">Completed deal activities and client touchpoints</p>
      </div>
      <FollowUpListTable
        items={items}
        stage="deal"
        onRefresh={refresh}
        emptyMessage="No completed deal follow-ups yet."
      />
    </div>
  );
}
