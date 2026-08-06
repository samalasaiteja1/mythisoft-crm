import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Flag, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatCurrency, formatDate, PROJECT_STATUSES } from '../../services/api';
import StatusBadge from '../StatusBadge';
import WorkflowProgress from '../workflow/WorkflowProgress';
import {
  PROJECT_MILESTONE_STAGES,
  TECHNICAL_PROJECT_STATUSES,
  getMilestoneIndex,
} from '../../constants/projectStatuses';
import ProjectDocumentsPanel from './ProjectDocumentsPanel';
import { categoryLabel } from '../../hooks/useProjectCategories';

export default function TechnicalMilestones({ projects: initialProjects, requirementsByProject = {}, deliveryByProject = {} }) {
  const [projects, setProjects] = useState(initialProjects);
  const [savingId, setSavingId] = useState(null);

  const milestoneCounts = PROJECT_MILESTONE_STAGES.reduce((acc, stage) => {
    acc[stage.key] = projects.filter((p) => p.status === stage.key || (stage.key === 'completed' && p.status === 'delivered')).length;
    return acc;
  }, {});

  const onHold = projects.filter((p) => p.status === 'on_hold');
  const cancelled = projects.filter((p) => p.status === 'cancelled');

  const updateStatus = async (projectId, status) => {
    setSavingId(projectId);
    try {
      const { data } = await projectsAPI.update(projectId, { status });
      setProjects((prev) => prev.map((p) => (p._id === projectId ? data : p)));
      toast.success('Milestone updated — admin and manager notified');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update milestone');
    } finally {
      setSavingId(null);
    }
  };

  const customerLabel = (customer) => {
    if (!customer) return 'Customer';
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'Customer';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Flag size={24} className="text-cyan-400" /> Milestones
        </h1>
        <p className="text-gray-400 mt-1">Track delivery progress and update milestone status for your assigned projects</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {PROJECT_MILESTONE_STAGES.map((stage) => (
          <div key={stage.key} className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 text-center">
            <p className="text-xs text-gray-500 truncate">{stage.label}</p>
            <p className="text-xl font-bold text-white mt-1">{milestoneCounts[stage.key] || 0}</p>
          </div>
        ))}
      </div>

      {(onHold.length > 0 || cancelled.length > 0) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {onHold.length > 0 && (
            <span className="badge bg-yellow-500/20 text-yellow-400">{onHold.length} on hold</span>
          )}
          {cancelled.length > 0 && (
            <span className="badge bg-red-500/20 text-red-400">{cancelled.length} cancelled</span>
          )}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No assigned projects yet</p>
          <p className="text-sm text-gray-500 mt-1">Milestones appear when admin or manager assigns you a project</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const currentIdx = getMilestoneIndex(project.status);
            const progress = Math.round(((currentIdx + 1) / PROJECT_MILESTONE_STAGES.length) * 100);

            return (
              <div key={project._id} className="card space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link to={`/projects/${project._id}`} className="text-lg font-semibold text-white hover:text-myth-accent">
                        {project.name}
                      </Link>
                      <StatusBadge status={project.status} config={PROJECT_STATUSES} />
                    </div>
                    <p className="text-sm text-gray-400">
                      {customerLabel(project.customer)}
                      {project.category ? ` · ${categoryLabel(project.category)}` : ''}
                      {' · '}{formatCurrency(project.budget)}
                    </p>
                    {project.endDate && (
                      <p className="text-xs text-gray-500 mt-1">Due {formatDate(project.endDate)}</p>
                    )}
                  </div>
                  <Link to={`/projects/${project._id}`} className="btn-secondary text-sm inline-flex items-center gap-1 shrink-0">
                    Open <ChevronRight size={14} />
                  </Link>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Delivery pipeline</span>
                    <span>{progress}% complete</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-myth-surface mb-3 overflow-hidden">
                    <div className="h-full bg-myth-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <WorkflowProgress
                    stages={PROJECT_MILESTONE_STAGES}
                    currentStage={project.status === 'delivered' ? 'completed' : project.status}
                  />
                </div>

                <div className="pt-2 border-t border-myth-border">
                  <ProjectDocumentsPanel
                    projectId={project._id}
                    canSubmit
                    projectStatus={project.status}
                    compact
                    initialRequirements={requirementsByProject[project._id] || []}
                    initialDelivery={deliveryByProject[project._id] || []}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-myth-border">
                  <select
                    className="input-field sm:max-w-xs flex-1"
                    value={TECHNICAL_PROJECT_STATUSES.includes(project.status) ? project.status : 'development'}
                    onChange={(e) => updateStatus(project._id, e.target.value)}
                    disabled={savingId === project._id}
                  >
                    {TECHNICAL_PROJECT_STATUSES.map((key) => (
                      <option key={key} value={key}>{PROJECT_STATUSES[key]?.label || key}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 sm:self-center">
                    {savingId === project._id ? 'Saving…' : 'Change milestone — updates sync to admin & manager'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
