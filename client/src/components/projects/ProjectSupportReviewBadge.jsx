import { Headphones, UserCheck, AlertCircle, Clock } from 'lucide-react';
import { SUPPORT_REVIEW_STATUSES } from '../../constants/supportWorkflow';

const personName = (user) => {
  if (!user || typeof user !== 'object') return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
};

/** Compact support handoff / review line for project list cards */
export default function ProjectSupportReviewBadge({ project, showDetail = true }) {
  if (!project?.supportHandoffAt && !project?.supportReviewStatus) return null;

  const reviewMeta = project.supportReviewStatus
    ? SUPPORT_REVIEW_STATUSES[project.supportReviewStatus]
    : null;

  const executive = personName(project.supportExecutiveAssignee);
  const reviewer = personName(project.supportReviewedBy);

  return (
    <div className="flex flex-col gap-1 mt-2">
      {reviewMeta && (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${reviewMeta.color}`}>
          <Headphones size={11} />
          {reviewMeta.label}
        </span>
      )}

      {showDetail && (
        <div className="text-xs text-gray-500 space-y-0.5">
          {project.supportHandoffAt && !reviewMeta && (
            <p className="flex items-center gap-1 text-amber-400/90">
              <Clock size={11} /> Submitted to support · awaiting review
            </p>
          )}
          {project.supportReviewStatus === 'in_support' && executive && (
            <p className="flex items-center gap-1 text-blue-300/90">
              <UserCheck size={11} />
              Support executive: {executive}
              {project.supportReviewedAt && (
                <span className="text-gray-600">· {new Date(project.supportReviewedAt).toLocaleDateString()}</span>
              )}
            </p>
          )}
          {reviewer && project.supportReviewStatus === 'in_support' && (
            <p className="text-gray-600">Accepted by {reviewer}</p>
          )}
          {project.supportReviewStatus === 'pending_review' && (
            <p className="text-amber-400/80">Support Manager has not accepted yet</p>
          )}
          {project.supportReviewStatus === 'changes_required' && (
            <p className="flex items-center gap-1 text-orange-400/90">
              <AlertCircle size={11} /> Support requested changes
            </p>
          )}
          {project.supportStaffRole?.name && (
            <p className="text-gray-600">Team: {project.supportStaffRole.name}</p>
          )}
        </div>
      )}
    </div>
  );
}
