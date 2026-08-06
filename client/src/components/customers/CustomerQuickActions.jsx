import { Link } from 'react-router-dom';
import {
  UserPlus, Handshake, Calendar, Headphones, FolderKanban,
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';

export default function CustomerQuickActions({ customerId }) {
  const { canWrite, canAccess, canAction, isAdmin, isManager } = usePermissions();

  const actions = [
    { label: 'Add Customer', icon: UserPlus, to: '/customers/create', show: canWrite('customers') },
    { label: 'Create Deal', icon: Handshake, to: `/deals/create?customerId=${customerId}`, show: canWrite('deals') },
    { label: 'Assign to Technical Team', icon: FolderKanban, to: `/deals/assign?customerId=${customerId}`, show: (isAdmin || isManager) },
    { label: 'Follow-up', icon: Calendar, to: FOLLOW_UP_PATHS.customer.detail(customerId, { virtual: true }), show: canAccess('followups') },
    { label: 'Create Support Ticket', icon: Headphones, to: `/tickets/create?customer=${customerId}`, show: canAction('tickets', 'create') },
  ].filter((a) => a.show);

  return (
    <div className="card">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Quick actions</p>
      <div className="flex flex-wrap gap-2 items-stretch">
        {actions.map(({ label, icon: Icon, to }) => {
          const cls = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-left bg-myth-surface border border-myth-border text-gray-300 hover:text-myth-accent hover:border-myth-accent/40 transition-colors';
          return (
            <Link key={label} to={to} className={cls}>
              <Icon size={14} /> {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
