import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ListTodo, Flag, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import Modal from '../Modal';
import TechManagerMilestoneForm from '../techManager/TechManagerMilestoneForm';
import MilestonesGuideBanner from './MilestonesGuideBanner';
import { MILESTONE_STATUSES, sortMilestonesByType } from '../../constants/milestoneForm';
import { formatDate } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

function taskCountForMilestone(tasks, milestoneId) {
  const mid = String(milestoneId);
  return tasks.filter((t) => String(t.milestone?._id || t.milestone || '') === mid).length;
}

export default function MilestonesProjectHub({
  milestones = [],
  projects = [],
  teams = [],
  employees = [],
  tasks = [],
  completedOnly = false,
  onRefresh,
  onDelete,
  deletingId = null,
  title = 'Milestones',
  subtitle = 'Phases per project — filter by project, then create milestones and tasks',
}) {
  const { isTechManager } = usePermissions();
  const [projectFilter, setProjectFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMilestone, setEditMilestone] = useState(null);
  const [createForProjectId, setCreateForProjectId] = useState('');
  const navigate = useNavigate();

  const openCreateTaskForMilestone = (milestone, projectId) => {
    sessionStorage.setItem(
      'taskPrefill',
      JSON.stringify({
        title: milestone.name || '',
        description: milestone.description || '',
        projectId: projectId || String(milestone.project?._id || milestone.project || ''),
        milestoneId: milestone._id,
        staffRoleId: String(milestone.staffRole?._id || milestone.staffRole || ''),
      }),
    );
    navigate('/tasks?create=1');
  };

  const displayedMilestones = useMemo(() => {
    if (completedOnly) return milestones.filter((m) => m.status === 'completed');
    return milestones.filter((m) => m.status !== 'completed');
  }, [milestones, completedOnly]);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [projects],
  );

  const visibleProjects = useMemo(() => {
    if (projectFilter === 'all') return sortedProjects;
    return sortedProjects.filter((p) => String(p._id) === projectFilter);
  }, [sortedProjects, projectFilter]);

  const openCreate = (projectId = '') => {
    setEditMilestone(null);
    setCreateForProjectId(projectId);
    setModalOpen(true);
  };

  const openEdit = (milestone) => {
    setEditMilestone(milestone);
    setCreateForProjectId('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditMilestone(null);
    setCreateForProjectId('');
  };

  const handleSaved = () => {
    closeModal();
    onRefresh?.();
  };

  const milestoneCountByProject = useMemo(() => {
    const map = {};
    displayedMilestones.forEach((m) => {
      const pid = String(m.project?._id || m.project || '');
      if (!pid) return;
      map[pid] = (map[pid] || 0) + 1;
    });
    return map;
  }, [displayedMilestones]);

  const PageIcon = completedOnly ? CheckCircle2 : Flag;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PageIcon className={completedOnly ? 'text-green-400' : 'text-cyan-400'} size={24} />
            {title}
          </h1>
          <p className="text-gray-400 mt-1">{subtitle}</p>
        </div>
        {!completedOnly && (
          <button
            type="button"
            onClick={() => openCreate(projectFilter !== 'all' ? projectFilter : '')}
            className="btn-primary inline-flex items-center gap-2 shrink-0"
          >
            <Plus size={18} />
            Create Milestone
          </button>
        )}
      </div>

      <MilestonesGuideBanner />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm text-gray-400 shrink-0">Filter by project</label>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="input-field w-full sm:max-w-md"
        >
          <option value="all">All projects ({sortedProjects.length})</option>
          {sortedProjects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
              {milestoneCountByProject[String(p._id)]
                ? ` — ${milestoneCountByProject[String(p._id)]} milestone(s)`
                : ' — no milestones yet'}
            </option>
          ))}
        </select>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="card text-center py-14">
          <PageIcon size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No projects assigned</p>
        </div>
      ) : (
        visibleProjects.map((project) => {
          const projectMilestones = sortMilestonesByType(
            displayedMilestones.filter((m) => String(m.project?._id || m.project) === String(project._id)),
          );
          return (
            <div key={project._id} className="card border border-myth-border/80">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                  <Link to={`/projects/${project._id}`} className="text-sm text-myth-accent hover:underline">
                    Open project
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {projectMilestones.length} milestone{projectMilestones.length !== 1 ? 's' : ''}
                  </span>
                  {!completedOnly && (
                    <button
                      type="button"
                      onClick={() => openCreate(String(project._id))}
                      className="btn-secondary text-xs inline-flex items-center gap-1"
                    >
                      <Plus size={14} /> Add milestone
                    </button>
                  )}
                </div>
              </div>

              {projectMilestones.length === 0 ? (
                <div className="rounded-lg border border-dashed border-myth-border py-8 text-center">
                  <p className="text-sm text-gray-500">No milestones for this project yet</p>
                  {!completedOnly && (
                    <button
                      type="button"
                      onClick={() => openCreate(String(project._id))}
                      className="btn-primary text-sm mt-3 inline-flex items-center gap-1"
                    >
                      <Plus size={14} /> Create first milestone
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="table-header">Milestone (phase)</th>
                        <th className="table-header">Type</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">Tasks</th>
                        <th className="table-header">Progress</th>
                        <th className="table-header">Dates</th>
                        <th className="table-header text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectMilestones.map((m) => {
                        const taskCount = taskCountForMilestone(tasks, m._id);
                        return (
                          <tr key={m._id} className="border-t border-myth-border">
                            <td className="table-cell text-white font-medium">{m.name}</td>
                            <td className="table-cell text-gray-400">{m.milestoneType || '—'}</td>
                            <td className="table-cell">
                              <StatusBadge status={m.status} config={MILESTONE_STATUSES} />
                            </td>
                            <td className="table-cell">
                              <span className="text-gray-300">{taskCount}</span>
                              {!completedOnly && (
                                <button
                                  type="button"
                                  onClick={() => openCreateTaskForMilestone(m, project._id)}
                                  className="ml-2 text-xs text-myth-accent hover:underline inline-flex items-center gap-0.5"
                                >
                                  <ListTodo size={12} /> Add task
                                </button>
                              )}
                            </td>
                            <td className="table-cell text-gray-400">{m.progress ?? 0}%</td>
                            <td className="table-cell text-gray-500 text-xs whitespace-nowrap">
                              {m.startDate ? formatDate(m.startDate) : '—'}
                              {m.endDate ? ` → ${formatDate(m.endDate)}` : ''}
                            </td>
                            <td className="table-cell text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEdit(m)}
                                  className="p-1.5 rounded hover:bg-myth-accent/10 text-gray-400 hover:text-myth-accent"
                                  title="Edit milestone"
                                >
                                  <Pencil size={16} />
                                </button>
                                {onDelete && (
                                  <button
                                    type="button"
                                    onClick={() => onDelete(m)}
                                    disabled={deletingId === m._id}
                                    className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 disabled:opacity-50"
                                    title="Delete milestone"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editMilestone ? 'Edit Milestone' : 'Create Milestone'}
        size="xl"
      >
        <TechManagerMilestoneForm
          key={editMilestone?._id || createForProjectId || 'create'}
          variant={isTechManager ? 'tech' : 'admin'}
          milestone={editMilestone}
          defaultProjectId={createForProjectId || editMilestone?.project?._id || editMilestone?.project || ''}
          projects={projects}
          teams={teams}
          employees={employees}
          milestones={milestones}
          onCancel={closeModal}
          onSaved={handleSaved}
        />
      </Modal>
    </div>
  );
}
