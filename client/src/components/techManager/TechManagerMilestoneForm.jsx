import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  milestonesAPI,
  documentsAPI,
  projectsAPI,
} from '../../services/api';
import MilestoneTeamAssignSection, { teamFromProject } from '../milestones/MilestoneTeamAssignSection';
import {
  MILESTONE_TYPES,
  MILESTONE_PRIORITIES,
  MILESTONE_STATUSES,
  MILESTONE_FORM_PRIORITIES,
  MILESTONE_FORM_STATUSES,
  sortMilestonesByType,
  normalizeMilestonePriority,
  milestonePriorityForApi,
} from '../../constants/milestoneForm';
import { mapMemberRoleLabels } from '../../constants/techTeamForm';
import { categoryLabel } from '../../hooks/useProjectCategories';
import { usePermissions } from '../../hooks/usePermissions';

const emptyForm = () => ({
  name: '',
  milestoneType: '',
  description: '',
  priority: 'medium',
  startDate: '',
  endDate: '',
  estimatedDurationDays: '',
  status: 'not_started',
  progress: 0,
  parentMilestoneId: '',
  projectId: '',
  staffRoleId: '',
  dependsOnId: '',
  remarks: '',
});

const buildTeamFromMilestone = (milestone) => {
  if (!milestone) return { manager: '', assignedTo: [], memberRoles: {} };
  const memberObjs = milestone.assignedMembers || [];
  let ids = memberObjs.map((u) => String(u._id || u)).filter(Boolean);
  if (!ids.length && milestone.assignedTo) {
    ids = [String(milestone.assignedTo._id || milestone.assignedTo)];
  }
  const stored = mapMemberRoleLabels(milestone);
  const memberRoles = { ...stored };
  ids.forEach((id) => {
    if (!memberRoles[id]) {
      const u = memberObjs.find((x) => String(x._id) === id) || milestone.assignedTo;
      memberRoles[id] = u?.roleId?.name || '';
    }
  });
  return {
    manager: String(milestone.technicalManager?._id || milestone.technicalManager || ''),
    assignedTo: ids,
    memberRoles,
  };
};

const projectIdOfTeam = (team) => {
  if (!team) return '';
  return String(team.projectRef?._id || team.projectRef || '');
};

const customerDisplay = (project) => {
  const c = project?.customer;
  if (!c || typeof c !== 'object') return '—';
  const name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
  const company = c.companyName || c.company?.name;
  if (company && name) return `${name} (${company})`;
  return company || name || c.email || '—';
};

const managerDisplay = (project) => {
  const m = project?.manager;
  if (!m) return '—';
  if (typeof m === 'object') {
    const name = `${m.firstName || ''} ${m.lastName || ''}`.trim();
    return name ? `${name} · ${m.email || ''}` : (m.email || '—');
  }
  return String(m);
};

const projectStatusLabel = (status) =>
  (status || '—').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const sectionTitle = (text) => (
  <h4 className="text-sm font-semibold text-white uppercase tracking-wide border-b border-myth-border pb-2">
    {text}
  </h4>
);

