import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowRight, UserCheck } from 'lucide-react';
import { dashboardAPI, leadsAPI, formatCurrency } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ADMIN_LEAD_NAV,
  countLeadsByAssignment,
  ASSIGNMENT_STATE_LABELS,
} from '../../constants/adminLeadViews';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3ABEF9', '#6366F1', '#8B5CF6'];

export default function LeadReport() {
  const [reportData, setReportData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getReports().then(({ data }) => data).catch(() => null),
      leadsAPI.getAll({ limit: 500 }).then(({ data }) => data.leads || []).catch(() => []),
    ])
      .then(([reports, leadList]) => {
        setReportData(reports);
        setLeads(leadList);
      })
      .finally(() => setLoading(false));
  }, []);

  const assignmentCounts = useMemo(() => countLeadsByAssignment(leads), [leads]);

  const funnelData = [
    { name: ASSIGNMENT_STATE_LABELS.unassigned, count: assignmentCounts.unassigned, fill: '#EF4444' },
    { name: ASSIGNMENT_STATE_LABELS.manager_only, count: assignmentCounts.manager_only, fill: '#F59E0B' },
    { name: ASSIGNMENT_STATE_LABELS.sales_only, count: assignmentCounts.sales_only, fill: '#3ABEF9' },
    { name: ASSIGNMENT_STATE_LABELS.both, count: assignmentCounts.both, fill: '#10B981' },
  ];

  const leadConversion = reportData?.leadConversion || [];
  const leadData = leadConversion.map((l) => ({
    name: (l._id || 'unknown').replace(/_/g, ' '),
    count: l.count,
    value: l.value,
  }));

  const pipelineValue = leads.reduce((sum, l) => sum + (l.value || l.budget || 0), 0);
  const qualifiedCount = leads.filter((l) => l.status === 'qualified' || l.isQualified).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{ADMIN_LEAD_NAV.analytics.title}</h1>
        <p className="text-gray-400 mt-1">{ADMIN_LEAD_NAV.analytics.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400">Total leads</p>
          <p className="text-2xl font-bold text-white">{assignmentCounts.total}</p>
        </div>
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400">Unassigned</p>
          <p className="text-2xl font-bold text-red-400">{assignmentCounts.unassigned}</p>
        </div>
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400">Manager only</p>
          <p className="text-2xl font-bold text-amber-400">{assignmentCounts.manager_only}</p>
        </div>
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400">Sales only</p>
          <p className="text-2xl font-bold text-blue-400">{assignmentCounts.sales_only}</p>
        </div>
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400">Manager + sales</p>
          <p className="text-2xl font-bold text-green-400">{assignmentCounts.both}</p>
        </div>
      </div>

      <div className="card border-myth-accent/20 bg-myth-accent/5">
        <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <UserCheck size={16} className="text-myth-accent" /> Admin assignment workflow
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/leads" className="text-myth-accent hover:underline">All Leads</Link>
          <span className="text-gray-600">→</span>
          <Link to="/leads/assign-manager" className="text-myth-accent hover:underline">Assign Manager</Link>
          <span className="text-gray-600">→</span>
          <Link to="/leads/assign" className="text-myth-accent hover:underline">Manager → Sales</Link>
          <span className="text-gray-600">→</span>
          <Link to="/leads/assigned" className="text-myth-accent hover:underline">Assigned Leads</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-1">Assignment funnel (Admin)</h3>
          <p className="text-xs text-gray-500 mb-4">Where leads sit in Admin → Manager → Executive flow</p>
          {funnelData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A3050" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={10} interval={0} angle={-12} textAnchor="end" height={70} />
                <YAxis stroke="#6B7280" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0F1D32', border: '1px solid #1A3050', borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {funnelData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No leads yet — <Link to="/leads/create" className="text-myth-accent hover:underline">create a lead</Link></p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-1">Leads by stage</h3>
          <p className="text-xs text-gray-500 mb-4">Status distribution across the pipeline</p>
          {leadData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={leadData} cx="50%" cy="50%" outerRadius={100} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                  {leadData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0F1D32', border: '1px solid #1A3050', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No stage data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-400">Pipeline value</p>
          <p className="text-xl font-bold text-myth-accent mt-1">{formatCurrency(pipelineValue)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">Qualified leads</p>
          <p className="text-xl font-bold text-white mt-1">{qualifiedCount}</p>
          <Link to="/qualified-leads" className="text-xs text-myth-accent hover:underline mt-2 inline-flex items-center gap-1">
            View qualified <ArrowRight size={12} />
          </Link>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">Unsigned (not assigned)</p>
          <p className="text-xl font-bold text-amber-400 mt-1">
            {assignmentCounts.unassigned}
          </p>
          <Link to="/leads/unsigned" className="text-xs text-myth-accent hover:underline mt-2 inline-flex items-center gap-1">
            View unsigned <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
