import { Outlet, Navigate } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import SupportFollowUpsSidebar from '../../../components/followups/SupportFollowUpsSidebar';
import {
  SupportManagerPageShell,
  SupportManagerPageHeader,
} from '../../../components/supportManager/supportManagerUi';

export default function SupportFollowUpsLayout() {
  return (
    <SupportManagerPageShell>
      <SupportManagerPageHeader
        icon={CalendarClock}
        title="Customer Follow-ups"
        subtitle="Schedule and track customer check-ins, calls, and support touchpoints across your team."
        workflow={['Schedule follow-up', 'Complete touchpoint', 'Log notes', 'Track outcomes']}
      />

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <Outlet />
        </div>
        <aside className="w-56 shrink-0 hidden md:block">
          <SupportFollowUpsSidebar />
        </aside>
      </div>

      <div className="md:hidden">
        <SupportFollowUpsSidebar />
      </div>
    </SupportManagerPageShell>
  );
}

export function SupportFollowUpsIndex() {
  return <Navigate to="/support/follow-ups/today" replace />;
}
