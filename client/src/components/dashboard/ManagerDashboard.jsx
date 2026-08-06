import { Link } from 'react-router-dom';
import {
  Users, Building2, Crown, ArrowRight, LayoutDashboard, TrendingUp, Target, Phone, Calendar, UserPlus, Handshake, CheckCircle2,
} from 'lucide-react';
import { MANAGER_RESPONSIBILITIES } from '../../constants/permissions';
import { MANAGER_QUICK_LINKS } from '../../constants/dashboardConfig';
import { DEPARTMENT_LABELS } from '../../utils/roleContext';
import { formatCurrency } from '../../services/api';
import LeadDealFollowUpGuide from './LeadDealFollowUpGuide';
import FollowUpSummaryPanel from './FollowUpSummaryPanel';
import SalesManagerLeadsDealsPanel from './SalesManagerLeadsDealsPanel';

const DEPT_COLORS = {
  sales: 'border-blue-500/40 bg-blue-500/10',
  technical: 'border-cyan-500/40 bg-cyan-500/10',
  support: 'border-green-500/40 bg-green-500/10',
};

const ROLE_BADGE = {
  manager: 'bg-purple-500/20 text-purple-300',
  sales: 'bg-blue-500/20 text-blue-300',
  technical: 'bg-cyan-500/20 text-cyan-300',
  support: 'bg-green-500/20 text-green-300',
};

const MANAGER_TITLES = {
  sales: 'Sales Manager Control Center',
  technical: 'Technical Manager Control Center',
  support: 'Support Manager Control Center',
};