export default function TechManagerMilestoneForm({
  milestone = null,
  projects = [],
  teams = [],
  employees = [],
  milestones = [],
  variant = 'tech',
  defaultProjectId = '',
  onCancel,
  onSaved,
}) {
  const navigate = useNavigate();
  const { user, isTechManager } = usePermissions();
  const editId = milestone?._id || null;
  const isAdmin = variant === 'admin';

  const resolveTechnicalManagerId = () => {
    const fromTeam = projectTeam.manager;
    const fromProject = projectDetail?.manager?._id || projectDetail?.manager || '';
    if (fromTeam) return String(fromTeam);
    if (fromProject) return String(fromProject);
    if (isTechManager && user?._id) return String(user._id);
    return '';
  };

  const resolveTechnicalManagerDisplay = () => {
    const fromProject = managerDisplay(projectDetail);
    if (fromProject !== '—') return fromProject;
    if (isTechManager && user) {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return name ? `${name} · ${user.email || ''}` : (user.email || 'You');
    }
    return '—';
  };

  const applyManagerFallback = (team, project) => {
    if (team.manager) return team;
    const projectManager = project?.manager?._id || project?.manager || '';
    if (projectManager) return { ...team, manager: String(projectManager) };
    if (isTechManager && user?._id) return { ...team, manager: String(user._id) };
    return team;
  };

  const buildInitial = () => {
    if (!milestone) return emptyForm();
    return {
      name: milestone.name || '',
      milestoneType: milestone.milestoneType || '',
      description: milestone.description || '',
      priority: normalizeMilestonePriority(milestone.priority),
      startDate: milestone.startDate ? new Date(milestone.startDate).toISOString().slice(0, 10) : '',
      endDate: milestone.endDate ? new Date(milestone.endDate).toISOString().slice(0, 10) : '',
      estimatedDurationDays: milestone.estimatedDurationDays ?? '',
      status: milestone.status || 'not_started',
      progress: milestone.progress ?? 0,
      parentMilestoneId: String(milestone.parentMilestone?._id || milestone.parentMilestone || ''),
      projectId: String(milestone.project?._id || milestone.project || ''),
      staffRoleId: String(milestone.staffRole?._id || milestone.staffRole || ''),
      dependsOnId: String(milestone.dependsOn?._id || milestone.dependsOn || ''),
      remarks: milestone.remarks || '',
    };
  };

  const [form, setForm] = useState(buildInitial);
  const [initialForm, setInitialForm] = useState(buildInitial);
  const [projectTeam, setProjectTeam] = useState(() => buildTeamFromMilestone(milestone));
  const [projectDetail, setProjectDetail] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    const seed = buildInitial();
    setForm(seed);
    setInitialForm(seed);
    setProjectTeam(buildTeamFromMilestone(milestone));
    setPendingFiles([]);
    if (milestone?.project) {
      const pid = milestone.project?._id || milestone.project;
      projectsAPI.getOne(pid)
        .then(({ data }) => {
          setProjectDetail(data);
          setProjectTeam(applyManagerFallback(teamFromProject(data), data));
        })
        .catch(() => {});
    } else if (defaultProjectId && !milestone) {
      handleProjectChange(String(defaultProjectId));
    } else {
      setProjectDetail(null);
    }
  }, [milestone?._id, defaultProjectId]);

  const teamsWithProject = useMemo(
    () => teams.filter((t) => projectIdOfTeam(t)),
    [teams]
  );

  const projectOptions = useMemo(() => {
    if (isAdmin) return projects;
    if (form.staffRoleId) {
      const team = teams.find((t) => String(t._id) === String(form.staffRoleId));
      const pid = projectIdOfTeam(team);
      if (!pid) return [];
      return projects.filter((p) => String(p._id) === pid);
    }
    if (form.projectId) {
      return projects.filter((p) => String(p._id) === String(form.projectId));
    }
    const linkedIds = new Set(teamsWithProject.map((t) => projectIdOfTeam(t)));
    return projects.filter((p) => linkedIds.has(String(p._id)));
  }, [projects, teams, teamsWithProject, form.projectId, form.staffRoleId, isAdmin]);

  const teamOptions = useMemo(() => {
    if (form.projectId) {
      return teamsWithProject.filter((t) => projectIdOfTeam(t) === String(form.projectId));
    }
    return teamsWithProject;
  }, [teamsWithProject, form.projectId]);

  const projectMilestones = useMemo(() => {
    if (!form.projectId) return [];
    const list = milestones.filter((m) => {
      const pid = m.project?._id || m.project;
      return String(pid) === String(form.projectId) && String(m._id) !== String(editId);
    });
    return sortMilestonesByType(list);
  }, [milestones, form.projectId, editId]);

  const handleProjectChange = async (projectId) => {
    const next = { ...form, projectId, parentMilestoneId: '', dependsOnId: '' };
    if (form.staffRoleId) {
      const team = teams.find((t) => String(t._id) === String(form.staffRoleId));
      if (projectIdOfTeam(team) !== String(projectId)) {
        next.staffRoleId = '';
      }
    }
    setForm(next);
    if (!projectId) {
      setProjectDetail(null);
      setProjectTeam({ manager: '', assignedTo: [], memberRoles: {} });
      return;
    }
    try {
      const { data } = await projectsAPI.getOne(projectId);
      setProjectDetail(data);
      setProjectTeam(applyManagerFallback(teamFromProject(data), data));
    } catch {
      const fromList = projects.find((p) => String(p._id) === String(projectId));
      setProjectDetail(fromList || null);
      if (fromList) setProjectTeam(applyManagerFallback(teamFromProject(fromList), fromList));
    }
  };

  const handleTeamChange = (staffRoleId) => {
    const team = teams.find((t) => String(t._id) === staffRoleId);
    const pid = projectIdOfTeam(team);
    setForm({
      ...form,
      staffRoleId,
      projectId: pid || form.projectId,
    });
  };

  const syncDurationFromDates = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? String(diff) : '';
  };

  const handleStartDateChange = (startDate) => {
    const estimatedDurationDays = syncDurationFromDates(startDate, form.endDate);
    setForm({ ...form, startDate, estimatedDurationDays: estimatedDurationDays || form.estimatedDurationDays });
  };

  const handleEndDateChange = (endDate) => {
    const estimatedDurationDays = syncDurationFromDates(form.startDate, endDate);
    setForm({ ...form, endDate, estimatedDurationDays: estimatedDurationDays || form.estimatedDurationDays });
  };

  const buildPayload = (attachments = []) => {
    const managerId = resolveTechnicalManagerId();
    return {
    name: form.name.trim(),
    milestoneType: form.milestoneType,
    description: form.description?.trim() || undefined,
    priority: milestonePriorityForApi(form.priority),
    startDate: form.startDate,
    endDate: form.endDate,
    estimatedDurationDays: form.estimatedDurationDays === '' ? undefined : Number(form.estimatedDurationDays),
    progress: Number(form.progress) || 0,
    status: form.status,
    parentMilestoneId: form.parentMilestoneId || undefined,
    projectId: form.projectId,
    staffRoleId: form.staffRoleId || undefined,
    assignedTo: projectTeam.assignedTo?.[0] || undefined,
    technicalManager: managerId || undefined,
    assignedMembers: projectTeam.assignedTo || [],
    memberRoleLabels: projectTeam.memberRoles || undefined,
    dependsOnId: form.dependsOnId || undefined,
    remarks: form.remarks?.trim() || undefined,
    attachments,
  };
  };

  const validate = () => {
    if (!form.projectId) {
      toast.error('Please select a project');
      return false;
    }
    const managerId = resolveTechnicalManagerId();
    if (!managerId && !isAdmin) {
      toast.error('This project has no technical manager. Ask admin to assign one on the project page.');
      return false;
    }
    if (!form.name.trim()) {
      toast.error('Milestone name is required');
      return false;
    }
    if (!form.milestoneType) {
      toast.error('Please select milestone type');
      return false;
    }
    if (!form.startDate) {
      toast.error('Start date is required');
      return false;
    }
    if (!form.endDate) {
      toast.error('End date is required');
      return false;
    }
    return true;
  };

  const uploadAttachments = async (milestoneId) => {
    if (!pendingFiles.length) return [];
    const uploaded = [];
    for (const file of pendingFiles) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('name', file.name);
        fd.append('folder', 'Milestones');
        fd.append('relatedType', 'milestone');
        fd.append('relatedId', milestoneId);
        const { data } = await documentsAPI.create(fd);
        uploaded.push({
          name: data.name || file.name,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileSize: data.fileSize,
        });
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    return uploaded;
  };

  const saveMilestone = async () => {
    if (!validate()) return null;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      let savedId = editId;
      if (editId) {
        await milestonesAPI.update(editId, payload);
        const attachments = await uploadAttachments(editId);
        if (attachments.length) {
          await milestonesAPI.update(editId, { attachments });
        }
        toast.success('Milestone updated');
      } else {
        const { data } = await milestonesAPI.create(payload);
        savedId = data._id;
        const attachments = await uploadAttachments(savedId);
        if (attachments.length) {
          await milestonesAPI.update(savedId, {
            attachments: [...(data.attachments || []), ...attachments],
          });
        }
        toast.success('Milestone created');
      }
      setInitialForm({ ...form });
      onSaved?.(savedId);
      return savedId;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveMilestone();
  };

  const handleSaveAndCreateTask = async (e) => {
    e.preventDefault();
    const savedId = await saveMilestone();
    if (!savedId) return;
    sessionStorage.setItem(
      'taskPrefill',
      JSON.stringify({
        title: form.name.trim(),
        description: form.description?.trim() || '',
        projectId: form.projectId,
        milestoneId: savedId,
        staffRoleId: form.staffRoleId || '',
      })
    );
    navigate('/tasks');
  };

  const resetForm = () => {
    setForm({ ...initialForm });
    setProjectTeam(buildTeamFromMilestone(milestone));
    setPendingFiles([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
      <section className="space-y-4">
        {sectionTitle('Project Information')}
        <p className="text-xs text-gray-500">
          {form.projectId
            ? 'Customer, category, and technical manager come from admin project setup.'
            : 'Select a project first. Customer, category, and technical manager come from admin project setup.'}
        </p>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Project *</label>
          <select
            value={form.projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="input-field w-full"
            required
          >
            <option value="">Select Project</option>
            {projectOptions.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}{p.code ? ` (${p.code})` : ''}
              </option>
            ))}
          </select>
        </div>
        {form.projectId && (
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Customer</label>
                <p className="text-sm text-white">{customerDisplay(projectDetail)}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Project Category</label>
                <p className="text-sm text-white">
                  {projectDetail ? categoryLabel(projectDetail.category) || '—' : '—'}
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Technical Manager</label>
                <p className="text-sm text-white">{resolveTechnicalManagerDisplay()}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {managerDisplay(projectDetail) === '—' && isTechManager
                    ? 'Not set on project — you will be recorded as technical manager for this milestone'
                    : 'Set by admin on the project — not editable here'}
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Project Status</label>
                <p className="text-sm text-white capitalize">{projectStatusLabel(projectDetail?.status)}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Assigned Engineers</label>
              <p className="text-sm text-cyan-300">
                {(projectDetail?.assignedTo || []).length
                  ? `${(projectDetail.assignedTo || []).length} member(s) on project team`
                  : 'No engineers assigned yet — ask admin to assign on project page'}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        {sectionTitle('Milestone Information')}
        <p className="text-xs text-gray-500">
          A milestone is a major phase for this project (e.g. Frontend Development). Create tasks after saving.
        </p>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Milestone Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field w-full"
            placeholder="Enter milestone name"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Milestone Type *</label>
            <select
              value={form.milestoneType}
              onChange={(e) => setForm({ ...form, milestoneType: e.target.value })}
              className="input-field w-full"
              required
            >
              <option value="">Select Type</option>
              {MILESTONE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Priority *</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="input-field w-full"
              required
            >
              {MILESTONE_FORM_PRIORITIES.map((key) => (
                <option key={key} value={key}>{MILESTONE_PRIORITIES[key]?.label || key}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field w-full h-28"
            placeholder="Milestone details"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Start Date *</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">End Date *</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Estimated Duration (Days)</label>
            <input
              type="number"
              min={0}
              value={form.estimatedDurationDays}
              onChange={(e) => setForm({ ...form, estimatedDurationDays: e.target.value })}
              className="input-field w-full"
              placeholder="Days"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Status *</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="input-field w-full"
              required
            >
              {MILESTONE_FORM_STATUSES.map((key) => (
                <option key={key} value={key}>{MILESTONE_STATUSES[key]?.label || key}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Progress (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => setForm({ ...form, progress: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Parent Milestone (Optional)</label>
            <select
              value={form.parentMilestoneId}
              onChange={(e) => setForm({ ...form, parentMilestoneId: e.target.value })}
              className="input-field w-full"
              disabled={!form.projectId}
            >
              <option value="">None</option>
              {projectMilestones.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {sectionTitle('Milestone Team')}
        <p className="text-xs text-gray-500">
          Optional: link a staff team, then choose which project engineers work on this milestone phase.
        </p>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Linked Staff Team (Optional)</label>
          <select
            value={form.staffRoleId}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="input-field w-full"
          >
            <option value="">None — use project engineers below</option>
            {teamOptions.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        {form.projectId && (
          <MilestoneTeamAssignSection
            projectId={form.projectId}
            team={projectTeam}
            onTeamChange={setProjectTeam}
            hideManager
            showAssignmentBadges={false}
            projectMembersOnly
          />
        )}
      </section>

      <section className="space-y-3">
        {sectionTitle('Dependencies')}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Depends On (Optional)</label>
          <select
            value={form.dependsOnId}
            onChange={(e) => setForm({ ...form, dependsOnId: e.target.value })}
            className="input-field w-full"
            disabled={!form.projectId}
          >
            <option value="">Select Previous Milestone</option>
            {projectMilestones.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-3">
        {sectionTitle('Attachments')}
        <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-myth-border bg-myth-surface/30 cursor-pointer hover:border-myth-accent/40">
          <Upload size={18} className="text-gray-500 shrink-0" />
          <span className="text-sm text-gray-400">Upload Documents</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
          />
        </label>
        {pendingFiles.length > 0 && (
          <ul className="text-xs text-gray-400 space-y-1">
            {pendingFiles.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        {sectionTitle('Remarks')}
        <textarea
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          className="input-field w-full h-28"
          placeholder="Optional remarks"
        />
      </section>

      <div className="flex flex-wrap gap-3 pt-2 border-t border-myth-border">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={handleSaveAndCreateTask}
          className="btn-primary"
        >
          Save & Create Task
        </button>
        <button type="button" onClick={resetForm} className="btn-secondary">Reset</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
