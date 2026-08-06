import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, CheckCircle2, Upload, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI, staffRolesAPI, rolesAPI, departmentsAPI } from '../../services/api';
import {
  HIRE_EMPLOYEE_STEPS,
  GENDER_OPTIONS,
  SHIFT_OPTIONS,
  SALARY_TYPE_OPTIONS,
  QUALIFICATION_OPTIONS,
  RELATIONSHIP_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  emptyHireEmployeeForm,
} from '../../constants/hireEmployeeForm';
import {
  managerLabelForRole,
  getManagersForRole,
  pickManagerForRole,
  inferSystemRoleFromDepartment,
  inferTeamGroupFromDepartmentName,
} from '../../utils/hireFormHelpers';
import LoadingSpinner from '../LoadingSpinner';
import useEmailAvailability from '../../hooks/useEmailAvailability';

function FileUploadField({ label, file, onChange, accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-myth-border bg-myth-surface/30 cursor-pointer hover:border-myth-accent/40">
        <Upload size={16} className="text-gray-500 shrink-0" />
        <span className="text-sm text-gray-400 truncate flex-1">
          {file ? file.name : 'Choose file to upload'}
        </span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
}

export default function HireEmployeeSettings() {
  const [form, setForm] = useState(emptyHireEmployeeForm());
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [docFiles, setDocFiles] = useState({});
  const [settingsTeams, setSettingsTeams] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [lastHired, setLastHired] = useState(null);
  const { status: emailStatus, checking: emailChecking } = useEmailAvailability(form.email);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      usersAPI.getAll(),
      staffRolesAPI.getOptions(),
      rolesAPI.getAll(),
      departmentsAPI.getAll(),
    ])
      .then(([empRes, teamsRes, rolesRes, deptRes]) => {
        setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
        setSettingsTeams(teamsRes.data?.items || []);
        const roles = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.items || []);
        setJobRoles(roles.filter((r) => r.status !== 'inactive'));
        setDepartments(deptRes.data?.items || []);
      })
      .catch(() => toast.error('Failed to load hire form data'))
      .finally(() => setLoading(false));
  }, []);

  const activeSettingsTeams = useMemo(
    () => settingsTeams.filter((t) => t.status !== 'inactive'),
    [settingsTeams]
  );

  const selectedDepartment = useMemo(
    () => departments.find((d) => String(d._id) === String(form.departmentId)),
    [departments, form.departmentId]
  );

  const rolesForDepartment = useMemo(() => {
    if (!form.departmentId) return jobRoles;
    return jobRoles.filter((r) => {
      const deptId = r.department?._id || r.department;
      return String(deptId) === String(form.departmentId);
    });
  }, [jobRoles, form.departmentId]);

  const selectedJobRole = useMemo(
    () => jobRoles.find((r) => String(r._id) === String(form.roleId)),
    [jobRoles, form.roleId]
  );

  const systemRole = useMemo(() => {
    if (selectedDepartment?.name) return inferTeamGroupFromDepartmentName(selectedDepartment.name);
    return inferSystemRoleFromDepartment(selectedJobRole?.department);
  }, [selectedDepartment, selectedJobRole]);

  const managersForReportsTo = useMemo(
    () => getManagersForRole(systemRole, employees, activeSettingsTeams),
    [employees, activeSettingsTeams, systemRole]
  );

  const selectedManager = useMemo(
    () => employees.find((e) => String(e._id) === String(form.reportsTo)),
    [employees, form.reportsTo]
  );

  const managerRequired = ['sales', 'technical', 'support'].includes(systemRole);

  const field = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const fieldHr = (key, val) => setForm((prev) => ({
    ...prev,
    hrProfile: { ...prev.hrProfile, [key]: val },
  }));

  const setLoginEmail = (value) => {
    setForm((prev) => ({
      ...prev,
      email: value,
      hrProfile: { ...prev.hrProfile, personalEmail: value },
    }));
  };

  const handleDepartmentChange = (departmentId) => {
    const dept = departments.find((d) => String(d._id) === String(departmentId));
    const group = dept ? inferTeamGroupFromDepartmentName(dept.name) : 'sales';
    const deptRoles = jobRoles.filter((r) => {
      const deptId = r.department?._id || r.department;
      return String(deptId) === String(departmentId);
    });
    setForm((prev) => {
      const roleStillValid = prev.roleId && deptRoles.some((r) => String(r._id) === String(prev.roleId));
      return {
        ...prev,
        departmentId,
        roleId: roleStillValid ? prev.roleId : '',
        reportsTo: pickManagerForRole(group, employees, activeSettingsTeams, prev.reportsTo),
      };
    });
  };

  const handleRoleIdChange = (roleId) => {
    const jobRole = jobRoles.find((r) => String(r._id) === String(roleId));
    const sysRole = inferSystemRoleFromDepartment(jobRole?.department);
    setForm((prev) => ({
      ...prev,
      roleId,
      reportsTo: pickManagerForRole(sysRole, employees, activeSettingsTeams, prev.reportsTo),
    }));
  };

  const validateFormStep = (step) => {
    const hp = form.hrProfile;
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        toast.error('First and last name are required');
        return false;
      }
      if (!hp.gender) {
        toast.error('Gender is required');
        return false;
      }
      if (!hp.dateOfBirth) {
        toast.error('Date of birth is required');
        return false;
      }
      if (!form.phone?.trim()) {
        toast.error('Mobile number is required');
        return false;
      }
    }
    if (step === 2) {
      if (!form.departmentId) {
        toast.error('Please select a department');
        return false;
      }
      if (!form.roleId) {
        toast.error('Please select a role');
        return false;
      }
      if (managerRequired && !form.reportsTo) {
        toast.error(`Please select a ${managerLabelForRole(systemRole)}`);
        return false;
      }
      if (!form.joiningDate) {
        toast.error('Joining date is required');
        return false;
      }
    }
    if (step === 3) {
      if (!form.email.trim()) {
        toast.error('Personal email (login) is required');
        return false;
      }
      if (emailStatus?.available === false) {
        toast.error(emailStatus.message || 'This email is already registered');
        return false;
      }
      if (!form.password || form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return false;
      }
      if (form.password !== confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const nextFormStep = () => {
    if (validateFormStep(formStep)) {
      setFormStep((s) => Math.min(s + 1, HIRE_EMPLOYEE_STEPS.length));
    }
  };

  const prevFormStep = () => setFormStep((s) => Math.max(s - 1, 1));

  const resetForm = () => {
    setForm(emptyHireEmployeeForm());
    setProfilePhoto(null);
    setDocFiles({});
    setConfirmPassword('');
    setShowPass(false);
    setFormStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFormStep(1) || !validateFormStep(2) || !validateFormStep(3)) {
      setFormStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const hp = { ...form.hrProfile };
      const docNames = {};
      Object.entries(docFiles).forEach(([key, file]) => {
        if (file) docNames[key] = file.name;
      });
      hp.documents = { ...hp.documents, ...docNames };

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        employeeId: form.employeeId.trim() || undefined,
        role: systemRole,
        roleId: form.roleId,
        department: form.departmentId,
        reportsTo: form.reportsTo || undefined,
        joiningDate: form.joiningDate,
        employmentType: form.employmentType,
        isActive: form.isActive,
        password: form.password,
        hrProfile: hp,
      };

      const { data: created } = await usersAPI.create(payload);

      if (profilePhoto) {
        const fd = new FormData();
        fd.append('avatar', profilePhoto);
        await usersAPI.update(created._id, fd);
      }

      const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      setLastHired({
        name,
        role: selectedJobRole?.name || '—',
        manager: selectedManager
          ? `${selectedManager.firstName} ${selectedManager.lastName}`
          : null,
        email: form.email.trim(),
      });
      toast.success(`${name} hired successfully!`);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to hire employee');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const hp = form.hrProfile;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 border-b border-myth-border pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-myth-accent/15">
            <UserPlus size={20} className="text-myth-accent" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">Employee Hiring Form</h3>
        </div>
        <p className="text-sm text-gray-400 ml-11">
          Complete all sections — personal, employment, login, salary, skills, emergency contact, documents, and remarks.
        </p>
      </div>

      {lastHired && (
        <div className="flex items-center gap-2 mb-5 p-3 rounded-lg bg-green-500/10 border border-green-500/25 text-green-400 text-sm">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>
            <strong>{lastHired.name}</strong> hired as <strong>{lastHired.role}</strong>
            {lastHired.manager ? ` · reports to ${lastHired.manager}` : ''}
            {lastHired.email ? ` · login: ${lastHired.email}` : ''}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        <div className="flex flex-wrap gap-2">
          {HIRE_EMPLOYEE_STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => step.id <= formStep && setFormStep(step.id)}
              className={`flex-1 min-w-[90px] px-2 py-2 rounded-lg text-left border transition-colors ${
                formStep === step.id
                  ? 'border-myth-accent bg-myth-accent/10'
                  : 'border-myth-border bg-myth-surface/30'
              }`}
            >
              <p className={`text-[10px] font-semibold ${formStep === step.id ? 'text-myth-accent' : 'text-gray-500'}`}>
                {step.id}. {step.label}
              </p>
            </button>
          ))}
        </div>

        {formStep === 1 && (
          <div className="space-y-4 border border-myth-border rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white">1. Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">First Name *</label>
                <input value={form.firstName} onChange={(e) => field('firstName', e.target.value)} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Last Name *</label>
                <input value={form.lastName} onChange={(e) => field('lastName', e.target.value)} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Gender *</label>
                <select value={hp.gender} onChange={(e) => fieldHr('gender', e.target.value)} className="input-field w-full" required>
                  {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Date of Birth *</label>
                <input type="date" value={hp.dateOfBirth} onChange={(e) => fieldHr('dateOfBirth', e.target.value)} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Mobile Number *</label>
                <input value={form.phone} onChange={(e) => field('phone', e.target.value)} className="input-field w-full" placeholder="+91 98765 43210" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Personal Email</label>
                <input type="email" value={hp.personalEmail} onChange={(e) => setLoginEmail(e.target.value)} className="input-field w-full" />
              </div>
              <div className="sm:col-span-2">
                <FileUploadField label="Profile Photo" file={profilePhoto} onChange={setProfilePhoto} accept="image/*" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Address</label>
                <input value={hp.address} onChange={(e) => fieldHr('address', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">City</label>
                <input value={hp.city} onChange={(e) => fieldHr('city', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">State</label>
                <input value={hp.state} onChange={(e) => fieldHr('state', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Country</label>
                <input value={hp.country} onChange={(e) => fieldHr('country', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">PIN Code</label>
                <input value={hp.pinCode} onChange={(e) => fieldHr('pinCode', e.target.value)} className="input-field w-full" />
              </div>
            </div>
          </div>
        )}

        {formStep === 2 && (
          <div className="space-y-4 border border-myth-border rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white">2. Employment Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Department *</label>
                <select value={form.departmentId} onChange={(e) => handleDepartmentChange(e.target.value)} className="input-field w-full" required>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Role *</label>
                <select value={form.roleId} onChange={(e) => handleRoleIdChange(e.target.value)} className="input-field w-full" required disabled={!form.departmentId}>
                  <option value="">{rolesForDepartment.length ? 'Select Role' : 'No roles for department'}</option>
                  {rolesForDepartment.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
                {!rolesForDepartment.length && form.departmentId && (
                  <p className="text-xs text-amber-400/80 mt-1"><Link to="/settings?tab=roles" className="underline">Create roles in Settings</Link></p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Reporting Manager *</label>
                <select value={form.reportsTo} onChange={(e) => field('reportsTo', e.target.value)} className="input-field w-full" required={managerRequired}>
                  <option value="">{managersForReportsTo.length ? 'Select Manager' : 'No manager found'}</option>
                  {managersForReportsTo.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.firstName} {m.lastName}{m.employeeId ? ` (${m.employeeId})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Joining Date *</label>
                <input type="date" value={form.joiningDate} onChange={(e) => field('joiningDate', e.target.value)} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Employment Type *</label>
                <select value={form.employmentType} onChange={(e) => field('employmentType', e.target.value)} className="input-field w-full">
                  {EMPLOYMENT_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Work Location</label>
                <input value={hp.workLocation} onChange={(e) => fieldHr('workLocation', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Shift</label>
                <select value={hp.shift} onChange={(e) => fieldHr('shift', e.target.value)} className="input-field w-full">
                  {SHIFT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Employment Status *</label>
                <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => field('isActive', e.target.value === 'active')} className="input-field w-full">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Employee ID</label>
                <input value={form.employeeId} onChange={(e) => field('employeeId', e.target.value)} className="input-field w-full font-mono" placeholder="Auto-generated if empty" />
              </div>
            </div>
          </div>
        )}

        {formStep === 3 && (
          <div className="space-y-4 border border-myth-border rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white">3. Login Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Personal Email (Login) *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="input-field w-full"
                  autoComplete="off"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Employee will sign in with this personal email.</p>
                {emailChecking && <p className="text-xs text-gray-500 mt-1">Checking email…</p>}
                {emailStatus?.available === false && (
                  <p className="text-xs text-red-400 mt-1">{emailStatus.message}</p>
                )}
                {emailStatus?.available === true && (
                  <p className="text-xs text-green-400 mt-1">Email is available</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => field('password', e.target.value)}
                    className="input-field w-full pr-10"
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field w-full"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Account Status *</label>
                <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => field('isActive', e.target.value === 'active')} className="input-field w-full">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 text-xs text-gray-400">
              <strong className="text-gray-300">Note:</strong> Share the personal email and password with the employee so they can log in.
            </div>
          </div>
        )}

        {formStep === 4 && (
          <div className="space-y-4 border border-myth-border rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white">4. Salary Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Salary</label>
                <input type="number" min={0} value={hp.salary} onChange={(e) => fieldHr('salary', e.target.value)} className="input-field w-full" placeholder="Amount" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Salary Type</label>
                <select value={hp.salaryType} onChange={(e) => fieldHr('salaryType', e.target.value)} className="input-field w-full">
                  {SALARY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Bank Name</label>
                <input value={hp.bankName} onChange={(e) => fieldHr('bankName', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Account Holder Name</label>
                <input value={hp.accountHolderName} onChange={(e) => fieldHr('accountHolderName', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Account Number</label>
                <input value={hp.accountNumber} onChange={(e) => fieldHr('accountNumber', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">IFSC Code</label>
                <input value={hp.ifscCode} onChange={(e) => fieldHr('ifscCode', e.target.value)} className="input-field w-full" />
              </div>
            </div>
          </div>
        )}

        {formStep === 5 && (
          <div className="space-y-4 border border-myth-border rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white">5. Skills & Qualifications</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Highest Qualification</label>
                <select value={hp.highestQualification} onChange={(e) => fieldHr('highestQualification', e.target.value)} className="input-field w-full">
                  {QUALIFICATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Experience (Years)</label>
                <input type="number" min={0} value={hp.experienceYears} onChange={(e) => fieldHr('experienceYears', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Primary Skill</label>
                <input value={hp.primarySkill} onChange={(e) => fieldHr('primarySkill', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Secondary Skill</label>
                <input value={hp.secondarySkill} onChange={(e) => fieldHr('secondarySkill', e.target.value)} className="input-field w-full" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Certifications</label>
                <input value={hp.certifications} onChange={(e) => fieldHr('certifications', e.target.value)} className="input-field w-full" placeholder="e.g. AWS Certified, PMP" />
              </div>
            </div>
          </div>
        )}

        {formStep === 6 && (
          <div className="space-y-4 border border-myth-border rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white">6. Emergency Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Contact Person Name</label>
                <input value={hp.emergencyContactName} onChange={(e) => fieldHr('emergencyContactName', e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Relationship</label>
                <select value={hp.emergencyContactRelationship} onChange={(e) => fieldHr('emergencyContactRelationship', e.target.value)} className="input-field w-full">
                  {RELATIONSHIP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Contact Number</label>
                <input value={hp.emergencyContactPhone} onChange={(e) => fieldHr('emergencyContactPhone', e.target.value)} className="input-field w-full" />
              </div>
            </div>
          </div>
        )}

        {formStep === 7 && (
          <div className="space-y-4 border border-myth-border rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white">7. Documents</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUploadField label="Resume" file={docFiles.resume} onChange={(f) => setDocFiles((p) => ({ ...p, resume: f }))} />
              <FileUploadField label="Aadhaar Card" file={docFiles.aadhaar} onChange={(f) => setDocFiles((p) => ({ ...p, aadhaar: f }))} accept="image/*,.pdf" />
              <FileUploadField label="PAN Card" file={docFiles.pan} onChange={(f) => setDocFiles((p) => ({ ...p, pan: f }))} accept="image/*,.pdf" />
              <FileUploadField label="Educational Certificates" file={docFiles.educationalCertificates} onChange={(f) => setDocFiles((p) => ({ ...p, educationalCertificates: f }))} />
              <FileUploadField label="Passport Photo" file={docFiles.passportPhoto} onChange={(f) => setDocFiles((p) => ({ ...p, passportPhoto: f }))} accept="image/*" />
            </div>
            <p className="text-xs text-gray-500">Document filenames are stored with the employee record. Full file storage can be linked later.</p>
          </div>
        )}

        {formStep === 8 && (
          <div className="space-y-4 border border-myth-border rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white">8. Additional Information</h4>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Remarks</label>
              <textarea value={hp.remarks} onChange={(e) => fieldHr('remarks', e.target.value)} className="input-field w-full h-24" placeholder="Any additional notes..." />
            </div>
            <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 text-sm text-gray-400">
              <p><span className="text-white">{form.firstName} {form.lastName}</span> · {selectedJobRole?.name || '—'}</p>
              <p className="mt-1">Login: {form.email || '—'}</p>
              {form.reportsTo && selectedManager && (
                <p className="mt-1">Manager: {selectedManager.firstName} {selectedManager.lastName}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-between pt-2 border-t border-myth-border">
          <button type="button" onClick={resetForm} className="btn-secondary">Reset</button>
          <div className="flex gap-2">
            {formStep > 1 && (
              <button type="button" onClick={prevFormStep} className="btn-secondary">Back</button>
            )}
            {formStep < HIRE_EMPLOYEE_STEPS.length ? (
              <button type="button" onClick={nextFormStep} className="btn-primary">Next</button>
            ) : (
              <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2 min-w-[140px] justify-center">
                <UserPlus size={17} />
                {submitting ? 'Saving…' : 'Save Employee'}
              </button>
            )}
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
}
