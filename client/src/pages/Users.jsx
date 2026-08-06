import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Shield, Users as UsersIcon, Pencil, Trash2, UserCog, Settings, Eye, Key } from 'lucide-react';
import TeamMemberCard from './teams/TeamMemberCard';
import { EMPLOYEE_FORM_STEPS } from '../constants/orgStructure';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { usersAPI, staffRolesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

import {
  ROLE_TO_TEAM_GROUP,
  teamGroupLabel,
  managerLabelForRole,
  getManagersForRole,
  pickManagerForTeam,
  pickManagerForRole,
  departmentLabel,
  getManagerTeams,
} from '../utils/hireFormHelpers';
import { inferTeamDepartment } from '../utils/roleContext';

const EMPLOYEE_ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'sales', label: 'Sales Person' },
  { value: 'technical', label: 'Technical Person' },
  { value: 'support', label: 'Support Person' },
];

const ROLE_FROM_TEAM_GROUP = {
  manager: 'manager',
  sales: 'sales',
  technical: 'technical',
  support: 'support',
};

const roleLabel = (role) => EMPLOYEE_ROLE_OPTIONS.find((r) => r.value === role)?.label || role;

const TEAM_GROUP_OPTIONS = [
  { key: 'sales', label: 'Sales Team' },
  { key: 'technical', label: 'Technical Team' },
  { key: 'support', label: 'Support Team' },
];

const roleColors = {
  admin: 'bg-red-500/20 text-red-400',
  manager: 'bg-purple-500/20 text-purple-400',
  sales: 'bg-blue-500/20 text-blue-400',
  support: 'bg-green-500/20 text-green-400',
  technical: 'bg-cyan-500/20 text-cyan-400',
};

