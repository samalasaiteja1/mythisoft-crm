import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Users, Flag, ListTodo, FileText, Inbox, Send, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  projectsAPI, milestonesAPI, tasksAPI, staffRolesAPI,
} from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import StatusBadge from '../StatusBadge';
import ProjectTechAssignmentBadge from './ProjectTechAssignmentBadge';
import CustomerAcceptanceBadge from './CustomerAcceptanceBadge';
import ProjectSupportReviewBadge from './ProjectSupportReviewBadge';
import { TechManagerPageHeader, TechManagerInfoBanner } from '../techManager/techManagerUi';
import { ACTIVE_PROJECT_STATUSES, PROJECT_STATUSES, PROJECT_STATUS_KEYS } from '../../constants/projectStatuses';
import { categoryLabel } from '../../hooks/useProjectCategories';

const displayProjectStatus = (project) => {
  if (project.workflowStage === 'project_started' && project.status === 'new') return 'planning';
  return project.status || 'planning';
};

const FILTER_ICONS = {
  all: FolderKanban,
  active: FolderKanban,
  completed: FolderKanban,
  code_review: FolderKanban,
  testing: FolderKanban,
  bug_fixing: FolderKanban,
  deployment: FolderKanban,
};

const FILTER_META = {
  all: {
    title: 'All My Projects',
    subtitle: 'Every project assigned to you — open one to manage teams, milestones, and tasks',
  },
  active: {
    title: 'Active Projects',
    subtitle: 'Projects in development, review, testing, or deployment',
  },
  completed: {
    title: 'Completed Projects',
    subtitle: 'Finished projects — view history and documents',
  },
  code_review: {
    title: 'Code Review',
    subtitle: 'Projects waiting for your review — open one for full details, then use the form above to approve or request changes',
  },
  testing: {
    title: 'Testing',
    subtitle: 'Projects in QA testing — pass to move to bug tracking',
  },
  bug_fixing: {
    title: 'Bug Tracking',
    subtitle: 'Fix bugs from testing — use Bug Tracker, then approve when ready for deployment',
  },
  deployment: {
    title: 'Deployment',
    subtitle: 'Deploy to staging or production — mark completed when live',
  },
};

function customerLabel(customer) {
  if (!customer || typeof customer !== 'object') return '—';
  const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  return name || customer.companyName || customer.email || '—';
}

