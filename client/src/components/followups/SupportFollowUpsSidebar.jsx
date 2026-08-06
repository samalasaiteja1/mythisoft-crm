import { NavLink } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, History, List, AlertTriangle } from 'lucide-react';
import { useFollowUpStats } from './useFollowUpList';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';

const { support: P } = FOLLOW_UP_PATHS;

const LINKS = [
  { to: P.list, label: 'All Follow-ups', icon: List, end: true },
  { to: P.today, label: 'Today', icon: Calendar },
  { to: P.upcoming, label: 'Upcoming', icon: Clock },
  { to: P.overdue, label: 'Overdue', icon: AlertTriangle },
  { to: P.completed, label: 'Completed', icon: CheckCircle2 },
  { to: P.history, label: 'History', icon: History },
];

export default function SupportFollowUpsSidebar() {
  const stats = useFollowUpStats();

  return (
    <nav className="card p-3 space-y-1">
      <p className="text-xs text-gray-500 uppercase tracking-wide px-2 pb-2">Customer Follow-ups</p>
      {LINKS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive ? 'bg-myth-accent/15 text-myth-accent' : 'text-gray-400 hover:text-white hover:bg-myth-surface'
          }`}
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
      <div className="mt-3 pt-3 border-t border-myth-border space-y-1 text-xs text-gray-500 px-2">
        <p>Today: <span className="text-white">{stats.today ?? 0}</span></p>
        <p>Overdue: <span className="text-amber-400">{stats.overdue ?? 0}</span></p>
        <p>Customer: <span className="text-white">{stats.customerStage ?? 0}</span></p>
      </div>
    </nav>
  );
}
