import { useState, useMemo, useEffect } from 'react';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksAPI, documentsAPI, projectsAPI, usersAPI, TASK_PRIORITIES } from '../../services/api';
import { TASK_TYPES, TASK_STATUS_OPTIONS, normalizeTaskStatus } from '../../constants/taskForm';
import { sortMilestonesByType } from '../../constants/milestoneForm';
import { inferTeamDepartment } from '../../utils/roleContext';

const emptyForm = () => ({
  projectId: '',
  milestoneId: '',
  staffRoleId: '',
  technicalManagerId: '',
  title: '',
  taskType: '',
  description: '',
  priority: 'medium',
  estimatedHours: '',
  assignedTo: '',
  startDate: '',
  dueDate: '',
  status: 'new',
  remarks: '',
});

const customerDisplay = (project) => {
  const c = project?.customer;
  if (!c || typeof c !== 'object') return '—';
  const name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
  const company = c.companyName || c.company?.name;
  if (company && name) return `${name} (${company})`;
  return company || name || c.email || '—';
};

const projectIdOfTeam = (team) => {
  if (!team) return '';
  return String(team.projectRef?._id || team.projectRef || '');
};

const projectIdOfMilestone = (m) => {
  if (!m) return '';
  return String(m.project?._id || m.project || '');
};

const teamIdOfMilestone = (m) => {
  if (!m) return '';
  return String(m.staffRole?._id || m.staffRole || '');
};

const filterHint = (text) => (
  <p className="text-[10px] lg:text-[11px] text-gray-500 mt-1">{text}</p>
);

const sectionTitle = (text) => (
  <h4 className="text-xs lg:text-sm font-semibold text-white uppercase tracking-wide border-b border-myth-border pb-2">
    {text}
  </h4>
);

