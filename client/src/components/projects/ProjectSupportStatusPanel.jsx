import { Headphones, UserCheck, Calendar, MessageSquare, Users, Crown } from 'lucide-react';
import { SUPPORT_REVIEW_STATUSES } from '../../constants/supportWorkflow';
import { formatDateTime } from '../../services/api';
import CustomerAcceptanceBadge from './CustomerAcceptanceBadge';
import { supportAssigneeRoleLabel } from '../../utils/supportAssigneeRole';

const personName = (user) => {
  if (!user || typeof user !== 'object') return '—';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '—';
};

/** Read-only support handoff & review status — visible to Tech Manager, Admin, Support */
export default function ProjectSupportStatusPanel({ project, compact = false, useAdminRoleLabels = false }) {
  if (!project?.supportHandoffAt && !project?.supportReviewStatus) return null;

  const reviewMeta = SUPPORT_REVIEW_STATUSES[project.supportReviewStatus] || null;
  const teamName = project.supportStaffRole?.name
    ? `${project.supportStaffRole.name}${project.supportStaffRole.code ? ` (${project.supportStaffRole.code})` : ''}`
    : null;

  return (
    <div className={`card border-orange-400/20 ${compact ? 'p-4' : ''}`}>
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Headphones size={18} className="text-orange-400" />
        Support handoff &amp; review
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Submitted to support</p>
          <p className="text-gray-300 flex items-center gap-2">
            <Calendar size={14} className="text-gray-500 shrink-0" />
            {project.supportHandoffAt ? formatDateTime(project.supportHandoffAt) : '—'}
          </p>
          {project.supportHandoffBy && (
            <p className="text-xs text-gray-500 mt-1">
              By {personName(project.supportHandoffBy)}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Support review status</p>
          {reviewMeta ? (
            <span className={`inline-flex text-xs px-2 py-1 rounded-full ${reviewMeta.color}`}>
              {reviewMeta.label}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
          <div className="mt-2">
            <CustomerAcceptanceBadge project={project} showWhenIdle />
          </div>
        </div>

        {project.supportReviewedBy && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reviewed by</p>
            <p className="text-white flex items-center gap-2">
              <UserCheck size={14} className="text-green-400 shrink-0" />
              {personName(project.supportReviewedBy)}
            </p>
            {project.supportReviewedAt && (
              <p className="text-xs text-gray-500 mt-1">{formatDateTime(project.supportReviewedAt)}</p>
            )}
          </div>
        )}

        {project.supportAssignee && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Support manager</p>
            <p className="text-gray-300 flex items-center gap-2">
              <Crown size={14} className="text-orange-400 shrink-0" />
              {personName(project.supportAssignee)}
            </p>
          </div>
        )}

        {project.supportExecutiveAssignee && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {useAdminRoleLabels
                ? supportAssigneeRoleLabel(project.supportExecutiveAssignee)
                : 'Support executive'}
            </p>
            <p className="text-white flex items-center gap-2">
              <Users size={14} className="text-blue-400 shrink-0" />
              {personName(project.supportExecutiveAssignee)}
            </p>
            {project.supportExecutiveAssignee?.email && (
              <p className="text-xs text-gray-500 mt-1">{project.supportExecutiveAssignee.email}</p>
            )}
          </div>
        )}

        {teamName && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Support team</p>
            <p className="text-gray-300">{teamName}</p>
          </div>
        )}
      </div>

      {(project.supportReviewNotes || project.supportHandoffNotes) && (
        <div className="mt-4 pt-4 border-t border-myth-border/60 space-y-3">
          {project.supportHandoffNotes && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <MessageSquare size={12} /> Tech handoff notes
              </p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{project.supportHandoffNotes}</p>
            </div>
          )}
          {project.supportReviewNotes && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <MessageSquare size={12} /> Support review notes
              </p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{project.supportReviewNotes}</p>
            </div>
          )}
        </div>
      )}

      {project.supportReviewStatus === 'changes_required' && project.activeUpdateRequest && (
        <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-sm">
          <p className="text-orange-200 font-medium">Changes requested by Support Manager</p>
          <p className="text-gray-300 mt-1">
            {typeof project.activeUpdateRequest === 'object'
              ? project.activeUpdateRequest.subject || project.activeUpdateRequest.ticketNumber
              : 'See update request'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Go to <strong className="text-gray-400">Support Updates</strong> to assign a developer and resubmit.
          </p>
        </div>
      )}

      {project.supportReviewStatus === 'resubmitted' && (
        <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm">
          <p className="text-cyan-200 font-medium">Resubmitted to Support Manager</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting support verification, then customer handoff.</p>
        </div>
      )}

      {project.supportReviewStatus === 'pending_review' && project.supportHandoffAt && project.supportReviewedBy && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
          <p className="text-amber-200 font-medium">Fix verified — ready to accept</p>
          <p className="text-xs text-gray-500 mt-1">Support Manager can accept the project for support.</p>
        </div>
      )}

      {project.supportReviewStatus === 'in_support' && (
        <p className="text-xs text-green-400/90 mt-4">
          Support Manager accepted this project — customer support is active.
        </p>
      )}
    </div>
  );
}
