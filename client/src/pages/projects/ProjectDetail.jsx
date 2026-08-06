import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, FolderKanban, Users, Send } from 'lucide-react';
import { projectsAPI, formatCurrency, formatDateTime, PROJECT_STATUSES, TECHNICAL_PROJECT_STATUSES } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import WorkflowProgress from '../../components/workflow/WorkflowProgress';
import ProjectTeamAssign from '../../components/projects/ProjectTeamAssign';
import ProjectDocumentsPanel from '../../components/projects/ProjectDocumentsPanel';
import SupportHandoffPanel from '../../components/projects/SupportHandoffPanel';
import { PROJECT_WORKFLOW_STAGES } from '../../constants/workflow';
import { usePermissions } from '../../hooks/usePermissions';
import { categoryLabel } from '../../hooks/useProjectCategories';
import { SubmitToManagerForm } from '../../components/techManager/TechManagerForms';
import CustomerProjectDetailView from '../../components/projects/CustomerProjectDetailView';
import CustomerAcceptancePanel from '../../components/projects/CustomerAcceptancePanel';
import ProjectSupportStatusPanel from '../../components/projects/ProjectSupportStatusPanel';

const workflowStageLabel = (key) => {
  const stage = PROJECT_WORKFLOW_STAGES.find((s) => s.key === key);
  return stage?.label || (key || '').replace(/_/g, ' ');
};

