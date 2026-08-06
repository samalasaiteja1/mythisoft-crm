import LoadingSpinner from '../../components/LoadingSpinner';
import FollowUpListTable from '../../components/followups/FollowUpListTable';
import { useFollowUpList, useFollowUpStats } from '../../components/followups/useFollowUpList';
import { AdminContentCard } from '../../components/admin/adminUi';

export default function TodayFollowUps() {
  const { items, loading, refresh } = useFollowUpList({ filter: 'today' });
  const stats = useFollowUpStats();

  if (loading) return <LoadingSpinner />;

  return (
    <AdminContentCard
      title="Today's follow-ups"
      toolbar={stats.today != null && (
        <span className="text-xs px-2 py-1 rounded-full bg-myth-accent/15 text-myth-accent">{stats.today} scheduled</span>
      )}
    >
      <p className="text-sm text-gray-500 mb-4">Remaining activities scheduled for later today</p>
      <FollowUpListTable items={items} showStageColumn onRefresh={refresh} emptyMessage="Nothing scheduled for today." />
    </AdminContentCard>
  );
}
