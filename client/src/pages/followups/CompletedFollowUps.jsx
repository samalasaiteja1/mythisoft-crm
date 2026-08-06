import LoadingSpinner from '../../components/LoadingSpinner';
import FollowUpListTable from '../../components/followups/FollowUpListTable';
import { useFollowUpList } from '../../components/followups/useFollowUpList';
import { AdminContentCard } from '../../components/admin/adminUi';

export default function CompletedFollowUps() {
  const { items, loading, refresh } = useFollowUpList({ filter: 'completed' });

  if (loading) return <LoadingSpinner />;

  return (
    <AdminContentCard title="Completed follow-ups">
      <p className="text-sm text-gray-500 mb-4">All completed activities across the workflow</p>
      <FollowUpListTable items={items} showStageColumn onRefresh={refresh} emptyMessage="No completed follow-ups yet." />
    </AdminContentCard>
  );
}
