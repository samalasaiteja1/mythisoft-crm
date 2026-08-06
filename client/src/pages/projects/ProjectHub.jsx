import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Users, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectTeamAssign from '../../components/projects/ProjectTeamAssign';
import TechnicalMilestones from '../../components/projects/TechnicalMilestones';
import AdminTechMilestonesView from './AdminTechMilestonesView';
import AdminTechTasksView from './AdminTechTasksView';
import TechnicalWorkload from '../../components/projects/TechnicalWorkload';
import ProjectTechAssignmentBadge from '../../components/projects/ProjectTechAssignmentBadge';
import StatusBadge from '../../components/StatusBadge';
import RequirementsDocLinks, { groupRequirementsByProject } from '../../components/projects/RequirementsDocLinks';
import { ACTIVE_PROJECT_STATUSES, PROJECT_STATUSES } from '../../constants/projectStatuses';
import { usePermissions } from '../../hooks/usePermissions';
import { getProjectTechAssignmentDisplay } from '../../utils/customerTechAssignment';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminStatStrip,
  AdminSectionTitle,
  AdminEmptyState,
} from '../../components/admin/adminUi';

function HubHeader({ icon: Icon, title, subtitle, meta, stats }) {
  return (
    <>
      <AdminPageHeader icon={Icon} title={title} subtitle={subtitle} meta={meta} />
      {stats}
    </>
  );
}

const TITLES = {
  assign: {
    title: 'Assign Projects',
    subtitle: 'Step 1 — assign technical manager and team members before development starts',
  },
  'team-allocation': {
    title: 'Team Allocation',
    subtitle: 'Who is assigned across active projects — managers and engineers',
  },
  milestones: {
    title: 'Milestones',
    subtitle: 'Project status and delivery progress across the portfolio',
  },
  tasks: {
    title: 'Tasks',
    subtitle: 'Tasks created by managers and assigned to technical team members',
  },
};

const TECH_TITLES = {
  'team-allocation': { title: 'My Workload', subtitle: 'Projects assigned to you by admin or manager' },
  milestones: { title: 'Milestones', subtitle: 'Delivery milestones for your assigned projects' },
};

const memberOnProject = (project, memberId) => (project.assignedTo || []).some(
  (u) => String(typeof u === 'object' ? u._id : u) === String(memberId),
);

const managerOnProject = (project, managerId) => {
  const m = project.manager;
  if (!m) return false;
  return String(typeof m === 'object' ? m._id : m) === String(managerId);
};

const displayProjectStatus = (project) => {
  if (project.workflowStage === 'project_started' && project.status === 'new') return 'planning';
  return project.status || 'planning';
};

