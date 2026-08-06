import { useEffect, useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, staffRolesAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { filterSupportTeamsByScope } from '../../utils/supportTeamOwnership';
import { PRIORITY_OPTIONS, supportCategoryLabel, memberTaskCategory } from '../../constants/supportProjectTasks';
import { SUPPORT_MANAGER_TASK_TABS } from '../../constants/supportManagerNav';
import {
  SupportManagerPageShell,
  SupportManagerPageHeader,
  SupportManagerTabBar,
  SupportManagerContentCard,
} from '../../components/supportManager/supportManagerUi';

const EMPTY = {
  projectId: '',
  title: '',
  staffRoleId: '',
  memberIds: [],
  priority: 'high',
  dueDate: '',
  description: '',
};

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">
        {label}{required ? ' *' : ''}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function MemberCheckList({ members, selectedIds, onToggle, loading, teamSelected }) {
  return (
    <div className="border border-myth-border rounded-lg divide-y divide-myth-border max-h-56 overflow-y-auto">
      {!teamSelected && (
        <p className="text-sm text-gray-500 text-center py-8">Select a support team first</p>
      )}
      {teamSelected && loading && (
        <p className="text-sm text-gray-500 text-center py-8">Loading members…</p>
      )}
      {teamSelected && !loading && members.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">No members on this team</p>
      )}
      {teamSelected && !loading && members.map((member) => {
        const id = String(member._id);
        const checked = selectedIds.includes(id);
        const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;
        const roleLabel = supportCategoryLabel(memberTaskCategory(member));
        return (
          <label
            key={member._id}
            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-myth-surface/60 ${checked ? 'bg-myth-accent/10' : ''}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(id)}
              className="rounded border-myth-border"
            />
            <span className="text-sm text-white flex-1">{name}</span>
            {roleLabel !== '—' && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-myth-surface/80 text-gray-400">{roleLabel}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}

export default function SupportManagerCreateTask() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [projects, setProjects] = useState([]);
  const [supportTeams, setSupportTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const teamsForProject = useMemo(() => {
    if (!form.projectId) return supportTeams;
    return supportTeams.filter((t) => {
      const ref = t.projectRef?._id || t.projectRef;
      return !ref || String(ref) === String(form.projectId);
    });
  }, [supportTeams, form.projectId]);

  useEffect(() => {
    Promise.all([
      projectsAPI.getSupportTaskProjects(),
      staffRolesAPI.getAll({ teamGroup: 'support', limit: 100, status: 'active' }),
    ])
      .then(([projectsRes, teamsRes]) => {
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        const allTeams = teamsRes.data?.items || teamsRes.data || [];
        const supportOnly = (Array.isArray(allTeams) ? allTeams : []).filter(
          (t) => t.teamGroup === 'support' && t.status !== 'inactive',
        );
        const scoped = filterSupportTeamsByScope(supportOnly, user?._id);
        setSupportTeams(scoped.length ? scoped : supportOnly);
      })
      .catch(() => toast.error('Failed to load form data'))
      .finally(() => setLoading(false));
  }, [user?._id]);

  useEffect(() => {
    if (!form.staffRoleId) {
      setTeamMembers([]);
      return;
    }
    setMembersLoading(true);
    projectsAPI.getSupportTaskTeamMembers(form.staffRoleId)
      .then(({ data }) => {
        setTeamMembers(Array.isArray(data?.members) ? data.members : []);
      })
      .catch(() => {
        setTeamMembers([]);
      })
      .finally(() => setMembersLoading(false));
  }, [form.staffRoleId]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.filter((id) => teamMembers.some((m) => String(m._id) === id)),
    }));
  }, [teamMembers]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleMember = (memberId) => {
    setForm((prev) => {
      const ids = prev.memberIds.map(String);
      if (ids.includes(memberId)) {
        return { ...prev, memberIds: ids.filter((id) => id !== memberId) };
      }
      return { ...prev, memberIds: [...ids, memberId] };
    });
  };

  const reset = () => {
    setForm(EMPTY);
    setTeamMembers([]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.projectId) return toast.error('Select a project');
    if (!form.title.trim()) return toast.error('Task title is required');
    if (!form.staffRoleId) return toast.error('Select a support team');
    if (!form.memberIds.length) return toast.error('Select at least one team member');
    if (!form.dueDate) return toast.error('Due date is required');

    setSubmitting(true);
    try {
      const { data } = await projectsAPI.createSupportTask(form.projectId, {
        title: form.title.trim(),
        staffRoleId: form.staffRoleId,
        assignedToIds: form.memberIds,
        priority: form.priority,
        dueDate: form.dueDate,
        description: form.description.trim(),
        status: 'assigned',
      });

      const count = data?.count || (data?.items?.length) || 1;
      toast.success(count > 1 ? `${count} tasks created and assigned` : 'Task created and assigned');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SupportManagerPageShell className="max-w-2xl mx-auto">
      <SupportManagerPageHeader
        icon={ClipboardList}
        title="Create Task"
        subtitle="Assign work to support team members on an active project."
        workflow={['Select project', 'Choose team & members', 'Set priority & due date', 'Submit']}
      />

      <SupportManagerTabBar tabs={SUPPORT_MANAGER_TASK_TABS} activeKey="create" />

      <SupportManagerContentCard>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Project" required>
          <select
            className="input-field w-full"
            value={form.projectId}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              projectId: e.target.value,
              staffRoleId: '',
              memberIds: [],
            }))}
            required
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Task Title" required>
          <input
            className="input-field w-full"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Enter task title"
            required
          />
        </Field>

        <Field label="Support Team" required>
          <select
            className="input-field w-full"
            value={form.staffRoleId}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              staffRoleId: e.target.value,
              memberIds: [],
            }))}
            required
            disabled={!form.projectId}
          >
            <option value="">{form.projectId ? 'Select support team' : 'Select project first'}</option>
            {teamsForProject.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          {form.projectId && teamsForProject.length === 0 && (
            <p className="text-amber-400 text-xs mt-1">No support team for this project — create one under Support Teams.</p>
          )}
        </Field>

        <Field
          label="Assign Members"
          required
          hint={form.memberIds.length ? `${form.memberIds.length} selected` : 'Select one or more team members'}
        >
          <MemberCheckList
            members={teamMembers}
            selectedIds={form.memberIds}
            onToggle={toggleMember}
            loading={membersLoading}
            teamSelected={Boolean(form.staffRoleId)}
          />
        </Field>

        <Field label="Priority" required>
          <select
            className="input-field w-full"
            value={form.priority}
            onChange={(e) => update('priority', e.target.value)}
            required
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Due Date" required>
          <input
            type="date"
            className="input-field w-full"
            value={form.dueDate}
            onChange={(e) => update('dueDate', e.target.value)}
            required
          />
        </Field>

        <Field label="Description">
          <textarea
            className="input-field w-full min-h-[120px]"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Task details and instructions…"
          />
        </Field>

        <div className="flex justify-center pt-4 border-t border-myth-border">
          <button type="submit" disabled={submitting} className="btn-primary min-w-[140px]">
            {submitting ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </form>
      </SupportManagerContentCard>
    </SupportManagerPageShell>
  );
}
