import LoadingSpinner from '../../../components/LoadingSpinner';
import FollowUpListTable from '../../../components/followups/FollowUpListTable';
import { useFollowUpList } from '../../../components/followups/useFollowUpList';

export default function LeadFollowUpHistory() {
  const { items, loading, refresh } = useFollowUpList({ workflowStage: 'lead', status: 'completed' });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Lead follow-up history</h2>
        <p className="text-sm text-gray-500">Completed calls, meetings, emails, and chats with leads</p>
      </div>
      <FollowUpListTable
        items={items}
        stage="lead"
        onRefresh={refresh}
        emptyMessage="No completed lead follow-ups yet."
      />
    </div>
  );
}
