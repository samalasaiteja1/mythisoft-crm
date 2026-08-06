import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, FolderKanban, Send, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { TechManagerPageHeader, TechManagerEmptyState } from '../../components/techManager/techManagerUi';
import { SUPPORT_REVIEW_STATUSES } from '../../constants/supportWorkflow';

export default function TechManagerSupportUpdatesHub() {
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [assignee, setAssignee] = useState('');
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      projectsAPI.getSupportReviewQueue({ queue: 'updates' }),
      projectsAPI.getTechnicalTeam(),
    ])
      .then(([queueRes, teamRes]) => {
        setProjects(queueRes.data?.items || []);
        setDevelopers(teamRes.data?.members || []);
      })
      .catch(() => toast.error('Failed to load update requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAssign = async (projectId) => {
    if (!assignee) {
      toast.error('Select a developer');
      return;
    }
    setSubmitting(true);
    try {
      await projectsAPI.startUpdateRequestFix(projectId, { technicalAssignee: assignee });
      toast.success('Developer assigned — complete fix then resubmit to support');
      setExpandedId(null);
      setAssignee('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign developer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async (projectId) => {
    setSubmitting(true);
    try {
      await projectsAPI.resubmitToSupport(projectId, { notes: resubmitNotes.trim() });
      toast.success('Project resubmitted to support manager for verification');
      setExpandedId(null);
      setResubmitNotes('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resubmit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechManagerPageHeader
        icon={Wrench}
        title="Support Update Requests"
        subtitle="Support manager requested changes — assign a developer, complete code review & testing, then resubmit."
      />

      {projects.length === 0 ? (
        <TechManagerEmptyState icon={Wrench} message="No open update requests from support" />
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const statusMeta = SUPPORT_REVIEW_STATUSES[project.supportReviewStatus] || {};
            const ticket = project.activeUpdateRequest;
            const isOpen = expandedId === String(project._id);
            const canResubmit = project.supportReviewStatus === 'fix_in_progress';

            return (
              <div key={project._id} className="card border border-purple-500/20">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <FolderKanban size={18} className="text-myth-accent" />
                      <Link to={`/projects/${project._id}`} className="text-lg font-semibold text-white hover:text-myth-accent">
                        {project.name}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusMeta.color || ''}`}>{statusMeta.label}</span>
                    </div>
                    {ticket && typeof ticket === 'object' && (
                      <p className="text-sm text-gray-300 mt-1">
                        {ticket.updateRequestType === 'bug' ? 'Bug fix' : 'Enhancement'}: {ticket.subject}
                      </p>
                    )}
                    {project.supportReviewNotes && (
                      <p className="text-sm text-gray-500 mt-1">{project.supportReviewNotes}</p>
                    )}
                    {ticket?._id && (
                      <Link to={`/tickets/${ticket._id}`} className="text-sm text-myth-accent hover:underline mt-2 inline-block">
                        Open ticket {ticket.ticketNumber || ''} →
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {canResubmit ? (
                      <button type="button" className="btn-primary text-sm" onClick={() => setExpandedId(isOpen ? null : String(project._id))}>
                        {isOpen ? 'Close' : 'Resubmit to support'}
                      </button>
                    ) : (
                      <button type="button" className="btn-primary text-sm inline-flex items-center gap-1" onClick={() => setExpandedId(isOpen ? null : String(project._id))}>
                        <UserPlus size={14} /> {isOpen ? 'Close' : 'Assign developer'}
                      </button>
                    )}
                    <Link to="/projects/status/code_review" className="btn-secondary text-sm">Code review</Link>
                    <Link to="/projects/status/testing" className="btn-secondary text-sm">Testing</Link>
                  </div>
                </div>

                {isOpen && !canResubmit && (
                  <div className="mt-4 pt-4 border-t border-myth-border/60 space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Developer</label>
                      <select className="input-field w-full" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                        <option value="">Select developer</option>
                        {developers.map((dev) => (
                          <option key={dev._id} value={dev._id}>
                            {dev.firstName} {dev.lastName} · {dev.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="button" disabled={submitting} className="btn-primary text-sm" onClick={() => handleAssign(project._id)}>
                      {submitting ? 'Assigning…' : 'Assign & start fix'}
                    </button>
                  </div>
                )}

                {isOpen && canResubmit && (
                  <div className="mt-4 pt-4 border-t border-myth-border/60 space-y-3">
                    <p className="text-sm text-gray-400">Confirm code review and testing are complete before resubmitting.</p>
                    <textarea
                      className="input-field w-full min-h-[60px]"
                      value={resubmitNotes}
                      onChange={(e) => setResubmitNotes(e.target.value)}
                      placeholder="Notes for support manager (what was fixed)…"
                    />
                    <button type="button" disabled={submitting} className="btn-primary text-sm inline-flex items-center gap-2" onClick={() => handleResubmit(project._id)}>
                      <Send size={14} />
                      {submitting ? 'Submitting…' : 'Resubmit to support manager'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
