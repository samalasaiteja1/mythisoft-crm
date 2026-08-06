import { NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { getProjectNavForRole, ADD_PROJECT_PATH } from '../../constants/projectNav';

const sectionTitle = 'text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 pt-4 pb-1 first:pt-1';

const itemClass = ({ isActive }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left w-full ${
    isActive
      ? 'bg-myth-accent/15 text-myth-accent font-medium'
      : 'text-gray-400 hover:text-white hover:bg-myth-surface/60'
  }`;

export default function ProjectsSidebar() {
  const { role, canWrite, isAdmin, isManager, isTechManager } = usePermissions();
  const navItems = getProjectNavForRole(role, { isTechManager });
  const canAddProject = (isAdmin || isManager) && !isTechManager && canWrite('projects');

  return (
    <nav className="card p-2 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      {canAddProject && (
        <NavLink
          to={ADD_PROJECT_PATH}
          className="flex items-center gap-2.5 px-3 py-2 mb-2 rounded-lg text-sm text-left bg-myth-accent/10 text-myth-accent hover:bg-myth-accent/20"
        >
          <Plus size={15} /> Add Project
        </NavLink>
      )}

      <p className={sectionTitle}>{isTechManager ? 'My Projects' : 'Projects'}</p>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.key} to={item.path} end={item.end} className={itemClass} title={item.hint || ''}>
            <Icon size={14} />
            <span className="truncate">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
