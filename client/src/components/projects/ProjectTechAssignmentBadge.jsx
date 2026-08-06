import { getProjectTechAssignmentDisplay, TECH_ASSIGNMENT_COPY } from '../../utils/customerTechAssignment';

export default function ProjectTechAssignmentBadge({ project, compact = false }) {
  const { status, label } = getProjectTechAssignmentDisplay(project);

  if (status === 'none') {
    return (
      <span className={`font-medium text-red-400 border border-red-500/40 bg-red-500/10 rounded-lg ${compact ? 'text-xs px-2 py-1' : 'text-xs px-2.5 py-1.5'}`}>
        {TECH_ASSIGNMENT_COPY.none}
      </span>
    );
  }

  if (status === 'tech_manager') {
    return (
      <span className={`font-medium text-emerald-300 border border-emerald-500/40 bg-emerald-600/15 rounded-lg ${compact ? 'text-xs px-2 py-1' : 'text-xs px-2.5 py-1.5'}`}>
        {TECH_ASSIGNMENT_COPY.tech_manager}: {label}
      </span>
    );
  }

  return (
    <span className={`font-medium text-emerald-300 border border-emerald-500/40 bg-emerald-600/15 rounded-lg ${compact ? 'text-xs px-2 py-1' : 'text-xs px-2.5 py-1.5'}`}>
      {TECH_ASSIGNMENT_COPY.tech}: {label}
    </span>
  );
}
