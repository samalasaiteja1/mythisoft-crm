import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { projectsAPI, formatCurrency, formatDate, PROJECT_STATUSES } from '../../services/api';
import { categoryLabel } from '../../hooks/useProjectCategories';
import { TechPersonPageHeader, TechPersonContentCard } from '../../components/technical/technicalPersonUi';

export default function TechnicalProjectView() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsAPI.getOne(id)
      .then(({ data }) => setProject(data))
      .catch(() => toast.error('Project not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!project) return <p className="text-gray-500">Project not found</p>;

  const managerName = project.manager
    ? `${project.manager.firstName} ${project.manager.lastName}`
    : '—';
  const teamName = project.staffRole?.name || project.technicalTeam?.name || '—';

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={16} /> Back to projects
      </Link>
      <TechPersonPageHeader
        icon={FolderKanban}
        title={project.name}
        subtitle="Project details — read-only view for your assigned work"
      />
      <TechPersonContentCard>
        <h2 className="text-lg font-semibold text-white border-b border-myth-border pb-2">Project Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Project Name</span><p className="text-white mt-1">{project.name}</p></div>
          <div><span className="text-gray-500">Project ID</span><p className="text-white mt-1">{project.code || project._id.slice(-8).toUpperCase()}</p></div>
          <div><span className="text-gray-500">Customer Name</span><p className="text-white mt-1">
            {project.customer ? `${project.customer.firstName} ${project.customer.lastName}${project.customer.companyName ? ` (${project.customer.companyName})` : ''}` : '—'}
          </p></div>
          <div><span className="text-gray-500">Project Type</span><p className="text-white mt-1">{categoryLabel(project.category) || project.category?.name || '—'}</p></div>
          <div><span className="text-gray-500">Start Date</span><p className="text-white mt-1">{project.startDate ? formatDate(project.startDate) : '—'}</p></div>
          <div><span className="text-gray-500">Expected End Date</span><p className="text-white mt-1">{project.endDate ? formatDate(project.endDate) : '—'}</p></div>
          <div><span className="text-gray-500">Project Status</span><p className="mt-1"><StatusBadge status={project.status} config={PROJECT_STATUSES} /></p></div>
          <div><span className="text-gray-500">Budget</span><p className="text-white mt-1">{formatCurrency(project.budget)}</p></div>
          <div><span className="text-gray-500">Assigned Technical Manager</span><p className="text-white mt-1">{managerName}</p></div>
          <div><span className="text-gray-500">Team</span><p className="text-white mt-1">{teamName}</p></div>
        </div>
        <div>
          <span className="text-gray-500 text-sm">Project Description</span>
          <p className="text-gray-300 mt-1">{project.description || '—'}</p>
        </div>
        {project.scope && (
          <div>
            <span className="text-gray-500 text-sm">Scope</span>
            <p className="text-gray-300 mt-1">{project.scope}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <Link to="/technical/tasks" className="btn-primary text-sm">View Tasks</Link>
          <Link to={`/technical/requirements`} className="btn-secondary text-sm">Requirements</Link>
          <Link to="/technical/milestones" className="btn-secondary text-sm">Milestones</Link>
        </div>
      </TechPersonContentCard>
    </div>
  );
}
