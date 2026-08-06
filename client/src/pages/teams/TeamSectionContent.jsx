import { Link } from 'react-router-dom';
import { formatCurrency, DEAL_STAGES, formatDate } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { sectionMeta, TEAM_TYPE_LABELS } from './teamConfig';
import TeamMemberCard from './TeamMemberCard';
import TeamInfoCard from './TeamInfoCard';
import TeamProfilePanel from './TeamProfilePanel';
import TeamMilestonesPanel from '../../components/techManager/TeamMilestonesPanel';
import { supportCategoryLabel } from '../../constants/supportProjectTasks';

export default function TeamSectionContent({
  teamType,
  section,
  team,
  users,
  teamLeaderId,
  teamLeads,
  teamDeals,
  teamProjects,
  allTeamProjects,
  teamTickets,
  teamAttendance,
  performance,
  loading,
  typeTeams,
  memberCountByTeam,
  stats,
  milestones,
  refetchMilestones,
  projects,
}) {
  const meta = sectionMeta(teamType, section);
  const Icon = meta.icon;

  if (loading) return <LoadingSpinner />;

  const workloadRows = () => {
    if (teamType === 'sales') {
      return users.map((u) => {
        const userLeads = teamLeads.filter((l) => String(l.assignedTo?._id || l.assignedTo) === String(u._id));
        const userDeals = teamDeals.filter((d) => String(d.assignedTo?._id || d.assignedTo) === String(u._id));
        return { user: u, primary: userLeads.length, secondary: userDeals.length, primaryLabel: 'Leads', secondaryLabel: 'Deals' };
      });
    }
    if (teamType === 'technical') {
      const projectList = section === 'workload' ? (allTeamProjects || teamProjects) : teamProjects;
      return users.map((u) => {
        const count = projectList.filter((p) => (p.assignedTo || []).some((a) => String(a._id || a) === String(u._id))).length;
        return { user: u, primary: count, secondary: 0, primaryLabel: 'Projects', secondaryLabel: '' };
      });
    }
    return users.map((u) => {
      const count = teamTickets.filter((t) => String(t.supportAssignee?._id || t.supportAssignee) === String(u._id)).length;
      return { user: u, primary: count, secondary: 0, primaryLabel: 'Tickets', secondaryLabel: '' };
    });
  };

  const memberPerformance = () => {
    const memberNames = new Set(users.map((u) => `${u.firstName} ${u.lastName}`.trim()));
    if (teamType === 'sales') {
      return (performance?.salesPerformance || []).filter((s) => memberNames.has(s.name));
    }
    if (teamType === 'technical') {
      return (performance?.taskStats || []).filter((s) => memberNames.has(s.name));
    }
    if (teamType === 'support') {
      return (performance?.supportStats || []).filter((s) => memberNames.has(s.name));
    }
    return [];
  };

  return (
    <div className="space-y-6">
      {section !== 'milestones' && (
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Icon className="text-myth-accent" size={22} />
          {meta.label}
        </h2>
      </div>
      )}

      {section === 'milestones' && teamType === 'technical' && (
        <TeamMilestonesPanel
          milestones={milestones || []}
          projects={projects || allTeamProjects || teamProjects || []}
          teams={typeTeams || []}
          employees={users}
          onRefresh={refetchMilestones}
        />
      )}

      {section === 'overview' && team && (
        <div className="space-y-6">
          <TeamProfilePanel team={team} memberCount={users.length} />
          {users.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Members preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {users.slice(0, 6).map((u) => (
                  <TeamMemberCard
                    key={u._id}
                    member={u}
                    isLeader={teamLeaderId && String(u._id) === String(teamLeaderId)}
                  />
                ))}
              </div>
              {users.length > 6 && (
                <Link to={`/teams/detail/${team._id}/members`} className="text-sm text-myth-accent hover:underline mt-3 inline-block">
                  View all {users.length} members →
                </Link>
              )}
            </div>
          )}
          {teamType === 'sales' && stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-3 text-center">
                <p className="text-2xl font-bold text-myth-accent">{stats.leads}</p>
                <p className="text-xs text-gray-500">Assigned Leads</p>
              </div>
              <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-3 text-center">
                <p className="text-2xl font-bold text-white">{stats.deals}</p>
                <p className="text-xs text-gray-500">Active Deals</p>
              </div>
            </div>
          )}
          {teamType === 'technical' && stats && (
            <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-3 text-center max-w-[200px]">
              <p className="text-2xl font-bold text-white">{stats.projects}</p>
              <p className="text-xs text-gray-500">Active Projects</p>
            </div>
          )}
          {teamType === 'support' && stats && (
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-3 text-center">
                <p className="text-2xl font-bold text-white">{stats.tickets}</p>
                <p className="text-xs text-gray-500">Tickets</p>
              </div>
              <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-3 text-center">
                <p className="text-2xl font-bold text-amber-400">{stats.openTickets}</p>
                <p className="text-xs text-gray-500">Open</p>
              </div>
            </div>
          )}
        </div>
      )}

      {['overview', 'my-teams', 'admin-teams'].includes(section) && !team && typeTeams && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {section === 'my-teams'
              ? 'Teams you created or manage as technical manager.'
              : section === 'admin-teams'
                ? 'Technical teams created by admin or assigned to other managers.'
                : `${TEAM_TYPE_LABELS[teamType]} — all teams. Select a team to view details.`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {typeTeams.map((t) => (
              <TeamInfoCard
                key={t._id}
                team={t}
                memberCount={memberCountByTeam?.[String(t._id)] || 0}
              />
            ))}
          </div>
          {!typeTeams.length && (
            <div className="text-center py-10 border border-dashed border-myth-border rounded-xl">
              <p className="text-gray-500 text-sm">
                {section === 'my-teams' ? 'You have no teams yet.' : section === 'admin-teams' ? 'No admin-created teams.' : 'No teams yet.'}
              </p>
              {section === 'my-teams' && teamType === 'technical' && (
                <Link to="/teams/technical/manage" className="text-myth-accent text-sm hover:underline mt-2 inline-block">
                  Create a team →
                </Link>
              )}
              {section === 'overview' && (
                <Link to="/settings?tab=teams" className="text-myth-accent text-sm hover:underline mt-2 inline-block">
                  Create a team in Settings →
                </Link>
              )}
            </div>
          )}
        </div>
      )}
      {section === 'members' && teamType === 'support' && (
        <div className="overflow-x-auto border border-myth-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-myth-border text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="table-cell">Name</th>
                <th className="table-cell">Employee ID</th>
                <th className="table-cell">Team</th>
                <th className="table-cell">Support Role</th>
                <th className="table-cell">Email</th>
                <th className="table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-myth-border/60 hover:bg-myth-surface/30">
                  <td className="table-cell text-white font-medium">
                    {u.firstName} {u.lastName}
                    {teamLeaderId && String(u._id) === String(teamLeaderId) && (
                      <span className="ml-2 badge bg-myth-accent/20 text-myth-accent text-[10px]">Lead</span>
                    )}
                  </td>
                  <td className="table-cell text-gray-400">{u.employeeId || '—'}</td>
                  <td className="table-cell text-gray-300">{u._supportTeam?.name || u.staffRole?.name || '—'}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      u._supportCategory === 'technical_support_engineer'
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'bg-orange-500/15 text-orange-400'
                    }`}>
                      {supportCategoryLabel(u._supportCategory)}
                    </span>
                  </td>
                  <td className="table-cell text-gray-400">{u.email || '—'}</td>
                  <td className="table-cell">
                    <span className={u.isActive !== false ? 'text-green-400' : 'text-gray-500'}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && <p className="text-gray-500 text-center py-10">No team members found.</p>}
        </div>
      )}

      {section === 'members' && teamType !== 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((u) => (
            <TeamMemberCard
              key={u._id}
              member={u}
              isLeader={teamLeaderId && String(u._id) === String(teamLeaderId)}
            />
          ))}
          {!users.length && <p className="text-gray-500">No team members found.</p>}
        </div>
      )}

      {section === 'leads' && teamType === 'sales' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-400 border-b border-myth-border">
                {['Lead', 'Company', 'Assigned To', 'Status'].map((h) => <th key={h} className="pb-3 pr-4">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {teamLeads.map((l) => (
                <tr key={l._id} className="border-b border-myth-border/40">
                  <td className="py-3 pr-4"><Link to={`/leads/${l._id}`} className="text-myth-accent">{l.firstName} {l.lastName}</Link></td>
                  <td className="py-3 pr-4 text-gray-300">{l.company}</td>
                  <td className="py-3 pr-4 text-gray-300">{l.assignedTo?.firstName} {l.assignedTo?.lastName}</td>
                  <td className="py-3 pr-4 text-gray-300 capitalize">{l.status?.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!teamLeads.length && <p className="text-gray-500 text-sm">No assigned leads for this team.</p>}
        </div>
      )}

      {section === 'deals' && teamType === 'sales' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-400 border-b border-myth-border">
                {['Deal', 'Value', 'Stage', 'Owner'].map((h) => <th key={h} className="pb-3 pr-4">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {teamDeals.map((d) => (
                <tr key={d._id} className="border-b border-myth-border/40">
                  <td className="py-3 pr-4"><Link to={`/deals/${d._id}`} className="text-myth-accent">{d.title}</Link></td>
                  <td className="py-3 pr-4 text-myth-accent">{formatCurrency(d.value)}</td>
                  <td className="py-3 pr-4 text-gray-300">{DEAL_STAGES[d.stage]?.label || d.stage}</td>
                  <td className="py-3 pr-4 text-gray-300">{d.assignedTo?.firstName} {d.assignedTo?.lastName}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!teamDeals.length && <p className="text-gray-500 text-sm">No active deals for this team.</p>}
        </div>
      )}

      {section === 'performance' && (
        <div className="space-y-3">
          {memberPerformance().map((s, i) => (
            <div key={i} className="flex justify-between p-3 rounded-lg bg-myth-surface/50">
              <span className="text-white">{s.name}</span>
              <span className="text-myth-accent">
                {teamType === 'sales' && `${s.totalDeals || 0} deals · ${formatCurrency(s.totalRevenue || 0)}`}
                {teamType === 'technical' && `${s.completed || 0} completed · ${s.pending || 0} pending`}
                {teamType === 'support' && `${s.resolved || 0} / ${s.total || 0} resolved`}
              </span>
            </div>
          ))}
          {!memberPerformance().length && <p className="text-gray-500 text-sm">No performance data for this team yet.</p>}
        </div>
      )}

      {section === 'workload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workloadRows().map(({ user, primary, secondary, primaryLabel, secondaryLabel }) => (
            <div key={user._id} className="card">
              <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-400 mt-2">{primaryLabel}: <span className="text-myth-accent font-semibold">{primary}</span></p>
              {secondaryLabel && <p className="text-sm text-gray-400">{secondaryLabel}: <span className="text-white">{secondary}</span></p>}
            </div>
          ))}
          {!users.length && <p className="text-gray-500">No workload data.</p>}
        </div>
      )}

      {teamType === 'technical' && ['assignments', 'active', 'pending', 'completed'].includes(section) && (
        <div className="space-y-2">
          {teamProjects.map((p) => (
            <Link key={p._id} to={`/projects/${p._id}`} className="block p-3 rounded-lg bg-myth-surface/40 hover:bg-myth-surface/60">
              <p className="text-white font-medium">{p.name}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">Status: {(p.status || '').replace(/_/g, ' ')}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(p.assignedTo || []).map((u) => `${u.firstName || ''} ${u.lastName || ''}`).join(', ') || 'Unassigned'}
              </p>
            </Link>
          ))}
          {!teamProjects.length && <p className="text-gray-500 text-sm">No projects in this view.</p>}
        </div>
      )}

      {teamType === 'support' && ['assigned-tickets', 'open-tickets', 'resolved-tickets'].includes(section) && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-400 border-b border-myth-border">
                {['Ticket', 'Subject', 'Priority', 'Status'].map((h) => <th key={h} className="pb-3 pr-4">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {teamTickets.map((t) => (
                <tr key={t._id} className="border-b border-myth-border/40">
                  <td className="py-3 pr-4"><Link to={`/tickets/${t._id}`} className="text-myth-accent">{t.ticketNumber}</Link></td>
                  <td className="py-3 pr-4 text-gray-300">{t.subject}</td>
                  <td className="py-3 pr-4 text-gray-300 capitalize">{t.priority}</td>
                  <td className="py-3 pr-4 text-gray-300 capitalize">{t.status?.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!teamTickets.length && <p className="text-gray-500 text-sm">No tickets in this view.</p>}
        </div>
      )}

      {section === 'attendance' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-400 border-b border-myth-border">
                {['Employee', 'Date', 'Status', 'Check In', 'Check Out'].map((h) => <th key={h} className="pb-3 pr-4">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {teamAttendance.map((a) => (
                <tr key={a._id} className="border-b border-myth-border/40">
                  <td className="py-3 pr-4 text-white">{a.user?.firstName} {a.user?.lastName}</td>
                  <td className="py-3 pr-4 text-gray-300">{formatDate(a.date)}</td>
                  <td className="py-3 pr-4 text-gray-300 capitalize">{(a.status || '').replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-4 text-gray-300">{a.checkIn || '—'}</td>
                  <td className="py-3 pr-4 text-gray-300">{a.checkOut || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!teamAttendance.length && <p className="text-gray-500 text-sm">No attendance records for this team.</p>}
        </div>
      )}
    </div>
  );
}
