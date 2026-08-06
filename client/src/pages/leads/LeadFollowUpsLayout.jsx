import { Outlet } from 'react-router-dom';
import LeadFollowUpsSidebar from '../../components/followups/LeadFollowUpsSidebar';

export default function LeadFollowUpsLayout() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Leads · Follow-ups</h1>
        <p className="text-gray-400 mt-1">Calls, meetings, and activities on leads before they convert to deals</p>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <Outlet />
        </div>
        <aside className="w-56 shrink-0 hidden md:block">
          <LeadFollowUpsSidebar />
        </aside>
      </div>

      <div className="md:hidden">
        <LeadFollowUpsSidebar />
      </div>
    </div>
  );
}
