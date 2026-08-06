import LoadingSpinner from '../../../components/LoadingSpinner';
import FollowUpListTable from '../../../components/followups/FollowUpListTable';
import { useFollowUpList } from '../../../components/followups/useFollowUpList';

export default function DealOverdueFollowUps() {
  const { items, loading, refresh } = useFollowUpList({ filter: 'overdue', workflowStage: 'deal' });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Overdue deal follow-ups</h2>
        <p className="text-sm text-gray-500">
          Deals past their scheduled date or marked as overdue in the follow-up form
        </p>
      </div>
      <FollowUpListTable
        items={items}
        stage="deal"
        onRefresh={refresh}
        emptyMessage="No overdue deal follow-ups — you're on track!"
      />
    </div>
  );
}