export default function ProjectHub({ section = 'assign' }) {
  const { isAdmin, isManager, isSales, isTechnical } = usePermissions();
  const canAssignTeam = isAdmin || isManager || isSales;
  const meta = (isTechnical ? TECH_TITLES[section] : TITLES[section]) || TITLES.assign;
  const [projects, setProjects] = useState([]);
  const [techTeam, setTechTeam] = useState([]);
  const [requirementsByProject, setRequirementsByProject] = useState({});
  const [deliveryByProject, setDeliveryByProject] = useState({});
  const [allRequirements, setAllRequirements] = useState([]);
  const [allDelivery, setAllDelivery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsAPI.getAll({ limit: 100 }),
      projectsAPI.getTechnicalTeam().catch(() => ({ data: { members: [] } })),
      projectsAPI.listRequirementsDocuments().catch(() => ({ data: [] })),
      isTechnical
        ? projectsAPI.listDeliveryDocuments().catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
    ])
      .then(([projRes, teamRes, reqRes, delRes]) => {
        setProjects(projRes.data.items || []);
        setTechTeam(teamRes.data.members || []);
        const reqs = Array.isArray(reqRes.data) ? reqRes.data : [];
        const dels = Array.isArray(delRes.data) ? delRes.data : [];
        setAllRequirements(reqs);
        setAllDelivery(dels);
        setRequirementsByProject(groupRequirementsByProject(reqs));
        setDeliveryByProject(groupRequirementsByProject(dels));
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [isTechnical]);

  if (loading) return <LoadingSpinner />;

  const active = projects.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status));
  const planning = projects.filter((p) => ['new', 'planning'].includes(p.status));
  const onHold = projects.filter((p) => p.status === 'on_hold');
  const completed = projects.filter((p) => p.status === 'completed');
  const cancelled = projects.filter((p) => p.status === 'cancelled');
  const unassignedTech = projects.filter((p) => getProjectTechAssignmentDisplay(p).status === 'none');

  if (section === 'assign') {
    if (isTechnical) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Assignments</h1>
            <p className="text-gray-400 mt-1 text-sm">Projects assigned to you — open a project to update status and delivery workflow</p>
          </div>
          {projects.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">No projects assigned yet</div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <Link key={p._id} to={`/projects/${p._id}`} className="card block hover:border-myth-accent/40 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-white font-medium">{p.name}</p>
                    <StatusBadge status={displayProjectStatus(p)} config={PROJECT_STATUSES} />
                  </div>
                  <ProjectTechAssignmentBadge project={p} compact />
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <AdminPageShell>
        <HubHeader
          icon={FolderKanban}
          title={meta.title}
          subtitle={meta.subtitle}
          meta={unassignedTech.length > 0 ? `${unassignedTech.length} project${unassignedTech.length !== 1 ? 's' : ''} not assigned to tech yet` : `${projects.length} projects`}
          stats={(
            <AdminStatStrip stats={[
              { label: 'Total', value: projects.length, color: 'text-white' },
              { label: 'Unassigned tech', value: unassignedTech.length, color: 'text-red-400', highlight: unassignedTech.length > 0 },
              { label: 'Planning', value: planning.length, color: 'text-blue-400' },
              { label: 'Active', value: active.length, color: 'text-green-400' },
              { label: 'Completed', value: completed.length, color: 'text-gray-400' },
            ]} />
          )}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card space-y-2 max-h-[32rem] overflow-y-auto">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Select project</p>
            {projects.map((p) => {
              const reqCount = (requirementsByProject[p._id] || []).length;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setSelectedProject(p)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedProject?._id === p._id ? 'border-myth-accent bg-myth-accent/10' : 'border-myth-border hover:border-myth-accent/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="text-white font-medium">{p.name}</p>
                    <StatusBadge status={displayProjectStatus(p)} config={PROJECT_STATUSES} />
                  </div>
                  <ProjectTechAssignmentBadge project={p} compact />
                  <p className="text-xs text-gray-500 mt-2">
                    {reqCount ? `${reqCount} requirements doc${reqCount !== 1 ? 's' : ''}` : 'No requirements document yet'}
                  </p>
                </button>
              );
            })}
          </div>
          {selectedProject ? (
            <div className="space-y-4">
              <ProjectTeamAssign
                projectId={selectedProject._id}
                assignedTo={selectedProject.assignedTo}
                manager={selectedProject.manager}
                memberRoleLabels={selectedProject.memberRoleLabels}
                canAssign={canAssignTeam}
                onAssigned={(data) => {
                  setSelectedProject(data);
                  setProjects((prev) => prev.map((p) => (p._id === data._id ? data : p)));
                }}
              />
              {(requirementsByProject[selectedProject._id] || []).length > 0 && (
                <div className="card">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Requirements sent to technical team</p>
                  <RequirementsDocLinks documents={requirementsByProject[selectedProject._id]} compact />
                </div>
              )}
            </div>
          ) : (
            <div className="card flex items-center justify-center text-gray-500 text-sm min-h-[200px]">
              Select a project to assign technical manager and team members
            </div>
          )}
        </div>
      </AdminPageShell>
    );
  }

  if (section === 'team-allocation') {
    if (isTechnical) {
      return <TechnicalWorkload projects={projects} techTeam={techTeam} requirementsByProject={requirementsByProject} deliveryByProject={deliveryByProject} allRequirements={allRequirements} allDelivery={allDelivery} />;
    }

    const managers = [...new Map(
      projects
        .filter((p) => p.manager)
        .map((p) => {
          const m = p.manager;
          const id = typeof m === 'object' ? m._id : m;
          return [String(id), typeof m === 'object' ? m : { _id: id, firstName: 'Manager', lastName: '' }];
        }),
    ).values()];

    return (
      <AdminPageShell>
        <HubHeader icon={Users} title={meta.title} subtitle={meta.subtitle} meta={`${managers.length} managers · ${techTeam.length} team members`} />

        {managers.length > 0 && (
          <div>
            <AdminSectionTitle icon={UserCog} title="Technical managers" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {managers.map((manager) => {
                const managed = projects.filter((p) => managerOnProject(p, manager._id));
                return (
                  <div key={manager._id} className="card border border-myth-border/80">
                    <p className="text-white font-medium">{manager.firstName} {manager.lastName}</p>
                    <p className="text-xs text-gray-500">{manager.email}</p>
                    <p className="text-sm text-gray-400 mt-2">{managed.length} project{managed.length !== 1 ? 's' : ''}</p>
                    <ul className="mt-2 space-y-1">
                      {managed.slice(0, 4).map((p) => (
                        <li key={p._id}>
                          <Link to={`/projects/${p._id}`} className="text-sm text-myth-accent hover:underline">{p.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <AdminSectionTitle icon={Users} title="Technical team members" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {techTeam.map((member) => {
              const assigned = projects.filter((p) => memberOnProject(p, member._id));
              return (
                <div key={member._id} className="card border border-myth-border/80">
                  <div className="flex items-center gap-3 mb-3">
                    <Users size={18} className="text-myth-accent" />
                    <div>
                      <p className="text-white font-medium">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{assigned.length} project{assigned.length !== 1 ? 's' : ''}</p>
                  <ul className="mt-2 space-y-1">
                    {assigned.slice(0, 4).map((p) => (
                      <li key={p._id}>
                        <Link to={`/projects/${p._id}`} className="text-sm text-myth-accent hover:underline">{p.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </AdminPageShell>
    );
  }

  if (section === 'milestones' && !isTechnical) {
    return <AdminTechMilestonesView />;
  }

  if (section === 'tasks' && !isTechnical) {
    return <AdminTechTasksView />;
  }

  if (isTechnical && section === 'milestones') {
    return <TechnicalMilestones projects={projects} requirementsByProject={requirementsByProject} deliveryByProject={deliveryByProject} />;
  }

  return (
    <AdminPageShell>
      <HubHeader icon={FolderKanban} title={meta.title} subtitle={meta.subtitle} />
      {[
        { label: 'New / Planning', items: planning },
        { label: 'Active delivery', items: active },
        { label: 'On hold', items: onHold },
        { label: 'Completed', items: completed },
        { label: 'Cancelled', items: cancelled },
      ].map(({ label, items }) => (
        <div key={label} className="card border border-myth-border/80">
          <AdminSectionTitle icon={FolderKanban} title={`${label} (${items.length})`} />
          {items.length === 0 ? (
            <AdminEmptyState message={`No projects in ${label.toLowerCase()}.`} icon={FolderKanban} />
          ) : (
            <div className="space-y-2">
              {items.map((p) => {
                const reqCount = (requirementsByProject[p._id] || []).length;
                return (
                  <Link key={p._id} to={`/projects/${p._id}`} className="block p-3 rounded-lg bg-myth-surface/40 hover:bg-myth-surface/60">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="text-white font-medium">{p.name}</p>
                      <StatusBadge status={displayProjectStatus(p)} config={PROJECT_STATUSES} />
                    </div>
                    <ProjectTechAssignmentBadge project={p} compact />
                    <p className="text-xs text-gray-500 mt-1">
                      {reqCount ? `${reqCount} requirements doc${reqCount !== 1 ? 's' : ''}` : 'No requirements document received yet'}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </AdminPageShell>
  );
}
