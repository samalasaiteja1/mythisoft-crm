import { NavLink } from 'react-router-dom';
import { Users, Plus, History, UserCheck, Calendar, ArrowLeft } from 'lucide-react';
import { useFollowUpStats } from './useFollowUpList';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';

const sectionTitle = 'text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 pt-4 pb-1 first:pt-1';

const itemClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-myth-accent/15 text-myth-accent font-medium'
      : 'text-gray-400 hover:text-white hover:bg-myth-surface/60'
  }`;

export default function LeadFollowUpsSidebar() {
  const stats = useFollowUpStats();
  const { lead: paths, all: allPaths } = FOLLOW_UP_PATHS;

  return (
    <nav className="card p-2 sticky top-20">
      <NavLink to="/leads" className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-myth-surface/60">
        <ArrowLeft size={15} /> Back to leads
      </NavLink>

      <p className={sectionTitle}>Lead follow-ups</p>
      <NavLink to={paths.list} end className={itemClass}>
        <Users size={15} />
        All lead follow-ups ({stats.leadStage ?? 0})
      </NavLink>
      <NavLink to={paths.assigned} className={itemClass}>
        <UserCheck size={15} />
        Assigned ({stats.assignedLeadFollowUps ?? 0})
      </NavLink>
      <NavLink to={paths.unassigned} className={itemClass}>
        <UserCheck size={15} />
        Unassigned ({stats.unassignedLeadFollowUps ?? 0})
      </NavLink>
      <NavLink to={paths.add} className={itemClass}>
        <Plus size={15} />
        Add lead follow-up
      </NavLink>
      <NavLink to={paths.history} className={itemClass}>
        <History size={15} />
        Lead history
      </NavLink>

      <p className={sectionTitle}>All follow-ups</p>
      <NavLink to={allPaths.today} className={itemClass}>
        <Calendar size={15} />
        Today ({stats.today})
      </NavLink>
    </nav>
  );
}
