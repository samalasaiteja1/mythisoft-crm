import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { staffRolesAPI, usersAPI, projectsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { mapMemberRoleLabels } from '../../constants/techTeamForm';
import { memberTaskCategory } from '../../constants/supportProjectTasks';

const CUSTOMER_SUPPORT_LABEL = 'Customer Support';
const TECHNICAL_SUPPORT_LABEL = 'Technical Support';

const emptyForm = () => ({
  projectId: '',
  name: '',
  description: '',
  status: 'active',
  customerSupportIds: [],
  technicalSupportIds: [],
  notes: '',
});

const personName = (user) => {
  if (!user) return '—';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '—';
};

const projectTypeLabel = (project) => {
  if (!project) return '—';
  const cat = project.category;
  if (!cat) return '—';
  if (typeof cat === 'object') {
    return cat.code ? `${cat.name} (${cat.code})` : (cat.name || '—');
  }
  return '—';
};

function splitMembersFromLabels(memberIds, labels, employees = []) {
  const byId = new Map(employees.map((e) => [String(e._id), e]));
  const customerSupportIds = [];
  const technicalSupportIds = [];
  memberIds.forEach((id) => {
    const key = String(id);
    const label = labels[key] || '';
    if (/technical/i.test(label)) {
      technicalSupportIds.push(key);
      return;
    }
    if (label && /customer|executive|support/i.test(label)) {
      customerSupportIds.push(key);
      return;
    }
    const cat = memberTaskCategory(byId.get(key), null);
    if (cat === 'technical_support_engineer') {
      technicalSupportIds.push(key);
    } else {
      customerSupportIds.push(key);
    }
  });
  return { customerSupportIds, technicalSupportIds };
}

function MemberCheckList({ title, hint, options, selectedIds, onToggle, emptyText }) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">{title}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div className="border border-myth-border rounded-lg divide-y divide-myth-border max-h-48 overflow-y-auto">
        {options.length ? options.map((emp) => {
          const id = String(emp._id);
          const checked = selectedIds.includes(id);
          return (
            <label
              key={emp._id}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-myth-surface/60 ${checked ? 'bg-myth-accent/10' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(id)}
                className="rounded border-myth-border"
              />
              <span className="text-sm text-white">
                {emp.firstName} {emp.lastName}
                {emp.role === 'technical' && (
                  <span className="text-xs text-cyan-400 ml-1">(Technical)</span>
                )}
              </span>
            </label>
          );
        }) : (
          <p className="text-sm text-gray-500 text-center py-6">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

export default function SupportManagerCreateTeamForm({
  team = null,
  supportDepartmentId = '',
  user = null,
  onCancel,
  onSaved,
}) {
  const editId = team?._id || null;

  const [form, setForm] = useState(emptyForm);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      usersAPI.getAll({ forTeamPick: '1' }),
      projectsAPI.getSupportReviewQueue({ queue: 'submitted' }),
      projectsAPI.getSupportReviewQueue({ queue: 'review' }),
      projectsAPI.getSupportReviewQueue({ queue: 'active' }),
    ])
      .then(([usersRes, submitted, review, active]) => {
        setEmployees(Array.isArray(usersRes.data) ? usersRes.data : []);
        const map = new Map();
        [...(submitted.data?.items || []), ...(review.data?.items || []), ...(active.data?.items || [])]
          .forEach((p) => map.set(String(p._id), p));
        setProjects([...map.values()]);
      })
      .catch(() => toast.error('Failed to load form data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!editId || !employees.length) {
      if (!editId) setForm(emptyForm());
      return;
    }
    const memberIds = employees
      .filter((e) => String(e.staffRole?._id || e.staffRole) === String(team._id))
      .map((e) => String(e._id));
    const labels = mapMemberRoleLabels(team);
    const split = splitMembersFromLabels(memberIds, labels, employees);
    setForm({
      projectId: String(team.projectRef?._id || team.projectRef || ''),
      name: team.name || '',
      description: team.description || '',
      status: team.status || 'active',
      customerSupportIds: split.customerSupportIds,
      technicalSupportIds: split.technicalSupportIds,
      notes: team.remarks || '',
    });
  }, [editId, team, employees]);

  const selectedProject = useMemo(
    () => projects.find((p) => String(p._id) === String(form.projectId)),
    [projects, form.projectId],
  );

  const memberOptions = useMemo(
    () => employees.filter((e) => e.isActive !== false && ['support', 'technical'].includes(e.role)),
    [employees],
  );

  const toggleMember = (listKey, memberId, otherKey) => {
    const key = String(memberId);
    setForm((prev) => {
      const list = prev[listKey].map(String);
      const other = prev[otherKey].map(String).filter((id) => id !== key);
      if (list.includes(key)) {
        return {
          ...prev,
          [listKey]: list.filter((id) => id !== key),
          [otherKey]: other,
        };
      }
      return {
        ...prev,
        [listKey]: [...list, key],
        [otherKey]: other,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId) {
      toast.error('Select a project');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    const memberIds = [...form.customerSupportIds, ...form.technicalSupportIds];
    if (!memberIds.length) {
      toast.error('Select at least one team member');
      return;
    }
    if (!supportDepartmentId) {
      toast.error('Support department is not configured');
      return;
    }

    const memberRoleLabels = {};
    form.customerSupportIds.forEach((id) => {
      memberRoleLabels[id] = CUSTOMER_SUPPORT_LABEL;
    });
    form.technicalSupportIds.forEach((id) => {
      memberRoleLabels[id] = TECHNICAL_SUPPORT_LABEL;
    });

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        status: form.status,
        memberIds,
        memberRoleLabels,
        teamGroup: 'support',
        departmentId: supportDepartmentId,
        teamManager: user?._id,
        projectId: form.projectId,
        remarks: form.notes?.trim() || undefined,
      };

      if (editId) {
        await staffRolesAPI.update(editId, payload);
        toast.success('Team updated');
      } else {
        const { data } = await staffRolesAPI.create(payload);
        if (data?._id) {
          try {
            await projectsAPI.assignSupportTeam(form.projectId, {
              staffRoleId: data._id,
              notes: form.notes?.trim() || undefined,
            });
          } catch {
            toast.success('Team created (link to project — assign manually if needed)');
            onSaved?.();
            return;
          }
        }
        toast.success('Team created and linked to project');
      }
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center border-b border-myth-border pb-4 mb-2">
        <h3 className="text-sm font-semibold tracking-widest text-gray-400 uppercase">
          {editId ? 'Edit Support Team' : 'Create Support Team'}
        </h3>
        <p className="text-xs text-gray-500 mt-1">Add Customer Support and Technical Support members to the same team.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">Project *</label>
          <select
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            className="input-field w-full"
            required
            disabled={Boolean(editId)}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Customer *</label>
          <input
            value={personName(selectedProject?.customer)}
            className="input-field w-full bg-myth-surface/50"
            readOnly
            disabled
            placeholder="Auto filled when project is selected"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Project Type *</label>
          <input
            value={projectTypeLabel(selectedProject)}
            className="input-field w-full bg-myth-surface/50"
            readOnly
            disabled
            placeholder="Auto filled when project is selected"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Team Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-field w-full"
          placeholder="e.g. Rapidking Support Team"
          required
        />
      </div>

      {editId && team?.code && (
        <div>
          <label className="block text-sm text-gray-300 mb-1">Team Code</label>
          <input value={team.code} className="input-field w-full bg-myth-surface/50" readOnly disabled />
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-300 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field w-full min-h-[72px]"
          placeholder="Optional description"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <MemberCheckList
          title="Customer Support (Support Executives) *"
          hint="Training, user setup, customer support, documentation tasks"
          options={memberOptions}
          selectedIds={form.customerSupportIds}
          onToggle={(id) => toggleMember('customerSupportIds', id, 'technicalSupportIds')}
          emptyText="No support staff available"
        />
        <MemberCheckList
          title="Technical Support (Technical Support Engineers) *"
          hint="Deployment, server, SSL, email, database tasks"
          options={memberOptions}
          selectedIds={form.technicalSupportIds}
          onToggle={(id) => toggleMember('technicalSupportIds', id, 'customerSupportIds')}
          emptyText="No technical support staff available"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-2">Status *</label>
        <div className="flex flex-wrap gap-6">
          {['active', 'inactive'].map((status) => (
            <label key={status} className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-300 capitalize">
              <input
                type="radio"
                name="teamStatus"
                value={status}
                checked={form.status === status}
                onChange={() => setForm({ ...form, status })}
                className="border-myth-border text-myth-accent"
              />
              {status}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="input-field w-full min-h-[72px]"
          placeholder="Optional notes"
        />
      </div>

      {!editId && (
        <p className="text-xs text-gray-500">Team code is auto-generated when you save.</p>
      )}

      <div className="flex justify-center gap-3 pt-2 border-t border-myth-border">
        <button type="submit" className="btn-primary min-w-[120px]" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Team'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary min-w-[120px]" disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
