import { NavLink } from 'react-router-dom';
import { Briefcase, Plus, History, AlertTriangle, Calendar, ArrowLeft } from 'lucide-react';
import { useFollowUpStats } from './useFollowUpList';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';

const sectionTitle = 'text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 pt-4 pb-1 first:pt-1';

const itemClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-myth-accent/15 text-myth-accent font-medium'
      : 'text-gray-400 hover:text-white hover:bg-myth-surface/60'
  }`;

export default function DealFollowUpsSidebar() {
  const stats = useFollowUpStats();
  const { deal: paths, all: allPaths } = FOLLOW_UP_PATHS;

  return (
    <nav className="card p-2 sticky top-20">
      <NavLink to="/deals" className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-myth-surface/60">
        <ArrowLeft size={15} /> Back to deals
      </NavLink>

      <p className={sectionTitle}>Deal follow-ups</p>
      <NavLink to={paths.list} end className={itemClass}>
        <Briefcase size={15} />
        All deal follow-ups ({stats.dealStage ?? 0})
      </NavLink>
      <NavLink to={paths.add} className={itemClass}>
        <Plus size={15} />
        Add deal follow-up
      </NavLink>
      <NavLink to={paths.overdue} className={itemClass}>
        <AlertTriangle size={15} />
        Overdue deals ({stats.overdueDeals ?? 0})
      </NavLink>
      <NavLink to={paths.history} className={itemClass}>
        <History size={15} />
        Deal history
      </NavLink>

      <p className={sectionTitle}>All follow-ups</p>
      <NavLink to={allPaths.today} className={itemClass}>
        <Calendar size={15} />
        Today ({stats.today})
      </NavLink>
    </nav>
  );
}
