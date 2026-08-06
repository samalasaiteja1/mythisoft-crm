import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CRM_WORKFLOW, SALES_WORKFLOW, SUPPORT_RESPONSIBILITIES,
  TECHNICAL_RESPONSIBILITIES,
} from '../constants/permissions';
import { DASHBOARD_META, DASHBOARD_STAT_CARDS } from '../constants/dashboardConfig';
import { TECH_PERSON_WORKFLOW } from '../constants/technicalPersonNav';
import { UserPlus, Activity, Calendar, Cpu, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardAPI, formatDateTime } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import HireEmployeeSettings from '../components/settings/HireEmployeeSettings';
import WorkflowBanner from '../components/workflow/WorkflowBanner';
import AdminMainDashboard from '../components/dashboard/AdminMainDashboard';
import ManagerDashboard from '../components/dashboard/ManagerDashboard';
import TechnicalManagerDashboard from '../components/dashboard/TechnicalManagerDashboard';
import SupportManagerDashboard from '../components/dashboard/SupportManagerDashboard';
import SalesMainDashboard from '../components/dashboard/SalesMainDashboard';
import TechnicalMainDashboard from '../components/dashboard/TechnicalMainDashboard';
import CustomerMainDashboard from '../components/dashboard/CustomerMainDashboard';
import SupportMainDashboard from '../components/dashboard/SupportMainDashboard';
import TechSubmissionsWidget from '../components/projects/TechSubmissionsWidget';
import DashboardStatCards from '../components/dashboard/DashboardStatCards';
import { getDashboardKey, DASHBOARD_KEYS } from '../utils/roleContext';

const COLORS = ['#3ABEF9', '#6366F1', '#F59E0B', '#10B981', '#EF4444'];

const MANAGER_KEYS = [
  DASHBOARD_KEYS.salesManager,
  DASHBOARD_KEYS.techManager,
  DASHBOARD_KEYS.supportManager,
];

const STAT_CARD_KEYS = [
  DASHBOARD_KEYS.salesManager,
  DASHBOARD_KEYS.techManager,
  DASHBOARD_KEYS.supportManager,
];

