import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Users, Crown, Building2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { staffRolesAPI, formatDate } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import TeamSectionContent from './TeamSectionContent';
import { useTeamSectionData } from './useTeamSectionData';
import {
  TEAM_TYPE_LABELS, TEAM_TYPE_SECTIONS, teamTypeFromGroup,
} from './teamConfig';
import { managerDisplay, departmentDisplay } from './TeamInfoCard';

export default function TeamDetailPage() {
  const { staffRoleId, section: sectionParam } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const teamType = team ? teamTypeFromGroup(team.teamGroup) : null;
  const sections = teamType ? TEAM_TYPE_SECTIONS[teamType] || [] : [];
  const section = sectionParam || sections[0]?.key || 'overview';

  const data = useTeamSectionData({ teamType, staffRoleId, section });

  useEffect(() => {
    setLoadingTeam(true);
    staffRolesAPI.getOne(staffRoleId)
      .then(({ data: teamData }) => setTeam(teamData))
      .catch(() => {
        toast.error('Team not found');
        navigate('/users');
      })
      .finally(() => setLoadingTeam(false));
  }, [staffRoleId, navigate]);

  if (loadingTeam) return <LoadingSpinner />;

  if (!team) return null;

  if (!sectionParam && sections[0]?.key) {
    return <Navigate to={`/teams/detail/${staffRoleId}/${sections[0].key}`} replace />;
  }

  const typeLabel = TEAM_TYPE_LABELS[teamType] || team.teamGroup;
  const teamManager = team.teamManager || team.teamLeader;
  const memberCap = team.maxMembers
    ? `${data.stats.members} / ${team.maxMembers}`
    : String(data.stats.members);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link to={`/teams/${teamType}/overview`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-3">
            <ArrowLeft size={16} /> Back to {typeLabel}
          </Link>
          <h1 className="text-2xl font-bold text-white">{team.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <Building2 size={14} /> {departmentDisplay(team)}
            </span>
            {teamManager && typeof teamManager === 'object' && (
              <span className="inline-flex items-center gap-1.5 text-myth-accent">
                <Crown size={14} />
                Manager: {managerDisplay(team)}
                {teamManager.employeeId ? ` (${teamManager.employeeId})` : ''}
              </span>
            )}
            {team.startDate && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} /> Started {formatDate(team.startDate)}
              </span>
            )}
            <span className={`badge ${team.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {team.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          {team.description && <p className="text-gray-500 text-sm mt-2">{team.description}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="card py-3 px-4 min-w-[100px] text-center">
            <p className="text-2xl font-bold text-myth-accent">{memberCap}</p>
            <p className="text-xs text-gray-500">Members</p>
          </div>
          {teamType === 'sales' && (
            <>
              <div className="card py-3 px-4 min-w-[100px] text-center">
                <p className="text-2xl font-bold text-white">{data.stats.leads}</p>
                <p className="text-xs text-gray-500">Leads</p>
              </div>
              <div className="card py-3 px-4 min-w-[100px] text-center">
                <p className="text-2xl font-bold text-white">{data.stats.deals}</p>
                <p className="text-xs text-gray-500">Deals</p>
              </div>
            </>
          )}
          {teamType === 'technical' && (
            <div className="card py-3 px-4 min-w-[100px] text-center">
              <p className="text-2xl font-bold text-white">{data.stats.projects}</p>
              <p className="text-xs text-gray-500">Projects</p>
            </div>
          )}
          {teamType === 'support' && (
            <>
              <div className="card py-3 px-4 min-w-[100px] text-center">
                <p className="text-2xl font-bold text-white">{data.stats.tickets}</p>
                <p className="text-xs text-gray-500">Tickets</p>
              </div>
              <div className="card py-3 px-4 min-w-[100px] text-center">
                <p className="text-2xl font-bold text-white">{data.stats.openTickets}</p>
                <p className="text-xs text-gray-500">Open</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <nav className="card p-3 space-y-1 h-fit">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-2">{typeLabel}</p>
          {sections.map((s) => {
            const Icon = s.icon || Users;
            const active = section === s.key;
            return (
              <Link
                key={s.key}
                to={`/teams/detail/${staffRoleId}/${s.key}`}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-myth-accent/20 text-myth-accent font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-myth-surface/50'
                }`}
              >
                <Icon size={16} />
                {s.label}
              </Link>
            );
          })}
        </nav>

        <div className="card p-5">
          <TeamSectionContent
            teamType={teamType}
            section={section}
            team={team}
            users={data.users}
            teamLeaderId={team.teamManager?._id || team.teamManager || team.teamLeader?._id || team.teamLeader}
            teamLeads={data.teamLeads}
            teamDeals={data.teamDeals}
            teamProjects={data.teamProjects}
            allTeamProjects={data.allTeamProjects}
            teamTickets={data.teamTickets}
            teamAttendance={data.teamAttendance}
            performance={data.performance}
            loading={data.loading}
            stats={data.stats}
          />
        </div>
      </div>
    </div>
  );
}
