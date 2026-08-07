import { Link } from 'react-router-dom';
import {
  Users, UserCog, Building2, UserPlus, Handshake, FolderKanban, Headphones,
  Settings, Shield, ArrowRight, LayoutDashboard, Truck, Ticket, FileEdit,
  AlertTriangle, Send, UserCheck, Radio, History,
} from 'lucide-react';
import { ADMIN_RESPONSIBILITIES } from '../../constants/permissions';
import { formatCurrency } from '../../services/api';
import CrmWorkflowGuide from './CrmWorkflowGuide';
import LeadDealFollowUpGuide from './LeadDealFollowUpGuide';
import FollowUpSummaryPanel from './FollowUpSummaryPanel';
import AdminDashboardCharts from './AdminDashboardCharts';
import {
  ADMIN_PIPELINE_STAGES,
  ADMIN_KPI_CARDS,
  ADMIN_QUICK_LINKS,
  ADMIN_DASHBOARD_PANELS,
  ADMIN_SUPPORT_STAT_CARDS,
  DEPT_MODULE_LINKS,
} from '../../constants/dashboardConfig';

const DEPT_COLORS = {
  sales: 'border-blue-500/40 bg-blue-500/10',
  technical: 'border-cyan-500/40 bg-cyan-500/10',
  support: 'border-orange-500/40 bg-orange-500/10',
};

const DEPT_PANEL_COLORS = {
  sales: 'border-blue-500/25 bg-blue-500/5',
  technical: 'border-cyan-500/25 bg-cyan-500/5',
  support: 'border-orange-500/25 bg-orange-500/5',
  customer: 'border-amber-500/25 bg-amber-500/5',
  all: 'border-myth-accent/30 bg-myth-accent/5',
};

const ROLE_BADGE = {
  manager: 'bg-purple-500/20 text-purple-300',
  sales: 'bg-blue-500/20 text-blue-300',
  technical: 'bg-cyan-500/20 text-cyan-300',
  support: 'bg-green-500/20 text-green-300',
};

const SUPPORT_STAT_ICONS = {
  totalProjectsReceived: Send,
  projectsAwaitingDelivery: Truck,
  pendingCustomerAcceptance: UserCheck,
  inSupport: Radio,
  unassignedTickets: Ticket,
  escalations: AlertTriangle,
  pendingChangeRequests: FileEdit,
};

function formatKpiValue(card, stats, roleStats) {
  const source = card.roleKey ? roleStats : stats;
  const val = source?.[card.key] ?? stats?.[card.key] ?? 0;
  if (card.format === 'currency') return formatCurrency(val);
  if (card.format === 'percent') return `${val}%`;
  return val;
}

