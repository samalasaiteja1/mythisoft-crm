import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  usersAPI, leadsAPI, dealsAPI, projectsAPI, ticketsAPI, performanceAPI, attendanceAPI, staffRolesAPI, milestonesAPI,
} from '../../services/api';
import { ACTIVE_PROJECT_STATUSES } from '../../constants/projectStatuses';
import { useAuth } from '../../context/AuthContext';
import { filterTechnicalTeamsByScope, TECH_TEAM_LIST_SCOPE } from '../../utils/techTeamOwnership';
import { filterSupportTeamsByScope } from '../../utils/supportTeamOwnership';
import { isSupportManagerUser } from '../../utils/roleContext';
import { memberTaskCategory } from '../../constants/supportProjectTasks';

const ACTIVE_OR_LEGACY = [...ACTIVE_PROJECT_STATUSES, 'in_progress', 'delivered'];

const ROLE_BY_TYPE = { sales: 'sales', technical: 'technical', support: 'support', manager: 'manager' };

function resolveSupportHubUsers(currentUser, employees, teams, staffRoleId) {
  let scopedTeams = (teams || []).filter((t) => t.teamGroup === 'support' && t.status !== 'inactive');

  if (staffRoleId) {
    scopedTeams = scopedTeams.filter((t) => String(t._id) === String(staffRoleId));
  } else if (isSupportManagerUser(currentUser)) {
    scopedTeams = filterSupportTeamsByScope(scopedTeams, currentUser._id);
  } else if (currentUser?.role === 'support' || currentUser?.role === 'technical') {
    const myTeamId = String(currentUser.staffRole?._id || currentUser.staffRole || '');
    scopedTeams = myTeamId
      ? scopedTeams.filter((t) => String(t._id) === myTeamId)
      : [];
  }

  const teamIds = new Set(scopedTeams.map((t) => String(t._id)));
  const teamById = Object.fromEntries(scopedTeams.map((t) => [String(t._id), t]));

  return (employees || [])
    .filter((u) => {
      const tid = String(u.staffRole?._id || u.staffRole || '');
      return tid && teamIds.has(tid) && ['support', 'technical'].includes(u.role);
    })
    .map((u) => {
      const team = teamById[String(u.staffRole?._id || u.staffRole)];
      return {
        ...u,
        _supportTeam: team,
        _supportCategory: memberTaskCategory(u, team),
      };
    })
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
}

