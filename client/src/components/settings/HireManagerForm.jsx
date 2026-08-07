import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI, staffRolesAPI } from '../../services/api';
import { MANAGER_FORM_STEPS } from '../../constants/orgStructure';
import { PLACEHOLDERS } from '../../constants/projectSamples';
import {
  getManagerTeams,
  managerTeamsByDepartment,
  departmentLabel,
  managerTypeLabel,
  defaultManagerTeamId,
  splitFullName,
} from '../../utils/hireFormHelpers';
import { inferTeamDepartment } from '../../utils/roleContext';
import LoadingSpinner from '../LoadingSpinner';
import useEmailAvailability from '../../hooks/useEmailAvailability';
import ManagerTypePicker from './ManagerTypePicker';

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
];

const emptyForm = {
  employeeId: '',
  fullName: '',
  email: '',
  phone: '',
  departmentKey: '',
  staffRole: '',
  joiningDate: '',
  employmentType: 'full_time',
  password: '',
  isActive: true,
};

export default function HireManagerForm() {
  const [form, setForm] = useState(emptyForm);
  const [settingsTeams, setSettingsTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [lastHired, setLastHired] = useState(null);
  const { status: emailStatus, checking: emailChecking } = useEmailAvailability(form.email);

  useEffect(() => {
    setLoading(true);
    Promise.all([usersAPI.getAll(), staffRolesAPI.getOptions()])
      .then(([empRes, teamsRes]) => {
        setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
        setSettingsTeams(teamsRes.data?.items || []);
      })
      .catch(() => toast.error('Failed to load hire form data'))
      .finally(() => setLoading(false));
  }, []);

  const activeSettingsTeams = useMemo(
    () => settingsTeams.filter((t) => t.status !== 'inactive'),
    [settingsTeams]
  );

  const managerTeams = useMemo(() => getManagerTeams(activeSettingsTeams), [activeSettingsTeams]);
  const teamsByDept = useMemo(() => managerTeamsByDepartment(managerTeams), [managerTeams]);

  const managersByDept = useMemo(() => {
    const map = { sales: [], technical: [], support: [] };
    employees.forEach((e) => {
      if (e.isActive === false || e.role !== 'manager') return;
      const dept = inferTeamDepartment(e.staffRole);
      if (map[dept]) map[dept].push(e);
    });
    return map;
  }, [employees]);

  const selectedTeam = settingsTeams.find((t) => t._id === form.staffRole);

  const field = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleEmailChange = (val) => {
    field('email', val);
  };

  const handleDepartmentSelect = (deptKey, staffRole) => {
    setForm((prev) => ({
      ...prev,
      departmentKey: deptKey,
      staffRole: staffRole || defaultManagerTeamId(deptKey, teamsByDept),
    }));
  };

  const validateFormStep = (step) => {
    if (step === 1) {
      const { firstName } = splitFullName(form.fullName);
      if (!form.employeeId.trim()) {
        toast.error('Employee ID is required');
        return false;
      }
      if (!firstName) {
        toast.error('Full name is required');
        return false;
      }
      if (!form.email.trim()) {
        toast.error('Email is required');
        return false;
      }
      if (emailStatus?.available === false) {
        toast.error(emailStatus.message || 'This email is already registered');
        return false;
      }
      if (!form.phone?.trim()) {
        toast.error('Phone number is required');
        return false;
      }
      if (!form.joiningDate) {
        toast.error('Joining date is required');
        return false;
      }
    }
    if (step === 2) {
      if (!form.departmentKey) {
        toast.error('Select Sales Manager, Technical Manager, or Support Manager');
        return false;
      }
      if (!form.staffRole) {
        toast.error('No manager team configured for this type — check Settings → Teams');
        return false;
      }
    }
    return true;
  };

  const nextFormStep = () => {
    if (validateFormStep(formStep)) {
      setFormStep((s) => Math.min(s + 1, MANAGER_FORM_STEPS.length));
    }
  };

  const prevFormStep = () => setFormStep((s) => Math.max(s - 1, 1));

  const resetForm = () => {
    setForm(emptyForm);
    setFormStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFormStep(1) || !validateFormStep(2)) return;
    if (!form.password || form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const { firstName, lastName } = splitFullName(form.fullName);

    setSubmitting(true);
    try {
      await usersAPI.create({
        employeeId: form.employeeId.trim(),
        firstName,
        lastName,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: 'manager',
        staffRole: form.staffRole,
        departmentName: departmentLabel(form.departmentKey),
        joiningDate: form.joiningDate,
        employmentType: form.employmentType,
        password: form.password,
        isActive: form.isActive,
      });

      const name = `${firstName} ${lastName}`.trim();
      setLastHired({
        name,
        dept: departmentLabel(form.departmentKey),
        team: selectedTeam?.name,
      });
      toast.success(`${name} hired as ${managerTypeLabel(form.departmentKey)}!`);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to hire manager');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const noManagerTeams = managerTeams.length === 0;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
        <div className="p-2 lg:p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/20">
          <ShieldCheck size={16} lg:size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-base lg:text-lg font-bold text-white">Hire Manager</h3>
          <p className="text-[10px] lg:text-xs text-gray-400 mt-0.5">
            One manager per department (Sales, Technical, Support). They receive the correct manager dashboard.
          </p>
        </div>
      </div>

      {lastHired && (
        <div className="flex items-center gap-2 mb-4 lg:mb-5 p-3 rounded-lg bg-green-500/10 border border-green-500/25 text-green-400 text-xs lg:text-sm">
          <CheckCircle2 size={14} lg:size={16} className="shrink-0" />
          <span>
            <strong>{lastHired.name}</strong> hired as <strong>{lastHired.dept} Manager</strong>
            {lastHired.team ? ` · ${lastHired.team}` : ''}.
          </span>
        </div>
      )}

      {noManagerTeams && (
        <div className="mb-4 lg:mb-5 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs lg:text-sm">
          No manager teams found. Create manager teams (e.g. Sales Managers, Tech Managers) in{' '}
          <Link to="/settings?tab=teams" className="underline font-medium">Settings → Teams</Link> first.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6" autoComplete="off">
        <div className="flex flex-wrap gap-2">
          {MANAGER_FORM_STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => step.id <= formStep && setFormStep(step.id)}
              className={`flex-1 min-w-[100px] lg:min-w-[120px] px-2 lg:px-3 py-2 rounded-lg text-left border transition-colors ${
                formStep === step.id
                  ? 'border-blue-400 bg-blue-500/10'
                  : 'border-myth-border bg-myth-surface/30'
              }`}
            >
              <p className={`text-[10px] lg:text-xs font-semibold ${formStep === step.id ? 'text-blue-400' : 'text-gray-400'}`}>
                Step {step.id}
              </p>
              <p className="text-xs lg:text-sm text-white font-medium">{step.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">{step.hint}</p>
            </button>
          ))}
        </div>

        {formStep === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1.5">Employee ID *</label>
              <input
                value={form.employeeId}
                onChange={(e) => field('employeeId', e.target.value)}
                className="input-field w-full font-mono tracking-wide"
                placeholder={PLACEHOLDERS.hireManager.employeeId}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1.5">Full Name *</label>
              <input
                value={form.fullName}
                onChange={(e) => field('fullName', e.target.value)}
                className="input-field w-full"
                placeholder={PLACEHOLDERS.hireManager.fullName}
                required
              />
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1.5">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="input-field w-full"
                placeholder={PLACEHOLDERS.hireManager.email}
                required
              />
              {emailChecking && <p className="text-[10px] lg:text-xs text-gray-500 mt-1">Checking email…</p>}
              {emailStatus?.available === false && (
                <p className="text-[10px] lg:text-xs text-red-400 mt-1">{emailStatus.message}</p>
              )}
              {emailStatus?.available === true && (
                <p className="text-[10px] lg:text-xs text-green-400 mt-1">Email is available</p>
              )}
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1.5">Phone *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => field('phone', e.target.value)}
                className="input-field w-full"
                placeholder={PLACEHOLDERS.hireManager.phone}
                required
              />
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1.5">Joining Date *</label>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => field('joiningDate', e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1.5">Employment Type</label>
              <select
                value={form.employmentType}
                onChange={(e) => field('employmentType', e.target.value)}
                className="input-field w-full"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {formStep === 2 && (
          <ManagerTypePicker
            departmentKey={form.departmentKey}
            staffRole={form.staffRole}
            teamsByDept={teamsByDept}
            managersByDept={managersByDept}
            onSelect={handleDepartmentSelect}
          />
        )}

        {formStep === 3 && (
          <div className="space-y-3 lg:space-y-4">
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => field('password', e.target.value)}
                  className="input-field w-full pr-10"
                  placeholder="Min. 6 characters"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={13} lg:size={15} /> : <Eye size={13} lg:size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-2">Status</label>
              <div className="flex items-center gap-6 lg:gap-8">
                <label className="flex items-center gap-2 lg:gap-2.5 text-xs lg:text-sm text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="hireManagerStatus"
                    checked={form.isActive}
                    onChange={() => field('isActive', true)}
                    className="w-4 h-4 accent-blue-400"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 lg:gap-2.5 text-xs lg:text-sm text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="hireManagerStatus"
                    checked={!form.isActive}
                    onChange={() => field('isActive', false)}
                    className="w-4 h-4 accent-blue-400"
                  />
                  Inactive
                </label>
              </div>
            </div>
            <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 text-xs lg:text-sm text-gray-400">
              <p>
                <span className="text-white">{form.fullName || '—'}</span>
                · {form.departmentKey ? managerTypeLabel(form.departmentKey) : '—'}
                · {selectedTeam?.name || '—'}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 lg:gap-3 justify-between pt-2 border-t border-myth-border">
          <button type="button" onClick={resetForm} className="btn-secondary">Clear</button>
          <div className="flex gap-2">
            {formStep > 1 && (
              <button type="button" onClick={prevFormStep} className="btn-secondary">Back</button>
            )}
            {formStep < MANAGER_FORM_STEPS.length ? (
              <button type="button" onClick={nextFormStep} className="btn-primary bg-blue-600 hover:bg-blue-500">Next</button>
            ) : (
              <button
                type="submit"
                disabled={submitting || noManagerTeams}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              >
                <UserPlus size={16} />
                {submitting ? 'Hiring…' : 'Hire Manager'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
