import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, UserPlus, Handshake, Calendar, TrendingUp, Target, Users, ArrowRight, LayoutDashboard, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  followupsAPI,
  formatDateTime,
  formatCurrency,
  LEAD_STATUSES,
  DEAL_STAGES,
  leadsAPI,
  dealsAPI,
  usersAPI,
} from '../../services/api';
import { SALES_QUICK_LINKS } from '../../constants/dashboardConfig';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';
import {
  ASSIGN_DROPDOWN_COPY,
  enrichAssignedRecord,
  formatAssigneeName,
  getAssignManagerFieldLabel,
  getAssignManagerSelectValue,
} from '../../constants/adminLeadViews';
import SalesOverview from './SalesOverview';
import LeadDealFollowUpGuide from './LeadDealFollowUpGuide';
import FollowUpSummaryPanel from './FollowUpSummaryPanel';
import StatusBadge from '../StatusBadge';
import SalespersonDashboardCharts from './SalespersonDashboardCharts';

export default function SalesMainDashboard({ salesOverview, roleStats }) {
  const [followups, setFollowups] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [managers, setManagers] = useState([]);
  const [assigningLeadId, setAssigningLeadId] = useState(null);
  const [assigningDealId, setAssigningDealId] = useState(null);

  useEffect(() => {
    setFollowups(salesOverview?.upcomingFollowups || []);
  }, [salesOverview?.upcomingFollowups]);

  useEffect(() => {
    setLeads(salesOverview?.recentLeads || []);
    setDeals(salesOverview?.activeDeals || []);
  }, [salesOverview?.recentLeads, salesOverview?.activeDeals]);

  useEffect(() => {
    usersAPI.getManagers()
      .then(({ data }) => {
        const allManagers = Array.isArray(data) ? data : [];
        const salesManagers = allManagers.filter((m) => {
          const teamGroup = m.staffRole?.teamGroup || m.teamGroup;
          const staffRoleName = m.staffRole?.name?.toLowerCase() || '';
          return teamGroup === 'sales' || staffRoleName.includes('sales');
        });
        setManagers(salesManagers);
      })
      .catch(() => setManagers([]));
  }, []);

  const assignLeadToManager = async (lead, managerId) => {
    if (!managerId) return;
    setAssigningLeadId(lead._id);
    try {
      const { data } = await leadsAPI.update(lead._id, { assignedManager: managerId });
      const merged = enrichAssignedRecord(data, { managers });
      setLeads((prev) => prev.map((l) => (l._id === lead._id ? { ...l, ...merged } : l)));
      toast.success('Lead assigned to sales manager');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign manager');
    } finally {
      setAssigningLeadId(null);
    }
  };

  const assignDealToManager = async (deal, managerId) => {
    if (!managerId) return;
    setAssigningDealId(deal._id);
    try {
      const { data } = await dealsAPI.update(deal._id, { assignedManager: managerId });
      const merged = enrichAssignedRecord(data, { managers });
      setDeals((prev) => prev.map((d) => (d._id === deal._id ? { ...d, ...merged } : d)));
      toast.success('Deal assigned to sales manager');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign manager');
    } finally {
      setAssigningDealId(null);
    }
  };

  if (!salesOverview) {
    return (
      <div className="card text-center py-12 text-gray-500">
        Loading sales workspace…
      </div>
    );
  }

  const { activeDeals = [], todayMeetings = [], followupOverview } = salesOverview;

  const SALES_PIPELINE_STAGES = [
    { label: 'My Leads', path: '/leads', statKey: 'myLeads', accent: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/30' },
    { label: 'Active Deals', path: '/deals', statKey: 'activeDeals', accent: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/30' },
    { label: 'Won Deals', path: '/deals?stage=won', statKey: 'wonDeals', accent: 'from-green-500/10 to-green-500/5', border: 'border-green-500/30' },
  ];

  const SALES_KPI_CARDS = [
    { label: 'My Leads', key: 'myLeads', path: '/leads', icon: Users, color: 'text-blue-400' },
    { label: 'New Leads', key: 'newLeads', path: '/leads?status=new', icon: UserPlus, color: 'text-cyan-400' },
    { label: 'Active Deals', key: 'activeDeals', path: '/deals', icon: Handshake, color: 'text-purple-400' },
    { label: 'Won Deals', key: 'wonDeals', path: '/deals?stage=won', icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Revenue', key: 'revenue', path: '/deals', icon: TrendingUp, color: 'text-emerald-400', format: 'currency' },
    { label: 'Target', key: 'salesTargetProgress', path: '/deals', icon: Target, color: 'text-amber-400', format: 'percent' },
    { label: 'Calls Today', key: 'todaysCalls', path: '/leads', icon: Phone, color: 'text-orange-400' },
    { label: 'Meetings', key: 'todayMeetings', path: '/calendar', icon: Calendar, color: 'text-violet-400' },
  ];

  const completeFollowup = async (id) => {
    try {
      await followupsAPI.complete(id, {});
      setFollowups((prev) => prev.filter((f) => f._id !== id));
      toast.success('Follow-up marked complete');
    } catch {
      toast.error('Failed to complete follow-up');
    }
  };

  return (
    <div className="space-y-4">
      {/* Charts Section */}
      <SalespersonDashboardCharts roleStats={roleStats} />

      {/* Hero + pipeline */}
      <div className="card border-blue-500/20 overflow-hidden">
        <div className="relative p-5 sm:p-6 border-b border-myth-border/60 bg-gradient-to-br from-blue-500/10 via-myth-accent/5 to-purple-500/5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <LayoutDashboard size={22} className="text-blue-400" /> Sales Workspace
              </h2>
              <p className="text-sm text-gray-400 mt-1 max-w-xl">
                Manage your leads, track deals, and drive revenue — all in one place
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {roleStats?.myLeads || 0} leads · {roleStats?.activeDeals || 0} active deals · {roleStats?.revenue ? formatCurrency(roleStats.revenue) : '₹0'} revenue
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/leads/create" className="btn-primary text-sm inline-flex items-center gap-1">
                <Plus size={14} /> Add Lead
              </Link>
              <Link to="/deals/create" className="btn-secondary text-sm inline-flex items-center gap-1">
                <Handshake size={14} /> New Deal
              </Link>
              <Link to="/calendar" className="btn-secondary text-sm inline-flex items-center gap-1">
                <Calendar size={14} /> Calendar
              </Link>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Sales Pipeline</p>
          <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0">
            {SALES_PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.label} className="flex sm:flex-1 items-center gap-2 sm:gap-0">
                <Link
                  to={stage.path}
                  className={`flex-1 rounded-xl border p-4 bg-gradient-to-br ${stage.accent} ${stage.border} hover:border-blue-500/40 transition-all group`}
                >
                  <p className="text-xs text-gray-400">{stage.label}</p>
                  <p className="text-2xl font-bold text-white mt-1 group-hover:text-blue-300 transition-colors">
                    {roleStats?.[stage.statKey] ?? 0}
                  </p>
                </Link>
                {i < SALES_PIPELINE_STAGES.length - 1 && (
                  <ArrowRight size={16} className="text-gray-600 shrink-0 hidden sm:block mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-3">
        {SALES_KPI_CARDS.map((card) => {
          const Icon = card.icon;
          const value = card.format === 'currency' 
            ? formatCurrency(roleStats?.[card.key] ?? 0)
            : card.format === 'percent'
            ? `${roleStats?.[card.key] ?? 0}%`
            : roleStats?.[card.key] ?? 0;
          return (
            <Link
              key={card.label}
              to={card.path}
              className="stat-card hover:border-blue-500/30 p-2 lg:p-3 transition-all"
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

      <SalesOverview roleStats={roleStats} />

      <LeadDealFollowUpGuide variant="sales" />

      <FollowUpSummaryPanel overview={followupOverview} variant="salesRep" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <UserPlus size={16} lg:size={18} className="text-blue-400" /> My Leads
            </h3>
            <Link to="/leads" className="text-sm text-myth-accent hover:underline">View all</Link>
          </div>
          {leads.length === 0 ? (
            <p className="text-sm text-gray-500">No leads assigned yet. Check unsigned leads or ask your manager.</p>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => {
                const managerName = formatAssigneeName(lead.assignedManager);
                const managerValue = getAssignManagerSelectValue(lead);
                return (
                  <div
                    key={lead._id}
                    className="p-3 rounded-lg border border-myth-border bg-myth-surface/20"
                  >
                    <div className="flex items-start justify-between gap-2 lg:gap-3">
                      <Link to={`/leads/${lead._id}`} className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm lg:text-base">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{lead.company || lead.email}</p>
                      </Link>
                      <StatusBadge status={lead.status} config={LEAD_STATUSES} />
                    </div>
                    <div className="mt-2 pt-2 border-t border-myth-border/40">
                      {managerValue ? (
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] text-gray-500 mb-0.5">
                            Assigned Manager
                          </label>
                          <span className="text-xs text-emerald-400 truncate ml-2">{managerName}</span>
                        </div>
                      ) : (
                        <>
                          <label className="block text-[10px] text-gray-500 mb-0.5">
                            Assign Manager
                          </label>
                          <select
                            className="w-full text-xs px-2 py-1.5 rounded border border-myth-border bg-myth-surface/80 text-gray-300"
                            value={managerValue}
                            onChange={(e) => assignLeadToManager(lead, e.target.value)}
                            disabled={assigningLeadId === lead._id || managers.length === 0}
                          >
                            <option value="">Select manager</option>
                            {managers.map((m) => (
                              <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
                            ))}
                          </select>
                          {managers.length === 0 && (
                            <p className="text-[10px] text-amber-400/90 mt-1">No sales managers available.</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Handshake size={16} lg:size={18} className="text-purple-400" /> Active Deals
            </h3>
            <Link to="/deals" className="text-sm text-myth-accent hover:underline">View pipeline</Link>
          </div>
          {deals.length === 0 ? (
            <p className="text-sm text-gray-500">No active deals. Convert a qualified lead to start a deal.</p>
          ) : (
            <div className="space-y-2">
              {deals.map((deal) => {
                const managerName = formatAssigneeName(deal.assignedManager);
                const managerValue = getAssignManagerSelectValue(deal);
                return (
                  <div
                    key={deal._id}
                    className="p-3 rounded-lg border border-myth-border bg-myth-surface/20"
                  >
                    <div className="flex items-start justify-between gap-2 lg:gap-3">
                      <Link to={`/deals/${deal._id}`} className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm lg:text-base">{deal.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {deal.customer
                            ? `${deal.customer.firstName} ${deal.customer.lastName}${deal.customer.companyName ? ` · ${deal.customer.companyName}` : ''}`
                            : 'No customer'}
                          {deal.value ? ` · ${formatCurrency(deal.value)}` : ''}
                        </p>
                      </Link>
                      <StatusBadge status={deal.stage} config={DEAL_STAGES} />
                    </div>
                    <div className="mt-2 pt-2 border-t border-myth-border/40">
                      {managerValue ? (
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] text-gray-500 mb-0.5">
                            Assigned Manager
                          </label>
                          <span className="text-xs text-emerald-400 truncate ml-2">{managerName}</span>
                        </div>
                      ) : (
                        <>
                          <label className="block text-[10px] text-gray-500 mb-0.5">
                            Assign Manager
                          </label>
                          <select
                            className="w-full text-xs px-2 py-1.5 rounded border border-myth-border bg-myth-surface/80 text-gray-300"
                            value={managerValue}
                            onChange={(e) => assignDealToManager(deal, e.target.value)}
                            disabled={assigningDealId === deal._id || managers.length === 0}
                          >
                            <option value="">Select manager</option>
                            {managers.map((m) => (
                              <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
                            ))}
                          </select>
                          {managers.length === 0 && (
                            <p className="text-[10px] text-amber-400/90 mt-1">No sales managers available.</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Calendar size={16} lg:size={18} className="text-myth-accent" /> Upcoming Follow-ups
            </h3>
            <div className="flex gap-3 text-sm">
              <Link to={FOLLOW_UP_PATHS.all.today} className="text-myth-accent hover:underline">Today</Link>
              <Link to={FOLLOW_UP_PATHS.lead.add} className="text-myth-accent hover:underline inline-flex items-center gap-1">
                <Plus size={14} /> Add follow-up
              </Link>
            </div>
          </div>
          {followups.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming follow-ups. Schedule calls with leads or deals.</p>
          ) : (
            <div className="space-y-2">
              {followups.map((f) => (
                <div key={f._id} className="p-3 rounded-lg border border-myth-border bg-myth-surface/30">
                  <div className="flex items-start justify-between gap-2 lg:gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm lg:text-base">{f.title}</p>
                      <p className="text-xs text-gray-500 capitalize truncate">
                        {f.workflowStage}
                        {f.lead ? ` · ${f.lead.firstName} ${f.lead.lastName}` : ''}
                        {f.deal?.title ? ` · ${f.deal.title}` : ''}
                        {f.customer ? ` · ${f.customer.firstName} ${f.customer.lastName}` : ''}
                      </p>
                      <p className="text-xs text-myth-accent mt-1">{formatDateTime(f.scheduledAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => completeFollowup(f._id)}
                      className="btn-secondary text-xs inline-flex items-center gap-1 shrink-0"
                      title="Mark complete"
                    >
                      <CheckCircle2 size={14} /> Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <Calendar size={16} lg:size={18} className="text-indigo-400" /> Today&apos;s Meetings
            </h3>
            <Link to="/calendar" className="text-sm text-myth-accent hover:underline">Calendar</Link>
          </div>
          {todayMeetings.length === 0 ? (
            <p className="text-sm text-gray-500">No meetings scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {todayMeetings.map((m) => (
                <div key={m._id} className="p-3 rounded-lg border border-myth-border bg-myth-surface/30">
                  <p className="text-white font-medium text-sm lg:text-base">{m.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {m.lead ? `${m.lead.firstName} ${m.lead.lastName}` : ''}
                    {m.customer ? `${m.customer.firstName} ${m.customer.lastName}` : ''}
                  </p>
                  <p className="text-xs text-myth-accent mt-1">{formatDateTime(m.scheduledAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-base lg:text-lg font-semibold text-white mb-3">Quick Links</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SALES_QUICK_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="p-2 lg:p-3 rounded-lg bg-myth-surface/50 hover:bg-myth-surface border border-myth-border text-xs lg:text-sm text-center text-myth-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
