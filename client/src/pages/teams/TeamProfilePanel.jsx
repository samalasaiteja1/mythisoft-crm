import { Link } from 'react-router-dom';
import { Building2, Crown, Users, Calendar, Pencil, Shield } from 'lucide-react';
import { formatDate } from '../../services/api';
import { managerDisplay, departmentDisplay } from './TeamInfoCard';

export default function TeamProfilePanel({ team, memberCount = 0 }) {
  if (!team) return null;

  const capacityPct = team.maxMembers
    ? Math.min(100, Math.round((memberCount / team.maxMembers) * 100))
    : null;

  return (
    <div className="card border border-myth-border/80 bg-myth-surface/20 p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Team Profile</p>
          <h2 className="text-xl font-bold text-white">{team.name}</h2>
          {team.description && <p className="text-sm text-gray-400 mt-1">{team.description}</p>}
        </div>
        <Link
          to="/settings?tab=teams"
          className="btn-secondary text-sm inline-flex items-center gap-2 shrink-0"
        >
          <Pencil size={14} /> Edit Team
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Building2 size={14} /> Department
          </div>
          <p className="text-white font-medium">{departmentDisplay(team)}</p>
        </div>
        <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Crown size={14} /> Team Manager
          </div>
          <p className="text-white font-medium">{managerDisplay(team)}</p>
        </div>
        <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Shield size={14} /> Status
          </div>
          <p className={team.status === 'active' ? 'text-green-400 font-medium' : 'text-gray-400 font-medium'}>
            {team.status === 'active' ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Users size={14} /> Team Members
          </div>
          <p className="text-white font-medium">
            {memberCount}
            {team.maxMembers ? ` / ${team.maxMembers}` : ''}
          </p>
          {capacityPct !== null && (
            <div className="mt-2 h-1.5 rounded-full bg-myth-border overflow-hidden">
              <div
                className={`h-full rounded-full ${capacityPct >= 100 ? 'bg-amber-500' : 'bg-myth-accent'}`}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          )}
        </div>
        <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Users size={14} /> Maximum Members
          </div>
          <p className="text-white font-medium">{team.maxMembers || '—'}</p>
        </div>
        <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Calendar size={14} /> Start Date
          </div>
          <p className="text-white font-medium">{team.startDate ? formatDate(team.startDate) : '—'}</p>
        </div>
      </div>
    </div>
  );
}
