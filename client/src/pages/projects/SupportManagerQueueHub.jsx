import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SUPPORT_REVIEW_STATUSES } from '../../constants/supportWorkflow';
import CustomerAcceptanceBadge from '../../components/projects/CustomerAcceptanceBadge';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminStatStrip,
  AdminEmptyState,
} from '../../components/admin/adminUi';

export default function SupportManagerQueueHub({ queue, title, subtitle, emptyMessage }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsAPI.getSupportReviewQueue({ queue })
      .then(({ data }) => setProjects(data?.items || []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [queue]);

  if (loading) return <LoadingSpinner />;

  const withExecutive = projects.filter((p) => p.supportExecutiveAssignee).length;
  const withTicket = projects.filter((p) => p.activeUpdateRequest).length;

  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={Headphones}
        title={title}
        subtitle={subtitle}
        meta={`${projects.length} project${projects.length !== 1 ? 's' : ''} in queue`}
      />

      {projects.length > 0 && (
        <AdminStatStrip stats={[
          { label: 'In queue', value: projects.length, color: 'text-orange-400' },
          { label: 'With executive', value: withExecutive, color: 'text-blue-400' },
          { label: 'Open updates', value: withTicket, color: 'text-purple-400', highlight: withTicket > 0 },
        ]} />
      )}

      {projects.length === 0 ? (
        <AdminEmptyState message={emptyMessage} icon={Headphones} />
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const statusMeta = SUPPORT_REVIEW_STATUSES[project.supportReviewStatus] || {};
            const executive = project.supportExecutiveAssignee;
            const ticket = project.activeUpdateRequest;
            return (
              <div key={project._id} className="card border border-myth-border/80 hover:border-orange-500/25 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <FolderKanban size={18} className="text-myth-accent shrink-0" />
                      <Link to={`/projects/${project._id}`} className="text-lg font-semibold text-white hover:text-myth-accent truncate">
                        {project.name}
                      </Link>
                      {statusMeta.label && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusMeta.color}`}>{statusMeta.label}</span>
                      )}
                      <CustomerAcceptanceBadge project={project} />
                    </div>
                    {project.customer && typeof project.customer === 'object' && (
                      <p className="text-sm text-gray-500">
                        {project.customer.firstName} {project.customer.lastName}
                        {project.customer.companyName && ` · ${project.customer.companyName}`}
                      </p>
                    )}
                    {executive && typeof executive === 'object' && (
                      <p className="text-sm text-blue-300/90 mt-1">
                        Support executive: {executive.firstName} {executive.lastName}
                      </p>
                    )}
                    {ticket && typeof ticket === 'object' && (
                      <p className="text-sm text-purple-300/90 mt-1">
                        Update: {ticket.subject}
                        {ticket._id && (
                          <> · <Link to={`/tickets/${ticket._id}`} className="text-myth-accent hover:underline">{ticket.ticketNumber}</Link></>
                        )}
                      </p>
                    )}
                  </div>
                  <Link to={`/projects/${project._id}`} className="btn-secondary text-sm shrink-0">View project</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminPageShell>
  );
}
