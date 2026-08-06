import { useState, useEffect, useMemo } from 'react';
import { Pencil, Eye, EyeOff, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI, staffRolesAPI, rolesAPI, departmentsAPI } from '../../services/api';
import {
  emptyHrProfile,
  GENDER_OPTIONS,
  SHIFT_OPTIONS,
  SALARY_TYPE_OPTIONS,
  QUALIFICATION_OPTIONS,
  RELATIONSHIP_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
} from '../../constants/hireEmployeeForm';
import {
  getManagerTeams,
  managerTeamsByDepartment,
  departmentLabel,
  managerTypeLabel,
  defaultManagerTeamId,
  splitFullName,
  managerLabelForRole,
  getManagersForRole,
  inferSystemRoleFromDepartment,
  inferTeamGroupFromDepartmentName,
} from '../../utils/hireFormHelpers';
import { getManagerDepartment, inferTeamDepartment } from '../../utils/roleContext';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import ManagerTypePicker from './ManagerTypePicker';

function personName(p) {
  return `${p.firstName || ''} ${p.lastName || ''}`.trim() || '—';
}

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function personToEmployeeForm(person) {
  const hr = person.hrProfile || {};
  return {
    firstName: person.firstName || '',
    lastName: person.lastName || '',
    phone: person.phone || '',
    email: person.email || '',
    employeeId: person.employeeId || '',
    departmentId: String(person.department?._id || person.department || ''),
    roleId: String(person.roleId?._id || person.roleId || ''),
    reportsTo: String(person.reportsTo?._id || person.reportsTo || ''),
    joiningDate: toDateInput(person.joiningDate),
    employmentType: person.employmentType || 'full_time',
    isActive: person.isActive !== false,
    password: '',
    hrProfile: {
      ...emptyHrProfile(),
      ...hr,
      dateOfBirth: toDateInput(hr.dateOfBirth),
      documents: { ...emptyHrProfile().documents, ...(hr.documents || {}) },
    },
  };
}

function personToManagerForm(person) {
  return {
    employeeId: person.employeeId || '',
    fullName: personName(person),
    email: person.email || '',
    phone: person.phone || '',
    departmentKey: getManagerDepartment(person),
    staffRole: String(person.staffRole?._id || person.staffRole || ''),
    joiningDate: toDateInput(person.joiningDate),
    employmentType: person.employmentType || 'full_time',
    isActive: person.isActive !== false,
    password: '',
  };
}

