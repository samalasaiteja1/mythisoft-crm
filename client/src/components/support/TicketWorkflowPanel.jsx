import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle, RefreshCw, Send, UserPlus, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsAPI, projectsAPI, staffRolesAPI } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { isSupportManagerUser } from '../../utils/roleContext';
import { useAuth } from '../../context/AuthContext';
import { filterSupportTeamsByScope } from '../../utils/supportTeamOwnership';
import { CHANGE_REQUEST_SCOPES } from '../../constants/supportWorkflow';
import { memberTaskCategory, supportCategoryLabel } from '../../constants/supportProjectTasks';
import { getProjectSupportTeamLabel } from '../../utils/projectSupportTeam';
import { isTechnicalIssueCategory, isChangeRequestCategory } from '../../constants/supportTickets';
import { TICKET_WORKER_NEXT_STATUSES, ticketStatusMeta, isTicketAssignee } from '../../constants/ticketStatusFlows';

const ACTIVE_STATUSES = ['open', 'reopened', 'assigned', 'accepted', 'working'];
const CLOSED_STATUSES = ['closed', 'waiting_customer', 'resolved', 'completed'];

export default function TicketWorkflowPanel({ ticket, onUpdated }) {
  const { user, isAdmin, isManager, isTechnical, isTechManager, role, canAction } = usePermissions();
  const { user: authUser } = useAuth();
  const isSupportManager = isSupportManagerUser(user);
  const isSupportStaff = role === 'support';

  const [supportTeamAgents, setSupportTeamAgents] = useState([]);
  const [supportTeams, setSupportTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [technicalTeam, setTechnicalTeam] = useState([]);
  const [supportAssignee, setSupportAssignee] = useState('');
  const [technicalAssignee, setTechnicalAssignee] = useState('');
  const [assigneeType, setAssigneeType] = useState('support_executive');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState('approve');
  const [loading, setLoading] = useState('');

  const isChangeRequest = ticket.requestKind === 'change_request';
  const isActive = ACTIVE_STATUSES.includes(ticket.status);
  const isAwaitingVerify = ticket.technicalStatus === 'resolved' && ticket.status === 'working';
  const isEscalated = ticket.escalated || ticket.technicalAssignee || ticket.technicalStatus !== 'unassigned';

  const isTechnicalTicket = isTechnicalIssueCategory(ticket.category);
  const isChangeRequestTicket = isChangeRequestCategory(ticket.category) || isChangeRequest;
  const teamLabel = getProjectSupportTeamLabel(ticket.project);

  const selectedTeam = useMemo(
    () => supportTeams.find((t) => String(t._id) === String(selectedTeamId)),
    [supportTeams, selectedTeamId],
  );

  const technicalManagers = useMemo(
    () => technicalTeam.filter((m) => m.role === 'manager'),
    [technicalTeam],
  );

  useEffect(() => {
    setSupportAssignee(ticket.supportAssignee?._id || ticket.supportAssignee || '');
    setTechnicalAssignee(ticket.technicalAssignee?._id || ticket.technicalAssignee || '');
  }, [ticket]);

  useEffect(() => {
    const projectTeamId = ticket.project?.supportStaffRole?._id || ticket.project?.supportStaffRole;
    if (projectTeamId) {
      setSelectedTeamId(String(projectTeamId));
    }
  }, [ticket.project?._id, ticket.project?.supportStaffRole]);

  useEffect(() => {
    if (isTechnicalTicket && ticket.status === 'open') {
      setAssigneeType('technical_support_engineer');
    } else if (isChangeRequestTicket && ticket.status === 'open') {
      setAssigneeType('technical_manager');
    } else if (ticket.status === 'open' || ticket.status === 'reopened') {
      setAssigneeType('support_executive');
    }
  }, [ticket.category, ticket.status, isTechnicalTicket, isChangeRequestTicket]);

  useEffect(() => {
    if (!(isAdmin || isManager || isSupportStaff || isSupportManager)) return;
    Promise.all([
      projectsAPI.getSupportTeam().then(({ data }) => setSupportTeamAgents(data?.members || [])).catch(() => {}),
      staffRolesAPI.getAll({ teamGroup: 'support', limit: 100, status: 'active' })
        .then(({ data }) => {
          const allTeams = data?.items || data || [];
          const supportOnly = (Array.isArray(allTeams) ? allTeams : []).filter(
            (t) => t.teamGroup === 'support' && t.status !== 'inactive',
          );
          const scoped = isSupportManager && !isAdmin
            ? filterSupportTeamsByScope(supportOnly, authUser?._id)
            : supportOnly;
          setSupportTeams(scoped.length ? scoped : supportOnly);
        })
        .catch(() => {}),
    ]);
  }, [isAdmin, isManager, isSupportStaff, isSupportManager, authUser?._id]);

  useEffect(() => {
    if (!selectedTeamId || assigneeType === 'technical_manager') {
      setTeamMembers([]);
      return;
    }
    const category = assigneeType === 'technical_support_engineer'
      ? 'technical_support_engineer'
      : 'support_executive';
    setMembersLoading(true);
    projectsAPI.getSupportTaskTeamMembers(selectedTeamId, category)
      .then(({ data }) => {
        let members = data?.members || [];
        if (!members.length && category === 'technical_support_engineer') {
          return projectsAPI.getSupportTaskTeamMembers(selectedTeamId, 'support_executive')
            .then(({ data: fallback }) => {
              setTeamMembers(fallback?.members || []);
            });
        }
        setTeamMembers(members);
      })
      .catch(() => setTeamMembers([]))
      .finally(() => setMembersLoading(false));
  }, [selectedTeamId, assigneeType]);

  useEffect(() => {
    if (isAdmin || isManager || isTechnical || isSupportManager) {
      projectsAPI.getTechnicalTeam()
        .then(({ data }) => setTechnicalTeam(data?.members || []))
        .catch(() => {});
    }
  }, [isAdmin, isManager, isTechnical, isSupportManager]);

  const canManagerAssign = (isAdmin || isSupportManager) && canAction('tickets', 'assign')
    && !isChangeRequest && ['open', 'reopened'].includes(ticket.status);

  const workerNextStatusRaw = TICKET_WORKER_NEXT_STATUSES[ticket.status];
  const workerNextStatus = typeof workerNextStatusRaw === 'string' ? workerNextStatusRaw : null;
  const isAssignee = isTicketAssignee(user?._id, ticket);
  const canUpdateWork = !isChangeRequest && !ticket.escalated && isAssignee && workerNextStatus
    && (isSupportStaff || isTechnical || isAdmin);

  const canReviewResolution = (isAdmin || isSupportManager) && !isChangeRequest && !ticket.escalated
    && ticket.status === 'completed';

  const managerAssignTypes = useMemo(() => {
    if (isChangeRequestTicket) {
      return [
        { value: 'support_executive', label: 'Support Executive' },
        { value: 'technical_manager', label: 'Technical Manager' },
      ];
    }
    if (isTechnicalTicket) {
      return [
        { value: 'technical_support_engineer', label: 'Technical Support Engineer' },
        { value: 'support_executive', label: 'Support Executive' },
      ];
    }
    return [
      { value: 'support_executive', label: 'Support Executive' },
      { value: 'technical_support_engineer', label: 'Technical Support Engineer' },
      { value: 'technical_manager', label: 'Technical Manager' },
    ];
  }, [isTechnicalTicket, isChangeRequestTicket]);

  const managerAssigneeOptions = teamMembers;

  const selectedManagerAssignee = assigneeType === 'support_executive' ? supportAssignee : technicalAssignee;

  const runAction = async (key, fn) => {
    setLoading(key);
    try {
      const { data } = await fn();
      onUpdated(data);
      setNotes('');
      toast.success('Updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading('');
    }
  };

  const canAssignSupport = (isAdmin || isManager || isSupportStaff) && canAction('tickets', 'assign') && !canManagerAssign;
  const canAssignTechnical = (isAdmin || isTechManager || isSupportManager) && canAction('tickets', 'assign') && isEscalated && !isAwaitingVerify;
  const canEscalate = (isAdmin || isManager || isSupportStaff) && canAction('tickets', 'update') && isActive && !isChangeRequest;
  const canResolve = false;
  const canReviewChangeScope = isChangeRequest && (isAdmin || isSupportManager) && isActive && !ticket.changeScope;
  const canSendToTechnical = isChangeRequest && ticket.changeScope === 'development_required' && (isAdmin || isTechManager || isSupportManager) && !isAwaitingVerify;
  const canHandleMinorChange = isChangeRequest && ticket.changeScope === 'minor' && (isAdmin || isSupportStaff) && ticket.status !== 'waiting_customer';
  const canCompleteTechnical = isEscalated && (isAdmin || isTechnical || isTechManager)
    && ticket.technicalStatus !== 'resolved'
    && !CLOSED_STATUSES.includes(ticket.status);
  const canVerifyFix = (isAdmin || isSupportManager) && isAwaitingVerify;

  const showPanel = canManagerAssign || canUpdateWork || canReviewResolution || canAssignSupport || canAssignTechnical || canEscalate || canResolve
    || canReviewChangeScope || canSendToTechnical || canHandleMinorChange || canCompleteTechnical || canVerifyFix;

  const statusMeta = ticketStatusMeta(ticket.status);

  if (!showPanel) return null;

  const workerActionLabel = {
    accepted: 'Accept Ticket',
    working: 'Start Work (In Progress)',
    completed: 'Mark Completed',
  }[workerNextStatus] || 'Update Ticket';

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Wrench size={16} className="text-orange-400" />
          {isChangeRequest ? 'Change request workflow' : 'Ticket workflow'}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusMeta.color}`}>{statusMeta.label}</span>
      </div>

      {ticket.escalated && (
        <p className="text-xs text-amber-300/90 flex items-center gap-1.5">
          <AlertTriangle size={14} />
          Escalated to technical
          {ticket.technicalAssignee && (
            <> · Dev: {ticket.technicalAssignee.firstName} {ticket.technicalAssignee.lastName}</>
          )}
        </p>
      )}

      {isAwaitingVerify && (
        <p className="text-xs text-emerald-300/90 flex items-center gap-1.5">
          <CheckCircle size={14} />
          Technical work complete — awaiting support manager verification
        </p>
      )}

      {canManagerAssign && (
        <div className="space-y-3 border-b border-myth-border pb-4">
          <p className="text-xs font-medium text-orange-200 uppercase tracking-wide">Review &amp; Assign Ticket</p>
          <p className="text-xs text-gray-400">
            {isTechnicalTicket
              ? 'Select your support team, then assign a team member (TSE or Support Executive)'
              : 'Select your support team and assign a team member'}
          </p>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Support Team *</label>
            <select
              className="input-field w-full"
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setSupportAssignee('');
                setTechnicalAssignee('');
              }}
            >
              <option value="">Select support team</option>
              {supportTeams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}{team.code ? ` (${team.code})` : ''}
                </option>
              ))}
            </select>
            {selectedTeam?.description && (
              <p className="text-xs text-gray-500 mt-1">{selectedTeam.description}</p>
            )}
            {!selectedTeamId && teamLabel && (
              <p className="text-xs text-amber-400/90 mt-1">Project team: {teamLabel} — pick your team above</p>
            )}
          </div>
          <div className={`grid gap-2 ${managerAssignTypes.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {managerAssignTypes.map((opt) => (
              <label
                key={opt.value}
                className={`text-xs px-3 py-2 rounded-lg border cursor-pointer text-center ${
                  assigneeType === opt.value
                    ? 'border-orange-500/50 bg-orange-500/10 text-orange-200'
                    : 'border-myth-border text-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="assigneeType"
                  value={opt.value}
                  checked={assigneeType === opt.value}
                  onChange={() => setAssigneeType(opt.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {assigneeType !== 'technical_manager' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Team Member *</label>
              <select
                className="input-field w-full"
                value={selectedManagerAssignee}
                disabled={!selectedTeamId || membersLoading}
                onChange={(e) => {
                  if (assigneeType === 'support_executive') setSupportAssignee(e.target.value);
                  else setTechnicalAssignee(e.target.value);
                }}
              >
                <option value="">
                  {!selectedTeamId ? 'Select support team first' : membersLoading ? 'Loading…' : 'Select team member'}
                </option>
                {managerAssigneeOptions.map((member) => {
                  const roleLabel = supportCategoryLabel(memberTaskCategory(member));
                  return (
                    <option key={member._id} value={member._id}>
                      {member.firstName} {member.lastName}
                      {roleLabel !== '—' ? ` · ${roleLabel}` : ''}
                    </option>
                  );
                })}
              </select>
              {selectedTeamId && !membersLoading && managerAssigneeOptions.length === 0 && (
                <p className="text-xs text-amber-400 mt-1">
                  No members on this team for this role — add employees to the team in Admin → Support Teams.
                </p>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Due Date *</label>
            <input
              type="date"
              className="input-field w-full"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Manager Notes</label>
            <textarea
              className="input-field w-full min-h-[60px] text-sm"
              placeholder="Assignment notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500">Status after assign: <span className="text-yellow-300">Assigned</span></p>
          <button
            type="button"
            disabled={loading === 'manager-assign' || (assigneeType !== 'technical_manager' && (!selectedTeamId || !selectedManagerAssignee)) || !dueDate}
            onClick={() => runAction('manager-assign', () => ticketsAPI.assignTicketByManager(ticket._id, {
              assigneeType,
              assigneeId: assigneeType === 'technical_manager' ? (technicalAssignee || ticket.project?.manager?._id || ticket.project?.manager) : selectedManagerAssignee,
              staffRoleId: selectedTeamId || undefined,
              notes,
              dueDate,
            }))}
            className="btn-primary text-sm w-full inline-flex items-center justify-center gap-2"
          >
            <UserPlus size={14} />
            {loading === 'manager-assign' ? 'Assigning…' : 'Assign Ticket'}
          </button>
        </div>
      )}

      {canUpdateWork && (
        <div className="space-y-3 border-b border-myth-border pb-4">
          <p className="text-xs font-medium text-cyan-200 uppercase tracking-wide">Update Ticket</p>
          <p className="text-xs text-gray-400">
            Current: <span className="text-white">{statusMeta.label}</span>
            {' → '}
            <span className="text-white">{ticketStatusMeta(workerNextStatus).label}</span>
          </p>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Work Notes {workerNextStatus === 'completed' ? '*' : ''}
            </label>
            <textarea
              className="input-field w-full min-h-[80px] text-sm"
              placeholder={workerNextStatus === 'completed' ? 'Describe what was done to fix the issue…' : 'Optional notes…'}
              value={workNotes}
              onChange={(e) => setWorkNotes(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={loading === 'work-update' || (workerNextStatus === 'completed' && !workNotes.trim())}
            onClick={() => runAction('work-update', () => ticketsAPI.updateWorkStatus(ticket._id, {
              status: workerNextStatus,
              workNotes: workNotes.trim(),
            }))}
            className="btn-primary text-sm w-full inline-flex items-center justify-center gap-2"
          >
            <CheckCircle size={14} />
            {loading === 'work-update' ? 'Saving…' : workerActionLabel}
          </button>
        </div>
      )}

      {canReviewResolution && (
        <div className="space-y-3 border-b border-myth-border pb-4">
          <p className="text-xs font-medium text-green-200 uppercase tracking-wide">Review Resolution</p>
          {ticket.completionNotes && (
            <div className="p-3 rounded-lg bg-myth-surface/40 border border-myth-border text-sm">
              <p className="text-xs text-gray-500 mb-1">Completion notes</p>
              <p className="text-gray-300 whitespace-pre-wrap">{ticket.completionNotes}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <label className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border ${reviewDecision === 'approve' ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-myth-border text-gray-400'}`}>
              <input type="radio" name="reviewDecision" checked={reviewDecision === 'approve'} onChange={() => setReviewDecision('approve')} className="sr-only" />
              Approve
            </label>
            <label className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border ${reviewDecision === 'rework' ? 'border-orange-500/50 bg-orange-500/10 text-orange-300' : 'border-myth-border text-gray-400'}`}>
              <input type="radio" name="reviewDecision" checked={reviewDecision === 'rework'} onChange={() => setReviewDecision('rework')} className="sr-only" />
              Return for Rework
            </label>
          </div>
          <textarea
            className="input-field w-full min-h-[60px] text-sm"
            placeholder="Manager comments (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            {reviewDecision === 'approve' ? 'Status → Resolved (customer will confirm)' : 'Status → Assigned (assignee continues work)'}
          </p>
          <button
            type="button"
            disabled={loading === 'review-resolution'}
            onClick={() => runAction('review-resolution', () => ticketsAPI.reviewResolution(ticket._id, {
              decision: reviewDecision,
              notes,
            }))}
            className="btn-primary text-sm w-full"
          >
            {loading === 'review-resolution' ? 'Saving…' : 'Save Review'}
          </button>
        </div>
      )}

      {canAssignSupport && !canManagerAssign && (
        <div className="space-y-2 border-t border-myth-border pt-3">
          <label className="text-xs text-gray-400 flex items-center gap-1">
            <UserPlus size={12} /> Assign support
            {ticket.project && supportTeamAgents.length > 0 && (
              <span className="text-gray-500">(project team)</span>
            )}
          </label>
          <select
            className="input-field w-full"
            value={supportAssignee}
            onChange={(e) => setSupportAssignee(e.target.value)}
          >
            <option value="">Select support member</option>
            {supportTeamAgents.map((member) => (
              <option key={member._id} value={member._id}>
                {member.firstName} {member.lastName}
                {member.assigneeType ? ` · ${member.assigneeType}` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading === 'assign-support' || !supportAssignee}
            onClick={() => runAction('assign-support', () => ticketsAPI.assignSupport(ticket._id, { supportAssignee }))}
            className="btn-secondary text-sm w-full"
          >
            {loading === 'assign-support' ? 'Assigning…' : 'Assign to support'}
          </button>
        </div>
      )}

      {canReviewChangeScope && (
        <div className="space-y-2 border-t border-myth-border pt-3">
          <p className="text-xs text-gray-400">Classify change request</p>
          <div className="grid grid-cols-1 gap-2">
            {CHANGE_REQUEST_SCOPES.map((scope) => (
              <button
                key={scope.value}
                type="button"
                disabled={loading === `scope-${scope.value}`}
                onClick={() => runAction(`scope-${scope.value}`, () => ticketsAPI.reviewChangeScope(ticket._id, {
                  changeScope: scope.value,
                  notes,
                  supportAssignee: scope.value === 'minor' ? supportAssignee : undefined,
                }))}
                className="btn-secondary text-sm text-left px-3 py-2"
              >
                {scope.label}
              </button>
            ))}
          </div>
          <textarea
            className="input-field w-full min-h-[60px] text-sm"
            placeholder="Review notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {canHandleMinorChange && (
        <div className="space-y-2 border-t border-myth-border pt-3">
          <p className="text-xs text-gray-400">Minor change — complete within support team, then resolve</p>
          <button
            type="button"
            disabled={loading === 'resolve-minor'}
            onClick={() => runAction('resolve-minor', () => ticketsAPI.resolve(ticket._id, { message: notes, notifyCustomer: true }))}
            className="btn-primary text-sm w-full"
          >
            {loading === 'resolve-minor' ? 'Resolving…' : 'Complete & notify customer'}
          </button>
        </div>
      )}

      {canSendToTechnical && (
        <div className="space-y-2 border-t border-myth-border pt-3">
          <p className="text-xs text-gray-400">Send to technical team for implementation</p>
          <textarea
            className="input-field w-full min-h-[72px] text-sm"
            placeholder="Notes for technical manager (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            disabled={loading === 'send-technical'}
            onClick={() => runAction('send-technical', () => ticketsAPI.sendToTechnical(ticket._id, { notes }))}
            className="btn-primary text-sm w-full inline-flex items-center justify-center gap-2"
          >
            <Send size={14} />
            {loading === 'send-technical' ? 'Sending…' : 'Send to technical'}
          </button>
        </div>
      )}

      {canEscalate && (
        <div className="space-y-2 border-t border-myth-border pt-3">
          <p className="text-xs text-gray-400">Escalate when support cannot resolve alone</p>
          <textarea
            className="input-field w-full min-h-[72px] text-sm"
            placeholder="Internal escalation notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            disabled={loading === 'escalate'}
            onClick={() => runAction('escalate', () => ticketsAPI.escalate(ticket._id, { notes }))}
            className="btn-secondary text-sm w-full inline-flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={14} />
            {loading === 'escalate' ? 'Escalating…' : 'Escalate to technical'}
          </button>
        </div>
      )}

      {canAssignTechnical && (
        <div className="space-y-2 border-t border-myth-border pt-3">
          <label className="text-xs text-gray-400">Assign developer</label>
          <select
            className="input-field w-full"
            value={technicalAssignee}
            onChange={(e) => setTechnicalAssignee(e.target.value)}
          >
            <option value="">Select developer</option>
            {technicalTeam.map((member) => (
              <option key={member._id} value={member._id}>
                {member.firstName} {member.lastName}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading === 'assign-technical' || !technicalAssignee}
            onClick={() => runAction('assign-technical', () => ticketsAPI.assignTechnical(ticket._id, { technicalAssignee }))}
            className="btn-secondary text-sm w-full"
          >
            {loading === 'assign-technical' ? 'Assigning…' : 'Assign developer'}
          </button>
        </div>
      )}

      {canCompleteTechnical && (
        <div className="space-y-2 border-t border-myth-border pt-3">
          <p className="text-xs text-gray-400">Mark technical work as complete for SM review</p>
          <textarea
            className="input-field w-full min-h-[72px] text-sm"
            placeholder="Summary of fix (internal, optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            disabled={loading === 'complete-technical'}
            onClick={() => runAction('complete-technical', () => ticketsAPI.completeTechnical(ticket._id, { notes }))}
            className="btn-primary text-sm w-full inline-flex items-center justify-center gap-2"
          >
            <CheckCircle size={14} />
            {loading === 'complete-technical' ? 'Submitting…' : 'Complete technical work'}
          </button>
        </div>
      )}

      {canVerifyFix && (
        <div className="space-y-2 border-t border-myth-border pt-3">
          <p className="text-xs text-gray-400">Verify fix before notifying customer</p>
          <textarea
            className="input-field w-full min-h-[72px] text-sm"
            placeholder="Verification notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading === 'verify-approve'}
              onClick={() => runAction('verify-approve', () => ticketsAPI.verifyFix(ticket._id, { decision: 'approve', notes }))}
              className="btn-primary text-sm"
            >
              {loading === 'verify-approve' ? '…' : 'Approve & notify customer'}
            </button>
            <button
              type="button"
              disabled={loading === 'verify-reopen'}
              onClick={() => runAction('verify-reopen', () => ticketsAPI.verifyFix(ticket._id, { decision: 'reopen', notes }))}
              className="btn-secondary text-sm inline-flex items-center justify-center gap-1"
            >
              <RefreshCw size={14} />
              {loading === 'verify-reopen' ? '…' : 'Return to dev'}
            </button>
          </div>
        </div>
      )}

      {canResolve && (
        <div className="space-y-2 border-t border-myth-border pt-3">
          <p className="text-xs text-gray-400">Resolve without technical escalation</p>
          <textarea
            className="input-field w-full min-h-[72px] text-sm"
            placeholder="Message to customer (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            disabled={loading === 'resolve'}
            onClick={() => runAction('resolve', () => ticketsAPI.resolve(ticket._id, { message: notes, notifyCustomer: true }))}
            className="btn-primary text-sm w-full inline-flex items-center justify-center gap-2"
          >
            <CheckCircle size={14} />
            {loading === 'resolve' ? 'Resolving…' : 'Resolve & notify customer'}
          </button>
        </div>
      )}
    </div>
  );
}
