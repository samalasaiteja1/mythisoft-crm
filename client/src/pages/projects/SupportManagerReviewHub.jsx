import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, FolderKanban, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SupportReviewPanel from '../../components/projects/SupportReviewPanel';
import { SUPPORT_REVIEW_STATUSES, SUPPORT_PROJECT_WORKFLOW } from '../../constants/supportWorkflow';
import { SUPPORT_MANAGER_DELIVERY_TABS } from '../../constants/supportManagerNav';
import {
  SupportManagerPageShell,
  SupportManagerPageHeader,
  SupportManagerStatStrip,
  SupportManagerTabBar,
  SupportManagerInfoBanner,
  SupportManagerSectionTitle,
  SupportManagerEmptyState,
} from '../../components/supportManager/supportManagerUi';

export default function SupportManagerReviewHub() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      projectsAPI.getSupportReviewQueue({ queue: 'review' }),
    ])
      .then(([queueRes]) => {
        setProjects(queueRes.data?.items || []);
      })
      .catch(() => toast.error('Failed to load review queue'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const { pending, resubmitted } = useMemo(() => ({
    pending: projects.filter((p) => p.supportReviewStatus === 'pending_review'),
    resubmitted: projects.filter((p) => p.supportReviewStatus === 'resubmitted'),
  }), [projects]);

  const handleDone = () => {
    setExpandedId(null);
    load();
  };

  if (loading) return <LoadingSpinner />;

  const renderProject = (project, mode) => {
    const statusMeta = SUPPORT_REVIEW_STATUSES[project.supportReviewStatus] || SUPPORT_REVIEW_STATUSES.pending_review;
    const isOpen = expandedId === `${project._id}-${mode}`;
    return (
      <div key={`${project._id}-${mode}`} className="card border border-myth-border/80">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <FolderKanban size={18} className="text-myth-accent" />
              <Link to={`/projects/${project._id}`} className="text-lg font-semibold text-white hover:text-myth-accent">
                {project.name}
              </Link>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusMeta.color}`}>{statusMeta.label}</span>
            </div>
            <p className="text-sm text-gray-500">
              Submitted {project.supportHandoffAt ? new Date(project.supportHandoffAt).toLocaleDateString() : '—'}
              {project.supportHandoffNotes && <> · {project.supportHandoffNotes.slice(0, 80)}{project.supportHandoffNotes.length > 80 ? '…' : ''}</>}
            </p>
            {project.activeUpdateRequest && typeof project.activeUpdateRequest === 'object' && (
              <p className="text-sm text-orange-400/90 mt-1">
                Update request: {project.activeUpdateRequest.subject}
                {project.activeUpdateRequest.ticketNumber && (
                  <> · <Link to={`/tickets/${project.activeUpdateRequest._id}`} className="text-myth-accent hover:underline">{project.activeUpdateRequest.ticketNumber}</Link></>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn-primary text-sm shrink-0"
            onClick={() => setExpandedId(isOpen ? null : `${project._id}-${mode}`)}
          >
            {isOpen ? 'Close' : (mode === 'verify' ? 'Verify fix' : 'Accept or request changes')}
          </button>
        </div>
        {isOpen && (
          <SupportReviewPanel
            project={project}
            mode={mode}
            onDone={handleDone}
          />
        )}
      </div>
    );
  };

  return (
    <SupportManagerPageShell>
      <SupportManagerPageHeader
        icon={ClipboardCheck}
        title="Review Submitted Projects"
        subtitle="Accept projects from the technical team or request changes before customer handoff."
        workflow={SUPPORT_PROJECT_WORKFLOW.slice(0, 5)}
      />

      <SupportManagerStatStrip stats={[
        { label: 'Awaiting review', value: pending.length, color: 'text-amber-400', highlight: pending.length > 0 },
        { label: 'Resubmitted', value: resubmitted.length, color: 'text-orange-400' },
        { label: 'Total in queue', value: projects.length, color: 'text-white' },
        { label: 'Delivery hub', value: pending.length + resubmitted.length, color: 'text-blue-400', link: '/support/project-delivery' },
        { label: 'Submitted list', value: projects.length, color: 'text-purple-400', link: '/support/submitted-projects' },
      ]} />

      <SupportManagerTabBar tabs={SUPPORT_MANAGER_DELIVERY_TABS} activeKey="review" />

      <SupportManagerInfoBanner>
        <p className="text-white font-medium mb-2">Review form on each project</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-orange-300">Support Team Accepted</strong> — activates support on the project</li>
          <li><strong className="text-orange-300">Request Changes</strong> — sends an update request to the technical team</li>
        </ul>
        <Link to="/support/project-delivery" className="inline-block mt-3 text-myth-accent hover:underline text-sm">
          ← Project Delivery hub
        </Link>
      </SupportManagerInfoBanner>

      <section className="space-y-3">
        <SupportManagerSectionTitle title={`Awaiting review (${pending.length})`} />
        {pending.length === 0 ? (
          <SupportManagerEmptyState message="No projects awaiting review." icon={FolderKanban} />
        ) : pending.map((p) => renderProject(p, 'review'))}
      </section>

      <section className="space-y-3">
        <SupportManagerSectionTitle title={`Verify fixes (${resubmitted.length})`} />
        {resubmitted.length === 0 ? (
          <SupportManagerEmptyState message="No resubmitted projects — after you verify a fix, the project moves to Awaiting review for customer handoff." />
        ) : resubmitted.map((p) => renderProject(p, 'verify'))}
      </section>

      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-myth-accent">
        View all projects <ChevronRight size={14} />
      </Link>
    </SupportManagerPageShell>
  );
}
