import { Link } from 'react-router-dom';
import {
  FolderKanban, Clock, CheckSquare, AlertTriangle, Users, Layers,
  ListTodo, Bell, TrendingUp, Cpu, GitBranch, Bug, Rocket, Headphones, Wrench,
  Plus, Flag, LayoutGrid, ArrowRight, UserCheck,
} from 'lucide-react';
import { DEPARTMENT_LABELS } from '../../utils/roleContext';
import { TECH_MANAGER_WORKFLOW } from '../../constants/technicalManagerNav';
import FollowUpSummaryPanel from './FollowUpSummaryPanel';

const ACTION_ITEMS = [
  { key: 'pendingCustomerAcceptance', label: 'Awaiting Acceptance', icon: UserCheck, color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-500/5', link: '/projects' },
  { key: 'overdueTasks', label: 'Overdue Tasks', icon: Clock, color: 'text-orange-400', bg: 'border-orange-500/30 bg-orange-500/5', link: '/tasks/overdue' },
  { key: 'delayedProjects', label: 'Delayed Projects', icon: AlertTriangle, color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/5', link: '/projects/overdue' },
  { key: 'pendingCodeReviews', label: 'Pending Reviews', icon: GitBranch, color: 'text-purple-400', bg: 'border-purple-500/30 bg-purple-500/5', link: '/projects/status/code_review' },
  { key: 'openBugs', label: 'Open Bugs', icon: Bug, color: 'text-rose-400', bg: 'border-rose-500/30 bg-rose-500/5', link: '/bug-tracker' },
  { key: 'pendingDeployment', label: 'Pending Deployment', icon: Rocket, color: 'text-cyan-400', bg: 'border-cyan-500/30 bg-cyan-500/5', link: '/projects/status/deployment' },
];

const PROJECT_HEALTH = [
  { key: 'activeProjects', label: 'Active', icon: FolderKanban, color: 'text-blue-400', link: '/projects/active' },
  { key: 'pendingCodeReviews', label: 'Code Review', icon: GitBranch, color: 'text-purple-400', link: '/projects/status/code_review' },
  { key: 'pendingTesting', label: 'Testing', icon: CheckSquare, color: 'text-amber-400', link: '/projects/status/testing' },
  { key: 'pendingBugFixing', label: 'Bug Fixing', icon: Bug, color: 'text-orange-400', link: '/projects/status/bug_fixing' },
  { key: 'pendingDeployment', label: 'Deployment', icon: Rocket, color: 'text-cyan-400', link: '/projects/status/deployment' },
  { key: 'completedProjects', label: 'Completed', icon: CheckSquare, color: 'text-green-400', link: '/projects/status/completed' },
];

const TEAM_METRICS = [
  { key: 'totalTeams', label: 'My Teams', icon: Layers, link: '/teams/technical/my-teams' },
  { key: 'totalTeamMembers', label: 'Team Members', icon: Users, link: '/teams/technical/members' },
  { key: 'projectProgress', label: 'Project Progress', icon: TrendingUp, link: '/reports/projects', format: 'percent' },
  { key: 'teamPerformance', label: 'Team Performance', icon: TrendingUp, link: '/teams/technical/performance', format: 'percent' },
];

const QUICK_ACTIONS = [
  { label: 'Create Team', path: '/teams/technical/manage', icon: Users, primary: true },
  { label: 'Create Task', path: '/tasks?create=1', icon: ListTodo },
  { label: 'Add Milestone', path: '/projects/milestones', icon: Flag },
  { label: 'Submit to Support', path: '/projects/support-handoff', icon: Headphones },
  { label: 'Support Updates', path: '/projects/support-updates', icon: Wrench },
  { label: 'Deployment', path: '/deployment', icon: Rocket },
];

const DELIVERY_LINKS = [
  { label: 'Task List', path: '/tasks' },
  { label: 'Kanban Board', path: '/dev-board' },
  { label: 'Code Review', path: '/projects/status/code_review' },
  { label: 'Testing', path: '/projects/status/testing' },
  { label: 'Bug Fixing', path: '/projects/status/bug_fixing' },
  { label: 'Deployment', path: '/projects/status/deployment' },
  { label: 'Submit to Support', path: '/projects/support-handoff' },
  { label: 'Bug Tracker', path: '/bug-tracker' },
  { label: 'Reports', path: '/reports/projects' },
];

function formatMetric(value, format) {
  if (value == null) return '—';
  if (format === 'percent') return `${value}%`;
  return String(value);
}

function actionAlertCount(stats) {
  return ACTION_ITEMS.reduce((sum, item) => sum + (Number(stats[item.key]) || 0), 0);
}

export default function TechnicalManagerDashboard({ departmentOverview, roleStats }) {
  const deptLabel = DEPARTMENT_LABELS.technical || 'Technical';
  const stats = roleStats || {};
  const overview = departmentOverview || { recentEmployees: [], deptInfo: null, followupOverview: null };
  const { deptInfo, recentEmployees = [], followupOverview, totalEmployees } = overview;
  const alerts = actionAlertCount(stats);
  const members = stats.totalTeamMembers ?? totalEmployees ?? recentEmployees.length;
  const activeProjects = stats.activeProjects ?? 0;
  const pendingAcceptance = stats.pendingCustomerAcceptance ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card border-cyan-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Cpu size={20} className="text-cyan-400" /> Technical Manager Control Center
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {deptLabel} department · scoped to your assigned projects only
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300">
              <FolderKanban size={14} /> {activeProjects} active project{activeProjects === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sm text-sky-300">
              <Users size={14} /> {members} team member{members === 1 ? '' : 's'}
            </span>
            {pendingAcceptance > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300">
                <UserCheck size={14} /> {pendingAcceptance} awaiting customer acceptance
              </span>
            )}
            {alerts > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300">
                <AlertTriangle size={14} /> {alerts} need attention
              </span>
            )}
            <Link to="/notifications" className="btn-secondary text-sm inline-flex items-center gap-1">
              <Bell size={14} /> Notifications
            </Link>
          </div>
        </div>
      </div>

      {/* Row 1 — Needs attention */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Needs Attention</h3>
          {alerts === 0 && (
            <span className="text-xs text-green-400">All clear — nothing overdue</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ACTION_ITEMS.map((item) => {
            const Icon = item.icon;
            const value = Number(stats[item.key]) || 0;
            const isUrgent = value > 0;
            return (
              <Link
                key={item.key}
                to={item.link}
                className={`p-4 rounded-xl border transition-colors hover:border-myth-accent/40 ${isUrgent ? item.bg : 'border-myth-border bg-myth-surface/50'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className={item.color} />
                  <span className="text-xs text-gray-400 leading-tight">{item.label}</span>
                </div>
                <p className={`text-2xl font-bold ${isUrgent ? 'text-white' : 'text-gray-500'}`}>{value}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Row 2 — Project health */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Project Health</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PROJECT_HEALTH.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.link}
                className="p-4 rounded-xl bg-myth-surface/50 border border-myth-border hover:border-myth-accent/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className={item.color} />
                  <span className="text-xs text-gray-400">{item.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatMetric(stats[item.key])}</p>
              </Link>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
          <span>{stats.totalProjects ?? 0} total projects</span>
          <span>{stats.pendingTasks ?? 0} pending tasks</span>
          <span>{stats.totalTasks ?? 0} total tasks</span>
          <Link to="/projects" className="text-myth-accent hover:underline inline-flex items-center gap-1">
            View all projects <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Row 3 — Team snapshot + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers size={18} className="text-myth-accent" /> Team Snapshot
            </h3>
            <Link to="/teams/technical/overview" className="text-sm text-myth-accent hover:underline">All teams →</Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {TEAM_METRICS.map((metric) => {
              const Icon = metric.icon;
              return (
                <Link
                  key={metric.key}
                  to={metric.link}
                  className="p-3 rounded-lg bg-myth-surface/50 border border-myth-border hover:border-myth-accent/30 transition-colors text-center"
                >
                  <Icon size={16} className="text-myth-accent mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{formatMetric(stats[metric.key], metric.format)}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{metric.label}</p>
                </Link>
              );
            })}
          </div>

          {deptInfo?.teams?.length > 0 ? (
            <div className="space-y-2">
              {deptInfo.teams.map((t) => (
                <div
                  key={t.code}
                  className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-myth-surface/30 border border-myth-border/50"
                >
                  <div>
                    <span className="text-myth-accent font-mono text-xs">{t.code}</span>
                    <span className="text-white ml-2">{t.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {t.memberCount ?? 0} members
                    {t.teamLeader ? ` · Lead: ${t.teamLeader.name}` : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">
              No teams yet.{' '}
              <Link to="/teams/technical/manage" className="text-myth-accent hover:underline">Create your first team</Link>
              {' '}from admin-assigned project members.
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus size={18} className="text-myth-accent" /> Quick Actions
          </h3>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    action.primary
                      ? 'bg-myth-accent/10 border-myth-accent/40 text-white hover:bg-myth-accent/20'
                      : 'bg-myth-surface/50 border-myth-border text-gray-300 hover:border-myth-accent/30'
                  }`}
                >
                  <Icon size={18} className={action.primary ? 'text-myth-accent' : 'text-gray-400'} />
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-myth-border">
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2 flex items-center gap-1">
              <LayoutGrid size={12} /> Tasks & Delivery
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {DELIVERY_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-xs text-myth-accent hover:underline py-1.5 px-2 rounded hover:bg-myth-surface/50"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {followupOverview && (
        <FollowUpSummaryPanel overview={followupOverview} variant="technical" />
      )}

      {/* Compact workflow */}
      <div className="card">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Delivery Workflow</h3>
        <div className="flex flex-wrap items-center gap-1">
          {TECH_MANAGER_WORKFLOW.slice(0, 8).map((step, i, arr) => (
            <div key={step} className="flex items-center gap-1">
              <span className="text-xs text-gray-300 px-2 py-1 rounded bg-myth-surface/50 border border-myth-border">
                {step}
              </span>
              {i < arr.length - 1 && <span className="text-gray-600 text-xs">→</span>}
            </div>
          ))}
          <span className="text-gray-600 text-xs mx-1">→</span>
          <span className="text-xs text-gray-400">Deploy → Submit</span>
        </div>
      </div>

      {/* Team members table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users size={18} className="text-myth-accent" /> Team Members
          </h3>
          <Link to="/teams/technical/members" className="text-sm text-myth-accent hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">ID</th>
                <th className="table-header">Role</th>
                <th className="table-header">Team</th>
                <th className="table-header">Email</th>
              </tr>
            </thead>
            <tbody>
              {recentEmployees.length ? recentEmployees.slice(0, 8).map((e) => (
                <tr key={e._id} className="border-t border-myth-border/50">
                  <td className="table-cell text-white">{e.firstName} {e.lastName}</td>
                  <td className="table-cell font-mono text-myth-accent text-xs">{e.employeeId || '—'}</td>
                  <td className="table-cell">
                    <span className="badge text-xs capitalize bg-cyan-500/20 text-cyan-300">{e.role}</span>
                  </td>
                  <td className="table-cell text-gray-300">{e.staffRole?.name || '—'}</td>
                  <td className="table-cell text-gray-500 text-xs">{e.email}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-gray-500 py-8">
                    No team members yet. Admin must assign engineers to your projects first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