export function useTeamSectionData({ teamType, staffRoleId, section }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [staffTeams, setStaffTeams] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamType) return;
    setLoading(true);
    const loads = [
      usersAPI.getAll(teamType === 'support' ? { forTeamPick: '1' } : undefined).then(({ data }) => {
        const all = Array.isArray(data) ? data : [];
        if (staffRoleId) {
          setUsers(all.filter((u) => String(u.staffRole?._id || u.staffRole) === String(staffRoleId)));
        } else if (teamType === 'support') {
          setUsers([]);
        } else {
          const role = ROLE_BY_TYPE[teamType];
          setUsers(role ? all.filter((u) => u.role === role) : all);
        }
        return all;
      }),
      staffRolesAPI.getAll(teamType === 'support' ? { teamGroup: 'support', limit: 200 } : undefined).then(({ data }) => {
        const teams = Array.isArray(data) ? data : data.items || [];
        setStaffTeams(teams);
        return teams;
      }).catch(() => []),
    ];

    if (teamType === 'sales' && ['leads', 'workload', 'members', 'overview'].includes(section)) {
      loads.push(leadsAPI.getAll().then(({ data }) => setLeads(data.leads || [])));
    }
    if (teamType === 'sales' && ['deals', 'workload', 'members', 'overview'].includes(section)) {
      loads.push(dealsAPI.getAll().then(({ data }) => setDeals(data || [])));
    }
    if (teamType === 'technical' && section === 'milestones') {
      loads.push(
        milestonesAPI.getAll().then(({ data }) => setMilestones(data.items || [])).catch(() => {}),
      );
    }
    if (teamType === 'technical' || (teamType === 'manager' && section === 'overview')) {
      loads.push(projectsAPI.getAll({ limit: 200 }).then(({ data }) => setProjects(data.items || [])));
    }
    if (teamType === 'support' || (teamType === 'manager' && section === 'overview')) {
      loads.push(ticketsAPI.getAll().then(({ data }) => setTickets(data.items || [])));
    }
    if (teamType === 'manager' && section === 'overview') {
      loads.push(
        leadsAPI.getAll().then(({ data }) => setLeads(data.leads || [])),
        dealsAPI.getAll().then(({ data }) => setDeals(data || [])),
      );
    }
    if (section === 'performance') {
      loads.push(performanceAPI.get().then(({ data }) => setPerformance(data)).catch(() => {}));
    }
    if (section === 'attendance') {
      loads.push(attendanceAPI.getAll().then(({ data }) => setAttendance(data.items || data || [])).catch(() => {}));
    }

    Promise.all(loads)
      .then((results) => {
        if (teamType === 'support' && !staffRoleId) {
          const allUsers = results[0] || [];
          const teams = results[1] || [];
          setUsers(resolveSupportHubUsers(user, allUsers, teams, null));
        } else if (teamType === 'support' && staffRoleId) {
          const allUsers = results[0] || [];
          const teams = results[1] || [];
          setUsers(resolveSupportHubUsers(user, allUsers, teams, staffRoleId));
        }
      })
      .catch(() => toast.error('Failed to load team data'))
      .finally(() => setLoading(false));
  }, [teamType, staffRoleId, section, user?._id, user?.role, user?.staffRole]);

  const memberIds = useMemo(
    () => new Set(users.map((u) => String(u._id))),
    [users]
  );

  const teamLeads = useMemo(
    () => leads.filter((l) => memberIds.has(String(l.assignedTo?._id || l.assignedTo))),
    [leads, memberIds]
  );

  const teamDeals = useMemo(
    () => deals.filter((d) => memberIds.has(String(d.assignedTo?._id || d.assignedTo)) && !['lost', 'closed_lost'].includes(d.stage)),
    [deals, memberIds]
  );

  const allTeamProjects = useMemo(() => {
    if (teamType === 'technical' && user?._id) {
      const uid = String(user._id);
      return projects.filter((p) => {
        if (String(p.manager?._id || p.manager) === uid) return true;
        if (String(p.createdBy?._id || p.createdBy) === uid) return true;
        return (p.assignedTo || []).some((a) => memberIds.has(String(a._id || a)));
      });
    }
    return projects.filter((p) => (p.assignedTo || []).some((a) => memberIds.has(String(a._id || a))));
  }, [projects, memberIds, teamType, user?._id]);

  const teamProjects = useMemo(() => {
    if (section === 'active') return allTeamProjects.filter((p) => ACTIVE_OR_LEGACY.includes(p.status));
    if (section === 'pending') return allTeamProjects.filter((p) => ['new', 'planning'].includes(p.status));
    if (section === 'completed') return allTeamProjects.filter((p) => p.status === 'completed' || p.status === 'delivered');
    if (section === 'assignments') return allTeamProjects.filter((p) => (p.assignedTo || []).length > 0);
    return allTeamProjects;
  }, [allTeamProjects, section]);

  const teamTickets = useMemo(() => {
    const forMembers = tickets.filter((t) => (
      memberIds.has(String(t.supportAssignee?._id || t.supportAssignee))
      || memberIds.has(String(t.technicalAssignee?._id || t.technicalAssignee))
    ));
    if (section === 'assigned-tickets') return forMembers;
    if (section === 'open-tickets') return forMembers.filter((t) => !['resolved', 'closed'].includes(t.status));
    if (section === 'resolved-tickets') return forMembers.filter((t) => ['resolved', 'closed'].includes(t.status));
    return forMembers;
  }, [tickets, memberIds, section]);

  const teamAttendance = useMemo(
    () => attendance.filter((a) => memberIds.has(String(a.user?._id || a.user))),
    [attendance, memberIds]
  );

  const teamLeaderIds = useMemo(() => {
    const group = teamType === 'manager' ? 'manager' : teamType;
    return new Set(
      staffTeams
        .filter((t) => t.teamGroup === group && (t.teamLeader || t.teamManager))
        .map((t) => String((t.teamManager || t.teamLeader)?._id || t.teamManager || t.teamLeader))
    );
  }, [staffTeams, teamType]);

  const teamListScope = useMemo(() => {
    if (teamType !== 'technical' || staffRoleId) return TECH_TEAM_LIST_SCOPE.ALL;
    if (section === 'my-teams') return TECH_TEAM_LIST_SCOPE.MY;
    if (section === 'admin-teams') return TECH_TEAM_LIST_SCOPE.ADMIN;
    return TECH_TEAM_LIST_SCOPE.ALL;
  }, [teamType, staffRoleId, section]);

  const typeTeams = useMemo(() => {
    if (!teamType || staffRoleId) return [];
    const group = teamType === 'manager' ? 'manager' : teamType;
    let groupTeams = staffTeams
      .filter((t) => t.teamGroup === group)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (teamType === 'support' && isSupportManagerUser(user)) {
      groupTeams = filterSupportTeamsByScope(groupTeams, user._id);
    } else if (teamType === 'technical') {
      return filterTechnicalTeamsByScope(groupTeams, teamListScope, user?._id);
    }
    return groupTeams;
  }, [staffTeams, teamType, staffRoleId, teamListScope, user?._id]);

  const memberCountByTeam = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      const tid = u.staffRole?._id || u.staffRole;
      if (!tid) return;
      const key = String(tid);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [users]);

  const stats = useMemo(() => ({
    members: users.length,
    leads: teamLeads.length,
    deals: teamType === 'manager'
      ? deals.filter((d) => !['lost', 'closed_lost'].includes(d.stage)).length
      : teamDeals.length,
    projects: teamType === 'manager'
      ? projects.filter((p) => ACTIVE_OR_LEGACY.includes(p.status)).length
      : teamProjects.length,
    tickets: teamType === 'manager' ? tickets.length : teamTickets.length,
    openTickets: teamType === 'manager'
      ? tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length
      : teamTickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length,
  }), [users.length, teamLeads.length, teamDeals.length, teamProjects.length, teamTickets, teamType, deals, projects, tickets]);

  const refetchMilestones = () => {
    return milestonesAPI.getAll()
      .then(({ data }) => setMilestones(data.items || []))
      .catch(() => toast.error('Failed to load milestones'));
  };

  return {
    users,
    teamLeads,
    teamDeals,
    teamProjects,
    allTeamProjects,
    teamTickets,
    teamAttendance,
    performance,
    loading,
    stats,
    memberIds,
    teamLeaderIds,
    typeTeams,
    memberCountByTeam,
    milestones,
    refetchMilestones,
    projects,
  };
}
