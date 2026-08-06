import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, CheckCircle2, Users, Briefcase, ArrowRight, UserCog, Headphones, Wrench, ShoppingBag,
} from 'lucide-react';
import { auditAPI, rolesAPI } from '../services/api';
import {
  ROLE_LABELS,
  ACTION_LABELS,
  ACCESS_DISPLAY,
  MODULE_LABELS,
  MODULE_GROUPS,
  CRM_WORKFLOW,
  ADMIN_PAGES,
  MANAGER_PAGES,
  SALES_PAGES,
  SUPPORT_PAGES,
  TECHNICAL_PAGES,
  CUSTOMER_PAGES,
  ADMIN_RESPONSIBILITIES,
  MANAGER_RESPONSIBILITIES,
  SALES_RESPONSIBILITIES,
  SUPPORT_RESPONSIBILITIES,
  TECHNICAL_RESPONSIBILITIES,
  CUSTOMER_RESPONSIBILITIES,
} from '../constants/permissions';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminContentCard,
  AdminEmptyState,
  AdminInfoBanner,
} from '../components/admin/adminUi';

const ROLE_PAGES = {
  admin: ADMIN_PAGES,
  manager: MANAGER_PAGES,
  sales: SALES_PAGES,
  support: SUPPORT_PAGES,
  technical: TECHNICAL_PAGES,
  customer: CUSTOMER_PAGES,
};

const ROLE_RESPONSIBILITIES = {
  admin: ADMIN_RESPONSIBILITIES,
  manager: MANAGER_RESPONSIBILITIES,
  sales: SALES_RESPONSIBILITIES,
  support: SUPPORT_RESPONSIBILITIES,
  technical: TECHNICAL_RESPONSIBILITIES,
  customer: CUSTOMER_RESPONSIBILITIES,
};

const SYSTEM_ROLE_GUIDE = [
  { role: 'admin', label: 'Admin', icon: Shield, color: 'text-cyan-400', border: 'border-cyan-500/20' },
  { role: 'manager', label: 'Manager', icon: UserCog, color: 'text-blue-400', border: 'border-blue-500/20' },
  { role: 'sales', label: 'Sales', icon: ShoppingBag, color: 'text-green-400', border: 'border-green-500/20' },
  { role: 'support', label: 'Support', icon: Headphones, color: 'text-orange-400', border: 'border-orange-500/20' },
  { role: 'technical', label: 'Technical', icon: Wrench, color: 'text-purple-400', border: 'border-purple-500/20' },
  { role: 'customer', label: 'Customer', icon: Users, color: 'text-teal-400', border: 'border-teal-500/20' },
];

const JOB_PERM_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  assign: 'Assign',
};

