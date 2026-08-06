import { NavLink } from 'react-router-dom';
import { Users, Plus, History, UserCheck, Calendar } from 'lucide-react';
import { CUSTOMER_SIDEBAR_NAV } from '../../constants/customerNav';
import { usePermissions } from '../../hooks/usePermissions';
import { useFollowUpStats } from '../followups/useFollowUpList';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';

const sectionTitle = 'text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 pt-4 pb-1 first:pt-1';

const itemClass = ({ isActive }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left w-full ${
    isActive
      ? 'bg-myth-accent/15 text-myth-accent font-medium'
      : 'text-gray-400 hover:text-white hover:bg-myth-surface/60'
  }`;

export default function CustomersSidebar() {
  const { canWrite, canAccess } = usePermissions();
  const stats = useFollowUpStats();
  const customerPaths = FOLLOW_UP_PATHS.customer;
  const showFollowUps = canAccess('followups');

  return (
    <nav className="card p-2 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      {canWrite('customers') && (
        <NavLink to="/customers/create" className="flex items-center gap-2.5 px-3 py-2 mb-2 rounded-lg text-sm text-left bg-myth-accent/10 text-myth-accent hover:bg-myth-accent/20">
          <Plus size={15} /> Add Customer
        </NavLink>
      )}

      <p className={sectionTitle}>Customers</p>
      {CUSTOMER_SIDEBAR_NAV.map((item) => (
        <NavLink key={item.key} to={item.path} end className={itemClass}>
          <Users size={14} />
          {item.label}
        </NavLink>
      ))}

      {showFollowUps && (
        <>
          <p className={sectionTitle}>Customer follow-ups</p>
          <NavLink to={customerPaths.list} end className={itemClass}>
            <Calendar size={14} />
            All follow-ups ({stats.customerStage ?? 0})
          </NavLink>
          <NavLink to={customerPaths.add} className={itemClass}>
            <Plus size={14} />
            Add follow-up
          </NavLink>
          <NavLink to={customerPaths.history} className={itemClass}>
            <History size={14} />
            Follow-up history
          </NavLink>
          <NavLink to={FOLLOW_UP_PATHS.all.today} className={itemClass}>
            <UserCheck size={14} />
            All follow-ups today ({stats.today})
          </NavLink>
        </>
      )}
    </nav>
  );
}
