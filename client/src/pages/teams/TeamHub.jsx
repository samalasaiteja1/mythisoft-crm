import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { TEAM_TYPE_LABELS, TEAM_TYPE_SECTIONS, sectionMeta } from './teamConfig';
import TeamSectionContent from './TeamSectionContent';
import { useTeamSectionData } from './useTeamSectionData';

export default function TeamHub({ team, section }) {
  const teamType = team;
  const sections = TEAM_TYPE_SECTIONS[teamType] || [];
  const meta = sectionMeta(teamType, section);
  const Icon = meta.icon;

  const data = useTeamSectionData({ teamType, staffRoleId: null, section });

  const totalMembers = data.users.length;
  const totalTeams = data.typeTeams?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icon className="text-myth-accent" size={24} />
            {TEAM_TYPE_LABELS[teamType]} Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            {totalTeams} team{totalTeams !== 1 ? 's' : ''} · {totalMembers} staff member{totalMembers !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/settings?tab=teams" className="btn-primary text-sm inline-flex items-center gap-2 shrink-0">
          <Plus size={16} /> Create Team
        </Link>
        {teamType === 'technical' && (
          <Link to="/teams/technical/manage" className="btn-secondary text-sm inline-flex items-center gap-2 shrink-0">
            Manage Teams
          </Link>
        )}
        {teamType === 'support' && (
          <Link to="/teams/support/manage" className="btn-secondary text-sm inline-flex items-center gap-2 shrink-0">
            Manage Teams
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card py-3 px-4 text-center">
          <p className="text-2xl font-bold text-myth-accent">{totalTeams}</p>
          <p className="text-xs text-gray-500">Teams</p>
        </div>
        <div className="card py-3 px-4 text-center">
          <p className="text-2xl font-bold text-white">{totalMembers}</p>
          <p className="text-xs text-gray-500">Staff</p>
        </div>
        {teamType === 'sales' && (
          <>
            <div className="card py-3 px-4 text-center">
              <p className="text-2xl font-bold text-white">{data.stats.leads}</p>
              <p className="text-xs text-gray-500">Team Leads</p>
            </div>
            <div className="card py-3 px-4 text-center">
              <p className="text-2xl font-bold text-white">{data.stats.deals}</p>
              <p className="text-xs text-gray-500">Active Deals</p>
            </div>
          </>
        )}
        {teamType === 'technical' && (
          <div className="card py-3 px-4 text-center">
            <p className="text-2xl font-bold text-white">{data.stats.projects}</p>
            <p className="text-xs text-gray-500">Active Projects</p>
          </div>
        )}
        {teamType === 'support' && (
          <>
            <div className="card py-3 px-4 text-center">
              <p className="text-2xl font-bold text-white">{data.stats.tickets}</p>
              <p className="text-xs text-gray-500">Tickets</p>
            </div>
            <div className="card py-3 px-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{data.stats.openTickets}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <nav className="card p-3 space-y-1 h-fit">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-2">
            {TEAM_TYPE_LABELS[teamType]}
          </p>
          {sections.map((s) => {
            const SectionIcon = s.icon;
            const active = section === s.key;
            return (
              <Link
                key={s.key}
                to={`/teams/${team}/${s.key}`}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-myth-accent/20 text-myth-accent font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-myth-surface/50'
                }`}
              >
                <SectionIcon size={16} />
                {s.label}
              </Link>
            );
          })}
        </nav>

        <div className="card p-5">
          <TeamSectionContent
            teamType={teamType}
            section={section}
            users={data.users}
            teamLeads={data.teamLeads}
            teamDeals={data.teamDeals}
            teamProjects={data.teamProjects}
            allTeamProjects={data.allTeamProjects}
            teamTickets={data.teamTickets}
            teamAttendance={data.teamAttendance}
            performance={data.performance}
            loading={data.loading}
            typeTeams={data.typeTeams}
            memberCountByTeam={data.memberCountByTeam}
            stats={data.stats}
            milestones={data.milestones}
            refetchMilestones={data.refetchMilestones}
            projects={data.projects}
          />
        </div>
      </div>
    </div>
  );
}