const emptyEmployee = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  employeeId: '',
  staffRole: '',
  role: 'sales',
  reportsTo: '',
  isTeamLead: false,
  password: '',
  isActive: true,
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [settingsTeams, setSettingsTeams] = useState([]);
  const [tab, setTab] = useState('employees');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyEmployee);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [passwordChangeUser, setPasswordChangeUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const activeSettingsTeams = useMemo(
    () => settingsTeams.filter((t) => t.status !== 'inactive'),
    [settingsTeams]
  );

  const teamsByGroup = useMemo(() => {
    const map = Object.fromEntries(TEAM_GROUP_OPTIONS.map((g) => [g.key, []]));
    activeSettingsTeams.forEach((team) => {
      if (map[team.teamGroup]) map[team.teamGroup].push(team);
    });
    return map;
  }, [activeSettingsTeams]);

  const isManagerForm = form.role === 'manager';
  const systemRole = form.role;

  const teamsForSelectedRole = useMemo(() => {
    if (form.role === 'manager') return getManagerTeams(activeSettingsTeams);
    return activeSettingsTeams.filter((t) => t.teamGroup === ROLE_TO_TEAM_GROUP[form.role]);
  }, [activeSettingsTeams, form.role]);

  const selectedTeam = settingsTeams.find((t) => t._id === form.staffRole);

  const managersForReportsTo = useMemo(
    () => getManagersForRole(isManagerForm ? 'manager' : systemRole, employees, activeSettingsTeams, editId),
    [employees, editId, activeSettingsTeams, isManagerForm, systemRole]
  );

  const selectedManager = useMemo(
    () => employees.find((e) => String(e._id) === String(form.reportsTo)),
    [employees, form.reportsTo]
  );

  const managerRequired = !isManagerForm && ['sales', 'technical', 'support'].includes(systemRole);

  const teamLeadIds = useMemo(() => {
    const ids = new Set();
    settingsTeams.forEach((team) => {
      const id = team.teamLeader?._id || team.teamLeader;
      if (id) ids.add(String(id));
    });
    return ids;
  }, [settingsTeams]);

  const currentTeamLead = useMemo(() => {
    if (!form.staffRole) return null;
    const team = settingsTeams.find((t) => String(t._id) === String(form.staffRole));
    const leaderId = team?.teamLeader?._id || team?.teamLeader;
    if (!leaderId) return null;
    return employees.find((e) => String(e._id) === String(leaderId)) || team?.teamLeader;
  }, [form.staffRole, settingsTeams, employees]);

  const reportsToOptions = useMemo(() => {
    if (!form.reportsTo) return managersForReportsTo;
    if (managersForReportsTo.some((m) => m._id === form.reportsTo)) return managersForReportsTo;
    const current = employees.find((e) => e._id === form.reportsTo);
    return current ? [...managersForReportsTo, current] : managersForReportsTo;
  }, [managersForReportsTo, form.reportsTo, employees]);

  const loadTeams = async () => {
    try {
      const { data } = await staffRolesAPI.getOptions();
      const items = data.items || [];
      setSettingsTeams(items);
      return items;
    } catch {
      setSettingsTeams([]);
      toast.error('Could not load teams from Settings');
      return [];
    }
  };

  const fetch = () => {
    setLoading(true);
    Promise.all([usersAPI.getAll(), staffRolesAPI.getOptions()])
      .then(([empRes, teamsRes]) => {
        setEmployees(empRes.data);
        setSettingsTeams(teamsRes.data.items || []);
      })
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
  }, []);

  const employeesByTeam = useMemo(() => {
    const map = {};
    employees.forEach((e) => {
      const id = e.staffRole?._id || e.staffRole;
      if (!id) return;
      const key = String(id);
      map[key] = map[key] || [];
      map[key].push(e);
    });
    return map;
  }, [employees]);

  const openAdd = async (presetStaffRole = '', presetRole = '') => {
    setEditId(null);
    setFormStep(1);
    const teams = await loadTeams();
    const team = teams.find((t) => t._id === presetStaffRole);
    const role = presetRole || (team ? (ROLE_FROM_TEAM_GROUP[team.teamGroup] || 'sales') : 'sales');
    const reportsTo = presetStaffRole
      ? pickManagerForTeam(role, presetStaffRole, employees, teams, '', null)
      : '';
    setForm({
      ...emptyEmployee,
      staffRole: presetStaffRole,
      role,
      reportsTo,
    });
    setConfirmPassword('');
    setModal('employee');
  };

  const openEdit = async (employee) => {
    const teams = await loadTeams();
    const staffRoleId = employee.staffRole?._id || employee.staffRole || '';
    const team = teams.find((t) => String(t._id) === String(staffRoleId));
    const leaderId = team?.teamLeader?._id || team?.teamLeader;
    setEditId(employee._id);
    setFormStep(1);
    setForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      employeeId: employee.employeeId || '',
      staffRole: staffRoleId,
      role: employee.role,
      reportsTo: employee.reportsTo?._id || employee.reportsTo || '',
      isTeamLead: leaderId ? String(leaderId) === String(employee._id) : false,
      password: '',
      isActive: employee.isActive !== false,
    });
    setConfirmPassword('');
    setModal('employee');
  };

  const openPasswordChange = (employee) => {
    setPasswordChangeUser(employee);
    setNewPassword('');
    setModal('password');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await usersAPI.changePassword(passwordChangeUser._id, { password: newPassword });
      toast.success('Password changed successfully');
      setPasswordChangeUser(null);
      setNewPassword('');
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRoleChange = (role) => {
    setForm((prev) => {
      if (role === 'manager') {
        return {
          ...prev,
          role,
          staffRole: '',
          reportsTo: '',
          isTeamLead: false,
        };
      }
      const team = settingsTeams.find((t) => t._id === prev.staffRole);
      const teamStillValid = team && team.teamGroup === ROLE_TO_TEAM_GROUP[role];
      const nextStaffRole = teamStillValid ? prev.staffRole : '';
      const reportsTo = teamStillValid
        ? pickManagerForTeam(role, nextStaffRole, employees, activeSettingsTeams, prev.reportsTo, editId)
        : pickManagerForRole(role, employees, activeSettingsTeams, editId);
      return {
        ...prev,
        role,
        staffRole: nextStaffRole,
        reportsTo,
        isTeamLead: false,
      };
    });
  };

  const handleTeamChange = (staffRoleId) => {
    const sys = isManagerForm ? 'manager' : systemRole;
    setForm((prev) => ({
      ...prev,
      staffRole: staffRoleId,
      isTeamLead: false,
      reportsTo: isManagerForm
        ? ''
        : pickManagerForTeam(sys, staffRoleId, employees, activeSettingsTeams, prev.reportsTo, editId),
    }));
  };

  const validateFormStep = (step) => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        toast.error('First name and last name are required');
        return false;
      }
      if (!form.email.trim()) {
        toast.error('Email is required');
        return false;
      }
      if (!form.phone?.trim()) {
        toast.error('Phone number is required');
        return false;
      }
      if (!form.employeeId.trim()) {
        toast.error('Employee ID is required');
        return false;
      }
    }
    if (step === 2) {
      if (isManagerForm && !form.staffRole) {
        toast.error('Please select a manager team');
        return false;
      }
      if (!form.role) {
        toast.error('Please select a system role');
        return false;
      }
      if (!form.staffRole) {
        toast.error('Please select a team');
        return false;
      }
    }
    if (step === 3) {
      if (managerRequired && !form.reportsTo) {
        toast.error(`Please assign a ${managerLabelForRole(systemRole)}`);
        return false;
      }
    }
    return true;
  };

  const nextFormStep = () => {
    if (validateFormStep(formStep)) {
      setFormStep((s) => Math.min(s + 1, EMPLOYEE_FORM_STEPS.length));
    }
  };

  const prevFormStep = () => setFormStep((s) => Math.max(s - 1, 1));

  const saveEmployee = async (e) => {
    if (e) e.preventDefault();
    if (!validateFormStep(1) || !validateFormStep(2) || !validateFormStep(3)) return;
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || undefined,
        employeeId: form.employeeId.trim(),
        staffRole: form.staffRole,
        reportsTo: form.reportsTo || undefined,
        setAsTeamLead: Boolean(form.isTeamLead),
        isActive: form.isActive,
      };
      payload.role = form.role;
      if (isManagerForm) {
        const mgrTeam = settingsTeams.find((t) => t._id === form.staffRole);
        const deptKey = inferTeamDepartment(mgrTeam);
        if (deptKey && deptKey !== 'manager') payload.departmentName = departmentLabel(deptKey);
      }
      if (form.password) payload.password = form.password;

      if (editId) {
        if (!payload.password) delete payload.password;
        await usersAPI.update(editId, payload);
        toast.success('Employee updated');
      } else {
        if (!payload.password) {
          toast.error('Password is required');
          return;
        }
        if (form.password !== confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        await usersAPI.create(payload);
        toast.success('Employee saved');
      }
      setModal(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
    }
  };

  const deleteEmployee = async (employee) => {
    if (!confirm(`Delete employee ${employee.firstName} ${employee.lastName}?`)) return;
    try {
      await usersAPI.delete(employee._id);
      toast.success('Employee deleted');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filteredEmployees = useMemo(() => {
    if (roleFilter === 'all') return employees;
    return employees.filter((e) => e.role === roleFilter);
  }, [employees, roleFilter]);

  const roleCounts = useMemo(() => employees.reduce((acc, e) => {
    acc[e.role] = (acc[e.role] || 0) + 1;
    return acc;
  }, {}), [employees]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCog size={24} className="text-myth-accent" /> Employees
          </h1>
          <p className="text-gray-400 mt-1">Manage employees and assign teams from Settings</p>
        </div>
        <button type="button" onClick={() => openAdd()} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Employee
        </button>
      </div>

      <div className="card border border-myth-border/80 bg-myth-surface/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-white font-medium">Teams come from Settings</p>
          <p className="text-xs text-gray-500 mt-1">Create teams in Settings → Teams, then assign employees here.</p>
        </div>
        <Link to="/settings?tab=staff-roles" className="btn-secondary inline-flex items-center gap-2 shrink-0">
          <Settings size={16} /> Manage Teams
        </Link>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'employees' ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}
        >
          <UsersIcon size={16} /> Employees ({employees.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('teams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'teams' ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}
        >
          <Shield size={16} /> Teams ({settingsTeams.length})
        </button>
      </div>

      {tab === 'employees' ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm ${roleFilter === 'all' ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}
            >
              All ({employees.length})
            </button>
            {EMPLOYEE_ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRoleFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm ${roleFilter === opt.value ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}
              >
                {opt.label} ({roleCounts[opt.value] || 0})
              </button>
            ))}
          </div>

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-myth-surface/50">
                  <tr>
                    <th className="table-header">Employee</th>
                    <th className="table-header">Employee ID</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Team</th>
                    <th className="table-header">Role</th>
                    <th className="table-header">Manager</th>
                    <th className="table-header">Team Lead</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-myth-border">
                  {filteredEmployees.map((e) => (
                    <tr key={e._id} className="hover:bg-myth-surface/30">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-myth-accent/20 flex items-center justify-center text-myth-accent text-xs font-bold">
                            {e.firstName[0]}{e.lastName[0]}
                          </div>
                          <span className="font-medium text-white">{e.firstName} {e.lastName}</span>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-myth-accent text-sm">{e.employeeId || '—'}</td>
                      <td className="table-cell">{e.email}</td>
                      <td className="table-cell text-white">{e.staffRole?.name || '—'}</td>
                      <td className="table-cell">
                        <span className={`badge ${roleColors[e.role] || 'bg-myth-surface text-gray-300'}`}>
                          {roleLabel(e.role)}
                        </span>
                      </td>
                      <td className="table-cell text-gray-300">
                        {e.reportsTo ? `${e.reportsTo.firstName} ${e.reportsTo.lastName}` : '—'}
                      </td>
                      <td className="table-cell">
                        {teamLeadIds.has(String(e._id)) ? (
                          <span className="badge bg-amber-500/20 text-amber-400">Team Lead</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${e.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {e.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-white" title="Edit employee">
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openPasswordChange(e)}
                            className="p-1.5 rounded hover:bg-blue-500/10 text-gray-400 hover:text-blue-400"
                            title="Change password"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteEmployee(e)}
                            disabled={e._id === currentUser?._id}
                            className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 disabled:opacity-30"
                            title="Delete employee"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="text-white font-medium mb-3">Role Teams (Settings)</h3>
          {TEAM_GROUP_OPTIONS.map((group) => (
            <div key={group.key}>
              <h3 className="text-white font-medium mb-3">{group.label}</h3>
              {teamsByGroup[group.key]?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamsByGroup[group.key].map((team) => {
                    const members = employeesByTeam[String(team._id)] || [];
                    return (
                      <div key={team._id} className="card">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <Link
                              to={`/teams/detail/${team._id}`}
                              className="font-semibold text-white hover:text-myth-accent transition-colors"
                            >
                              {team.name}
                            </Link>
                            <p className="text-sm text-gray-400 mt-1">{team.description || 'No description'}</p>
                            {team.teamLeader && (
                              <p className="text-xs text-myth-accent mt-1">
                                Team Lead: {team.teamLeader.firstName} {team.teamLeader.lastName}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">{members.length} employee{members.length === 1 ? '' : 's'}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link
                              to={`/teams/detail/${team._id}`}
                              className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1 justify-center"
                            >
                              <Eye size={14} /> View Details
                            </Link>
                            <button type="button" onClick={() => openAdd(team._id)} className="btn-secondary text-xs py-1.5 px-3">
                              Add Employee
                            </button>
                          </div>
                        </div>
                        {members.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-myth-border space-y-3">
                            {members.map((m) => (
                              <div key={m._id} className="relative group">
                                <TeamMemberCard
                                  member={m}
                                  compact
                                  isLeader={team.teamLeader && String(team.teamLeader._id || team.teamLeader) === String(m._id)}
                                />
                                <button
                                  type="button"
                                  onClick={() => openEdit(m)}
                                  className="absolute top-3 right-3 p-1.5 rounded hover:bg-myth-surface text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Edit employee"
                                >
                                  <Pencil size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-myth-border rounded-xl">
                  No teams in {group.label}. <Link to="/settings?tab=staff-roles" className="text-myth-accent hover:underline">Create in Settings</Link>
                </p>
              )}
            </div>
          ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={modal === 'employee'}
        onClose={() => setModal(null)}
        title={editId ? 'Edit Employee' : 'Add Employee'}
        size="xl"
      >
        <form onSubmit={saveEmployee} className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {EMPLOYEE_FORM_STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (editId || step.id <= formStep) setFormStep(step.id);
                }}
                className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg text-left border transition-colors ${
                  formStep === step.id
                    ? 'border-myth-accent bg-myth-accent/10'
                    : 'border-myth-border bg-myth-surface/30'
                }`}
              >
                <p className={`text-xs font-semibold ${formStep === step.id ? 'text-myth-accent' : 'text-gray-400'}`}>
                  Step {step.id}
                </p>
                <p className="text-sm text-white font-medium">{step.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">{step.hint}</p>
              </button>
            ))}
          </div>

          {formStep === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">First Name *</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Last Name *</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Phone Number *</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field w-full" placeholder="+91 98765 43210" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Employee ID *</label>
                <input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="input-field w-full font-mono" placeholder="e.g. EMP-001" required />
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 text-xs text-gray-400">
                Pick system role, then team from Settings → Teams.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">System Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="input-field w-full"
                    required
                  >
                    {EMPLOYEE_ROLE_OPTIONS.filter((o) => editId || o.value !== 'manager').map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">{isManagerForm ? 'Manager Team *' : 'Team *'}</label>
                  <select
                    value={form.staffRole}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="input-field w-full"
                    required
                    disabled={!teamsForSelectedRole.length}
                  >
                    <option value="">
                      {teamsForSelectedRole.length
                        ? 'Select team'
                        : `No ${isManagerForm ? 'manager' : teamGroupLabel(ROLE_TO_TEAM_GROUP[systemRole])} teams`}
                    </option>
                    {teamsForSelectedRole.map((team) => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                  {!teamsForSelectedRole.length && (
                    <p className="text-xs text-amber-400/80 mt-1">
                      <Link to="/settings?tab=staff-roles" className="underline">Create teams in Settings</Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {formStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 text-xs text-gray-400">
                <strong className="text-gray-300">Assign Manager</strong> = who this person reports to.
                <strong className="text-gray-300"> Team Lead</strong> = senior person on this role team (optional).
              </div>
              {form.staffRole && !isManagerForm && (
                <label className="flex items-start gap-3 p-3 rounded-lg border border-myth-border bg-myth-surface/30 cursor-pointer">
                  <input type="checkbox" checked={form.isTeamLead} onChange={(e) => setForm({ ...form, isTeamLead: e.target.checked })} className="mt-1 text-myth-accent" />
                  <span>
                    <span className="block text-sm text-white font-medium">Set as Team Lead</span>
                    <span className="block text-xs text-gray-400 mt-1">
                      Team lead for <strong className="text-gray-300">{selectedTeam?.name}</strong>
                      {currentTeamLead && !form.isTeamLead && String(currentTeamLead._id || currentTeamLead) !== String(editId) && (
                        <> — replaces {currentTeamLead.firstName} {currentTeamLead.lastName}</>
                      )}
                    </span>
                  </span>
                </label>
              )}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Assign Manager{managerRequired ? ' *' : ''}
                  {!isManagerForm && systemRole && (
                    <span className="text-gray-500 font-normal"> — {managerLabelForRole(systemRole)}</span>
                  )}
                </label>
                <select
                  value={form.reportsTo}
                  onChange={(e) => setForm({ ...form, reportsTo: e.target.value })}
                  className="input-field w-full"
                  disabled={isManagerForm || !systemRole}
                  required={managerRequired}
                >
                  <option value="">
                    {isManagerForm ? 'Not required for Manager' : managersForReportsTo.length ? `Select ${managerLabelForRole(systemRole)}` : `No ${managerLabelForRole(systemRole)} found`}
                  </option>
                  {reportsToOptions.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.firstName} {m.lastName}{m.employeeId ? ` (${m.employeeId})` : ''}{m.staffRole?.name ? ` — ${m.staffRole.name}` : ''}
                    </option>
                  ))}
                </select>
                {selectedManager && (
                  <div className="mt-2 rounded-lg bg-myth-surface/50 p-3 text-sm">
                    <p className="text-white font-medium">{selectedManager.firstName} {selectedManager.lastName}</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedManager.employeeId || '—'} · {selectedManager.email}</p>
                    {selectedManager.staffRole?.name && <p className="text-xs text-myth-accent mt-1">Manager team: {selectedManager.staffRole.name}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {formStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">{editId ? 'New Password (optional)' : 'Password *'}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field w-full" minLength={6} required={!editId} />
                </div>
                {!editId && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Confirm Password *</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field w-full" minLength={6} required />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Status</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="radio" name="employeeStatus" checked={form.isActive} onChange={() => setForm({ ...form, isActive: true })} className="text-myth-accent" />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="radio" name="employeeStatus" checked={!form.isActive} onChange={() => setForm({ ...form, isActive: false })} className="text-myth-accent" />
                    Inactive
                  </label>
                </div>
              </div>
              <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 text-sm text-gray-400">
                <p><span className="text-white">{form.firstName} {form.lastName}</span> · {roleLabel(form.role)} · {selectedTeam?.name || '—'}</p>
                {form.reportsTo && selectedManager && (
                  <p className="mt-1">Manager: {selectedManager.firstName} {selectedManager.lastName}</p>
                )}
                {form.isTeamLead && <p className="mt-1 text-amber-400">Team Lead for {selectedTeam?.name}</p>}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-between pt-2 border-t border-myth-border">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <div className="flex gap-2">
              {formStep > 1 && (
                <button type="button" onClick={prevFormStep} className="btn-secondary">Back</button>
              )}
              {formStep < EMPLOYEE_FORM_STEPS.length ? (
                <button type="button" onClick={nextFormStep} className="btn-primary">Next</button>
              ) : (
                <button type="submit" className="btn-primary">Save Employee</button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {modal === 'password' && passwordChangeUser && (
        <Modal isOpen onClose={() => setModal(null)} title="Change Password" size="md">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-4">
              <p className="text-sm text-white font-medium">{passwordChangeUser.firstName} {passwordChangeUser.lastName}</p>
              <p className="text-xs text-gray-400 mt-1">{passwordChangeUser.email}</p>
              <p className="text-xs text-gray-500 mt-1">Role: {roleLabel(passwordChangeUser.role)}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field w-full"
                minLength={6}
                required
                placeholder="Enter new password (minimum 6 characters)"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters required</p>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-myth-border">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={changingPassword}>
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
