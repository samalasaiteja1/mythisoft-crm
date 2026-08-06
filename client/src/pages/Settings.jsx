import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Key, Plug, FolderKanban, Shield, Users, UserPlus, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../services/api';
import ProjectCategoriesSettings from '../components/settings/ProjectCategoriesSettings';
import Departments from '../pages/Departments';
import RolesSettings from '../components/settings/RolesSettings';
import StaffRolesSettings from '../components/settings/StaffRolesSettings';
import HireEmployeeSettings from '../components/settings/HireEmployeeSettings';
import HireManagerForm from '../components/settings/HireManagerForm';
import HiredStaffSettings from '../components/settings/HiredStaffSettings';

const isAdmin = (role) => role === 'admin';
const isManager = (role) => role === 'manager';
const canManageCompany = (role) => isAdmin(role) || isManager(role);

const ADMIN_SETUP_STEPS = [
  { step: 1, label: 'Company Info', tab: 'company', desc: 'Brand, timezone, currency' },
  { step: 2, label: 'Departments', tab: 'departments', desc: 'Sales, Technical, Support' },
  { step: 3, label: 'Roles', tab: 'roles', desc: 'Job titles + permissions per department' },
  { step: 4, label: 'Teams', tab: 'teams', desc: 'Work groups inside each department' },
  { step: 5, label: 'Hire Manager', tab: 'hire-manager', desc: 'One manager per department (3 total)' },
  { step: 6, label: 'Hire Employee', tab: 'hire', desc: 'Staff under each manager' },
  { step: 7, label: 'Permissions', href: '/permissions', desc: 'System access: admin, manager, sales…' },
];

