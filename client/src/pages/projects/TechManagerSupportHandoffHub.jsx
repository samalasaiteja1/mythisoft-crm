import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, FolderKanban, ChevronRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import ProjectSupportStatusPanel from '../../components/projects/ProjectSupportStatusPanel';
import SupportHandoffPanel from '../../components/projects/SupportHandoffPanel';
import { TechManagerPageHeader, TechManagerInfoBanner } from '../../components/techManager/techManagerUi';
import { PROJECT_STATUSES } from '../../constants/projectStatuses';
import { SUPPORT_REVIEW_STATUSES } from '../../constants/supportWorkflow';

const HANDOFF_WORKFLOW_STAGES = ['delivered', 'support', 'completed', 'deployment'];
const HANDOFF_STATUSES = ['completed', 'delivered', 'deployment'];

function isReadyForHandoff(project) {
  const stage = project.workflowStage || '';
  const status = project.status || '';
  return HANDOFF_WORKFLOW_STAGES.includes(stage) || HANDOFF_STATUSES.includes(status);
}

function assigneeName(assignee) {
  if (!assignee || typeof assignee !== 'object') return 'Support team';
  return `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.email || 'Support team';
}

export default function TechManagerSupportHandoffHub() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    projectsAPI.getAll({ limit: 200 })
      .then(({ data }) => setProjects(data?.items || data || []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const { ready, handedOff, notReady } = useMemo(() => {
    const readyList = [];
    const handedOffList = [];
    const notReadyList = [];

    projects.forEach((project) => {
      if (project.supportHandoffAt || project.supportAssignee) {
        handedOffList.push(project);
      } else if (isReadyForHandoff(project)) {
        readyList.push(project);
      } else {
        notReadyList.push(project);
      }
    });

    const sortByName = (a, b) => (a.name || '').localeCompare(b.name || '');
    return {
      ready: readyList.sort(sortByName),
      handedOff: handedOffList.sort(sortByName),
      notReady: notReadyList.sort(sortByName),
    };
  }, [projects]);

  const handleHandoff = (updatedProject) => {
    setProjects((prev) => prev.map((p) => (String(p._id) === String(updatedProject._id) ? updatedProject : p)));
    setExpandedId(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechManagerPageHeader
        icon={Headphones}
        title="Submit to Support"
        subtitle="Hand off completed projects to the Support Manager — share delivery documents and schedule customer follow-up."
      />

      <TechManagerInfoBanner>
        <p className="text-white font-medium mb-2">How it works</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Finish delivery (deployment → completed) and upload completion documents on the project page.</li>
          <li>Select the <strong className="text-gray-300">Support Manager</strong> (recommended) or a support agent.</li>
          <li>Add handoff notes — known issues, warranty, customer context — then submit.</li>
        </ol>
      </TechManagerInfoBanner>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Ready to submit ({ready.length})</h2>
        </div>

        {ready.length === 0 ? (
          <div className="card text-center py-12">
            <Headphones size={36} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400">No projects ready for support handoff yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Complete deployment and mark the project delivered or completed first.
            </p>
            <Link to="/projects/status/deployment" className="inline-flex items-center gap-1 text-myth-accent text-sm mt-4 hover:underline">
              Go to Deployment <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          ready.map((project) => {
            const isOpen = expandedId === String(project._id);
            return (
              <div key={project._id} className="card border border-myth-border/80">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <FolderKanban size={18} className="text-myth-accent shrink-0" />
                      <Link to={`/projects/${project._id}`} className="text-lg font-semibold text-white hover:text-myth-accent truncate">
                        {project.name}
                      </Link>
                      <StatusBadge status={project.status} config={PROJECT_STATUSES} />
                      {project.supportReviewStatus && SUPPORT_REVIEW_STATUSES[project.supportReviewStatus] && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${SUPPORT_REVIEW_STATUSES[project.supportReviewStatus].color}`}>
                          {SUPPORT_REVIEW_STATUSES[project.supportReviewStatus].label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Stage: {(project.workflowStage || '—').replace(/_/g, ' ')}
                      {project.customer && typeof project.customer === 'object' && (
                        <> · {project.customer.firstName} {project.customer.lastName}</>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link to={`/projects/${project._id}`} className="btn-secondary text-sm">
                      View project
                    </Link>
                    <button
                      type="button"
                      className="btn-primary text-sm"
                      onClick={() => setExpandedId(isOpen ? null : String(project._id))}
                    >
                      {isOpen ? 'Close form' : 'Submit to support'}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-6 pt-6 border-t border-myth-border/60">
                    <SupportHandoffPanel
                      project={project}
                      variant="techManager"
                      onHandoff={handleHandoff}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {handedOff.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" /> Already submitted ({handedOff.length})
          </h2>
          <div className="space-y-3">
            {handedOff.map((project) => (
              <div key={project._id} className="card border border-green-500/20 bg-green-500/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/projects/${project._id}`} className="font-medium text-white hover:text-myth-accent">
                        {project.name}
                      </Link>
                      {project.supportReviewStatus && SUPPORT_REVIEW_STATUSES[project.supportReviewStatus] && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${SUPPORT_REVIEW_STATUSES[project.supportReviewStatus].color}`}>
                          {SUPPORT_REVIEW_STATUSES[project.supportReviewStatus].label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Assigned to {assigneeName(project.supportAssignee)}
                      {project.supportHandoffAt && (
                        <> · Submitted {new Date(project.supportHandoffAt).toLocaleDateString()}</>
                      )}
                    </p>
                    {project.supportReviewStatus === 'in_support' && project.supportExecutiveAssignee && (
                      <p className="text-sm text-blue-300/90 mt-1">
                        Accepted — Support executive: {assigneeName(project.supportExecutiveAssignee)}
                        {project.supportReviewedAt && (
                          <> · {new Date(project.supportReviewedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    )}
                    {project.supportReviewStatus === 'pending_review' && (
                      <p className="text-sm text-amber-400/90 mt-1">Awaiting Support Manager review</p>
                    )}
                    {project.supportReviewStatus === 'changes_required' && (
                      <p className="text-sm text-orange-400/90 mt-1">Support requested changes — see Support Updates</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link to={`/projects/${project._id}`} className="btn-secondary text-sm">
                      View status
                    </Link>
                    <button
                      type="button"
                      className="btn-secondary text-sm shrink-0"
                      onClick={() => setExpandedId(expandedId === String(project._id) ? null : String(project._id))}
                    >
                      {expandedId === String(project._id) ? 'Close' : 'Update assignment'}
                    </button>
                  </div>
                </div>
                {expandedId === String(project._id) && (
                  <div className="mt-4 pt-4 border-t border-myth-border/40 space-y-4">
                    <ProjectSupportStatusPanel project={project} compact />
                    <SupportHandoffPanel
                      project={project}
                      variant="techManager"
                      onHandoff={handleHandoff}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {notReady.length > 0 && ready.length === 0 && handedOff.length === 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Still in delivery ({notReady.length})</h2>
          <p className="text-sm text-gray-500">These projects must pass deployment before you can submit to support.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {notReady.slice(0, 6).map((project) => (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="card py-3 px-4 text-sm text-gray-300 hover:border-myth-accent/30 transition-colors"
              >
                {project.name}
                <span className="text-gray-500 ml-2">· {(project.status || 'planning').replace(/_/g, ' ')}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
