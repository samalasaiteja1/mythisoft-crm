import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { staffRolesAPI, projectsAPI, rolesAPI, usersAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import {
  TECH_MEMBER_ROLE_OPTIONS,
  defaultMemberRole,
  filterTeamPickRoles,
  isExcludedTeamPickRole,
  buildRolesFromAssignedMembers,
  memberMatchesJobRole,
  getEmployeeJobRoleName,
} from '../../constants/techTeamForm';
import { inferTeamGroupFromDepartmentName } from '../../utils/hireFormHelpers';

const emptyForm = (departmentId = '') => ({
  name: '',
  projectId: '',
  departmentId,
  description: '',
  startDate: '',
  endDate: '',
  maxMembers: '',
  status: 'active',
  remarks: '',
  memberIds: [],
  memberRoles: {},
});

const mapMemberRolesFromTeam = (team) => {
  const raw = team?.memberRoleLabels;
  if (!raw) return {};
  if (raw instanceof Map) {
    return Object.fromEntries(raw.entries());
  }
  return { ...raw };
};

const employeeRoleId = (employee) => String(employee?.roleId?._id || employee?.roleId || '');

const memberDisplayRole = (employee) =>
  employee?.assignedProjectRole || getEmployeeJobRoleName(employee) || defaultMemberRole(employee, []);

export default function TechManagerCreateTeamForm({
  team = null,
  departments = [],
  employees: employeesProp = [],
  user = null,
  onCancel,
  onSaved,
}) {
  const editId = team?._id || null;
  const defaultDeptId = departments[0] ? String(departments[0]._id) : '';
  const useProjectScopedPick = Boolean(user);

  const [form, setForm] = useState(() => emptyForm(defaultDeptId));
  const [initialForm, setInitialForm] = useState(() => emptyForm(defaultDeptId));
  const [projects, setProjects] = useState([]);
  const [pickableEmployees, setPickableEmployees] = useState(employeesProp);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [jobRoles, setJobRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [pendingIds, setPendingIds] = useState([]);
  const [memberRoleFilterId, setMemberRoleFilterId] = useState('');

  const employees = useProjectScopedPick ? pickableEmployees : (employeesProp.length ? employeesProp : pickableEmployees);

  const buildInitial = (jobRolesList = []) => {
    if (!team) return emptyForm(defaultDeptId);
    const memberIds = employees
      .filter((e) => String(e.staffRole?._id || e.staffRole) === String(team._id))
      .map((e) => String(e._id));
    const storedRoles = mapMemberRolesFromTeam(team);
    const roleNames = jobRolesList.map((r) => r.name);
    const memberRoles = {};
    memberIds.forEach((id) => {
      const emp = employees.find((e) => String(e._id) === id);
      memberRoles[id] = storedRoles[id] || defaultMemberRole(emp, roleNames);
    });
    return {
      name: team.name || '',
      projectId: String(team.projectRef?._id || team.projectRef || ''),
      departmentId: String(team.departmentRef?._id || team.departmentRef || defaultDeptId),
      description: team.description || '',
      startDate: team.startDate ? new Date(team.startDate).toISOString().slice(0, 10) : '',
      endDate: team.endDate ? new Date(team.endDate).toISOString().slice(0, 10) : '',
      maxMembers: team.maxMembers ?? '',
      status: team.status || 'active',
      remarks: team.remarks || '',
      memberIds,
      memberRoles,
    };
  };

  useEffect(() => {
    if (!editId) {
      if (defaultDeptId) {
        setForm((prev) => (prev.departmentId ? prev : { ...prev, departmentId: defaultDeptId }));
      }
      return;
    }
    if (!employees.length || !jobRoles.length) return;
    const seed = buildInitial(jobRoles);
    setForm(seed);
    setInitialForm(seed);
    setPendingIds([]);
    setMemberSearch('');
  }, [editId, employees.length, defaultDeptId, jobRoles.length]);

  useEffect(() => {
    rolesAPI.getAll()
      .then(({ data }) => {
        const roles = Array.isArray(data) ? data : data?.items || [];
        setJobRoles(roles.filter((r) => r.status !== 'inactive'));
      })
      .catch(() => toast.error('Failed to load roles'))
      .finally(() => setRolesLoading(false));
  }, []);

  useEffect(() => {
    projectsAPI.getAll({ limit: 200 })
      .then(({ data }) => setProjects(data.items || data || []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setProjectsLoading(false));
  }, []);

  const loadEmployees = (projectId) => {
    if (!useProjectScopedPick) return Promise.resolve();
    if (!projectId) {
      setPickableEmployees([]);
      return Promise.resolve();
    }
    setEmployeesLoading(true);
    const params = { forTeamPick: '1', projectId };
    return usersAPI.getAll(params)
      .then(({ data }) => setPickableEmployees(Array.isArray(data) ? data : []))
      .catch(() => {
        setPickableEmployees([]);
        toast.error('Failed to load project team members');
      })
      .finally(() => setEmployeesLoading(false));
  };

  useEffect(() => {
    const projectId = form.projectId || team?.projectRef?._id || team?.projectRef || '';
    loadEmployees(projectId);
  }, [form.projectId, team?._id, useProjectScopedPick]);

  const inferredTeamGroup = useMemo(() => {
    const dept = departments.find((d) => String(d._id) === String(form.departmentId));
    if (dept?.name) return inferTeamGroupFromDepartmentName(dept.name);
    return 'technical';
  }, [departments, form.departmentId]);

  const rolesForDepartment = useMemo(() => {
    let list = jobRoles;
    if (form.departmentId) {
      list = list.filter((r) => {
        const deptId = r.department?._id || r.department;
        return String(deptId) === String(form.departmentId);
      });
    }
    return filterTeamPickRoles(list);
  }, [jobRoles, form.departmentId]);

  const memberOptions = useMemo(() => {
    const teamId = editId ? String(editId) : null;
    return employees.filter((e) => {
      if (e.isActive === false) return false;
      if (e.role === 'manager' || e.role === 'admin') return false;
      if (e.role !== inferredTeamGroup) return false;
      const onTeam = String(e.staffRole?._id || e.staffRole || '') === teamId;
      const unassigned = !e.staffRole;
      return onTeam || unassigned || !teamId;
    });
  }, [employees, inferredTeamGroup, editId]);

  /** Only roles that exist among admin-assigned members on the selected project */
  const rolesFromAssignedMembers = useMemo(() => {
    if (!form.projectId) return [];
    return buildRolesFromAssignedMembers(memberOptions, rolesForDepartment);
  }, [form.projectId, memberOptions, rolesForDepartment]);

  const rolePickList = form.projectId ? rolesFromAssignedMembers : [];

  useEffect(() => {
    if (!form.projectId || !rolesFromAssignedMembers.length) {
      setMemberRoleFilterId('');
      return;
    }
    const stillValid = rolesFromAssignedMembers.some((r) => String(r._id) === String(memberRoleFilterId));
    if (!memberRoleFilterId || !stillValid) {
      setMemberRoleFilterId(String(rolesFromAssignedMembers[0]._id));
    }
  }, [form.projectId, rolesFromAssignedMembers, memberRoleFilterId]);

  const memberRoleOptions = useMemo(() => {
    const names = rolePickList.map((r) => r.name);
    return names.length ? names : TECH_MEMBER_ROLE_OPTIONS.filter((n) => !isExcludedTeamPickRole(n));
  }, [rolePickList]);

  const selectedFilterRole = useMemo(
    () => rolePickList.find((r) => String(r._id) === String(memberRoleFilterId)),
    [rolePickList, memberRoleFilterId]
  );

  const availableEmployees = useMemo(() => {
    const selected = new Set(form.memberIds.map(String));
    const q = memberSearch.trim().toLowerCase();
    const activeRole = selectedFilterRole;
    return memberOptions.filter((e) => {
      if (selected.has(String(e._id))) return false;
      if (activeRole && !memberMatchesJobRole(e, activeRole)) return false;
      if (!q) return true;
      const roleLabel = memberDisplayRole(e);
      const hay = `${e.employeeId || ''} ${e.firstName} ${e.lastName} ${roleLabel} ${e.email}`.toLowerCase();
      return hay.includes(q);
    });
  }, [memberOptions, form.memberIds, memberSearch, selectedFilterRole]);

  const selectedMembers = useMemo(() => {
    return form.memberIds
      .map((id) => employees.find((e) => String(e._id) === String(id)))
      .filter(Boolean);
  }, [form.memberIds, employees]);

  const togglePending = (memberId) => {
    const key = String(memberId);
    setPendingIds((prev) => (prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]));
  };

  const addSelectedMembers = () => {
    if (!memberRoleFilterId) {
      toast.error('Select a role first');
      return;
    }
    if (!pendingIds.length) {
      toast.error('Select employees to add');
      return;
    }
    const roleName = selectedFilterRole?.name || '';
    const max = form.maxMembers ? Number(form.maxMembers) : null;
    const nextIds = [...form.memberIds.map(String)];
    const nextRoles = { ...form.memberRoles };
    pendingIds.forEach((id) => {
      if (nextIds.includes(id)) return;
      if (max && nextIds.length >= max) {
        toast.error(`Maximum ${max} team members allowed`);
        return;
      }
      nextIds.push(id);
      nextRoles[id] = roleName || defaultMemberRole(employees.find((e) => String(e._id) === id), memberRoleOptions);
    });
    setForm((prev) => ({ ...prev, memberIds: nextIds, memberRoles: nextRoles }));
    setPendingIds([]);
  };

  const removeMember = (memberId) => {
    const key = String(memberId);
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.filter((id) => String(id) !== key),
      memberRoles: Object.fromEntries(
        Object.entries(prev.memberRoles).filter(([id]) => id !== key)
      ),
    }));
  };

  const setMemberRole = (memberId, role) => {
    const key = String(memberId);
    setForm((prev) => ({
      ...prev,
      memberRoles: { ...prev.memberRoles, [key]: role },
    }));
  };

  const resetForm = () => {
    setForm({ ...initialForm, memberIds: [...initialForm.memberIds], memberRoles: { ...initialForm.memberRoles } });
    setPendingIds([]);
    setMemberSearch('');
  };

  const deriveTeamRoleId = () => {
    if (!form.memberIds.length) return undefined;
    const roleIds = new Set();
    form.memberIds.forEach((id) => {
      const emp = employees.find((e) => String(e._id) === String(id));
      const rid = employeeRoleId(emp);
      if (rid) roleIds.add(rid);
    });
    if (roleIds.size === 1) return [...roleIds][0];
    const first = employees.find((e) => String(e._id) === String(form.memberIds[0]));
    return employeeRoleId(first) || undefined;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    departmentId: form.departmentId,
    teamManager: user?._id,
    description: form.description?.trim() || undefined,
    status: form.status,
    memberIds: form.memberIds,
    memberRoleLabels: form.memberRoles,
    maxMembers: form.maxMembers === '' ? undefined : Number(form.maxMembers),
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    projectId: form.projectId || undefined,
    roleId: deriveTeamRoleId(),
    remarks: form.remarks?.trim() || undefined,
    teamGroup: inferredTeamGroup,
  });

  const validate = () => {
    if (!form.name.trim()) {
      toast.error('Team name is required');
      return false;
    }
    if (!form.departmentId) {
      toast.error('Please select a department');
      return false;
    }
    if (!form.projectId) {
      toast.error('Please select a project');
      return false;
    }
    if (!form.startDate) {
      toast.error('Start date is required');
      return false;
    }
    if (!form.memberIds.length) {
      toast.error('Add at least one team member from the roles list');
      return false;
    }
    return true;
  };

  const saveTeam = async () => {
    if (!validate()) return null;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      let savedId = editId;
      if (editId) {
        await staffRolesAPI.update(editId, payload);
        toast.success('Team updated');
      } else {
        const { data } = await staffRolesAPI.create(payload);
        savedId = data._id;
        toast.success('Team created');
      }
      const nextInitial = { ...form };
      setInitialForm(nextInitial);
      if (onSaved) onSaved(savedId, { projectId: form.projectId });
      return savedId;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveTeam();
  };

  const handleRoleFilterChange = (roleId) => {
    setMemberRoleFilterId(roleId);
    setPendingIds([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 border-b border-myth-border pb-5">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Team Information</h4>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Team Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field w-full"
            placeholder="Enter team name"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Project *</label>
            {projectsLoading ? (
              <LoadingSpinner />
            ) : projects.length === 0 ? (
              <p className="text-sm text-amber-400/90 border border-amber-500/30 rounded-lg px-3 py-2">
                No projects assigned to you yet. Ask admin to assign you as technical manager on a project.
              </p>
            ) : (
              <select
                value={form.projectId}
                onChange={(e) => {
                  const projectId = e.target.value;
                  setForm((prev) => ({ ...prev, projectId, memberIds: [], memberRoles: {} }));
                  setPendingIds([]);
                  setMemberRoleFilterId('');
                }}
                className="input-field w-full"
                required
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}{p.code ? ` (${p.code})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Department *</label>
            <select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              className="input-field w-full"
              required
              disabled
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Status *</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="input-field w-full sm:max-w-xs"
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field w-full h-24"
            placeholder="Optional team description"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Start Date *</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Maximum Members</label>
            <input
              type="number"
              min={1}
              value={form.maxMembers}
              onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
              className="input-field w-full"
              placeholder="e.g. 10"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-b border-myth-border pb-5">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Team Members</h4>
        <p className="text-xs text-gray-500">
          Select a project first — members are loaded from employees admin assigned to that project.
          Pick a role, choose employees, then add them to your team.
        </p>
        {!form.projectId && (
          <p className="text-xs text-amber-400/90">Choose a project above to load available members.</p>
        )}
        {form.projectId && employeesLoading && <LoadingSpinner />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="card p-4 space-y-3 h-full">
            <label className="block text-sm font-medium text-gray-300">Role *</label>
            {!form.projectId ? (
              <p className="text-sm text-amber-400/90 border border-dashed border-myth-border rounded-lg px-3 py-2">
                Select a project above — then role options will appear here.
              </p>
            ) : rolesLoading || employeesLoading ? (
              <LoadingSpinner />
            ) : (
              <select
                value={memberRoleFilterId}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="input-field w-full"
                disabled={!rolePickList.length}
              >
                <option value="">Select Role</option>
                {rolePickList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}{r.description ? ` — ${r.description}` : ''}
                  </option>
                ))}
              </select>
            )}
            {form.projectId && !employeesLoading && rolePickList.length === 0 && (
              <p className="text-xs text-amber-400/80">
                No roles found among project members. Ask admin to assign staff with job roles on the project.
              </p>
            )}
            {selectedFilterRole && (
              <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 text-sm text-gray-400">
                <p className="text-white font-medium">{selectedFilterRole.name}</p>
                {selectedFilterRole.description && (
                  <p className="text-xs mt-1">{selectedFilterRole.description}</p>
                )}
                <p className="text-xs mt-2 text-myth-accent">
                  {availableEmployees.length} available · {pendingIds.length} selected
                </p>
              </div>
            )}
            {rolesFromAssignedMembers.length > 1 && (
              <p className="text-xs text-gray-500">
                Each role shows only members admin assigned to this project with that role. Switch role to add others.
              </p>
            )}
          </div>

          <div className="card p-4 space-y-3 h-full">
            <label className="block text-sm font-medium text-gray-300">Team Members</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="search"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="input-field flex-1 text-sm"
                placeholder="Search employee..."
                disabled={!memberRoleFilterId}
              />
              <button
                type="button"
                onClick={() => setMemberSearch(memberSearch)}
                className="btn-secondary shrink-0 text-sm"
                disabled={!memberRoleFilterId}
              >
                Search
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {memberRoleFilterId
                ? `Employees with role: ${selectedFilterRole?.name || '—'}`
                : 'Select a role on the left to see employees'}
            </p>
            <div className="rounded-lg border border-myth-border divide-y divide-myth-border/60 max-h-52 overflow-y-auto">
              {!form.projectId ? (
                <p className="text-sm text-gray-500 px-3 py-4 text-center">Select a project first.</p>
              ) : !memberRoleFilterId ? (
                <p className="text-sm text-gray-500 px-3 py-4 text-center">Select a role on the left.</p>
              ) : availableEmployees.length ? availableEmployees.map((e) => {
                const roleLabel = memberDisplayRole(e);
                const id = String(e._id);
                return (
                  <label
                    key={e._id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-myth-surface/30 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={pendingIds.includes(id)}
                      onChange={() => togglePending(e._id)}
                      className="text-myth-accent rounded"
                    />
                    <span className="text-sm text-white">
                      {e.employeeId || '—'} — {e.firstName} {e.lastName} — {roleLabel}
                    </span>
                  </label>
                );
              }) : (
                <p className="text-sm text-gray-500 px-3 py-4 text-center">
                  {memberOptions.length
                    ? `No members with role “${selectedFilterRole?.name || ''}” on this project. Try another role.`
                    : 'No members assigned to this project yet. Ask admin to assign technical staff on the project page.'}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={addSelectedMembers}
              className="btn-secondary text-sm w-full sm:w-auto"
              disabled={!memberRoleFilterId || !pendingIds.length}
            >
              Add Selected Members
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Selected Team Members ({selectedMembers.length})</p>
          {selectedMembers.length ? (
            <div className="overflow-x-auto rounded-lg border border-myth-border">
              <table className="w-full text-sm">
                <thead className="bg-myth-surface/50 text-gray-400 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Employee ID</th>
                    <th className="px-3 py-2 font-medium">Employee Name</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-myth-border/60">
                  {selectedMembers.map((e) => {
                    const id = String(e._id);
                    return (
                      <tr key={e._id} className="text-white">
                        <td className="px-3 py-2 font-mono text-xs text-gray-300">{e.employeeId || '—'}</td>
                        <td className="px-3 py-2">{e.firstName} {e.lastName}</td>
                        <td className="px-3 py-2">
                          <select
                            value={form.memberRoles[id] || defaultMemberRole(e, memberRoleOptions)}
                            onChange={(ev) => setMemberRole(e._id, ev.target.value)}
                            className="input-field text-sm py-1 min-w-[160px]"
                          >
                            {memberRoleOptions.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeMember(e._id)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 border border-dashed border-myth-border rounded-lg px-3 py-4 text-center">
              No members added yet. Select a role, choose employees, and click Add Selected Members.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Remarks</h4>
        <textarea
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          className="input-field w-full h-24"
          placeholder="Optional remarks or notes about this team"
        />
      </section>

      <div className="flex flex-wrap gap-3 pt-2 border-t border-myth-border">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={resetForm} className="btn-secondary">Reset</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
