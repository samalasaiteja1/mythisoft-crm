import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ClipboardCheck, FolderKanban } from 'lucide-react';
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
import CustomerAcceptanceBadge from '../../components/projects/CustomerAcceptanceBadge';
import MarkCustomerAcceptedButton from '../../components/projects/MarkCustomerAcceptedButton';
import { formatSupportAssigneeLine } from '../../utils/supportAssigneeRole';

const personName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—');

export default function SupportProjectDelivery() {
  const [reviewProjects, setReviewProjects] = useState([]);
  const [taskProjects, setTaskProjects] = useState([]);
  const [customerProjects, setCustomerProjects] = useState([]);
  const [inSupportProjects, setInSupportProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      projectsAPI.getSupportReviewQueue({ queue: 'review' }),
      projectsAPI.getSupportReviewQueue({ queue: 'tasks' }),
      projectsAPI.getSupportReviewQueue({ queue: 'customer' }),
      projectsAPI.getSupportReviewQueue({ queue: 'active' }),
    ])
      .then(([reviewRes, tasksRes, customerRes, activeRes]) => {
        setReviewProjects(reviewRes.data?.items || []);
        setTaskProjects(tasksRes.data?.items || []);
        setCustomerProjects(customerRes.data?.items || []);
        setInSupportProjects(activeRes.data?.items || []);
      })
      .catch(() => toast.error('Failed to load delivery queue'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const { pending, resubmitted } = useMemo(() => ({
    pending: reviewProjects.filter((p) => p.supportReviewStatus === 'pending_review'),
    resubmitted: reviewProjects.filter((p) => p.supportReviewStatus === 'resubmitted'),
  }), [reviewProjects]);

  const tasksReady = useMemo(
    () => taskProjects.filter((p) => p.supportReviewStatus === 'support_tasks_complete'),
    [taskProjects],
  );

  const tasksInProgress = useMemo(
    () => taskProjects.filter((p) => ['support_tasks_assigned', 'support_tasks_in_progress'].includes(p.supportReviewStatus)),
    [taskProjects],
  );

  const handleDone = () => {
    setExpandedId(null);
    load();
  };

  const renderReviewProject = (project, mode) => {
    const statusMeta = SUPPORT_REVIEW_STATUSES[project.supportReviewStatus] || SUPPORT_REVIEW_STATUSES.pending_review;
    const panelKey = `${project._id}-${mode}`;
    const isOpen = expandedId === panelKey;

    return (
      <div key={panelKey} className="card border border-myth-border/80">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <FolderKanban size={18} className="text-myth-accent" />
              <Link to={`/projects/${project._id}`} className="text-lg font-semibold text-white hover:text-myth-accent">
                {project.name}
              </Link>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusMeta.color}`}>{statusMeta.label}</span>
              <CustomerAcceptanceBadge project={project} />
            </div>
            <p className="text-sm text-gray-500">
              Customer: {personName(project.customer)} · Tech Manager: {personName(project.manager)}
            </p>
            {project.supportHandoffAt && (
              <p className="text-sm text-gray-500 mt-1">
                Submitted {new Date(project.supportHandoffAt).toLocaleDateString()}
              </p>
            )}
            {project.activeUpdateRequest && typeof project.activeUpdateRequest === 'object' && (
              <p className="text-sm text-orange-400/90 mt-1">
                Update request: {project.activeUpdateRequest.subject}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn-primary text-sm shrink-0 inline-flex items-center gap-1"
            onClick={() => setExpandedId(isOpen ? null : panelKey)}
          >
            <ClipboardCheck size={14} />
            {isOpen ? 'Close' : (mode === 'verify' ? 'Verify fix' : mode === 'tasks' ? 'Verify & submit' : 'Accept or request changes')}
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

  if (loading) return <LoadingSpinner />;

  const deliveryStats = [
    { label: 'Awaiting review', value: pending.length, color: 'text-amber-400', highlight: pending.length > 0 },
    { label: 'Tasks in progress', value: tasksInProgress.length, color: 'text-blue-400' },
    { label: 'Ready to verify', value: tasksReady.length, color: 'text-green-400' },
    { label: 'Resubmitted', value: resubmitted.length, color: 'text-orange-400' },
    { label: 'With customer', value: customerProjects.length, color: 'text-purple-400', link: '/support/customer-acceptance' },
  ];

  return (
    <SupportManagerPageShell>
      <SupportManagerPageHeader
        icon={Truck}
        title="Project Delivery"
        subtitle="Accept projects from the technical team or request changes — then create tasks and submit to the customer when ready."
        workflow={SUPPORT_PROJECT_WORKFLOW}
      />

      <SupportManagerStatStrip stats={deliveryStats} />

      <SupportManagerTabBar tabs={SUPPORT_MANAGER_DELIVERY_TABS} activeKey="delivery" />

      <SupportManagerInfoBanner>
        <p className="text-white font-medium mb-2">Review actions on each project</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-orange-300">Support Team Accepted</strong> — activates support on the project</li>
          <li><strong className="text-orange-300">Request Changes</strong> — sends an update request to the technical team</li>
          <li>Create tasks via <Link to="/support/create-task" className="text-myth-accent hover:underline">Create Task</Link> when needed</li>
          <li>Track tasks on <Link to="/support/task-status" className="text-myth-accent hover:underline">Task Status</Link>, then submit to customer</li>
        </ul>
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-orange-500/20">
          <Link to="/projects/support-review" className="text-myth-accent hover:underline text-sm">
            Open full review queue →
          </Link>
          <Link to="/support/submitted-projects" className="text-gray-400 hover:text-myth-accent text-sm">
            Submitted projects list →
          </Link>
        </div>
      </SupportManagerInfoBanner>

      <section className="space-y-3">
        <SupportManagerSectionTitle icon={ClipboardCheck} title={`Awaiting review (${pending.length})`} />
        {pending.length === 0 ? (
          <SupportManagerEmptyState
            message={(
              <>
                No projects awaiting review — check{' '}
                <Link to="/support/submitted-projects" className="text-myth-accent hover:underline">Submitted Projects</Link>
              </>
            )}
          />
        ) : pending.map((p) => renderReviewProject(p, 'review'))}
      </section>

      <section className="space-y-3">
        <SupportManagerSectionTitle title={`Tasks in progress (${tasksInProgress.length})`} />
        {tasksInProgress.length === 0 ? (
          <SupportManagerEmptyState message="No projects with active support tasks." />
        ) : tasksInProgress.map((p) => renderReviewProject(p, 'tasks'))}
      </section>

      <section className="space-y-3">
        <SupportManagerSectionTitle title={`Verify completed tasks (${tasksReady.length})`} />
        {tasksReady.length === 0 ? (
          <SupportManagerEmptyState message="When the support executive completes all tasks, verify here then submit to the customer." />
        ) : tasksReady.map((p) => renderReviewProject(p, 'tasks'))}
      </section>

      <section className="space-y-3">
        <SupportManagerSectionTitle title={`Verify fixes (${resubmitted.length})`} />
        {resubmitted.length === 0 ? (
          <SupportManagerEmptyState message="No resubmitted projects — after technical manager completes an update request, verify the fix here then submit to the customer." />
        ) : resubmitted.map((p) => renderReviewProject(p, 'verify'))}
      </section>

      {customerProjects.length > 0 && (
        <section className="space-y-3">
          <SupportManagerSectionTitle title={`Awaiting customer acceptance (${customerProjects.length})`} />
          <div className="space-y-3">
            {customerProjects.map((project) => (
              <div key={project._id} className="card border border-purple-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <Link to={`/projects/${project._id}`} className="text-white font-medium hover:text-myth-accent">{project.name}</Link>
                    <div className="mt-1">
                      <CustomerAcceptanceBadge project={project} showWhenIdle />
                    </div>
                  </div>
                  <MarkCustomerAcceptedButton project={project} onDone={load} compact />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {inSupportProjects.length > 0 && (
        <section className="space-y-3">
          <SupportManagerSectionTitle title={`Active support (${inSupportProjects.length})`} />
          <div className="space-y-3">
            {inSupportProjects.map((project) => {
              const statusMeta = SUPPORT_REVIEW_STATUSES[project.supportReviewStatus] || {};
              return (
                <div key={project._id} className="card border border-blue-500/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <Link to={`/projects/${project._id}`} className="text-white font-medium hover:text-myth-accent">
                        {project.name}
                      </Link>
                      {statusMeta.label && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${statusMeta.color}`}>{statusMeta.label}</span>
                      )}
                      <CustomerAcceptanceBadge project={project} />
                      {project.supportExecutiveAssignee && (
                        <p className="text-sm text-blue-300/90 mt-1">
                          {formatSupportAssigneeLine(project.supportExecutiveAssignee, { useRoleName: true })}
                        </p>
                      )}
                    </div>
                    <Link to="/support/customer-acceptance" className="btn-secondary text-sm shrink-0">
                      Customer acceptance
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </SupportManagerPageShell>
  );
}