export default function TechManagerCreateTaskForm({
  task = null,
  initialPrefill = null,
  projects = [],
  teams = [],
  milestones = [],
  employees = [],
  variant = 'tech',
  onCancel,
  onSaved,
  onDeleted,
  showSaveAndNew = true,
}) {
  const editId = task?._id || null;
  const isAdmin = variant === 'admin';

  const buildInitial = () => {
    if (task) {
      const projectId = task.relatedTo?.type === 'project'
        ? String(task.relatedTo.id || task.relatedTo._id || '')
        : '';
      return {
        projectId,
        milestoneId: String(task.milestone?._id || task.milestone || ''),
        staffRoleId: String(task.staffRole?._id || task.staffRole || ''),
        technicalManagerId: String(task.technicalManager?._id || task.technicalManager || ''),
        title: task.title || '',
        taskType: task.taskType || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        estimatedHours: task.estimatedHours ?? '',
        assignedTo: String(task.assignedTo?._id || task.assignedTo || ''),
        startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
        status: normalizeTaskStatus(task.status),
        remarks: task.remarks || '',
      };
    }
    if (initialPrefill) {
      return {
        ...emptyForm(),
        title: initialPrefill.title || '',
        description: initialPrefill.description || '',
        projectId: initialPrefill.projectId || '',
        milestoneId: initialPrefill.milestoneId || '',
        staffRoleId: initialPrefill.staffRoleId || '',
      };
    }
    return emptyForm();
  };

  const [form, setForm] = useState(buildInitial);
  const [initialForm, setInitialForm] = useState(buildInitial);
  const [projectDetail, setProjectDetail] = useState(null);
  const [managers, setManagers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    usersAPI.getAll()
      .then(({ data: allUsers }) => {
        const allManagers = (allUsers || []).filter((u) => u.role === 'manager' && u.isActive !== false);
        const techManagers = allManagers.filter((u) => {
          const dept = inferTeamDepartment(u.staffRole);
          if (dept === 'technical') return true;
          const deptName = String(u.departmentName || '').toLowerCase();
          return deptName.includes('tech');
        });
        setManagers(techManagers.length ? techManagers : allManagers);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const seed = buildInitial();
    setForm(seed);
    setInitialForm(seed);
    setPendingFiles([]);
    if (task?.relatedTo?.type === 'project') {
      const pid = task.relatedTo.id?._id || task.relatedTo.id;
      if (pid) {
        projectsAPI.getOne(pid).then(({ data }) => setProjectDetail(data)).catch(() => {});
      }
    } else if (seed.projectId) {
      projectsAPI.getOne(seed.projectId).then(({ data }) => setProjectDetail(data)).catch(() => {});
    } else {
      setProjectDetail(null);
    }
  }, [task?._id, initialPrefill]);

  const teamsWithProject = useMemo(
    () => teams.filter((t) => projectIdOfTeam(t)),
    [teams]
  );

  const selectedMilestone = useMemo(
    () => milestones.find((m) => String(m._id) === String(form.milestoneId)),
    [milestones, form.milestoneId]
  );

  const selectedTeam = useMemo(
    () => teams.find((t) => String(t._id) === String(form.staffRoleId)),
    [teams, form.staffRoleId]
  );

  const selectedProject = useMemo(
    () => projects.find((p) => String(p._id) === String(form.projectId)),
    [projects, form.projectId]
  );

  const projectOptions = useMemo(() => {
    if (isAdmin) return projects;
    if (form.milestoneId && selectedMilestone) {
      const pid = projectIdOfMilestone(selectedMilestone);
      if (pid) return projects.filter((p) => String(p._id) === pid);
    }
    if (form.staffRoleId && selectedTeam) {
      const pid = projectIdOfTeam(selectedTeam);
      if (pid) return projects.filter((p) => String(p._id) === pid);
    }
    const linkedIds = new Set();
    teamsWithProject.forEach((t) => linkedIds.add(projectIdOfTeam(t)));
    milestones.forEach((m) => {
      const pid = projectIdOfMilestone(m);
      if (pid) linkedIds.add(pid);
    });
    if (form.projectId) linkedIds.add(String(form.projectId));
    if (linkedIds.size === 0) return projects;
    return projects.filter((p) => linkedIds.has(String(p._id)));
  }, [projects, teamsWithProject, milestones, form.projectId, form.milestoneId, form.staffRoleId, selectedMilestone, selectedTeam]);

  const milestoneOptions = useMemo(() => {
    let list = milestones;

    if (form.projectId) {
      list = list.filter((m) => projectIdOfMilestone(m) === String(form.projectId));
    } else if (form.staffRoleId && selectedTeam) {
      const pid = projectIdOfTeam(selectedTeam);
      if (pid) list = list.filter((m) => projectIdOfMilestone(m) === pid);
    }

    if (form.staffRoleId) {
      list = list.filter((m) => {
        const tid = teamIdOfMilestone(m);
        return !tid || tid === String(form.staffRoleId);
      });
    } else if (form.milestoneId && selectedMilestone) {
      const tid = teamIdOfMilestone(selectedMilestone);
      if (tid) list = list.filter((m) => teamIdOfMilestone(m) === tid || !teamIdOfMilestone(m));
    }

    return sortMilestonesByType(list);
  }, [milestones, form.projectId, form.staffRoleId, form.milestoneId, selectedTeam, selectedMilestone]);

  const teamOptions = useMemo(() => {
    let list = teamsWithProject;

    if (form.projectId) {
      list = list.filter((t) => projectIdOfTeam(t) === String(form.projectId));
    } else if (form.milestoneId && selectedMilestone) {
      const pid = projectIdOfMilestone(selectedMilestone);
      if (pid) list = list.filter((t) => projectIdOfTeam(t) === pid);
    }

    if (form.milestoneId && selectedMilestone) {
      const tid = teamIdOfMilestone(selectedMilestone);
      if (tid) list = list.filter((t) => String(t._id) === tid);
    }

    return list;
  }, [teamsWithProject, form.projectId, form.milestoneId, selectedMilestone]);

  const teamMembers = form.staffRoleId
    ? employees.filter((e) => String(e.staffRole?._id || e.staffRole) === String(form.staffRoleId))
    : [];

  const milestoneStillValid = (milestoneId, projectId, staffRoleId) => {
    if (!milestoneId) return true;
    const m = milestones.find((item) => String(item._id) === String(milestoneId));
    if (!m) return false;
    if (projectId && projectIdOfMilestone(m) !== String(projectId)) return false;
    if (staffRoleId) {
      const tid = teamIdOfMilestone(m);
      if (tid && tid !== String(staffRoleId)) return false;
    }
    return true;
  };

  const teamStillValid = (staffRoleId, projectId) => {
    if (!staffRoleId) return true;
    const t = teams.find((item) => String(item._id) === String(staffRoleId));
    if (!t) return false;
    if (projectId && projectIdOfTeam(t) !== String(projectId)) return false;
    return true;
  };

  const handleProjectChange = async (projectId) => {
    const next = {
      ...form,
      projectId,
      assignedTo: '',
    };

    if (!milestoneStillValid(form.milestoneId, projectId, form.staffRoleId)) {
      next.milestoneId = '';
    }
    if (!teamStillValid(form.staffRoleId, projectId)) {
      next.staffRoleId = '';
    }

    if (isAdmin && projectId) {
      try {
        const { data } = await projectsAPI.getOne(projectId);
        setProjectDetail(data);
        const mgr = data.manager?._id || data.manager;
        if (mgr && !next.technicalManagerId) {
          next.technicalManagerId = String(mgr);
        }
      } catch {
        const fromList = projects.find((p) => String(p._id) === String(projectId));
        setProjectDetail(fromList || null);
        const mgr = fromList?.manager?._id || fromList?.manager;
        if (mgr && !next.technicalManagerId) {
          next.technicalManagerId = String(mgr);
        }
      }
    } else if (!projectId) {
      setProjectDetail(null);
    }

    setForm(next);
  };

  const handleMilestoneChange = (milestoneId) => {
    const milestone = milestones.find((m) => String(m._id) === String(milestoneId));
    const teamId = teamIdOfMilestone(milestone);
    const pid = projectIdOfMilestone(milestone);
    setForm({
      ...form,
      milestoneId,
      projectId: pid || form.projectId,
      staffRoleId: teamId || (milestoneId ? form.staffRoleId : ''),
      assignedTo: '',
    });
  };

  const handleTeamChange = (staffRoleId) => {
    const team = teams.find((t) => String(t._id) === staffRoleId);
    const pid = projectIdOfTeam(team);
    const next = {
      ...form,
      staffRoleId,
      projectId: pid || form.projectId,
      assignedTo: '',
    };
    if (!milestoneStillValid(form.milestoneId, next.projectId, staffRoleId)) {
      next.milestoneId = '';
    }
    setForm(next);
  };

  const buildPayload = (attachments = []) => ({
    title: form.title.trim(),
    description: form.description.trim(),
    taskType: form.taskType,
    priority: form.priority,
    status: form.status,
    startDate: form.startDate,
    dueDate: form.dueDate,
    estimatedHours: form.estimatedHours === '' ? undefined : Number(form.estimatedHours),
    assignedTo: form.assignedTo || undefined,
    milestoneId: form.milestoneId,
    staffRoleId: form.staffRoleId || undefined,
    technicalManagerId: form.technicalManagerId || undefined,
    projectId: form.projectId,
    remarks: form.remarks?.trim() || undefined,
    attachments,
  });

  const validate = () => {
    if (!form.projectId) return toast.error('Please select a project'), false;
    if (!form.milestoneId) return toast.error('Please select a milestone'), false;
    if (!isAdmin && !form.staffRoleId) return toast.error('Please select a team'), false;
    if (!form.title.trim()) return toast.error('Task title is required'), false;
    if (!form.taskType) return toast.error('Please select task type'), false;
    if (!form.description.trim()) return toast.error('Description is required'), false;
    if (isAdmin && !form.technicalManagerId) return toast.error('Please select a technical manager'), false;
    if (!isAdmin && !form.assignedTo) return toast.error('Please assign to a team member'), false;
    if (!form.startDate) return toast.error('Start date is required'), false;
    if (!form.dueDate) return toast.error('Due date is required'), false;
    return true;
  };

  const uploadAttachments = async (taskId) => {
    if (!pendingFiles.length) return [];
    const uploaded = [];
    for (const file of pendingFiles) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('name', file.name);
        fd.append('folder', 'Tasks');
        fd.append('relatedType', 'task');
        fd.append('relatedId', taskId);
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

  const saveTask = async () => {
    if (!validate()) return null;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      let savedId = editId;
      if (editId) {
        await tasksAPI.update(editId, payload);
        const attachments = await uploadAttachments(editId);
        if (attachments.length) {
          await tasksAPI.update(editId, { attachments });
        }
        toast.success('Task updated');
      } else {
        const { data } = await tasksAPI.create(payload);
        savedId = data._id;
        const attachments = await uploadAttachments(savedId);
        if (attachments.length) {
          await tasksAPI.update(savedId, {
            attachments: [...(data.attachments || []), ...attachments],
          });
        }
        toast.success('Task created');
      }
      if (onSaved) onSaved(savedId);
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
    await saveTask();
  };

  const handleSaveAndNew = async (e) => {
    e.preventDefault();
    const saved = await saveTask();
    if (!saved) return;
    setForm(emptyForm());
    setInitialForm(emptyForm());
    setProjectDetail(null);
    setPendingFiles([]);
  };

  const handleReset = () => {
    setForm(initialForm);
    setPendingFiles([]);
  };

  const handleDelete = async () => {
    if (!editId) return;
    if (!window.confirm(`Delete this task? This cannot be undone.`)) return;
    setSubmitting(true);
    try {
      await tasksAPI.delete(editId);
      toast.success('Task deleted');
      onDeleted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = TASK_STATUS_OPTIONS;

  const projectHint = form.milestoneId || form.staffRoleId
    ? 'Narrowed by selected milestone or team'
    : `${projectOptions.length} project${projectOptions.length === 1 ? '' : 's'} available`;

  const milestoneHint = !form.projectId && !form.staffRoleId
    ? 'Select a project or team to filter milestones'
    : milestoneOptions.length === 0
      ? 'No milestones match — create one under Teams → Milestones'
      : form.projectId && selectedProject
        ? `${milestoneOptions.length} milestone${milestoneOptions.length === 1 ? '' : 's'} for ${selectedProject.name}`
        : `${milestoneOptions.length} milestone${milestoneOptions.length === 1 ? '' : 's'} available`;

  const teamHint = !form.projectId && !form.milestoneId
    ? 'Select a project or milestone to filter teams'
    : teamOptions.length === 0
      ? 'No teams linked to this project — create one under Teams'
      : form.projectId && selectedProject
        ? `${teamOptions.length} team${teamOptions.length === 1 ? '' : 's'} for ${selectedProject.name}`
        : `${teamOptions.length} team${teamOptions.length === 1 ? '' : 's'} available`;

  const assigneeOptions = useMemo(() => {
    if (form.staffRoleId) {
      return employees.filter((e) => String(e.staffRole?._id || e.staffRole) === String(form.staffRoleId));
    }
    if (isAdmin) {
      return employees.filter((e) => e.role === 'technical' && e.isActive !== false);
    }
    return [];
  }, [employees, form.staffRoleId, isAdmin]);

  const attachmentsSection = (
    <section className="space-y-2 lg:space-y-3">
      {sectionTitle('Attachments')}
      <div className="border border-dashed border-myth-border rounded-lg p-3 lg:p-4">
        <label className="flex items-center gap-2 text-xs lg:text-sm text-myth-accent cursor-pointer hover:underline">
          <Upload size={14} lg:size={16} />
          Upload Files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setPendingFiles((prev) => [...prev, ...files]);
              e.target.value = '';
            }}
          />
        </label>
        {pendingFiles.length > 0 && (
          <ul className="mt-2 space-y-1">
            {pendingFiles.map((f, i) => (
              <li key={`${f.name}-${i}`} className="text-[10px] lg:text-xs text-gray-400 flex justify-between gap-2">
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:underline shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {task?.attachments?.length > 0 && (
          <ul className="mt-2 space-y-1">
            {task.attachments.map((a) => (
              <li key={a._id || a.fileUrl} className="text-[10px] lg:text-xs text-gray-500">
                Existing: {a.name || 'File'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );

  const formActions = (
    <div className="flex flex-wrap gap-2 lg:gap-3 justify-end pt-2 border-t border-myth-border">
      {editId && !isAdmin && onDeleted && (
        <button
          type="button"
          onClick={handleDelete}
          className="btn-secondary text-red-400 hover:text-red-300 mr-auto"
          disabled={submitting}
        >
          Delete
        </button>
      )}
      <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>
        Cancel
      </button>
      {!editId && (
        <button type="button" onClick={handleReset} className="btn-secondary" disabled={submitting}>
          Reset
        </button>
      )}
      {showSaveAndNew && !editId && (
        <button type="button" onClick={handleSaveAndNew} className="btn-secondary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save & New'}
        </button>
      )}
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Saving…' : editId ? 'Update' : 'Save'}
      </button>
    </div>
  );

  if (isAdmin) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        <section className="space-y-3 lg:space-y-4">
          {sectionTitle('Project Information')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="block text-xs lg:text-sm text-gray-300 mb-1">Project *</label>
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
            <div>
              <label className="block text-xs lg:text-sm text-gray-300 mb-1">Milestone *</label>
              <select
                value={form.milestoneId}
                onChange={(e) => handleMilestoneChange(e.target.value)}
                className="input-field w-full"
                required
                disabled={!form.projectId}
              >
                <option value="">{form.projectId ? 'Select Milestone' : 'Select project first'}</option>
                {milestoneOptions.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}{m.milestoneType ? ` — ${m.milestoneType}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Customer</label>
            <input
              readOnly
              value={customerDisplay(projectDetail)}
              className="input-field w-full bg-myth-surface/40 text-gray-400"
            />
          </div>
        </section>

        <section className="space-y-3 lg:space-y-4">
          {sectionTitle('Task Information')}
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Task Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field w-full"
              placeholder="Enter task title"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="block text-xs lg:text-sm text-gray-300 mb-1">Task Type *</label>
              <select
                value={form.taskType}
                onChange={(e) => setForm({ ...form, taskType: e.target.value })}
                className="input-field w-full"
                required
              >
                <option value="">Select Task Type</option>
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs lg:text-sm text-gray-300 mb-1">Priority *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="input-field w-full"
                required
              >
                {Object.keys(TASK_PRIORITIES).map((p) => (
                  <option key={p} value={p}>{TASK_PRIORITIES[p].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field w-full h-24"
              placeholder="Describe the task…"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <div>
              <label className="block text-xs lg:text-sm text-gray-300 mb-1">Estimated Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.estimatedHours}
                onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                className="input-field w-full"
                placeholder="Hours"
              />
            </div>
            <div>
              <label className="block text-xs lg:text-sm text-gray-300 mb-1">Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs lg:text-sm text-gray-300 mb-1">Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="input-field w-full"
                min={form.startDate || undefined}
                required
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 lg:space-y-4">
          {sectionTitle('Assignment')}
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Technical Manager *</label>
            <select
              value={form.technicalManagerId}
              onChange={(e) => setForm({ ...form, technicalManagerId: e.target.value })}
              className="input-field w-full"
              required
            >
              <option value="">Select Technical Manager</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.firstName} {m.lastName} · {m.email}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="block text-xs lg:text-sm text-gray-300 mb-1">Assign Team</label>
              <select
                value={form.staffRoleId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Optional</option>
                {teamOptions.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}{t.code ? ` (${t.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs lg:text-sm text-gray-300 mb-1">Assign Employee</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                className="input-field w-full"
              >
                <option value="">Leave Empty</option>
                {assigneeOptions.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.firstName} {e.lastName}{e.employeeId ? ` (${e.employeeId})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-2 lg:space-y-3">
          {sectionTitle('Status')}
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Status *</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="input-field w-full sm:w-64"
              required
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </section>

        {attachmentsSection}

        <section className="space-y-2 lg:space-y-3">
          {sectionTitle('Remarks')}
          <textarea
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            className="input-field w-full h-20"
            placeholder="Additional notes…"
          />
        </section>

        {formActions}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6 max-h-[75vh] overflow-y-auto pr-1">
      <section className="space-y-2 lg:space-y-3">
        {sectionTitle('Project')}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Project *</label>
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
            {filterHint(projectHint)}
          </div>
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Milestone *</label>
            <select
              value={form.milestoneId}
              onChange={(e) => handleMilestoneChange(e.target.value)}
              className="input-field w-full"
              required
            >
              <option value="">
                {form.projectId || form.staffRoleId ? 'Select Milestone' : 'Select project or team first'}
              </option>
              {milestoneOptions.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}{m.milestoneType ? ` — ${m.milestoneType}` : ''}
                </option>
              ))}
            </select>
            {filterHint(milestoneHint)}
          </div>
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Team *</label>
            <select
              value={form.staffRoleId}
              onChange={(e) => handleTeamChange(e.target.value)}
              className="input-field w-full"
              required
            >
              <option value="">
                {form.projectId || form.milestoneId ? 'Select Team' : 'Select project or milestone first'}
              </option>
              {teamOptions.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}{t.code ? ` (${t.code})` : ''}
                </option>
              ))}
            </select>
            {filterHint(teamHint)}
          </div>
        </div>
      </section>

      <section className="space-y-2 lg:space-y-3">
        {sectionTitle('Task Information')}
        <div>
          <label className="block text-xs lg:text-sm text-gray-300 mb-1">Task Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input-field w-full"
            placeholder="Enter task title"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Task Type *</label>
            <select
              value={form.taskType}
              onChange={(e) => setForm({ ...form, taskType: e.target.value })}
              className="input-field w-full"
              required
            >
              <option value="">Select Task Type</option>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Priority *</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="input-field w-full"
              required
            >
              {Object.keys(TASK_PRIORITIES).map((p) => (
                <option key={p} value={p}>{TASK_PRIORITIES[p].label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs lg:text-sm text-gray-300 mb-1">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field w-full h-24"
            placeholder="Describe the task…"
            required
          />
        </div>
        <div>
          <label className="block text-xs lg:text-sm text-gray-300 mb-1">Estimated Hours</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={form.estimatedHours}
            onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
            className="input-field w-full sm:w-48"
            placeholder="Hours"
          />
        </div>
      </section>

      <section className="space-y-2 lg:space-y-3">
        {sectionTitle('Assignment')}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Assign To *</label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="input-field w-full"
              required
              disabled={!form.staffRoleId}
            >
              <option value="">Select Team Member</option>
              {teamMembers.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName}{e.employeeId ? ` (${e.employeeId})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Start Date *</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs lg:text-sm text-gray-300 mb-1">Due Date *</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="input-field w-full"
              min={form.startDate || undefined}
              required
            />
          </div>
        </div>
      </section>

      <section className="space-y-2 lg:space-y-3">
        {sectionTitle('Status')}
        <div>
          <label className="block text-xs lg:text-sm text-gray-300 mb-1">Status *</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="input-field w-full sm:w-64"
            required
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </section>

      {attachmentsSection}

      <section className="space-y-2 lg:space-y-3">
        {sectionTitle('Remarks')}
        <textarea
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          className="input-field w-full h-20"
          placeholder="Additional notes…"
        />
      </section>

      {formActions}
    </form>
  );
}

export const emptyTaskForm = emptyForm;

export function buildTaskPayload(form) {
  return {
    title: form.title?.trim(),
    description: form.description?.trim(),
    taskType: form.taskType,
    priority: form.priority || 'medium',
    status: form.status || 'new',
    startDate: form.startDate || undefined,
    dueDate: form.dueDate || undefined,
    estimatedHours: form.estimatedHours === '' ? undefined : Number(form.estimatedHours),
    assignedTo: form.assignedTo || undefined,
    milestoneId: form.milestoneId || undefined,
    staffRoleId: form.staffRoleId || undefined,
    technicalManagerId: form.technicalManagerId || undefined,
    projectId: form.projectId || undefined,
    remarks: form.remarks?.trim() || undefined,
    devStage: form.devStage || undefined,
  };
}

export function parseTaskToForm(task) {
  const projectId = task.relatedTo?.type === 'project'
    ? String(task.relatedTo.id || task.relatedTo._id || '')
    : '';
  return {
    projectId,
    milestoneId: String(task.milestone?._id || task.milestone || ''),
    staffRoleId: String(task.staffRole?._id || task.staffRole || ''),
    technicalManagerId: String(task.technicalManager?._id || task.technicalManager || ''),
    title: task.title || '',
    taskType: task.taskType || '',
    description: task.description || '',
    priority: task.priority || 'medium',
    estimatedHours: task.estimatedHours ?? '',
    assignedTo: String(task.assignedTo?._id || task.assignedTo || ''),
    startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : '',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    status: normalizeTaskStatus(task.status),
    remarks: task.remarks || '',
    devStage: task.devStage || 'todo',
  };
}
