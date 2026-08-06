import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, FolderKanban, CheckCircle2, FileEdit, Headphones, Download,
} from 'lucide-react';
import { projectsAPI, formatDateTime, PROJECT_STATUSES } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import SupportContactCard from '../../components/support/SupportContactCard';
import { projectCode, projectVersion } from '../../constants/customerPortalNav';
import { isPendingCustomerAcceptance } from '../../utils/customerAcceptance';
import CustomerAcceptProjectButton from './CustomerAcceptProjectButton';
import CustomerAcceptanceBadge from './CustomerAcceptanceBadge';

const DOC_LABELS = {
  'user-manual': 'User Manual',
  'release-notes': 'Release Notes',
  'deployment-guide': 'Deployment Guide',
  'api-documentation': 'API Documentation',
};

export default function CustomerProjectDetailView({ project, projectId }) {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    projectsAPI.getDeliveryDocuments(projectId)
      .then(({ data }) => setDocuments(Array.isArray(data) ? data : []))
      .catch(() => setDocuments([]));
  }, [projectId]);

  const accepted = project.deliveryChecklist?.clientAcceptance;
  const supportManager = project.supportAssignee;
  const supportExecutive = project.supportExecutiveAssignee || project.supportTeamAssignees?.[0];
  const contactName = (u) => u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—';

  const canAccept = isPendingCustomerAcceptance(project);

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back to My Projects
      </Link>

      <div className="card">
        <div className="flex items-start gap-3 flex-wrap">
          <FolderKanban className="text-myth-accent shrink-0" size={24} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-sm text-gray-400 mt-1 font-mono">{projectCode(project)} · {projectVersion(project)}</p>
            <div className="mt-2"><StatusBadge status={project.status} config={PROJECT_STATUSES} /></div>
          </div>
        </div>
        {accepted && (
          <div className="mt-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-sm text-green-400 flex items-center gap-2">
            <CheckCircle2 size={16} /> Accepted on {new Date(project.deliveryChecklist.clientAcceptanceAt).toLocaleDateString()}
          </div>
        )}
        {!accepted && canAccept && (
          <div className="mt-4">
            <CustomerAcceptanceBadge project={project} showWhenIdle />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-white">Project Information</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-500">Project Code</dt><dd className="text-white">{projectCode(project)}</dd></div>
            <div><dt className="text-gray-500">Version</dt><dd className="text-white">{projectVersion(project)}</dd></div>
            <div><dt className="text-gray-500">Current Status</dt><dd className="text-white capitalize">{(project.status || '').replace(/_/g, ' ')}</dd></div>
            <div><dt className="text-gray-500">Start Date</dt><dd className="text-gray-300">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}</dd></div>
            <div><dt className="text-gray-500">Delivery Date</dt><dd className="text-gray-300">{project.deliveredAt ? new Date(project.deliveredAt).toLocaleDateString() : project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}</dd></div>
            <div><dt className="text-gray-500">Go Live Date</dt><dd className="text-gray-300">{project.deliveredAt ? new Date(project.deliveredAt).toLocaleDateString() : '—'}</dd></div>
            <div><dt className="text-gray-500">Warranty End</dt><dd className="text-gray-300">{project.deliveryChecklist?.warrantyPeriod || '—'}</dd></div>
          </dl>
          {project.description && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card space-y-3">
            <h3 className="text-lg font-semibold text-white">Support Information</h3>
            <div className="text-sm space-y-2">
              <div><span className="text-gray-500">Support Manager</span><p className="text-white">{contactName(supportManager)}</p></div>
              <div><span className="text-gray-500">Support Executive</span><p className="text-white">{contactName(supportExecutive)}</p></div>
              <div><span className="text-gray-500">Support Email</span><p className="text-gray-300">{supportExecutive?.email || supportManager?.email || '—'}</p></div>
              <div><span className="text-gray-500">Support Phone</span><p className="text-gray-300">{supportExecutive?.phone || supportManager?.phone || '—'}</p></div>
            </div>
          </div>
          <SupportContactCard contact={supportExecutive || supportManager} title="Your Support Contact" />
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Available Documents</h3>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">No delivery documents uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <a key={doc._id} href={doc.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-myth-border hover:border-myth-accent/40 transition-colors">
                <span className="text-sm text-white">{doc.name}</span>
                <Download size={16} className="text-myth-accent shrink-0" />
              </a>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
          {Object.values(DOC_LABELS).map((label) => (
            <span key={label} className="px-2 py-1 rounded bg-myth-surface">{label}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3 items-center">
          {canAccept && (
            <>
              <CustomerAcceptProjectButton project={project} />
              <Link to={`/projects/${projectId}/review`} className="btn-secondary inline-flex items-center gap-2 text-sm">
                Review delivery
              </Link>
            </>
          )}
          <Link to={`/change-requests/new?project=${projectId}`} className="btn-secondary inline-flex items-center gap-2 text-sm">
            <FileEdit size={16} /> Request Changes
          </Link>
          <Link to={`/tickets/create?project=${projectId}`} className="btn-secondary inline-flex items-center gap-2 text-sm">
            <Headphones size={16} /> Create Ticket
          </Link>
        </div>
      </div>

      <p className="text-xs text-gray-500">Last updated {formatDateTime(project.updatedAt)}</p>
    </div>
  );
}