const WORKFLOW_BY_KEY = {
  [DASHBOARD_KEYS.sales]: { title: 'Sales Workflow', steps: SALES_WORKFLOW },
  [DASHBOARD_KEYS.support]: {
    title: 'Ticket Status Flow',
    steps: ['Open', 'Assigned', 'Working', 'Waiting Customer', 'Resolved', 'Closed'],
  },
  [DASHBOARD_KEYS.technical]: { title: 'Technical Person Workflow', steps: TECH_PERSON_WORKFLOW },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hireOpen, setHireOpen] = useState(false);

  const dashboardKey = getDashboardKey(user);
  const meta = DASHBOARD_META[dashboardKey] || DASHBOARD_META[DASHBOARD_KEYS.sales];

  useEffect(() => {
    dashboardAPI.getDashboard()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center text-gray-400 py-12">Failed to load dashboard</div>;

  const {
    stats,
    roleStats,
    leadsByStatus,
    pipelineByStage,
    recentActivities,
    calendarEvents,
    adminOverview,
    departmentOverview,
    technicalOverview,
    customerOverview,
    supportOverview,
    salesOverview,
  } = data;

  const leadChartData = Object.entries(leadsByStatus || {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
  }));
  const pipelineChartData = (pipelineByStage || []).map((s) => ({
    name: (s._id || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    count: s.count || 0,
  }));

  const statCards = DASHBOARD_STAT_CARDS[dashboardKey];
  const managerRoleStats = roleStats?.manager || roleStats;
  const workflow = WORKFLOW_BY_KEY[dashboardKey];
  const isTechManager = dashboardKey === DASHBOARD_KEYS.techManager;
  const isSupportManager = dashboardKey === DASHBOARD_KEYS.supportManager;
  const isSupportPerson = dashboardKey === DASHBOARD_KEYS.support;
  const isCustomer = dashboardKey === DASHBOARD_KEYS.customer;

  if (isCustomer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{meta.title}</h1>
          <p className="text-gray-400 mt-1">{meta.subtitle}</p>
        </div>
        <CustomerMainDashboard
          customerOverview={customerOverview}
          roleStats={roleStats?.customer}
          recentActivities={recentActivities}
          calendarEvents={calendarEvents}
        />
      </div>
    );
  }

  if (isTechManager) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu size={26} className="text-cyan-400 shrink-0" />
            {meta.title}
          </h1>
          <p className="text-gray-400 mt-1">{meta.subtitle}</p>
        </div>

        <TechnicalManagerDashboard
          departmentOverview={departmentOverview}
          roleStats={managerRoleStats}
        />

        <TechSubmissionsWidget />

        <div className="card" id="recent-activities">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity size={20} className="text-myth-accent" /> Recent Activities
            </h3>
            <Link to="/communications" className="text-sm text-myth-accent hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentActivities?.length > 0 ? recentActivities.map((act) => (
              <div key={act._id} className="flex items-start gap-3 p-3 rounded-lg bg-myth-surface/50 hover:bg-myth-surface transition-colors">
                <div className="w-8 h-8 rounded-full bg-myth-accent/20 flex items-center justify-center text-myth-accent text-xs font-bold shrink-0">
                  {act.user?.firstName?.[0]}{act.user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{act.title}</p>
                  <p className="text-xs text-gray-500">{act.user?.firstName} {act.user?.lastName} · {formatDateTime(act.createdAt)}</p>
                </div>
                <span className="badge bg-myth-accent/10 text-myth-accent capitalize">{act.type}</span>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-8">No recent activities</p>
            )}
          </div>
        </div>

        <Modal isOpen={hireOpen} onClose={() => setHireOpen(false)} title="Hire Employee">
          <HireEmployeeSettings />
        </Modal>
      </div>
    );
  }

  if (isSupportManager) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{meta.title}</h1>
          <p className="text-gray-400 mt-1">{meta.subtitle}</p>
        </div>

        <SupportManagerDashboard
          departmentOverview={departmentOverview}
          roleStats={managerRoleStats}
          supportManagerOverview={data.supportManagerOverview}
        />
      </div>
    );
  }

  if (isSupportPerson) {
    return (
      <SupportMainDashboard
        supportOverview={supportOverview}
        roleStats={roleStats?.support}
      />
    );
  }

  if (dashboardKey === DASHBOARD_KEYS.technical) {
    const workflow = WORKFLOW_BY_KEY[dashboardKey];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu size={26} className="text-cyan-400 shrink-0" />
            {meta.title}
          </h1>
          <p className="text-gray-400 mt-1">{meta.subtitle}</p>
        </div>

        <TechnicalMainDashboard technicalOverview={technicalOverview} roleStats={roleStats} />

        <div className="card border-cyan-500/20">
          <h3 className="text-lg font-semibold text-white mb-3">Technical Responsibilities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {TECHNICAL_RESPONSIBILITIES.map((item) => (
              <div key={item} className="text-sm text-gray-300 p-2 rounded-lg bg-myth-surface/50">• {item}</div>
            ))}
          </div>
        </div>

        {workflow && (
          <div className="card border-cyan-500/20">
            <h3 className="text-lg font-semibold text-white mb-4">{workflow.title}</h3>
            <div className="flex flex-wrap gap-2">
              {workflow.steps.map((step, i) => (
                <span key={step} className="text-sm text-gray-300 px-3 py-1.5 rounded-lg bg-myth-surface/50 border border-myth-border">
                  {i + 1}. {step}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dashboardKey === DASHBOARD_KEYS.admin ? (
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={26} className="text-orange-400 shrink-0" />
            {meta.title}
          </h1>
          <p className="text-gray-400 mt-1">{meta.subtitle}</p>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold text-white">{meta.title}</h1>
          <p className="text-gray-400 mt-1">{meta.subtitle}</p>
        </div>
      )}

      {dashboardKey !== DASHBOARD_KEYS.admin && <WorkflowBanner />}

      {dashboardKey === DASHBOARD_KEYS.admin && (
        <AdminMainDashboard
          adminOverview={adminOverview}
          roleStats={roleStats}
          stats={stats}
          onAddEmployee={() => setHireOpen(true)}
        />
      )}

      {dashboardKey === DASHBOARD_KEYS.admin && (
        <TechSubmissionsWidget />
      )}

      {MANAGER_KEYS.includes(dashboardKey) && dashboardKey !== DASHBOARD_KEYS.techManager && dashboardKey !== DASHBOARD_KEYS.supportManager && (
        <ManagerDashboard departmentOverview={departmentOverview} salesOverview={salesOverview} />
      )}

      {dashboardKey === DASHBOARD_KEYS.sales && (
        <SalesMainDashboard salesOverview={salesOverview} roleStats={roleStats} />
      )}

      {dashboardKey === DASHBOARD_KEYS.support && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-3">Support Responsibilities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {SUPPORT_RESPONSIBILITIES.map((item) => (
              <div key={item} className="text-sm text-gray-300 p-2 rounded-lg bg-myth-surface/50">• {item}</div>
            ))}
          </div>
        </div>
      )}

      {STAT_CARD_KEYS.includes(dashboardKey) && dashboardKey !== DASHBOARD_KEYS.techManager && dashboardKey !== DASHBOARD_KEYS.supportManager && (
        <DashboardStatCards
          cards={statCards}
          stats={stats}
          roleStats={MANAGER_KEYS.includes(dashboardKey) ? managerRoleStats : roleStats}
        />
      )}

      {workflow && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">{workflow.title}</h3>
          <div className="flex flex-wrap gap-2">
            {workflow.steps.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className="badge bg-myth-accent/10 text-myth-accent text-xs">{step}</span>
                {i < workflow.steps.length - 1 && <span className="text-gray-600">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {dashboardKey === DASHBOARD_KEYS.admin && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">CRM Workflow</h3>
          <div className="flex flex-wrap gap-2">
            {CRM_WORKFLOW.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className="badge bg-myth-accent/10 text-myth-accent text-xs">{step}</span>
                {i < CRM_WORKFLOW.length - 1 && <span className="text-gray-600">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">
            {dashboardKey === DASHBOARD_KEYS.customer ? 'Projects by Status' : 'Leads by Status'}
          </h3>
          {leadChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={leadChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {leadChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0F1D32', border: '1px solid #1A3050', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No data yet</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">
            {dashboardKey === DASHBOARD_KEYS.customer ? 'Project Pipeline' : 'Sales Pipeline Chart'}
          </h3>
          {pipelineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pipelineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A3050" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={10} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0F1D32', border: '1px solid #1A3050', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No pipeline data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardKey === DASHBOARD_KEYS.customer ? (
          <div className="card" id="calendar-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar size={18} className="text-myth-accent" /> Calendar
              </h3>
              <Link to="/calendar" className="text-sm text-myth-accent hover:underline">Open calendar</Link>
            </div>
            <div className="space-y-2">
              {(calendarEvents || []).length > 0 ? calendarEvents.map((event, i) => (
                <div key={`${event.type}-${event.title}-${i}`} className="flex items-center justify-between p-3 rounded-lg bg-myth-surface/50 border border-myth-border">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{event.title}</p>
                    <p className="text-xs text-myth-accent capitalize">{event.type}</p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0 ml-3">{formatDateTime(event.scheduledAt)}</p>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-6">No upcoming events</p>
              )}
            </div>
          </div>
        ) : (
          <Link to="/calendar" className="card hover:border-myth-accent/30 transition-all block">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Calendar size={18} className="text-myth-accent" /> Calendar
            </h3>
            <p className="text-sm text-gray-400">Meetings, follow-ups, tasks & holidays</p>
          </Link>
        )}

        <div className="card" id="recent-activities">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity size={20} className="text-myth-accent" /> Recent Activities
            </h3>
            {dashboardKey !== DASHBOARD_KEYS.customer && (
              <Link to="/communications" className="text-sm text-myth-accent hover:underline">View all</Link>
            )}
          </div>
          <div className="space-y-3">
            {recentActivities?.length > 0 ? recentActivities.map((act) => (
              <div key={act._id} className="flex items-start gap-3 p-3 rounded-lg bg-myth-surface/50 hover:bg-myth-surface transition-colors">
                <div className="w-8 h-8 rounded-full bg-myth-accent/20 flex items-center justify-center text-myth-accent text-xs font-bold shrink-0">
                  {act.user?.firstName?.[0]}{act.user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{act.title}</p>
                  <p className="text-xs text-gray-500">{act.user?.firstName} {act.user?.lastName} · {formatDateTime(act.createdAt)}</p>
                </div>
                <span className="badge bg-myth-accent/10 text-myth-accent capitalize">{act.type}</span>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-8">No recent activities</p>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={hireOpen} onClose={() => setHireOpen(false)} title="Hire Employee">
        <HireEmployeeSettings />
      </Modal>
    </div>
  );
}
