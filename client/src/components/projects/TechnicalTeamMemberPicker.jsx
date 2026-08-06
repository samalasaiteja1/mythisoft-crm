import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { rolesAPI, departmentsAPI } from '../../services/api';
import {
  TECH_MEMBER_ROLE_OPTIONS,
  defaultMemberRole,
  findTechnicalDepartment,
  filterRolesForTechnicalDepartment,
  getEmployeeJobRoleName,
  memberMatchesJobRole,
  isExcludedTeamPickRole,
} from '../../constants/techTeamForm';

/**
 * Technical manager dropdown + role-filtered multi-select for team members.
 * Role dropdowns use job roles from Settings → Departments → Technical team.
 */
export default function TechnicalTeamMemberPicker({
  managers = [],
  members = [],
  loading = false,
  canAssign = true,
  selectedManager = '',
  onManagerChange,
  selectedMemberIds = [],
  memberRoles = {},
  onMembersChange,
  onMemberRolesChange,
  onTeamChange,
  showManagerDropdown = true,
  rolesForPickOverride = null,
  emptyMembersHint = '',
}) {
  const [jobRoles, setJobRoles] = useState([]);
  const [technicalDept, setTechnicalDept] = useState(null);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilterId, setMemberRoleFilterId] = useState('all');

  useEffect(() => {
    let cancelled = false;
    setRolesLoading(true);
    Promise.all([
      rolesAPI.getAll(),
      departmentsAPI.getAll(),
    ])
      .then(([rolesRes, deptRes]) => {
        if (cancelled) return;
        const roles = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.items || [];
        const departments = Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.items || [];
        const techDept = findTechnicalDepartment(departments);
        setTechnicalDept(techDept || null);
        setJobRoles(roles.filter((r) => r.status !== 'inactive'));
      })
      .catch(() => toast.error('Failed to load technical department roles'))
      .finally(() => { if (!cancelled) setRolesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const rolesForPick = useMemo(() => {
    if (rolesForPickOverride?.length) return rolesForPickOverride;
    return filterRolesForTechnicalDepartment(jobRoles, technicalDept?._id);
  }, [rolesForPickOverride, jobRoles, technicalDept]);

  useEffect(() => {
    if (memberRoleFilterId === 'all') return;
    if (!rolesForPick.length) {
      setMemberRoleFilterId('all');
      return;
    }
    const stillValid = rolesForPick.some((r) => String(r._id) === String(memberRoleFilterId));
    if (!stillValid) setMemberRoleFilterId('all');
  }, [rolesForPick, memberRoleFilterId]);

  const roleNameOptions = useMemo(() => {
    const names = rolesForPick.map((r) => r.name);
    return names.length ? names : TECH_MEMBER_ROLE_OPTIONS.filter((n) => !isExcludedTeamPickRole(n));
  }, [rolesForPick]);

  const selectedFilterRole = useMemo(
    () => rolesForPick.find((r) => String(r._id) === String(memberRoleFilterId)),
    [rolesForPick, memberRoleFilterId]
  );

  const normalizedIds = useMemo(
    () => selectedMemberIds.map(String),
    [selectedMemberIds]
  );

  const applyTeamUpdate = (assignedTo, roles) => {
    const ids = assignedTo.map(String);
    if (onTeamChange) {
      onTeamChange({ assignedTo: ids, memberRoles: roles });
      return;
    }
    onMembersChange?.(ids);
    if (roles !== undefined) onMemberRolesChange?.(roles);
  };

  const availableForRole = useMemo(() => {
    const selected = new Set(normalizedIds);
    const q = memberSearch.trim().toLowerCase();
    const filterByRole = memberRoleFilterId && memberRoleFilterId !== 'all';
    return members.filter((m) => {
      const mid = String(m._id);
      if (selected.has(mid)) return false;
      if (filterByRole && !memberMatchesJobRole(m, selectedFilterRole)) return false;
      if (!q) return true;
      const roleLabel = getEmployeeJobRoleName(m) || memberRoles[mid] || '';
      const hay = `${m.firstName} ${m.lastName} ${m.email} ${roleLabel} ${m.employeeId || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [members, normalizedIds, memberSearch, memberRoleFilterId, memberRoles, selectedFilterRole]);

  const selectedMembers = useMemo(
    () => normalizedIds.map((id) => members.find((m) => String(m._id) === id)).filter(Boolean),
    [normalizedIds, members]
  );

  const roleDescription = (roleName) => {
    const role = rolesForPick.find((r) => r.name === roleName);
    return role?.description?.trim() || '';
  };

  const addMember = (member) => {
    const id = String(member._id);
    if (normalizedIds.includes(id)) return;
    const roleName = selectedFilterRole?.name || defaultMemberRole(member, roleNameOptions);
    applyTeamUpdate([...normalizedIds, id], { ...memberRoles, [id]: roleName });
  };

  const removeMember = (id) => {
    const sid = String(id);
    const nextRoles = { ...memberRoles };
    delete nextRoles[sid];
    applyTeamUpdate(normalizedIds.filter((x) => x !== sid), nextRoles);
  };

  const updateMemberRole = (id, roleName) => {
    const sid = String(id);
    applyTeamUpdate(normalizedIds, { ...memberRoles, [sid]: roleName });
  };

  if (loading || rolesLoading) {
    return <p className="text-sm text-gray-500">Loading technical team…</p>;
  }

  const technicalDeptLabel = technicalDept?.name || 'Technical';

  return (
    <div className="space-y-4">
      <div>
        {showManagerDropdown && (
          <>
            <label className="block text-sm text-gray-300 mb-1">Technical manager</label>
            {canAssign ? (
              <select
                value={selectedManager}
                onChange={(e) => onManagerChange?.(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select technical manager</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.firstName} {m.lastName} · {m.email}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500">Only admin or manager can assign the technical manager.</p>
            )}
          </>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">
          Filter by role
          <span className="text-gray-500 font-normal"> — {technicalDeptLabel} department</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Roles from Settings → Departments → {technicalDeptLabel}. Pick a role to see who does that work, then add members.
        </p>
        {canAssign ? (
          <>
            <select
              value={memberRoleFilterId}
              onChange={(e) => setMemberRoleFilterId(e.target.value)}
              className="input-field w-full sm:w-72"
            >
              <option value="all">All technical roles</option>
              {rolesForPick.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}{r.description ? ` — ${r.description.slice(0, 48)}${r.description.length > 48 ? '…' : ''}` : ''}
                </option>
              ))}
            </select>
            {selectedFilterRole && memberRoleFilterId !== 'all' && (
              <div className="mt-2 rounded-lg border border-myth-border bg-myth-surface/30 px-3 py-2">
                <p className="text-sm font-medium text-white">{selectedFilterRole.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedFilterRole.description?.trim()
                    || 'No role description in Settings. Add one under Settings → Roles for this job role.'}
                </p>
              </div>
            )}
            {rolesForPick.length === 0 && (
              <p className="text-xs text-amber-400/90 mt-2">
                No roles found for the {technicalDeptLabel} department. Add roles in Settings → Departments → Roles.
              </p>
            )}
          </>
        ) : null}
      </div>

      {canAssign && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-myth-border bg-myth-surface/20 p-3 space-y-2">
            <label className="block text-sm text-gray-300">
              Add team member
              {selectedFilterRole && memberRoleFilterId !== 'all' && (
                <span className="text-gray-500 font-normal"> — {selectedFilterRole.name}</span>
              )}
            </label>
            <input
              type="search"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="input-field w-full text-sm"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {availableForRole.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">
                  {emptyMembersHint || (memberRoleFilterId !== 'all'
                    ? 'No employees with this job role, or all are already selected'
                    : 'No technical team members available')}
                </p>
              ) : availableForRole.map((member) => {
                const jobRole = getEmployeeJobRoleName(member);
                return (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => addMember(member)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-myth-border hover:border-myth-accent/40 hover:bg-myth-accent/5 transition-colors"
                  >
                    <p className="text-sm text-white truncate">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {member.email}
                      {jobRole ? ` · ${jobRole}` : ''}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-myth-accent/20 bg-myth-accent/5 p-3 space-y-2">
            <label className="block text-sm text-gray-300">Selected team members ({selectedMembers.length})</label>
            <p className="text-xs text-gray-500">
              Assign each member&apos;s project role from {technicalDeptLabel} department roles
            </p>
            {selectedMembers.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">Pick members from one or more roles</p>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto">
                {selectedMembers.map((member) => {
                  const mid = String(member._id);
                  const roleValue = memberRoles[mid] || defaultMemberRole(member, roleNameOptions);
                  const roleDesc = roleDescription(roleValue);
                  return (
                    <li key={member._id} className="flex flex-col gap-2 p-2 rounded-lg bg-myth-surface/40 border border-myth-border">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                          {getEmployeeJobRoleName(member) && (
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              Job role: {getEmployeeJobRoleName(member)}
                            </p>
                          )}
                        </div>
                        {(onMemberRolesChange || onTeamChange) && (
                          <div className="flex flex-col gap-0.5 shrink-0 sm:w-44">
                            <span className="text-[10px] uppercase tracking-wide text-gray-500">Project role</span>
                            <select
                              value={roleValue}
                              onChange={(e) => updateMemberRole(member._id, e.target.value)}
                              className="input-field text-xs py-1.5"
                            >
                              {roleNameOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMember(member._id)}
                          className="text-xs text-red-400 hover:underline shrink-0 self-start sm:self-center"
                        >
                          Remove
                        </button>
                      </div>
                      {roleDesc && (
                        <p className="text-[11px] text-gray-400 border-t border-myth-border/50 pt-1.5">
                          {roleDesc}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {!canAssign && selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((m) => (
            <span key={m._id} className="badge bg-indigo-500/20 text-indigo-300">
              {m.firstName} {m.lastName}
              {memberRoles[String(m._id)] ? ` · ${memberRoles[String(m._id)]}` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
