import { useState, useEffect, useMemo } from 'react';
import { Plus, Shield, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { staffRolesAPI, usersAPI, departmentsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import SearchBar from '../SearchBar';
import TeamSettingsCard from './TeamSettingsCard';
import { inferTeamGroupFromDepartmentName } from '../../utils/hireFormHelpers';
import { getManagerDepartment } from '../../utils/roleContext';
import { useAuth } from '../../context/AuthContext';
import {
  filterTechnicalTeamsByScope,
  isAdminCreatedTechnicalTeam,
  TECH_TEAM_LIST_SCOPE,
} from '../../utils/techTeamOwnership';
import TechManagerCreateTeamForm from '../techManager/TechManagerCreateTeamForm';

const emptyForm = {
  name: '',
  departmentId: '',
  teamManager: '',
  description: '',
  status: 'active',
  memberIds: [],
  maxMembers: '',
  startDate: '',
};

export default function StaffRolesSettings({ departmentScope = null }) {
  const { user } = useAuth();
  const scopedDepartments = departmentScope === 'technical';
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);
  const [presetTeamGroup, setPresetTeamGroup] = useState(null);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState(TECH_TEAM_LIST_SCOPE.MY);

  const fetchItems = () => {
    setLoading(true);
    staffRolesAPI.getAll({ search, limit: 200 })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => toast.error('Failed to load teams'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [search]);

  useEffect(() => {
    usersAPI.getAll()
      .then(({ data }) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => {});
    departmentsAPI.getAll()
      .then(({ data }) => {
        const all = data.items || [];
        if (scopedDepartments) {
          const technical = all.filter((d) => inferTeamGroupFromDepartmentName(d.name) === 'technical');
          setDepartments(technical);
          if (technical[0]) setDepartmentFilter(String(technical[0]._id));
        } else {
          setDepartments(all);
        }
      })
      .catch(() => {});
  }, [scopedDepartments]);

  const membersByTeam = useMemo(() => {
    const map = {};
    employees.forEach((e) => {
      const tid = e.staffRole?._id || e.staffRole;
      if (!tid) return;
      const key = String(tid);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [employees]);

  const scopedItems = useMemo(() => {
    if (!scopedDepartments || !user?._id) return items;
    return filterTechnicalTeamsByScope(items, ownershipFilter, user._id);
  }, [items, scopedDepartments, ownershipFilter, user?._id]);

  const filteredItems = useMemo(() => {
    let list = scopedDepartments ? scopedItems : items;
    if (departmentFilter !== 'all') {
      const dept = departments.find((d) => String(d._id) === String(departmentFilter));
      list = list.filter((t) => {
        const deptId = t.departmentRef?._id || t.departmentRef;
        if (deptId && String(deptId) === String(departmentFilter)) return true;
        if (dept?.name) {
          const group = inferTeamGroupFromDepartmentName(dept.name);
          return t.teamGroup === group || t.department === group;
        }
        return false;
      });
    }
    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }
    return list;
  }, [scopedItems, items, scopedDepartments, departmentFilter, statusFilter, departments]);

  const myTeamCount = useMemo(() => {
    if (!scopedDepartments || !user?._id) return 0;
    return filterTechnicalTeamsByScope(items, TECH_TEAM_LIST_SCOPE.MY, user._id).length;
  }, [items, scopedDepartments, user?._id]);

  const adminTeamCount = useMemo(() => {
    if (!scopedDepartments || !user?._id) return 0;
    return filterTechnicalTeamsByScope(items, TECH_TEAM_LIST_SCOPE.ADMIN, user._id).length;
  }, [items, scopedDepartments, user?._id]);

  const stats = useMemo(() => {
    const source = scopedDepartments ? scopedItems : items;
    const active = source.filter((t) => t.status === 'active').length;
    const memberTotal = Object.values(membersByTeam).reduce((sum, arr) => sum + arr.length, 0);
    const atCapacity = source.filter((t) => {
      if (!t.maxMembers) return false;
      const count = membersByTeam[String(t._id)]?.length || 0;
      return count >= t.maxMembers;
    }).length;
    return { total: source.length, active, memberTotal, atCapacity };
  }, [scopedDepartments, scopedItems, items, membersByTeam]);

  const selectedDepartment = useMemo(
    () => departments.find((d) => String(d._id) === String(form.departmentId)),
    [departments, form.departmentId]
  );

  const inferredTeamGroup = useMemo(() => {
    if (presetTeamGroup === 'manager') return 'manager';
    if (selectedDepartment?.name) return inferTeamGroupFromDepartmentName(selectedDepartment.name);
    return presetTeamGroup && presetTeamGroup !== 'all' ? presetTeamGroup : 'sales';
  }, [presetTeamGroup, selectedDepartment]);

  const managerOptions = useMemo(() => {
    return employees.filter((e) => {
      if (e.isActive === false || e.role !== 'manager') return false;
      if (!selectedDepartment) return true;
      const deptGroup = inferTeamGroupFromDepartmentName(selectedDepartment.name);
      return getManagerDepartment(e) === deptGroup;
    });
  }, [employees, selectedDepartment]);

  const memberOptions = useMemo(() => {
    const group = inferredTeamGroup;
    const teamId = editId ? String(editId) : null;
    return employees.filter((e) => {
      if (e.isActive === false) return false;
      if (group === 'manager') return e.role === 'manager';
      if (e.role !== group) return false;
      const onTeam = String(e.staffRole?._id || e.staffRole || '') === teamId;
      const unassigned = !e.staffRole;
      return onTeam || unassigned || !teamId;
    });
  }, [employees, inferredTeamGroup, editId]);

  const filteredMemberOptions = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return memberOptions;
    return memberOptions.filter((e) => {
      const hay = `${e.firstName} ${e.lastName} ${e.employeeId || ''} ${e.email}`.toLowerCase();
      return hay.includes(q);
    });
  }, [memberOptions, memberSearch]);

  const resetForm = () => {
    setForm({ ...initialForm, memberIds: [...initialForm.memberIds] });
    setMemberSearch('');
  };

  const openCreate = () => {
    setPresetTeamGroup(scopedDepartments ? 'technical' : null);
    const defaultDeptId = scopedDepartments && departments[0] ? String(departments[0]._id) : '';
    const defaultManager = scopedDepartments && user?._id ? String(user._id) : '';
    const seed = {
      ...emptyForm,
      memberIds: [],
      departmentId: defaultDeptId,
      teamManager: defaultManager,
    };
    setForm(seed);
    setInitialForm(seed);
    setEditId(null);
    setMemberSearch('');
    setModal('form');
  };

  const openEdit = (item) => {
    if (scopedDepartments && isAdminCreatedTechnicalTeam(item, user?._id)) {
      toast.error('Admin-created teams are view-only');
      return;
    }
    const memberIds = employees
      .filter((e) => String(e.staffRole?._id || e.staffRole) === String(item._id))
      .map((e) => String(e._id));
    const deptId = item.departmentRef?._id || item.departmentRef || '';
    const formData = {
      name: item.name || '',
      departmentId: deptId ? String(deptId) : '',
      teamManager: String(item.teamManager?._id || item.teamManager || item.teamLeader?._id || item.teamLeader || ''),
      description: item.description || '',
      status: item.status || 'active',
      memberIds,
      maxMembers: item.maxMembers ?? '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : '',
    };
    setPresetTeamGroup(item.teamGroup);
    setForm(formData);
    setInitialForm(formData);
    setEditId(item._id);
    setMemberSearch('');
    setModal('form');
  };

  const handleDepartmentChange = (departmentId) => {
    const dept = departments.find((d) => String(d._id) === String(departmentId));
    const defaultManager = dept?.manager?._id || dept?.manager || '';
    setForm((prev) => ({
      ...prev,
      departmentId,
      teamManager: defaultManager ? String(defaultManager) : '',
      memberIds: editId ? prev.memberIds : [],
    }));
  };

  const toggleMember = (memberId) => {
    const key = String(memberId);
    setForm((prev) => {
      const ids = prev.memberIds.map(String);
      if (ids.includes(key)) {
        return { ...prev, memberIds: ids.filter((id) => id !== key) };
      }
      if (prev.maxMembers && ids.length >= Number(prev.maxMembers)) {
        toast.error(`Maximum ${prev.maxMembers} team members allowed`);
        return prev;
      }
      return { ...prev, memberIds: [...ids, key] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    if (!form.departmentId) {
      toast.error('Please select a department');
      return;
    }
    if (!form.teamManager) {
      toast.error('Please select a team manager');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        departmentId: form.departmentId,
        teamManager: form.teamManager,
        description: form.description?.trim() || undefined,
        status: form.status,
        memberIds: form.memberIds,
        maxMembers: form.maxMembers === '' ? undefined : Number(form.maxMembers),
        startDate: form.startDate || undefined,
        teamGroup: inferredTeamGroup,
      };

      if (editId) {
        await staffRolesAPI.update(editId, payload);
        toast.success('Team updated');
      } else {
        await staffRolesAPI.create(payload);
        toast.success('Team created');
      }
      setModal(null);
      fetchItems();
      usersAPI.getAll().then(({ data }) => setEmployees(Array.isArray(data) ? data : []));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (item) => {
    const next = item.status === 'active' ? 'inactive' : 'active';
    try {
      await staffRolesAPI.update(item._id, { status: next });
      toast.success(next === 'active' ? 'Activated' : 'Deactivated');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete team "${item.name}"?`)) return;
    try {
      await staffRolesAPI.delete(item._id);
      toast.success('Team deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield size={18} className="text-myth-accent" /> Teams Dashboard
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Manage teams — department, manager, members, capacity, and start date.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <Plus size={18} /> Create Team
        </button>
      </div>

      {scopedDepartments && ownershipFilter === TECH_TEAM_LIST_SCOPE.ADMIN && (
        <p className="text-sm text-gray-400">
          View-only — admin-created teams cannot be edited here. Open a team to see members and assignments.
        </p>
      )}

      {scopedDepartments && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOwnershipFilter(TECH_TEAM_LIST_SCOPE.MY)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              ownershipFilter === TECH_TEAM_LIST_SCOPE.MY
                ? 'bg-myth-accent/20 text-myth-accent border border-myth-accent/40'
                : 'bg-myth-surface text-gray-400 border border-myth-border hover:text-white'
            }`}
          >
            My Teams ({myTeamCount})
          </button>
          <button
            type="button"
            onClick={() => setOwnershipFilter(TECH_TEAM_LIST_SCOPE.ADMIN)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              ownershipFilter === TECH_TEAM_LIST_SCOPE.ADMIN
                ? 'bg-myth-accent/20 text-myth-accent border border-myth-accent/40'
                : 'bg-myth-surface text-gray-400 border border-myth-border hover:text-white'
            }`}
          >
            Admin Created Teams ({adminTeamCount})
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card py-3 px-4 text-center">
          <p className="text-2xl font-bold text-myth-accent">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Teams</p>
        </div>
        <div className="card py-3 px-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <CheckCircle2 size={12} /> Active
          </p>
        </div>
        <div className="card py-3 px-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.memberTotal}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Users size={12} /> Assigned Members
          </p>
        </div>
        <div className="card py-3 px-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.atCapacity}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <AlertTriangle size={12} /> At Capacity
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search team name..." />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field text-sm min-w-[140px]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDepartmentFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm ${departmentFilter === 'all' ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}
        >
          All Departments ({items.length})
        </button>
        {departments.map((d) => {
          const count = items.filter((t) => {
            const deptId = t.departmentRef?._id || t.departmentRef;
            if (deptId && String(deptId) === String(d._id)) return true;
            const group = inferTeamGroupFromDepartmentName(d.name);
            return t.teamGroup === group || t.department === group;
          }).length;
          return (
            <button
              key={d._id}
              type="button"
              onClick={() => setDepartmentFilter(String(d._id))}
              className={`px-3 py-1.5 rounded-lg text-sm ${departmentFilter === String(d._id) ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}
            >
              {d.name} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredItems.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((team) => {
            const members = membersByTeam[String(team._id)] || [];
            return (
              <TeamSettingsCard
                key={team._id}
                team={team}
                memberCount={members.length}
                members={members}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleStatus={toggleStatus}
                readOnly={scopedDepartments && isAdminCreatedTechnicalTeam(team, user?._id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-myth-border rounded-xl">
          <Shield size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No teams yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Create a team with name, department, manager, members, max capacity, and start date.
          </p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> Create Team
          </button>
        </div>
      )}

      <Modal
        isOpen={modal === 'form'}
        onClose={() => setModal(null)}
        title={editId ? 'Edit Team' : 'Create Team'}
        size="xl"
      >
        {scopedDepartments ? (
          <TechManagerCreateTeamForm
            key={editId || 'create'}
            team={editId ? items.find((t) => String(t._id) === String(editId)) : null}
            departments={departments}
            employees={employees}
            user={user}
            onCancel={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              fetchItems();
              usersAPI.getAll().then(({ data }) => setEmployees(Array.isArray(data) ? data : []));
            }}
          />
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 border-b border-myth-border pb-5">
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
                <label className="block text-sm text-gray-300 mb-1">Department *</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="input-field w-full"
                  required
                  disabled={scopedDepartments}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Team Manager *</label>
                <select
                  value={form.teamManager}
                  onChange={(e) => setForm({ ...form, teamManager: e.target.value })}
                  className="input-field w-full"
                  required
                  disabled={!form.departmentId || scopedDepartments}
                >
                  <option value="">Select Manager</option>
                  {managerOptions.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.firstName} {m.lastName}{m.employeeId ? ` (${m.employeeId})` : ''}
                    </option>
                  ))}
                </select>
                {form.departmentId && !managerOptions.length && (
                  <p className="text-xs text-amber-400/80 mt-1">No managers found. Hire a manager first.</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input-field w-full"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field w-full h-20"
                placeholder="Optional team description"
              />
            </div>
          </div>

          <div className="space-y-3 border-b border-myth-border pb-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-white">Team Members</h4>
              <span className="text-xs text-gray-500">
                {form.memberIds.length} selected
                {form.maxMembers ? ` · max ${form.maxMembers}` : ''}
              </span>
            </div>
            {!form.departmentId ? (
              <p className="text-sm text-gray-500">Select a department to choose team members.</p>
            ) : (
              <>
                <input
                  type="search"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="input-field w-full text-sm"
                  placeholder="Search employees..."
                />
                <div className="rounded-lg border border-myth-border divide-y divide-myth-border/60 max-h-48 overflow-y-auto">
                  {filteredMemberOptions.length ? filteredMemberOptions.map((e) => (
                    <label
                      key={e._id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-myth-surface/30 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.memberIds.map(String).includes(String(e._id))}
                        onChange={() => toggleMember(e._id)}
                        className="text-myth-accent rounded"
                      />
                      <span className="text-sm text-white">
                        {e.firstName} {e.lastName}
                        {e.employeeId && <span className="text-gray-500 font-mono text-xs ml-2">{e.employeeId}</span>}
                      </span>
                    </label>
                  )) : (
                    <p className="text-sm text-gray-500 px-3 py-4 text-center">No eligible employees for this department.</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Maximum Team Members</label>
              <input
                type="number"
                min={1}
                value={form.maxMembers}
                onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
                className="input-field w-full"
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-myth-border">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : 'Save Team'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">Reset</button>
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
          </div>
        </form>
        )}
      </Modal>
    </div>
  );
}