export default function EditHiredStaffModal({ person, onClose, onSaved }) {
  const isManager = person?.role === 'manager';
  const [tab, setTab] = useState('basic');
  const [form, setForm] = useState(() => (isManager ? personToManagerForm(person) : personToEmployeeForm(person)));
  const [settingsTeams, setSettingsTeams] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const originalEmail = person?.email || '';

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
      .catch(() => toast.error('Failed to load edit form'))
      .finally(() => setLoading(false));
  }, []);

  const activeSettingsTeams = useMemo(
    () => settingsTeams.filter((t) => t.status !== 'inactive'),
    [settingsTeams],
  );

  const managerTeams = useMemo(() => getManagerTeams(activeSettingsTeams), [activeSettingsTeams]);
  const teamsByDept = useMemo(() => managerTeamsByDepartment(managerTeams), [managerTeams]);

  const selectedDepartment = useMemo(
    () => departments.find((d) => String(d._id) === String(form.departmentId)),
    [departments, form.departmentId],
  );

  const rolesForDepartment = useMemo(() => {
    if (!form.departmentId) return jobRoles;
    return jobRoles.filter((r) => {
      const deptId = r.department?._id || r.department;
      return String(deptId) === String(form.departmentId);
    });
  }, [jobRoles, form.departmentId]);

  const systemRole = useMemo(() => {
    if (isManager) return form.departmentKey;
    if (selectedDepartment?.name) return inferTeamGroupFromDepartmentName(selectedDepartment.name);
    const jobRole = jobRoles.find((r) => String(r._id) === String(form.roleId));
    return inferSystemRoleFromDepartment(jobRole?.department);
  }, [isManager, selectedDepartment, form.departmentId, form.roleId, form.departmentKey, jobRoles]);

  const managersForReportsTo = useMemo(
    () => getManagersForRole(systemRole, employees.filter((e) => e._id !== person._id), activeSettingsTeams),
    [employees, activeSettingsTeams, systemRole, person._id],
  );

  const managersByDept = useMemo(() => {
    const map = { sales: [], technical: [], support: [] };
    employees.forEach((e) => {
      if (e.isActive === false || e.role !== 'manager' || e._id === person._id) return;
      const dept = inferTeamDepartment(e.staffRole);
      if (map[dept]) map[dept].push(e);
    });
    return map;
  }, [employees, person._id]);

  const handleManagerTypeSelect = (deptKey, staffRole) => {
    setForm((prev) => ({
      ...prev,
      departmentKey: deptKey,
      staffRole: staffRole || defaultManagerTeamId(deptKey, teamsByDept),
    }));
  };

  const field = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const fieldHr = (key, val) => setForm((prev) => ({
    ...prev,
    hrProfile: { ...prev.hrProfile, [key]: val },
  }));

  const handleSave = async () => {
    if (isManager) {
      const { firstName, lastName } = splitFullName(form.fullName);
      if (!form.employeeId.trim() || !firstName || !form.email.trim() || !form.phone?.trim()) {
        toast.error('Employee ID, name, email, and phone are required');
        return;
      }
      if (!form.departmentKey || !form.staffRole) {
        toast.error('Select Sales Manager, Technical Manager, or Support Manager');
        return;
      }
    } else {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone?.trim()) {
        toast.error('Name, email, and phone are required');
        return;
      }
      if (!form.departmentId || !form.roleId) {
        toast.error('Department and job role are required');
        return;
      }
    }

    if (form.password && form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      let payload;
      if (isManager) {
        const { firstName, lastName } = splitFullName(form.fullName);
        payload = {
          employeeId: form.employeeId.trim(),
          firstName,
          lastName,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          role: 'manager',
          staffRole: form.staffRole,
          departmentName: departmentLabel(form.departmentKey),
          joiningDate: form.joiningDate || undefined,
          employmentType: form.employmentType,
          isActive: form.isActive,
        };
      } else {
        payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          employeeId: form.employeeId.trim() || undefined,
          role: systemRole,
          roleId: form.roleId,
          department: form.departmentId,
          reportsTo: form.reportsTo || undefined,
          joiningDate: form.joiningDate || undefined,
          employmentType: form.employmentType,
          isActive: form.isActive,
          hrProfile: form.hrProfile,
        };
      }
      if (form.password?.trim()) payload.password = form.password.trim();

      await usersAPI.update(person._id, payload);
      toast.success(`${personName(person)} updated`);
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update staff');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = isManager
    ? [
      { id: 'basic', label: 'Basic' },
      { id: 'employment', label: 'Employment' },
      { id: 'password', label: 'Password' },
    ]
    : [
      { id: 'basic', label: 'Basic' },
      { id: 'employment', label: 'Employment' },
      { id: 'hr', label: 'HR Details' },
      { id: 'password', label: 'Password' },
    ];

  return (
    <Modal isOpen onClose={onClose} title={`Edit — ${personName(person)}`} size="lg">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-myth-border pb-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  tab === t.id ? 'bg-myth-accent/20 text-myth-accent border border-myth-accent/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-4">
            {tab === 'basic' && (
              <>
                {isManager ? (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Employee ID</label>
                      <input className="input-field w-full" value={form.employeeId} onChange={(e) => field('employeeId', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Full name</label>
                      <input className="input-field w-full" value={form.fullName} onChange={(e) => field('fullName', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">First name</label>
                      <input className="input-field w-full" value={form.firstName} onChange={(e) => field('firstName', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Last name</label>
                      <input className="input-field w-full" value={form.lastName} onChange={(e) => field('lastName', e.target.value)} />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email (login)</label>
                    <input type="email" className="input-field w-full" value={form.email} onChange={(e) => field('email', e.target.value)} />
                    {form.email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() && (
                      <p className="text-xs text-amber-400/90 mt-1">Login email will change for this user</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Phone</label>
                    <input className="input-field w-full" value={form.phone} onChange={(e) => field('phone', e.target.value)} />
                  </div>
                </div>
                {!isManager && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Employee ID</label>
                    <input className="input-field w-full" value={form.employeeId} onChange={(e) => field('employeeId', e.target.value)} />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => field('isActive', e.target.checked)} className="rounded" />
                  Active account
                </label>
              </>
            )}

            {tab === 'employment' && (
              <>
                {isManager ? (
                  <ManagerTypePicker
                    departmentKey={form.departmentKey}
                    staffRole={form.staffRole}
                    teamsByDept={teamsByDept}
                    managersByDept={managersByDept}
                    onSelect={handleManagerTypeSelect}
                    compact
                  />
                ) : (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Department</label>
                      <select
                        className="input-field w-full"
                        value={form.departmentId}
                        onChange={(e) => {
                          const departmentId = e.target.value;
                          const deptRoles = jobRoles.filter((r) => String(r.department?._id || r.department) === String(departmentId));
                          setForm((prev) => ({
                            ...prev,
                            departmentId,
                            roleId: deptRoles.some((r) => String(r._id) === String(prev.roleId)) ? prev.roleId : '',
                          }));
                        }}
                      >
                        <option value="">Select department</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Job role</label>
                      <select className="input-field w-full" value={form.roleId} onChange={(e) => field('roleId', e.target.value)}>
                        <option value="">Select role</option>
                        {rolesForDepartment.map((r) => (
                          <option key={r._id} value={r._id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    {['sales', 'technical', 'support'].includes(systemRole) && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">{managerLabelForRole(systemRole)}</label>
                        <select className="input-field w-full" value={form.reportsTo} onChange={(e) => field('reportsTo', e.target.value)}>
                          <option value="">Select manager</option>
                          {managersForReportsTo.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.firstName} {m.lastName} · {m.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Joining date</label>
                    <input type="date" className="input-field w-full" value={form.joiningDate} onChange={(e) => field('joiningDate', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Employment type</label>
                    <select className="input-field w-full" value={form.employmentType} onChange={(e) => field('employmentType', e.target.value)}>
                      {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {tab === 'hr' && !isManager && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Gender</label>
                    <select className="input-field w-full" value={form.hrProfile.gender} onChange={(e) => fieldHr('gender', e.target.value)}>
                      {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Date of birth</label>
                    <input type="date" className="input-field w-full" value={form.hrProfile.dateOfBirth} onChange={(e) => fieldHr('dateOfBirth', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Designation</label>
                  <input className="input-field w-full" value={form.hrProfile.designation} onChange={(e) => fieldHr('designation', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Work location</label>
                    <input className="input-field w-full" value={form.hrProfile.workLocation} onChange={(e) => fieldHr('workLocation', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Shift</label>
                    <select className="input-field w-full" value={form.hrProfile.shift} onChange={(e) => fieldHr('shift', e.target.value)}>
                      {SHIFT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Salary</label>
                    <input type="number" className="input-field w-full" value={form.hrProfile.salary} onChange={(e) => fieldHr('salary', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Salary type</label>
                    <select className="input-field w-full" value={form.hrProfile.salaryType} onChange={(e) => fieldHr('salaryType', e.target.value)}>
                      {SALARY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Qualification</label>
                    <select className="input-field w-full" value={form.hrProfile.highestQualification} onChange={(e) => fieldHr('highestQualification', e.target.value)}>
                      {QUALIFICATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Experience (years)</label>
                    <input type="number" className="input-field w-full" value={form.hrProfile.experienceYears} onChange={(e) => fieldHr('experienceYears', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Primary skill</label>
                    <input className="input-field w-full" value={form.hrProfile.primarySkill} onChange={(e) => fieldHr('primarySkill', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Secondary skill</label>
                    <input className="input-field w-full" value={form.hrProfile.secondarySkill} onChange={(e) => fieldHr('secondarySkill', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Address</label>
                  <textarea className="input-field w-full min-h-[60px]" value={form.hrProfile.address} onChange={(e) => fieldHr('address', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">City</label>
                    <input className="input-field w-full" value={form.hrProfile.city} onChange={(e) => fieldHr('city', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">State</label>
                    <input className="input-field w-full" value={form.hrProfile.state} onChange={(e) => fieldHr('state', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Country</label>
                    <input className="input-field w-full" value={form.hrProfile.country} onChange={(e) => fieldHr('country', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">PIN</label>
                    <input className="input-field w-full" value={form.hrProfile.pinCode} onChange={(e) => fieldHr('pinCode', e.target.value)} />
                  </div>
                </div>
                <div className="pt-2 border-t border-myth-border">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Emergency contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input className="input-field w-full" placeholder="Name" value={form.hrProfile.emergencyContactName} onChange={(e) => fieldHr('emergencyContactName', e.target.value)} />
                    <select className="input-field w-full" value={form.hrProfile.emergencyContactRelationship} onChange={(e) => fieldHr('emergencyContactRelationship', e.target.value)}>
                      {RELATIONSHIP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input className="input-field w-full" placeholder="Phone" value={form.hrProfile.emergencyContactPhone} onChange={(e) => fieldHr('emergencyContactPhone', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Remarks</label>
                  <textarea className="input-field w-full min-h-[60px]" value={form.hrProfile.remarks} onChange={(e) => fieldHr('remarks', e.target.value)} />
                </div>
              </div>
            )}

            {tab === 'password' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Leave blank to keep the current password.</p>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field w-full pr-10"
                    value={form.password}
                    onChange={(e) => field('password', e.target.value)}
                    placeholder="New password (min 6 characters)"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-myth-border">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="button" onClick={handleSave} disabled={submitting} className="btn-primary text-sm inline-flex items-center gap-2">
              <Save size={14} />
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function EditStaffButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg hover:bg-myth-accent/10 text-gray-400 hover:text-myth-accent ${className}`}
      title="Edit staff"
    >
      <Pencil size={16} />
    </button>
  );
}