export default function TechManagerProjectsHome({ filterMode = 'all', refreshKey = 0 }) {
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const meta = FILTER_META[filterMode] || FILTER_META.all;
  const PageIcon = FILTER_ICONS[filterMode] || FolderKanban;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsAPI.getAll({ limit: 200 }),
      milestonesAPI.getAll(),
      tasksAPI.getAll(),
      staffRolesAPI.getAll(),
    ])
      .then(([projRes, milRes, taskRes, teamRes]) => {
        setProjects(projRes.data?.items || projRes.data || []);
        setMilestones(milRes.data?.items || []);
        setTasks(Array.isArray(taskRes.data) ? taskRes.data : taskRes.data?.items || []);
        const teamList = Array.isArray(teamRes.data) ? teamRes.data : teamRes.data?.items || [];
        setTeams(teamList.filter((t) => t.teamGroup === 'technical'));
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const countsByProject = useMemo(() => {
    const map = {};
    milestones.forEach((m) => {
      const pid = String(m.project?._id || m.project || '');
      if (pid) map[pid] = { ...(map[pid] || {}), milestones: (map[pid]?.milestones || 0) + 1 };
    });
    tasks.forEach((t) => {
      let pid = '';
      if (t.relatedTo?.type === 'project') {
        pid = String(t.relatedTo.id?._id || t.relatedTo.id || '');
      }
      if (!pid && t.project) pid = String(t.project._id || t.project);
      if (pid) map[pid] = { ...(map[pid] || {}), tasks: (map[pid]?.tasks || 0) + 1 };
    });
    teams.forEach((team) => {
      const pid = String(team.projectRef?._id || team.projectRef || '');
      if (pid) map[pid] = { ...(map[pid] || {}), teams: (map[pid]?.teams || 0) + 1 };
    });
    return map;
  }, [milestones, tasks, teams]);

  const filteredProjects = useMemo(() => {
    let list = [...projects];
    if (filterMode === 'active') {
      list = list.filter((p) => ACTIVE_PROJECT_STATUSES.includes(displayProjectStatus(p)));
    } else if (filterMode === 'completed') {
      list = list.filter((p) => ['completed', 'delivered'].includes(p.status));
    } else if (PROJECT_STATUS_KEYS.includes(filterMode)) {
      list = list.filter((p) => displayProjectStatus(p) === filterMode);
    }
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [projects, filterMode]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechManagerPageHeader
        icon={PageIcon}
        title={meta.title}
        subtitle={meta.subtitle}
      />

      <TechManagerInfoBanner>
        <p className="text-white font-medium mb-2">Per project workflow</p>
        <p>
          Open project → create <strong className="text-gray-300">teams</strong> (Frontend, Backend, QA) →
          add <strong className="text-gray-300">milestones</strong> (phases) →
          create <strong className="text-gray-300">tasks</strong> (daily work under each milestone).
        </p>
      </TechManagerInfoBanner>

      {filteredProjects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">
            {filterMode === 'active' ? 'No active projects' : filterMode === 'completed' ? 'No completed projects yet' : filterMode === 'testing' ? 'No projects in testing — approve code review first' : filterMode === 'code_review' ? 'No projects in code review' : filterMode === 'bug_fixing' ? 'No projects in bug tracking — pass testing first' : filterMode === 'deployment' ? 'No projects ready for deployment — resolve bugs first' : 'No projects assigned yet'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Ask admin to assign you as technical manager on a project</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const pid = String(project._id);
            const counts = countsByProject[pid] || {};
            return (
              <div key={project._id} className="card border border-myth-border/80 hover:border-myth-accent/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Link to={`/projects/${project._id}`} className="text-lg font-semibold text-white hover:text-myth-accent">
                        {project.name}
                      </Link>
                      <StatusBadge status={displayProjectStatus(project)} config={PROJECT_STATUSES} />
                      <CustomerAcceptanceBadge project={project} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                      <span>Customer: {customerLabel(project.customer)}</span>
                      {project.category && (
                        <span>Category: {categoryLabel(project.category)}</span>
                      )}
                    </div>
                    <ProjectTechAssignmentBadge project={project} compact />
                    <ProjectSupportReviewBadge project={project} />
                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <Users size={12} className="text-cyan-400" />
                        {counts.teams || 0} team{(counts.teams || 0) !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <Flag size={12} className="text-violet-400" />
                        {counts.milestones || 0} milestone{(counts.milestones || 0) !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <ListTodo size={12} className="text-amber-400" />
                        {counts.tasks || 0} task{(counts.tasks || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                    <Link to={`/projects/${project._id}`} className="btn-primary text-sm inline-flex items-center justify-center gap-1">
                      Open project <ChevronRight size={14} />
                    </Link>
                    <Link to="/teams/technical/manage" className="btn-secondary text-xs inline-flex items-center gap-1">
                      <Users size={12} /> Create team
                    </Link>
                    <Link to="/projects/milestones" className="btn-secondary text-xs inline-flex items-center gap-1">
                      <Flag size={12} /> Milestones
                    </Link>
                    <Link to="/tasks?create=1" className="btn-secondary text-xs inline-flex items-center gap-1">
                      <ListTodo size={12} /> Create task
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-myth-border/50">
                  <Link to="/projects/customer-requirements" className="text-xs text-myth-accent hover:underline inline-flex items-center gap-1">
                    <Inbox size={12} /> Requirements
                  </Link>
                  <Link to="/documents" className="text-xs text-myth-accent hover:underline inline-flex items-center gap-1">
                    <FileText size={12} /> Documents
                  </Link>
                  <Link to="/projects/tech-submissions" className="text-xs text-myth-accent hover:underline inline-flex items-center gap-1">
                    <Send size={12} /> Change requests
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