function AccessBadge({ level }) {
  const isDenied = !level || level === false;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${
      isDenied
        ? 'bg-red-500/10 text-red-400/80'
        : 'bg-cyan-500/10 text-cyan-300'
    }`}>
      {ACCESS_DISPLAY[level] || ACCESS_DISPLAY.false}
    </span>
  );
}

function PermissionBadges({ permissions }) {
  const active = Object.entries(permissions || {}).filter(([, v]) => v);
  if (!active.length) return <span className="text-gray-500 text-xs">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {active.map(([key]) => (
        <span key={key} className="badge bg-cyan-500/10 text-cyan-300 text-xs">
          {JOB_PERM_LABELS[key] || key}
        </span>
      ))}
    </div>
  );
}

export default function Permissions() {
  const { isAdmin } = usePermissions();
  const [data, setData] = useState(null);
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('guide');

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: d }, { data: roles }] = await Promise.all([
          auditAPI.getPermissions(),
          rolesAPI.getAll(),
        ]);
        setData(d);
        setJobRoles(Array.isArray(roles) ? roles : roles?.items || []);
      } catch {
        /* handled below */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <AdminEmptyState message="Failed to load permissions" icon={Shield} />;

  const matrix = data.moduleAccessMatrix || [];
  const adminMatrix = data.admin?.actionMatrix || {};
  const matrixModules = Object.keys(adminMatrix);
  const actions = data.actions || Object.keys(ACTION_LABELS);
  const roles = data.roles || Object.keys(ROLE_LABELS);

  const tabs = [
    { id: 'guide', label: 'Role guide' },
    { id: 'modules', label: 'Module access' },
    { id: 'job-roles', label: 'Job roles' },
    ...(isAdmin ? [{ id: 'admin-actions', label: 'Admin actions' }] : []),
  ];

  const matrixByModule = Object.fromEntries(matrix.map((row) => [row.module, row]));

  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={Shield}
        title="Roles & Permissions"
        subtitle="System roles control CRM access. Job roles in Settings are department titles used when hiring."
        meta={`${roles.length} system roles · ${matrix.length} modules · ${jobRoles.length} job titles`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-start gap-3">
            <Users className="text-cyan-400 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-white font-semibold text-sm">System roles</h3>
              <p className="text-xs text-gray-400 mt-1">
                Set on each user account. Controls sidebar, routes, and API access.
              </p>
              <Link to="/settings?tab=hired-staff" className="text-xs text-cyan-400 hover:underline mt-2 inline-flex items-center gap-1">
                Hired Staff <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
        <div className="card border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <Briefcase className="text-blue-400 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-white font-semibold text-sm">Job roles (Settings)</h3>
              <p className="text-xs text-gray-400 mt-1">
                Job titles per department — used on hire form. Department maps to system role.
              </p>
              <Link to="/settings?tab=roles" className="text-xs text-blue-400 hover:underline mt-2 inline-flex items-center gap-1">
                Settings → Roles <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AdminInfoBanner>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">End-to-end CRM workflow</p>
        <div className="flex flex-wrap gap-2">
          {CRM_WORKFLOW.map((step, i) => (
            <span key={step} className="flex items-center gap-1.5 text-xs text-gray-300">
              <span className="w-5 h-5 rounded-full bg-myth-surface flex items-center justify-center text-[10px] text-gray-500">{i + 1}</span>
              {step}
              {i < CRM_WORKFLOW.length - 1 && <ArrowRight size={10} className="text-gray-600 hidden lg:inline" />}
            </span>
          ))}
        </div>
      </AdminInfoBanner>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === t.id
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                : 'border-myth-border text-gray-400 hover:text-white hover:border-myth-border/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'guide' && (
        <div className="space-y-3">
          {SYSTEM_ROLE_GUIDE.map(({ role, label, icon: Icon, color, border }) => {
            const pages = data[role]?.pages || ROLE_PAGES[role] || [];
            const responsibilities = data[role]?.responsibilities || ROLE_RESPONSIBILITIES[role] || [];
            return (
              <div key={role} className={`card border ${border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={18} className={color} />
                  <h3 className={`text-base font-semibold ${color}`}>{label}</h3>
                  {role === 'manager' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-myth-surface text-gray-500">
                      Sales · Support · Technical dept sidebars
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                  {responsibilities.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-gray-300 p-2 rounded-lg bg-myth-surface/40 border border-myth-border/40">
                      <CheckCircle2 size={12} className="text-cyan-400 shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
                {pages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-myth-border/50">
                    {pages.slice(0, 14).map((page) => (
                      <Link
                        key={page.key}
                        to={page.path}
                        className="text-[10px] px-2 py-1 rounded-lg bg-myth-surface/60 text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
                      >
                        {page.label}
                      </Link>
                    ))}
                    {pages.length > 14 && (
                      <span className="text-[10px] text-gray-500 self-center">+{pages.length - 14} more</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'modules' && (
        <div className="space-y-4">
          <AdminContentCard title="Role access matrix">
            <p className="text-xs text-gray-500 mb-4">
              What each system role can do per module. Manager access varies by department (Sales, Support, Technical).
            </p>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr>
                    <th className="table-header text-left">Module</th>
                    {roles.map((role) => (
                      <th key={role} className="table-header text-center">{ROLE_LABELS[role] || role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map(({ module, label, access }) => (
                    <tr key={module} className="border-t border-myth-border/60 hover:bg-myth-surface/20">
                      <td className="table-cell font-medium text-gray-200">
                        {MODULE_LABELS[module] || label || module.replace(/_/g, ' ')}
                      </td>
                      {roles.map((role) => (
                        <td key={role} className="table-cell text-center">
                          <AccessBadge level={access[role]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminContentCard>

          {MODULE_GROUPS.map((group) => (
            <AdminContentCard key={group.label} title={group.label}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {group.modules.map((mod) => {
                  const row = matrixByModule[mod];
                  if (!row) return null;
                  return (
                    <div key={mod} className="p-3 rounded-xl bg-myth-surface/30 border border-myth-border/50">
                      <p className="text-sm font-medium text-white mb-2">
                        {MODULE_LABELS[mod] || row.label}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {roles.map((role) => (
                          <span key={role} className="text-[9px] text-gray-500">
                            {ROLE_LABELS[role]?.slice(0, 1)}:
                            <span className="text-gray-400 ml-0.5">
                              {(ACCESS_DISPLAY[row.access[role]] || '—').replace(' access', '').slice(0, 8)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AdminContentCard>
          ))}
        </div>
      )}

      {tab === 'job-roles' && (
        <AdminContentCard
          title="Job roles"
          toolbar={(
            <Link to="/settings?tab=roles" className="btn-secondary text-xs">Manage in Settings</Link>
          )}
        >
          <p className="text-xs text-gray-500 mb-4">
            {jobRoles.length} job title{jobRoles.length !== 1 ? 's' : ''} configured. Permissions here are metadata for hiring — the user&apos;s system role still drives app access.
          </p>
          {jobRoles.length === 0 ? (
            <AdminEmptyState message="No job roles yet. Create them in Settings → Roles before hiring." icon={Briefcase} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header text-left">Job title</th>
                    <th className="table-header text-left">Department</th>
                    <th className="table-header text-left">Permissions</th>
                    <th className="table-header text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobRoles.map((role) => (
                    <tr key={role._id} className="border-t border-myth-border/60">
                      <td className="table-cell font-medium text-white">{role.name}</td>
                      <td className="table-cell text-gray-400">{role.department?.name || '—'}</td>
                      <td className="table-cell"><PermissionBadges permissions={role.permissions} /></td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${role.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
                          {role.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminContentCard>
      )}

      {tab === 'admin-actions' && isAdmin && (
        <AdminContentCard title="Admin action matrix">
          <p className="text-xs text-gray-500 mb-4">
            Admin has full CRUD + export, import, assign, and approve on all modules below.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr>
                  <th className="table-header text-left">Module</th>
                  {actions.map((action) => (
                    <th key={action} className="table-header text-center text-xs">{ACTION_LABELS[action] || action}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixModules.map((mod) => (
                  <tr key={mod} className="border-t border-myth-border/60">
                    <td className="table-cell font-medium text-gray-200">
                      {MODULE_LABELS[mod] || mod.replace(/_/g, ' ')}
                    </td>
                    {actions.map((action) => (
                      <td key={action} className="table-cell text-center">
                        {adminMatrix[mod]?.[action] ? (
                          <CheckCircle2 size={14} className="text-green-400 inline" />
                        ) : (
                          <span className="text-red-400/60">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminContentCard>
      )}
    </AdminPageShell>
  );
}