function defaultTabForRole(role, urlTab) {
  if (urlTab && urlTab !== 'profile' && urlTab !== 'password') return urlTab;
  if (isAdmin(role)) return 'company';
  if (isManager(role)) return 'company';
  return 'company';
}

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = user?.role;
  const admin = isAdmin(role);

  const [tab, setTab] = useState(() => defaultTabForRole(role, searchParams.get('tab')));
  const [settings, setSettings] = useState(null);
  const [companyForm, setCompanyForm] = useState({});
  const [apiKeyName, setApiKeyName] = useState('');

  useEffect(() => {
    if (canManageCompany(role)) {
      settingsAPI.get()
        .then(({ data }) => {
          setSettings(data);
          setCompanyForm({
            companyName: data.companyName || '',
            companyTagline: data.companyTagline || '',
            companyEmail: data.companyEmail || '',
            companyPhone: data.companyPhone || '',
            companyAddress: data.companyAddress || '',
            companyWebsite: data.companyWebsite || '',
            timezone: data.timezone || 'Asia/Kolkata',
            currency: data.currency || 'INR',
            dateFormat: data.dateFormat || 'DD/MM/YYYY',
          });
        })
        .catch(() => {});
    }
  }, [role]);

  const saveCompany = async (e) => {
    e.preventDefault();
    try {
      const { data } = await settingsAPI.update(companyForm);
      setSettings(data);
      toast.success('Company settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const generateApiKey = async () => {
    if (!apiKeyName) return toast.error('Enter a key name');
    try {
      const { data } = await settingsAPI.addApiKey(apiKeyName);
      toast.success(`API Key: ${data.key}`, { duration: 10000 });
      setApiKeyName('');
      const { data: s } = await settingsAPI.get();
      setSettings(s);
    } catch {
      toast.error('Failed');
    }
  };

  const revokeApiKey = async (keyId) => {
    if (!confirm('Revoke this API key?')) return;
    try {
      await settingsAPI.revokeApiKey(keyId);
      toast.success('API key revoked');
      const { data: s } = await settingsAPI.get();
      setSettings(s);
    } catch {
      toast.error('Failed to revoke');
    }
  };

  const allTabs = [
    { id: 'company', label: 'Company Info', icon: Building2, roles: 'admin-manager' },
    { id: 'project-categories', label: 'Project Categories', icon: FolderKanban, roles: 'admin-manager' },
    { id: 'departments', label: 'Departments', icon: FolderKanban, roles: 'admin' },
    { id: 'teams', label: 'Teams', icon: Users, roles: 'admin' },
    { id: 'roles', label: 'Roles', icon: Shield, roles: 'admin' },
    { id: 'hire',         label: 'Hire Employee', icon: UserPlus, roles: 'admin' },
    { id: 'hire-manager', label: 'Hire Manager',  icon: UserPlus, roles: 'admin' },
    { id: 'hired-staff',  label: 'Hired Staff',   icon: Users, roles: 'admin' },
    { id: 'email', label: 'Email & SMS', icon: Mail, roles: 'admin' },
    { id: 'api', label: 'API Keys', icon: Key, roles: 'admin' },
    { id: 'integrations', label: 'Integrations', icon: Plug, roles: 'admin' },
  ];

  const visibleTabs = allTabs.filter((t) => {
    if (t.roles === 'all') return true;
    if (t.roles === 'admin-manager') return canManageCompany(role);
    if (t.roles === 'admin') return admin;
    return false;
  });

  const selectTab = (id) => {
    setTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab === 'profile' || urlTab === 'password') {
      navigate('/profile', { replace: true });
      return;
    }
    if (urlTab === 'staff-roles') {
      setTab('teams');
      setSearchParams({ tab: 'teams' }, { replace: true });
      return;
    }
    if (urlTab && visibleTabs.some((t) => t.id === urlTab)) {
      setTab(urlTab);
    }
  }, [searchParams, visibleTabs]);

  const setupHint = (step) => (
    <div className="mb-4 p-3 rounded-lg border border-myth-accent/20 bg-myth-accent/5 text-sm text-gray-400">
      <span className="text-myth-accent font-semibold">Step {step}</span>
      {' — '}
      {ADMIN_SETUP_STEPS.find((s) => s.step === step)?.desc}
    </div>
  );

  const subtitle = admin
    ? 'Company setup, departments, teams, hiring, and integrations'
    : 'Company information and project categories';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">{subtitle}</p>
      </div>

      {admin && (
        <div className="card border-myth-accent/25 bg-gradient-to-br from-myth-accent/10 to-transparent">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-1">
            <Shield size={18} className="text-orange-400" /> Admin CRM Setup
          </h2>
          <p className="text-sm text-gray-400 mb-4">Complete in order — each step unlocks the next.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {ADMIN_SETUP_STEPS.map((item) => (
              item.href ? (
                <Link
                  key={item.step}
                  to={item.href}
                  className="rounded-xl border border-myth-border bg-myth-surface/40 p-3 hover:border-myth-accent/40 transition-all"
                >
                  <p className="text-[10px] text-gray-500 font-mono">Step {item.step}</p>
                  <p className="text-sm font-medium text-white mt-0.5">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.desc}</p>
                </Link>
              ) : (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => selectTab(item.tab)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    tab === item.tab
                      ? 'border-myth-accent/50 bg-myth-accent/10'
                      : 'border-myth-border bg-myth-surface/40 hover:border-myth-accent/40'
                  }`}
                >
                  <p className="text-[10px] text-gray-500 font-mono">Step {item.step}</p>
                  <p className="text-sm font-medium text-white mt-0.5">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.desc}</p>
                </button>
              )
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 space-y-1">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectTab(id)}
              className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white hover:bg-myth-surface'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 card">
          {tab === 'company' && canManageCompany(role) && (
            <>
              {admin && setupHint(1)}
              <form onSubmit={saveCompany} className="space-y-4 max-w-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Company Information</h3>
              <p className="text-sm text-gray-400 mb-2">
                {admin ? 'Full company settings — admin control.' : 'Update company details. API keys and integrations are admin only.'}
              </p>
              {settings?.companyLogo && (
                <img src={settings.companyLogo} alt="Company logo" className="h-12 object-contain mb-2" />
              )}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Company Name</label>
                <input value={companyForm.companyName} onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tagline</label>
                <input value={companyForm.companyTagline} onChange={(e) => setCompanyForm({ ...companyForm, companyTagline: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email</label>
                  <input type="email" value={companyForm.companyEmail} onChange={(e) => setCompanyForm({ ...companyForm, companyEmail: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Phone</label>
                  <input value={companyForm.companyPhone} onChange={(e) => setCompanyForm({ ...companyForm, companyPhone: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Address</label>
                <textarea value={companyForm.companyAddress} onChange={(e) => setCompanyForm({ ...companyForm, companyAddress: e.target.value })} className="input-field h-20" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Website</label>
                <input value={companyForm.companyWebsite} onChange={(e) => setCompanyForm({ ...companyForm, companyWebsite: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Timezone</label>
                  <input value={companyForm.timezone} onChange={(e) => setCompanyForm({ ...companyForm, timezone: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Currency</label>
                  <input value={companyForm.currency} onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Date Format</label>
                  <input value={companyForm.dateFormat} onChange={(e) => setCompanyForm({ ...companyForm, dateFormat: e.target.value })} className="input-field" />
                </div>
              </div>
              <button type="submit" className="btn-primary">Save Company Settings</button>
              {admin && (
                <button type="button" onClick={() => selectTab('departments')} className="btn-secondary text-sm inline-flex items-center gap-1 mt-2">
                  Next: Departments <ArrowRight size={14} />
                </button>
              )}
            </form>
            </>
          )}

          {tab === 'project-categories' && canManageCompany(role) && (
            <ProjectCategoriesSettings />
          )}

          {tab === 'departments' && admin && (
            <>
              {setupHint(2)}
              <Departments />
              <button type="button" onClick={() => selectTab('roles')} className="btn-secondary text-sm inline-flex items-center gap-1 mt-4">
                Next: Roles <ArrowRight size={14} />
              </button>
            </>
          )}

          {tab === 'roles' && admin && (
            <>
              {setupHint(3)}
              <RolesSettings />
              <button type="button" onClick={() => selectTab('teams')} className="btn-secondary text-sm inline-flex items-center gap-1 mt-4">
                Next: Teams <ArrowRight size={14} />
              </button>
            </>
          )}

          {tab === 'teams' && admin && (
            <>
              {setupHint(4)}
              <StaffRolesSettings />
              <button type="button" onClick={() => selectTab('hire-manager')} className="btn-secondary text-sm inline-flex items-center gap-1 mt-4">
                Next: Hire Manager <ArrowRight size={14} />
              </button>
            </>
          )}

          {tab === 'hire-manager' && admin && (
            <>
              {setupHint(5)}
              <HireManagerForm />
              <button type="button" onClick={() => selectTab('hire')} className="btn-secondary text-sm inline-flex items-center gap-1 mt-4">
                Next: Hire Employee <ArrowRight size={14} />
              </button>
            </>
          )}

          {tab === 'hire' && admin && (
            <>
              {setupHint(6)}
              <HireEmployeeSettings />
              <Link to="/permissions" className="btn-secondary text-sm inline-flex items-center gap-1 mt-4">
                Next: Permissions <ArrowRight size={14} />
              </Link>
            </>
          )}

          {tab === 'hired-staff' && admin && (
            <HiredStaffSettings />
          )}

          {tab === 'email' && admin && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Email & SMS Configuration</h3>
              <div className="p-4 bg-myth-surface rounded-lg space-y-2">
                <p className="text-sm text-gray-400">
                  SMTP and SMS providers are configured in server environment variables (.env).
                </p>
                <p className="text-xs text-gray-500">
                  Email: SMTP_USER, SMTP_PASS · SMS: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
                </p>
              </div>
            </div>
          )}

          {tab === 'api' && admin && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-semibold text-white mb-2">API Keys</h3>
              <p className="text-sm text-gray-400">Create and revoke API keys for external integrations. Admin only.</p>
              <div className="flex gap-3">
                <input value={apiKeyName} onChange={(e) => setApiKeyName(e.target.value)} placeholder="Key name (e.g. Zapier)" className="input-field flex-1" />
                <button type="button" onClick={generateApiKey} className="btn-primary">Generate</button>
              </div>
              {settings?.apiKeys?.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {settings.apiKeys.map((k) => (
                    <div key={k._id} className="flex justify-between items-center p-3 bg-myth-surface rounded-lg">
                      <div>
                        <p className="text-sm text-white">{k.name}</p>
                        <p className="text-xs text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${k.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {k.isActive ? 'Active' : 'Revoked'}
                        </span>
                        {k.isActive && (
                          <button type="button" onClick={() => revokeApiKey(k._id)} className="text-xs text-red-400 hover:text-red-300">
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No API keys yet.</p>
              )}
            </div>
          )}

          {tab === 'integrations' && admin && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Integrations</h3>
              <p className="text-sm text-gray-400 mb-2">Connect third-party services. Admin only.</p>
              {['Slack', 'Google Workspace', 'Zapier'].map((name) => (
                <div key={name} className="flex items-center justify-between p-4 bg-myth-surface rounded-lg">
                  <div>
                    <p className="text-white font-medium">{name}</p>
                    <p className="text-xs text-gray-400">Connect your {name} account</p>
                  </div>
                  <button type="button" className="btn-secondary text-sm">Configure</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
