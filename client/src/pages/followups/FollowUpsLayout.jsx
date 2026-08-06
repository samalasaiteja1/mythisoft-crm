import { Outlet, Navigate } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import FollowUpsSidebar from '../../components/followups/FollowUpsSidebar';
import {
  AdminPageShell,
  AdminPageHeader,
} from '../../components/admin/adminUi';

export default function FollowUpsLayout() {
  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={CalendarClock}
        title="Follow-ups"
        subtitle="Today, overdue, and completed touchpoints across leads, deals, and customers"
        workflow={['Schedule', 'Complete call', 'Log outcome', 'Track pipeline']}
      />

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <Outlet />
        </div>
        <aside className="w-56 shrink-0 hidden md:block">
          <FollowUpsSidebar />
        </aside>
      </div>

      <div className="md:hidden">
        <FollowUpsSidebar />
      </div>
    </AdminPageShell>
  );
}

export function FollowUpsIndex() {
  return <Navigate to="/follow-ups/today" replace />;
}
