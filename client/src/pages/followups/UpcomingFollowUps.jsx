import LoadingSpinner from '../../components/LoadingSpinner';
import FollowUpListTable from '../../components/followups/FollowUpListTable';
import { useFollowUpList } from '../../components/followups/useFollowUpList';
import { AdminContentCard } from '../../components/admin/adminUi';

export default function UpcomingFollowUps() {
  const { items, loading, refresh } = useFollowUpList({ filter: 'upcoming' });

  if (loading) return <LoadingSpinner />;

  return (
    <AdminContentCard title="Upcoming follow-ups">
      <p className="text-sm text-gray-500 mb-4">Future scheduled activities</p>
      <FollowUpListTable items={items} showStageColumn onRefresh={refresh} emptyMessage="No upcoming follow-ups." />
    </AdminContentCard>
  );
}
