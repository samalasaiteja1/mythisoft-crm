import { Link } from 'react-router-dom';
import { Users, Crown, Calendar, Building2 } from 'lucide-react';
import { formatDate } from '../../services/api';

function managerDisplay(team) {
  const mgr = team.teamManager || team.teamLeader;
  if (!mgr) return '—';
  if (typeof mgr === 'object') return `${mgr.firstName} ${mgr.lastName}`;
  return '—';
}

function departmentDisplay(team) {
  if (team.departmentRef?.name) return team.departmentRef.name;
  if (team.department && team.department !== 'manager') {
    return team.department.charAt(0).toUpperCase() + team.department.slice(1);
  }
  return '—';
}

export default function TeamInfoCard({ team, memberCount = 0 }) {
  const capacity = team.maxMembers ? `${memberCount} / ${team.maxMembers}` : String(memberCount);
  const atCapacity = team.maxMembers && memberCount >= team.maxMembers;

  return (
    <Link
      to={`/teams/detail/${team._id}/overview`}
      className="card block hover:border-myth-accent/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-white font-semibold group-hover:text-myth-accent transition-colors truncate">
            {team.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1 truncate">{team.description || 'No description'}</p>
        </div>
        <span className={`badge shrink-0 ${team.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {team.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Building2 size={14} className="shrink-0 text-gray-500" />
          <span className="truncate">{departmentDisplay(team)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Crown size={14} className="shrink-0 text-gray-500" />
          <span className="truncate">{managerDisplay(team)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Users size={14} className="shrink-0 text-gray-500" />
          <span className={atCapacity ? 'text-amber-400' : 'text-gray-300'}>{capacity} members</span>
        </div>
        {team.startDate && (
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar size={14} className="shrink-0 text-gray-500" />
            <span>{formatDate(team.startDate)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export { managerDisplay, departmentDisplay };
