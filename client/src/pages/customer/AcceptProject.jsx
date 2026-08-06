import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomerAcceptanceBadge from '../../components/projects/CustomerAcceptanceBadge';
import { projectCode, projectVersion } from '../../constants/customerPortalNav';
import { isPendingCustomerAcceptance, isCustomerAccepted } from '../../utils/customerAcceptance';
import { useAuth } from '../../context/AuthContext';

export default function AcceptProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (projectId) {
      projectsAPI.getOne(projectId)
        .then(({ data }) => setProject(data))
        .catch(() => toast.error('Project not found'))
        .finally(() => setLoading(false));
      return;
    }

    projectsAPI.getAll()
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : data?.items || [];
        setPendingProjects(items.filter(isPendingCustomerAcceptance));
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) return;
    setSubmitting(true);
    try {
      await projectsAPI.acceptProject(projectId, { comments });
      toast.success('Project accepted successfully');
      navigate(`/projects/${projectId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const customerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  if (!projectId) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="card">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="text-green-400" size={22} /> Accept Project
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Select a project submitted for your review and confirm delivery.
          </p>

          {pendingProjects.length === 0 ? (
            <p className="text-sm text-gray-500 mt-6 py-8 text-center">
              No projects are waiting for your acceptance right now.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {pendingProjects.map((p) => (
                <li key={p._id} className="p-4 rounded-lg border border-myth-border bg-myth-surface/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-white font-medium flex items-center gap-2">
                        <FolderKanban size={16} className="text-myth-accent" />
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">{projectCode(p)} · {projectVersion(p)}</p>
                      <div className="mt-2">
                        <CustomerAcceptanceBadge project={p} showWhenIdle />
                      </div>
                    </div>
                    <Link
                      to={`/projects/accept?project=${p._id}`}
                      className="btn-primary text-sm shrink-0 inline-flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} /> Review & accept
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  const accepted = project?.deliveryChecklist?.clientAcceptance;
  const canAccept = isPendingCustomerAcceptance(project);

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to={projectId ? `/projects/${projectId}` : '/projects/accept'} className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="card">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="text-green-400" size={22} /> Accept Project
        </h1>
        <p className="text-sm text-gray-400 mt-1">Confirm that the delivered project meets your requirements.</p>

        {accepted ? (
          <div className="mt-6 p-4 rounded-lg border border-green-500/30 bg-green-500/10">
            <p className="text-green-400 font-medium">Project already accepted</p>
            <p className="text-sm text-gray-400 mt-1">
              Accepted on {new Date(project.deliveryChecklist.clientAcceptanceAt).toLocaleDateString()}
            </p>
          </div>
        ) : !canAccept ? (
          <div className="mt-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
            <p className="text-amber-300 font-medium">Not ready for acceptance yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your support team will notify you when this project is submitted for review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Project</label>
              <input className="input-field w-full bg-myth-surface/50" value={project?.name || '—'} readOnly />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Version</label>
              <input className="input-field w-full bg-myth-surface/50" value={projectVersion(project)} readOnly />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Project Code</label>
              <input className="input-field w-full bg-myth-surface/50" value={projectCode(project)} readOnly />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Customer Name</label>
              <input className="input-field w-full bg-myth-surface/50" value={customerName} readOnly />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Acceptance Comments</label>
              <textarea className="input-field w-full" rows={4} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Optional feedback about the delivery..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Acceptance Date</label>
              <input className="input-field w-full bg-myth-surface/50" value={new Date().toLocaleDateString()} readOnly />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting || !project}>
              {submitting ? 'Accepting…' : 'Accept Project'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
