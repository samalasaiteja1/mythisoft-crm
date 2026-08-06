import { NavLink } from 'react-router-dom';
import {
  Calendar, Clock, AlertTriangle, CheckCircle2, UserPlus, Briefcase, UserCheck,
} from 'lucide-react';
import { useFollowUpStats } from './useFollowUpList';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';

const sectionTitle = 'text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 pt-4 pb-1 first:pt-1';

const itemClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-myth-accent/15 text-myth-accent font-medium'
      : 'text-gray-400 hover:text-white hover:bg-myth-surface/60'
  }`;

export default function FollowUpsSidebar() {
  const stats = useFollowUpStats();
  const { all: paths, lead, deal, customer } = FOLLOW_UP_PATHS;

  return (
    <nav className="card p-2 sticky top-20">
      <p className={sectionTitle}>All follow-ups</p>
      <NavLink to={paths.today} className={itemClass}>
        <Calendar size={15} />
        Today ({stats.today})
      </NavLink>
      <NavLink to={paths.upcoming} className={itemClass}>
        <Clock size={15} />
        Upcoming
      </NavLink>
      <NavLink to={paths.overdue} className={itemClass}>
        <AlertTriangle size={15} />
        Overdue ({stats.overdue ?? 0})
      </NavLink>
      <NavLink to={paths.completed} className={itemClass}>
        <CheckCircle2 size={15} />
        Completed
      </NavLink>

      <p className={sectionTitle}>By module</p>
      <NavLink to={lead.list} className={itemClass}>
        <UserPlus size={15} />
        Lead follow-ups ({stats.leadStage ?? 0})
      </NavLink>
      <NavLink to={deal.list} className={itemClass}>
        <Briefcase size={15} />
        Deal follow-ups ({stats.dealStage ?? 0})
      </NavLink>
      <NavLink to={customer.list} className={itemClass}>
        <UserCheck size={15} />
        Customer follow-ups ({stats.customerStage ?? 0})
      </NavLink>
    </nav>
  );
}