export default function ManagerDashboard({ departmentOverview, salesOverview, roleStats }) {
  if (!departmentOverview) return null;

  const department = departmentOverview.departmentKey || 'sales';
  const deptLabel = DEPARTMENT_LABELS[department] || department;
  const { deptInfo, recentEmployees = [], followupOverview } = departmentOverview;
  const quickLinks = MANAGER_QUICK_LINKS[department] || MANAGER_QUICK_LINKS.sales;

  const SALES_MANAGER_PIPELINE_STAGES = [
    { label: 'Team Leads', path: '/leads', statKey: 'teamLeads', accent: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/30' },
    { label: 'Active Deals', path: '/deals', statKey: 'activeDeals', accent: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/30' },
    { label: 'Won Deals', path: '/deals?stage=won', statKey: 'monthlySales', accent: 'from-green-500/10 to-green-500/5', border: 'border-green-500/30' },
  ];

  const SALES_MANAGER_KPI_CARDS = [
    { label: 'Team Leads', key: 'teamLeads', path: '/leads', icon: Users, color: 'text-blue-400' },
    { label: 'Active Deals', key: 'activeDeals', path: '/deals', icon: Handshake, color: 'text-purple-400' },
    { label: 'Won Deals', key: 'monthlySales', path: '/deals?stage=won', icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Revenue', key: 'totalRevenue', path: '/deals', icon: TrendingUp, color: 'text-emerald-400', format: 'currency' },
    { label: 'Projects', key: 'totalProjects', path: '/projects', icon: Building2, color: 'text-cyan-400' },
    { label: 'Pending Tasks', key: 'pendingTasks', path: '/tasks', icon: Target, color: 'text-amber-400' },
    { label: 'Team Members', key: 'teamMembers', path: `/teams/${department}/members`, icon: UserPlus, color: 'text-orange-400' },
    { label: 'Present Today', key: 'presentToday', path: `/teams/${department}/members`, icon: CheckCircle2, color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Hero + pipeline */}
      <div className="card border-purple-500/20 overflow-hidden">
        <div className="relative p-4 sm:p-5 lg:p-6 border-b border-myth-border/60 bg-gradient-to-br from-purple-500/10 via-myth-accent/5 to-blue-500/5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
                <Crown size={18} lg:size={22} className="text-purple-400" /> {MANAGER_TITLES[department]}
              </h2>
              <p className="text-xs lg:text-sm text-gray-400 mt-1 max-w-xl">
                Lead your {deptLabel} team, monitor performance, and drive results
              </p>
              <p className="text-[10px] lg:text-xs text-gray-500 mt-2">
                {departmentOverview.totalEmployees ?? recentEmployees.length} team members · {deptLabel} department
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/teams/${department}/members`} className="btn-primary text-xs lg:text-sm inline-flex items-center gap-1">
                <Users size={12} lg:size={14} /> Team Members
              </Link>
              {department === 'sales' && (
                <>
                  <Link to="/leads/create" className="btn-secondary text-xs lg:text-sm inline-flex items-center gap-1">
                    <UserPlus size={12} lg:size={14} /> Add Lead
                  </Link>
                  <Link to="/leads/assign" className="btn-secondary text-xs lg:text-sm inline-flex items-center gap-1">
                    <Handshake size={12} lg:size={14} /> Assign Leads
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {department === 'sales' && (
          <div className="p-4 sm:p-5 lg:p-6">
            <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Sales Pipeline</p>
            <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0">
              {SALES_MANAGER_PIPELINE_STAGES.map((stage, i) => (
                <div key={stage.label} className="flex sm:flex-1 items-center gap-2 sm:gap-0">
                  <Link
                    to={stage.path}
                    className={`flex-1 rounded-xl border p-2 lg:p-4 bg-gradient-to-br ${stage.accent} ${stage.border} hover:border-purple-500/40 transition-all group`}
                  >
                    <p className="text-[10px] lg:text-xs text-gray-400">{stage.label}</p>
                    <p className="text-xl lg:text-2xl font-bold text-white mt-1 group-hover:text-purple-300 transition-colors">
                      {roleStats?.[stage.statKey] ?? 0}
                    </p>
                  </Link>
                  {i < SALES_MANAGER_PIPELINE_STAGES.length - 1 && (
                    <ArrowRight size={14} lg:size={16} className="text-gray-600 shrink-0 hidden sm:block mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI strip */}
      {department === 'sales' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-3">
          {SALES_MANAGER_KPI_CARDS.map((card) => {
            const Icon = card.icon;
            const value = card.format === 'currency' 
              ? formatCurrency(roleStats?.[card.key] ?? 0)
              : roleStats?.[card.key] ?? 0;
            return (
              <Link
                key={card.label}
                to={card.path}
                className="stat-card hover:border-purple-500/30 p-2 lg:p-3 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] lg:text-[11px] text-gray-400 truncate">{card.label}</p>
                    <p className="text-base lg:text-lg font-bold text-white mt-1">{value}</p>
                  </div>
                  <div className={`p-1 lg:p-1.5 rounded-lg bg-myth-surface ${card.color} shrink-0`}>
                    <Icon size={12} lg:size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="card border-myth-accent/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-5">
          <div>
            <h2 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Building2 size={16} lg:size={20} className="text-myth-accent" /> Department Overview
            </h2>
            <p className="text-xs lg:text-sm text-gray-400 mt-1">
              {departmentOverview.totalEmployees ?? recentEmployees.length} team members · {deptLabel} department
            </p>
          </div>
          <Link to={`/teams/${department}/members`} className="btn-primary text-xs lg:text-sm inline-flex items-center gap-1">
            <Users size={12} lg:size={14} /> Team Members
          </Link>
        </div>

        {deptInfo && (
          <div className={`rounded-xl border p-3 lg:p-4 ${DEPT_COLORS[department] || 'border-myth-border bg-myth-surface/30'}`}>
            <p className="text-white font-semibold flex items-center gap-2 text-sm lg:text-base">
              <Building2 size={14} lg:size={16} /> {deptInfo.label} Department
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {deptInfo.staffCount} staff · {deptInfo.teamCount} team{deptInfo.teamCount === 1 ? '' : 's'}
            </p>
            <div className="mt-3 space-y-1">
              {deptInfo.teams?.map((t) => (
                <div key={t.code} className="text-xs flex justify-between text-gray-400">
                  <span className="text-myth-accent font-mono">{t.code}</span>
                  <span>{t.memberCount} members{t.teamLeader ? ` · Lead: ${t.teamLeader.name}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {department === 'sales' && <LeadDealFollowUpGuide variant="manager" />}

      <div className="card">
        <h3 className="text-base lg:text-lg font-semibold text-white mb-3">Manager Responsibilities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {MANAGER_RESPONSIBILITIES.map((item) => (
            <div key={item} className="text-xs lg:text-sm text-gray-300 p-2 rounded-lg bg-myth-surface/50">• {item}</div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="p-2 lg:p-2.5 rounded-lg bg-myth-surface/50 hover:bg-myth-surface border border-myth-border text-[10px] lg:text-xs text-center text-myth-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {department === 'sales' && (
            <>
              <Link to="/leads/assign" className="p-2 lg:p-2.5 rounded-lg bg-myth-accent/15 border border-myth-accent/30 text-[10px] lg:text-xs text-center text-myth-accent">
                Assign Leads to Sales
              </Link>
              <Link to="/leads" className="p-2 lg:p-2.5 rounded-lg bg-myth-surface/50 border border-myth-border text-[10px] lg:text-xs text-center text-gray-300">
                Monitor Pipeline
              </Link>
            </>
          )}
        </div>
      </div>

      {department === 'sales' && <FollowUpSummaryPanel overview={followupOverview} />}

      {department === 'sales' && salesOverview && (
        <SalesManagerLeadsDealsPanel
          recentLeads={salesOverview.recentLeads}
          activeDeals={salesOverview.activeDeals}
        />
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users size={18} className="text-myth-accent" /> Department Team
          </h3>
          <Link to={`/teams/${department}/members`} className="text-sm text-myth-accent hover:underline">Manage →</Link>
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
              {recentEmployees.length ? recentEmployees.map((e) => (
                <tr key={e._id} className="border-t border-myth-border/50">
                  <td className="table-cell text-white">{e.firstName} {e.lastName}</td>
                  <td className="table-cell font-mono text-myth-accent text-xs">{e.employeeId || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge text-xs capitalize ${ROLE_BADGE[e.role] || ''}`}>{e.role}</span>
                  </td>
                  <td className="table-cell text-gray-300">{e.staffRole?.name || '—'}</td>
                  <td className="table-cell text-gray-500 text-xs">{e.email}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="table-cell text-center text-gray-500 py-8">No team members yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
