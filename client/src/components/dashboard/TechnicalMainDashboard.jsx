import { Link } from 'react-router-dom';
import {
  FolderKanban, UserCog, FileText, ExternalLink, Cpu,
} from 'lucide-react';
import { formatCurrency, formatDate, PROJECT_STATUSES } from '../../services/api';
import { categoryLabel } from '../../hooks/useProjectCategories';
import StatusBadge from '../StatusBadge';
import TechnicalOverview from '../technical/TechnicalOverview';
import { TechPersonPageHeader } from '../technical/technicalPersonUi';

export default function TechnicalMainDashboard({ technicalOverview, roleStats }) {
  if (!technicalOverview) return null;

  const { projects = [] } = technicalOverview;

  return (
    <div className="space-y-4 lg:space-y-6">
      <TechPersonPageHeader
        icon={Cpu}
        title="Tech Team Workspace"
        subtitle="Your assigned projects, tasks, code reviews, testing, and bugs"
      />

      <TechnicalOverview technicalOverview={technicalOverview} roleStats={roleStats} />

      <div className="card border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-5">
          <div>
            <h2 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
              <FolderKanban size={16} lg:size={20} className="text-cyan-400" /> My Projects
            </h2>
            <p className="text-xs lg:text-sm text-gray-400 mt-1">Assigned projects — open to view details, requirements, and milestones</p>
          </div>
          <Link to="/projects" className="btn-primary text-xs lg:text-sm inline-flex items-center gap-1">
            <FolderKanban size={12} lg:size={14} /> All Projects
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 lg:py-12 border border-dashed border-myth-border rounded-xl">
            <FolderKanban size={32} lg:size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-xs lg:text-sm text-gray-400">No projects assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {projects.map((project) => (
              <div key={project._id} className="rounded-xl border border-myth-border bg-myth-surface/20 p-3 lg:p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Link to={`/technical/projects/${project._id}`} className="text-white font-semibold hover:text-myth-accent">
                        {project.name}
                      </Link>
                      <StatusBadge status={project.status} config={PROJECT_STATUSES} />
                    </div>
                    <p className="text-xs lg:text-sm text-gray-400">
                      {project.customer
                        ? `${project.customer.firstName} ${project.customer.lastName}${project.customer.companyName ? ` · ${project.customer.companyName}` : ''}`
                        : 'Customer'}
                      {project.category ? ` · ${categoryLabel(project.category)}` : ''}
                      {' · '}{formatCurrency(project.budget)}
                    </p>
                    {project.assignedBy && (
                      <p className="text-[10px] lg:text-xs text-myth-accent mt-2 flex items-center gap-1">
                        <UserCog size={10} lg:size={12} />
                        Assigned by {project.assignedBy.name}
                      </p>
                    )}
                    <p className="text-[10px] lg:text-xs text-gray-600 mt-2">
                      Updated {formatDate(project.updatedAt)}
                      {project.endDate ? ` · Due ${formatDate(project.endDate)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 lg:w-52">
                    <Link to={`/technical/projects/${project._id}`} className="btn-primary text-xs lg:text-sm text-center">View Project</Link>
                    <Link to="/technical/requirements" className="btn-secondary text-xs lg:text-sm text-center">Requirements</Link>
                    <Link to="/technical/milestones" className="btn-secondary text-xs lg:text-sm text-center">Milestones</Link>
                    {project.requirementsDoc && (
                      <a href={project.requirementsDoc.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs lg:text-sm inline-flex items-center justify-center gap-1">
                        <FileText size={12} lg:size={14} /> Requirements
                        <ExternalLink size={10} lg:size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
