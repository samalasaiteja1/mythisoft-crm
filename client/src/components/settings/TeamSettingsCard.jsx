import { Link } from 'react-router-dom';
import {
  Building2, Crown, Users, Calendar, Pencil, Trash2, ToggleLeft, ToggleRight, Eye,
} from 'lucide-react';
import { formatDate } from '../../services/api';
import { managerDisplay, departmentDisplay } from '../../pages/teams/TeamInfoCard';

export default function TeamSettingsCard({
  team,
  memberCount = 0,
  members = [],
  onEdit,
  onDelete,
  onToggleStatus,
  readOnly = false,
}) {
  const capacityPct = team.maxMembers
    ? Math.min(100, Math.round((memberCount / team.maxMembers) * 100))
    : null;
  const atCapacity = team.maxMembers && memberCount >= team.maxMembers;

  return (
    <div className="card border border-myth-border/80 hover:border-myth-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-white font-semibold truncate">{team.name}</h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {team.description || 'No description'}
          </p>
        </div>
        <span className={`badge shrink-0 ${team.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {team.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
            <Building2 size={13} /> Department
          </span>
          <span className="text-gray-300 text-right truncate">{departmentDisplay(team)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
            <Crown size={13} /> Team Manager
          </span>
          <span className="text-myth-accent text-right truncate">{managerDisplay(team)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
            <Users size={13} /> Members
          </span>
          <span className={`text-right ${atCapacity ? 'text-amber-400' : 'text-white'}`}>
            {memberCount}{team.maxMembers ? ` / ${team.maxMembers}` : ''}
          </span>
        </div>
        {team.maxMembers && (
          <div className="h-1.5 rounded-full bg-myth-border overflow-hidden">
            <div
              className={`h-full rounded-full ${atCapacity ? 'bg-amber-500' : 'bg-myth-accent'}`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        )}
        <div className="flex justify-between gap-2">
          <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
            <Calendar size={13} /> Start Date
          </span>
          <span className="text-gray-300">{team.startDate ? formatDate(team.startDate) : '—'}</span>
        </div>
      </div>

      {members.length > 0 && (
        <div className="mt-4 pt-3 border-t border-myth-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Team Members</p>
          <div className="flex flex-wrap gap-1.5">
            {members.slice(0, 4).map((m) => (
              <span key={m._id} className="text-xs px-2 py-1 rounded-md bg-myth-surface/60 text-gray-300">
                {m.firstName} {m.lastName}
              </span>
            ))}
            {members.length > 4 && (
              <span className="text-xs px-2 py-1 rounded-md bg-myth-surface/40 text-gray-500">
                +{members.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-myth-border">
        <div className="flex items-center gap-1">
          {team.teamGroup !== 'manager' && (
            <Link
              to={`/teams/detail/${team._id}/overview`}
              className="p-2 rounded-lg hover:bg-myth-surface text-gray-400 hover:text-myth-accent"
              title="View dashboard"
            >
              <Eye size={16} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => !readOnly && onEdit(team)}
            disabled={readOnly}
            className={`p-2 rounded-lg hover:bg-myth-surface text-gray-400 ${readOnly ? 'opacity-40 cursor-not-allowed' : 'hover:text-myth-accent'}`}
            title={readOnly ? 'View only' : 'Edit team'}
          >
            <Pencil size={16} />
          </button>
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => onToggleStatus(team)}
                className="p-2 rounded-lg hover:bg-myth-surface text-gray-400 hover:text-white"
                title="Toggle status"
              >
                {team.status === 'active' ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} />}
              </button>
              <button
                type="button"
                onClick={() => onDelete(team)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                title="Delete team"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
        {team.maxMembers && (
          <span className="text-[10px] text-gray-500">Max {team.maxMembers}</span>
        )}
      </div>
    </div>
  );
}
