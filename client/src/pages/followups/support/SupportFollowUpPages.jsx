import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import FollowUpListTable from '../../../components/followups/FollowUpListTable';
import { useFollowUpList } from '../../../components/followups/useFollowUpList';
import { usePermissions } from '../../../hooks/usePermissions';
import { isSupportManagerUser } from '../../../utils/roleContext';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

const { support: P } = FOLLOW_UP_PATHS;

function SupportFollowUpPage({ title, subtitle, queryParams, emptyMessage }) {
  const { user, role } = usePermissions();
  const isManager = role === 'manager' && isSupportManagerUser(user);
  const { items, loading, refresh } = useFollowUpList({ workflowStage: 'customer', ...queryParams });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <Link to={P.add} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} /> Add follow-up
        </Link>
      </div>
      <FollowUpListTable
        items={items}
        stage="customer"
        pathSet="support"
        showCreatedBy={isManager}
        onRefresh={refresh}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}

export function SupportAllFollowUps() {
  const { user, role } = usePermissions();
  const isManager = role === 'manager' && isSupportManagerUser(user);
  return (
    <SupportFollowUpPage
      title={isManager ? 'Team customer follow-ups' : 'My customer follow-ups'}
      subtitle={isManager
        ? 'All follow-ups created or assigned to your support team'
        : 'Follow-ups for customers assigned to you'}
      queryParams={{}}
      emptyMessage="No follow-ups yet. Add one or schedule from My Customers."
    />
  );
}

export function SupportTodayFollowUps() {
  return (
    <SupportFollowUpPage
      title="Today's follow-ups"
      subtitle="Customer activities scheduled for today"
      queryParams={{ filter: 'today' }}
      emptyMessage="Nothing scheduled for today."
    />
  );
}

export function SupportUpcomingFollowUps() {
  return (
    <SupportFollowUpPage
      title="Upcoming follow-ups"
      subtitle="Scheduled customer touchpoints"
      queryParams={{ filter: 'upcoming' }}
      emptyMessage="No upcoming follow-ups."
    />
  );
}

export function SupportOverdueFollowUps() {
  return (
    <SupportFollowUpPage
      title="Overdue follow-ups"
      subtitle="Past-due customer activities needing attention"
      queryParams={{ filter: 'overdue' }}
      emptyMessage="No overdue follow-ups."
    />
  );
}

export function SupportCompletedFollowUps() {
  return (
    <SupportFollowUpPage
      title="Completed follow-ups"
      subtitle="Recently completed customer touchpoints"
      queryParams={{ filter: 'completed' }}
      emptyMessage="No completed follow-ups yet."
    />
  );
}

export function SupportFollowUpHistory() {
  return (
    <SupportFollowUpPage
      title="Follow-up history"
      subtitle="All completed customer follow-ups"
      queryParams={{ filter: 'completed' }}
      emptyMessage="No history yet."
    />
  );
}
