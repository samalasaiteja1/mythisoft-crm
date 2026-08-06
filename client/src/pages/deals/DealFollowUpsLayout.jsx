import { Outlet } from 'react-router-dom';
import DealFollowUpsSidebar from '../../components/followups/DealFollowUpsSidebar';

export default function DealFollowUpsLayout() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Deals · Follow-ups</h1>
        <p className="text-gray-400 mt-1">Proposal, negotiation, and close activities on converted deals</p>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <Outlet />
        </div>
        <aside className="w-56 shrink-0 hidden md:block">
          <DealFollowUpsSidebar />
        </aside>
      </div>

      <div className="md:hidden">
        <DealFollowUpsSidebar />
      </div>
    </div>
  );
}