const SUPPORT_HANDOFF_STAGES = ['delivered', 'support', 'completed'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite, user, isAdmin, isManager, isTechnical, isTechManager, isCustomer } = usePermissions();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusValue, setStatusValue] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [submittingSetup, setSubmittingSetup] = useState(false);
  const teamAssignRef = useRef(null);
  const documentsRef = useRef(null);

  const isAssignedTechManager = project && isTechManager
    && String(project.manager?._id || project.manager || '') === String(user?._id || '');
  const canAssignTeam = isAdmin || (isManager && !isTechManager) || isAssignedTechManager;
  const canChangeStatus = (canWrite('projects') || isTechManager) && !isCustomer;
  const canSubmitDocs = isTechnical || isTechManager;

  const statusOptions = isTechnical
    ? TECHNICAL_PROJECT_STATUSES
    : Object.keys(PROJECT_STATUSES);

  useEffect(() => {
    projectsAPI.getOne(id)
      .then(({ data }) => setProject(data))
      .catch(() => toast.error('Project not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!project?.status) return;
    const val = project.workflowStage === 'project_started' && project.status === 'new'
      ? 'planning'
      : project.status;
    setStatusValue(val);
  }, [project?.status, project?.workflowStage]);

  const handleStatusChange = async (newStatus) => {
    setStatusValue(newStatus);
    if (!newStatus || newStatus === project.status) return;
    setSavingStatus(true);
    try {
      const { data } = await projectsAPI.update(id, { status: newStatus });
      setProject(data);
      toast.success('Status updated — admin and manager will see the change');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
      setStatusValue(project.status === 'new' && project.workflowStage === 'project_started' ? 'planning' : project.status);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSetupSubmit = async () => {
    const team = teamAssignRef.current;
    if (!team?.canSubmit()) {
      toast.error('Select a technical manager and at least one team member');
      return;
    }
    setSubmittingSetup(true);
    try {
      const assigned = await team.save();
      setProject(assigned);
      if (documentsRef.current?.hasPendingRequirements()) {
        await documentsRef.current.uploadRequirementsIfPending();
      }
      if ((project?.workflowStage || 'project_started') === 'project_started') {
        const { data } = await projectsAPI.updateWorkflow(id, 'development');
        setProject(data);
        toast.success('Project created — team assigned and moved to Development');
        navigate(`/projects/${id}`, { replace: true });
      } else {
        toast.success('Project assignment saved');
        navigate(`/projects/${id}`, { replace: true });
      }
    } catch (err) {
      if (!err?.message?.includes('required')) {
        toast.error(err.response?.data?.message || 'Failed to submit project setup');
      }
    } finally {
      setSubmittingSetup(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return <div className="text-center text-gray-400 py-12">Project not found</div>;

  if (isCustomer) {
    return <CustomerProjectDetailView project={project} projectId={id} />;
  }

  const workflowStage = project.workflowStage || 'project_started';
  const customer = project.customer;
  const isProjectStarted = workflowStage === 'project_started';
  const showSupportHandoff = canAssignTeam && (
    SUPPORT_HANDOFF_STAGES.includes(workflowStage)
    || (isTechManager && ['completed', 'delivered', 'deployment'].includes(project.status))
  );
  const displayStatus = isProjectStarted && project.status === 'new' ? 'planning' : project.status;

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <div className="card">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Project delivery workflow</p>
        <WorkflowProgress stages={PROJECT_WORKFLOW_STAGES} currentStage={workflowStage} />
      </div>

      <CustomerAcceptancePanel project={project} onUpdated={setProject} />

      {(isTechManager || isAdmin || isManager) && (
        <ProjectSupportStatusPanel project={project} useAdminRoleLabels={isAdmin} />
      )}

      <div className="card">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <FolderKanban className="text-myth-accent" size={24} />
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <span className="badge bg-myth-accent/20 text-myth-accent">{workflowStageLabel(workflowStage)}</span>
            <StatusBadge status={displayStatus} config={PROJECT_STATUSES} />
          </div>
          <p className="text-gray-400">
            {customer ? `${customer.firstName} ${customer.lastName}` : 'Customer'}
            {project.category ? ` · ${categoryLabel(project.category)}` : ''}
            {' · Budget '}{formatCurrency(project.budget)}
          </p>
          {project.manager && (
            <p className="text-sm text-gray-500 mt-2">
              Technical manager:{' '}
              <span className="text-gray-300">
                {project.manager.firstName} {project.manager.lastName}
                {project.manager.email ? ` (${project.manager.email})` : ''}
              </span>
              {isAssignedTechManager && (
                <span className="ml-2 text-xs text-myth-accent">· You manage this project</span>
              )}
            </p>
          )}
        </div>
        {project.description && <p className="text-gray-300 text-sm mt-4">{project.description}</p>}
        {project.scope && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Scope</p>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{project.scope}</p>
          </div>
        )}
        {project.deliverables && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deliverables</p>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{project.deliverables}</p>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">Created {formatDateTime(project.createdAt)}</p>

        {canChangeStatus && (
          <div className="mt-5 pt-4 border-t border-myth-border">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Project status</p>
            <select
              className="input-field sm:max-w-xs"
              value={statusValue}
              disabled={savingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {statusOptions.map((key) => (
                <option key={key} value={key}>{PROJECT_STATUSES[key]?.label || key}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">Admin and manager see status changes on Projects and Notifications</p>
          </div>
        )}
      </div>

      {canAssignTeam && (
        <div className={isProjectStarted ? 'space-y-2' : ''}>
          {isProjectStarted && (
            <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Users size={14} className="text-myth-accent" />
              Step 1 — Assign technical team
            </p>
          )}
          <div className={isProjectStarted ? 'card border-myth-accent/30' : ''}>
            <ProjectTeamAssign
              ref={teamAssignRef}
              projectId={id}
              assignedTo={project.assignedTo}
              manager={project.manager}
              memberRoleLabels={project.memberRoleLabels}
              canAssign={canAssignTeam}
              embedded={isProjectStarted}
              showInlineSave={!isProjectStarted}
              onAssigned={(data) => setProject(data)}
            />
          </div>
        </div>
      )}

      <div className="card">
        {isProjectStarted && canAssignTeam && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Step 2 — Requirements & documents</p>
        )}
        <ProjectDocumentsPanel
          ref={documentsRef}
          projectId={id}
          canSubmit={canSubmitDocs}
          projectStatus={project.status}
          workflowStage={workflowStage}
          showRequirementsSubmit={!isProjectStarted || !canAssignTeam}
        />
      </div>

      {canAssignTeam && isProjectStarted && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSetupSubmit}
            disabled={submittingSetup}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <Send size={14} />
            {submittingSetup ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      )}

      {showSupportHandoff && (
        <div className="card border-orange-400/20">
          <SupportHandoffPanel
            project={project}
            variant={isTechManager ? 'techManager' : 'default'}
            onHandoff={(updated) => setProject(updated)}
          />
        </div>
      )}

      {isTechManager && !['delivered', 'completed'].includes(workflowStage) && (
        <SubmitToManagerForm
          projectId={id}
          projectName={project.name}
          onSubmitted={() => projectsAPI.getOne(id).then(({ data }) => setProject(data))}
        />
      )}

      {!canAssignTeam && (
        <ProjectTeamAssign
          projectId={id}
          assignedTo={project.assignedTo}
          manager={project.manager}
          memberRoleLabels={project.memberRoleLabels}
          canAssign={false}
          onAssigned={(data) => setProject(data)}
        />
      )}
    </div>
  );
}