export default function AdminMainDashboard({ adminOverview, roleStats, stats, onAddEmployee }) {
  if (!adminOverview) {
    return (
      <div className="card border-amber-500/20 bg-amber-500/5 text-sm text-gray-400">
        Organization overview could not be loaded. Refresh the page or check that the server is running.
      </div>
    );
  }

  const { employeesByRole, departments } = adminOverview;
  const supportOverview = adminOverview.supportOverview || {};
  const recentEmployees = (adminOverview.recentEmployees || []).slice(0, 12);

  const orgStatCards = [
    { label: 'Employees', value: adminOverview.totalEmployees, icon: Users, link: '/users', color: 'text-blue-400' },
    { label: 'Managers', value: employeesByRole.manager, icon: UserCog, link: '/users', color: 'text-purple-400' },
    { label: 'Sales Staff', value: employeesByRole.sales, icon: UserPlus, link: '/teams/sales/members', color: 'text-blue-300' },
    { label: 'Technical', value: employeesByRole.technical, icon: FolderKanban, link: '/teams/technical/members', color: 'text-cyan-400' },
    { label: 'Support', value: employeesByRole.support, icon: Headphones, link: '/teams/support/members', color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Charts Section */}
      <AdminDashboardCharts stats={stats} adminOverview={adminOverview} />

      {/* Hero + pipeline */}
      <div className="card border-orange-500/20 overflow-hidden">
        <div className="relative p-4 sm:p-5 lg:p-6 border-b border-myth-border/60 bg-gradient-to-br from-orange-500/10 via-myth-accent/5 to-purple-500/5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
                <Shield size={18} lg:size={22} className="text-orange-400" /> Admin Control Center
              </h2>
              <p className="text-xs lg:text-sm text-gray-400 mt-1 max-w-xl">
                Oversee the full CRM — organization, sales pipeline, project delivery, and support operations
              </p>
              <p className="text-[10px] lg:text-xs text-gray-500 mt-2">
                {adminOverview.totalEmployees} employees · {employeesByRole.manager} managers · {departments.length} departments
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {onAddEmployee && (
                <button type="button" onClick={onAddEmployee} className="btn-primary text-xs lg:text-sm inline-flex items-center gap-1">
                  <UserPlus size={12} lg:size={14} /> Add Employee
                </button>
              )}
              <Link to="/settings?tab=company" className="btn-secondary text-xs lg:text-sm inline-flex items-center gap-1">
                <Settings size={12} lg:size={14} /> Setup CRM
              </Link>
              <Link to="/settings?tab=hired-staff" className="btn-secondary text-xs lg:text-sm inline-flex items-center gap-1">
                <Users size={12} lg:size={14} /> Hired Staff
              </Link>
              <Link to="/permissions" className="btn-secondary text-xs lg:text-sm inline-flex items-center gap-1">
                <Shield size={12} lg:size={14} /> Permissions
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6">
          <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">CRM Pipeline</p>
          <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0">
            {ADMIN_PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.label} className="flex sm:flex-1 items-center gap-2 sm:gap-0">
                <Link
                  to={stage.path}
                  className={`flex-1 rounded-xl border p-2 lg:p-4 bg-gradient-to-br ${stage.accent} ${stage.border} hover:border-orange-500/40 transition-all group`}
                >
                  <p className="text-[10px] lg:text-xs text-gray-400">{stage.label}</p>
                  <p className="text-xl lg:text-2xl font-bold text-white mt-1 group-hover:text-orange-300 transition-colors">
                    {stats?.[stage.statKey] ?? 0}
                  </p>
                </Link>
                {i < ADMIN_PIPELINE_STAGES.length - 1 && (
                  <ArrowRight size={14} lg:size={16} className="text-gray-600 shrink-0 hidden sm:block mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-3">
        {ADMIN_KPI_CARDS.map((card) => (
          <Link
            key={card.label}
            to={card.path}
            className="stat-card hover:border-orange-500/30 p-2 lg:p-3 transition-all"
          >
            <p className="text-[10px] lg:text-[11px] text-gray-400 truncate">{card.label}</p>
            <p className="text-base lg:text-lg font-bold text-white mt-1">{formatKpiValue(card, stats, roleStats)}</p>
          </Link>
        ))}
      </div>

      {/* Support operations */}
      {adminOverview.supportOverview && (
        <div className="card border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                <Headphones size={14} lg:size={18} className="text-orange-400" /> Support Operations
              </h3>
              <p className="text-[10px] lg:text-xs text-gray-500 mt-1">Project delivery, tickets, and change requests across the support team</p>
            </div>
            <Link to="/support/project-delivery" className="text-xs lg:text-sm text-myth-accent hover:underline shrink-0">
              Open delivery hub →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 lg:gap-3">
            {ADMIN_SUPPORT_STAT_CARDS.map((card) => {
              const Icon = SUPPORT_STAT_ICONS[card.key] || Ticket;
              const value = supportOverview[card.key] ?? 0;
              const highlight = value > 0 && ['projectsAwaitingDelivery', 'pendingCustomerAcceptance', 'unassignedTickets', 'escalations'].includes(card.key);
              return (
                <Link
                  key={card.key}
                  to={card.path}
                  className={`p-2 lg:p-3 rounded-xl border transition-colors hover:border-orange-500/40 ${
                    highlight ? 'border-orange-500/30 bg-orange-500/5' : 'border-myth-border bg-myth-surface/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[10px] lg:text-xs text-gray-500 truncate">{card.label}</p>
                    <Icon size={12} lg:size={14} className={`shrink-0 ${card.color}`} />
                  </div>
                  <p className={`text-xl lg:text-2xl font-bold ${card.color}`}>{value}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Org headcount */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3">
        {orgStatCards.map((card) => (
          <Link key={card.label} to={card.link} className="stat-card hover:border-orange-500/30 p-2 lg:p-4 transition-all group">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] lg:text-xs text-gray-400 truncate">{card.label}</p>
                <p className="text-lg lg:text-xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-1.5 lg:p-2 rounded-lg bg-myth-surface ${card.color} shrink-0 group-hover:scale-105 transition-transform`}>
                <card.icon size={14} lg:size={18} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Follow-ups — sales + support */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FollowUpSummaryPanel
          overview={adminOverview.followupOverview}
          variant="sales"
          title="Sales Follow-ups"
        />
        {adminOverview.supportFollowupOverview && (
          <FollowUpSummaryPanel
            overview={adminOverview.supportFollowupOverview}
            variant="supportAdmin"
            title="Support Follow-ups"
          />
        )}
      </div>

      {/* 8 dashboard oversight */}
      <div className="card border border-myth-border/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
            <LayoutDashboard size={14} lg:size={18} className="text-orange-400" /> Dashboard Overview
          </h3>
          <span className="text-[10px] lg:text-xs text-gray-500">8 role dashboards in MYTHISOFT CRM</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
          {ADMIN_DASHBOARD_PANELS.map((panel, i) => (
            <Link
              key={panel.label}
              to={panel.path}
              className={`rounded-xl border p-2 lg:p-3 hover:border-orange-500/40 transition-all ${DEPT_PANEL_COLORS[panel.dept] || 'border-myth-border bg-myth-surface/30'}`}
            >
              <p className="text-[10px] lg:text-xs text-gray-500 font-mono">#{i + 1}</p>
              <p className="text-xs lg:text-sm font-semibold text-white mt-0.5">{panel.label}</p>
              <p className="text-[10px] lg:text-xs text-gray-400 mt-1 line-clamp-2">{panel.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {departments.map((dept) => (
          <div key={dept.key} className={`card ${DEPT_COLORS[dept.key] || 'border-myth-border bg-myth-surface/30'}`}>
            <p className="text-white font-semibold flex items-center gap-2 text-sm lg:text-base">
              <Building2 size={14} lg:size={16} /> {dept.label} Department
            </p>
            {dept.manager ? (
              <p className="text-xs lg:text-sm text-gray-300 mt-2">
                Manager: <span className="text-white">{dept.manager.name}</span>
                <span className="text-gray-500 text-[10px] lg:text-xs block">{dept.manager.email}</span>
              </p>
            ) : (
              <p className="text-xs lg:text-sm text-amber-400 mt-2">No manager assigned</p>
            )}
            <p className="text-[10px] lg:text-xs text-gray-400 mt-2">{dept.staffCount} staff · {dept.teamCount} team{dept.teamCount === 1 ? '' : 's'}</p>
            <div className="mt-3 space-y-1 mb-4">
              {dept.teams.map((t) => (
                <div key={t.code} className="text-xs flex justify-between text-gray-400">
                  <span className="text-myth-accent font-mono">{t.code}</span>
                  <span>{t.memberCount} members{t.teamLeader ? ` · Lead: ${t.teamLeader.name}` : ''}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(DEPT_MODULE_LINKS[dept.key] || []).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="p-2 rounded-lg bg-myth-surface/60 hover:bg-myth-surface border border-myth-border/50 text-[10px] lg:text-xs text-center text-myth-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Responsibilities + quick links */}
      <div className="card border border-myth-border/80">
        <h3 className="text-base lg:text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Shield size={14} lg:size={18} className="text-orange-400" /> Admin Responsibilities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {ADMIN_RESPONSIBILITIES.map((item) => (
            <div key={item} className="text-xs lg:text-sm text-gray-300 p-2 rounded-lg bg-myth-surface/50">• {item}</div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ADMIN_QUICK_LINKS.map((item) => (
            <Link
              key={item.path + item.label}
              to={item.path}
              className="p-2 lg:p-2.5 rounded-lg bg-myth-surface/50 hover:bg-myth-surface border border-myth-border text-[10px] lg:text-xs text-center text-myth-accent hover:border-orange-500/30 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Employees */}
      <div className="card border border-myth-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
            <Users size={14} lg:size={18} className="text-orange-400" /> Employees
            <span className="text-[10px] lg:text-xs text-gray-500 font-normal">(showing {recentEmployees.length} of {adminOverview.totalEmployees})</span>
          </h3>
          <div className="flex items-center gap-3">
            <Link to="/support-logs" className="text-xs lg:text-sm text-gray-400 hover:text-myth-accent inline-flex items-center gap-1">
              <History size={12} lg:size={14} /> Ticket History
            </Link>
            <Link to="/users" className="text-xs lg:text-sm text-myth-accent hover:underline">Manage all →</Link>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-myth-card z-10">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">ID</th>
                <th className="table-header">Role</th>
                <th className="table-header">Team</th>
                <th className="table-header">Reports To</th>
                <th className="table-header">Email</th>
              </tr>
            </thead>
            <tbody>
              {recentEmployees.length ? recentEmployees.map((e) => (
                <tr key={e._id} className="border-t border-myth-border/50 hover:bg-myth-surface/30 transition-colors">
                  <td className="table-cell text-white">{e.firstName} {e.lastName}</td>
                  <td className="table-cell font-mono text-myth-accent text-xs">{e.employeeId || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge text-xs capitalize ${ROLE_BADGE[e.role] || ''}`}>{e.role}</span>
                  </td>
                  <td className="table-cell text-gray-300">{e.staffRole?.name || '—'}</td>
                  <td className="table-cell text-gray-400">
                    {e.reportsTo ? `${e.reportsTo.firstName} ${e.reportsTo.lastName}` : '—'}
                  </td>
                  <td className="table-cell text-gray-500 text-xs">{e.email}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="table-cell text-center text-gray-500 py-8">No employees yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
