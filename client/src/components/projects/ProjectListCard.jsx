import { Link } from 'react-router-dom';
import {
  Building2, DollarSign, Headphones, Pencil, Trash2, ChevronRight,
  FileText, Users, Tag,
} from 'lucide-react';
import { formatCurrency, PROJECT_STATUSES } from '../../services/api';
import { categoryLabel } from '../../hooks/useProjectCategories';
import { getProjectTechAssignmentDisplay, TECH_ASSIGNMENT_COPY } from '../../utils/customerTechAssignment';
import { formatSupportAssigneeLine } from '../../utils/supportAssigneeRole';

const PRIORITY_META = {
  low: { label: 'Low', className: 'text-gray-400 bg-gray-500/10' },
  medium: { label: 'Medium', className: 'text-blue-300 bg-blue-500/10' },
  high: { label: 'High', className: 'text-orange-300 bg-orange-500/10' },
  urgent: { label: 'Urgent', className: 'text-red-300 bg-red-500/10' },
};

const STATUS_ACCENT = {
  planning: 'border-l-blue-500/80',
  new: 'border-l-blue-500/80',
  development: 'border-l-cyan-500/80',
  code_review: 'border-l-purple-500/80',
  testing: 'border-l-yellow-500/80',
  bug_fixing: 'border-l-orange-500/80',
  deployment: 'border-l-indigo-500/80',
  completed: 'border-l-green-500/80',
  delivered: 'border-l-green-500/80',
  on_hold: 'border-l-gray-500/80',
  cancelled: 'border-l-red-500/80',
};

export function displayProjectStatus(project) {
  if (project.workflowStage === 'project_started' && project.status === 'new') return 'planning';
  return project.status || 'planning';
}

function customerLabel(customer) {
  if (!customer) return '—';
  if (typeof customer === 'string') return customer;
  const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  return name || customer.companyName || customer.email || '—';
}

function projectInitial(name = '') {
  return (name.trim()[0] || 'P').toUpperCase();
}

function MetaItem({ icon: Icon, label, value, valueClass = 'text-gray-300' }) {
  if (!value || value === '—') return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-gray-600 mb-0.5">{label}</p>
      <p className={`text-xs truncate inline-flex items-center gap-1 ${valueClass}`}>
        {Icon && <Icon size={11} className="shrink-0 text-gray-500" />}
        {value}
      </p>
    </div>
  );
}

function TeamPill({ status, label }) {
  const styles = {
    none: 'bg-red-500/8 text-red-300/90 ring-red-500/20',
    tech_manager: 'bg-emerald-500/8 text-emerald-300/90 ring-emerald-500/20',
    tech: 'bg-emerald-500/8 text-emerald-300/90 ring-emerald-500/20',
  };
  const copy = status === 'none'
    ? TECH_ASSIGNMENT_COPY.none
    : `${TECH_ASSIGNMENT_COPY[status]}: ${label}`;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ring-1 ring-inset max-w-full ${styles[status] || styles.none}`}>
      <Users size={10} className="shrink-0" />
      <span className="truncate">{copy}</span>
    </span>
  );
}

export default function ProjectListCard({
  project,
  requirementsDocs = [],
  showSupportAssignee = false,
  canEdit = false,
  canDelete = false,
  editHref,
  onDelete,
}) {
  const status = displayProjectStatus(project);
  const statusMeta = PROJECT_STATUSES[status] || PROJECT_STATUSES.planning;
  const accent = STATUS_ACCENT[status] || STATUS_ACCENT.planning;
  const priority = PRIORITY_META[project.priority] || PRIORITY_META.medium;
  const techDisplay = getProjectTechAssignmentDisplay(project);
  const supportLine = formatSupportAssigneeLine(project.supportExecutiveAssignee, { useRoleName: true });
  const hasRequirements = requirementsDocs.length > 0;

  return (
    <article className={`group relative rounded-xl border border-myth-border/60 border-l-[3px] ${accent} bg-myth-surface/20 hover:bg-myth-surface/35 hover:border-myth-accent/25 transition-all`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${statusMeta.color || 'bg-cyan-500/15 text-cyan-300'}`}>
            {projectInitial(project.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  to={`/projects/${project._id}`}
                  className="font-semibold text-white text-sm hover:text-cyan-300 transition-colors line-clamp-2"
                >
                  {project.name}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                  <Building2 size={11} className="shrink-0" />
                  {customerLabel(project.customer)}
                </p>
              </div>

              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {canEdit && editHref && (
                  <Link
                    to={editHref}
                    className="p-1.5 text-gray-500 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </Link>
                )}
                {canDelete && onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusMeta.color || 'bg-gray-500/15 text-gray-400'}`}>
                {statusMeta.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${priority.className}`}>
                {priority.label}
              </span>
              {project.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-myth-surface text-gray-400 inline-flex items-center gap-1">
                  <Tag size={9} />
                  {categoryLabel(project.category)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-myth-border/40">
          <MetaItem
            label="Budget"
            value={project.budget > 0 ? formatCurrency(project.budget) : null}
            valueClass="text-cyan-300/90 font-medium"
            icon={DollarSign}
          />
          <MetaItem
            label="Requirements"
            value={hasRequirements ? `${requirementsDocs.length} document${requirementsDocs.length !== 1 ? 's' : ''}` : 'None yet'}
            valueClass={hasRequirements ? 'text-gray-300' : 'text-gray-600'}
            icon={FileText}
          />
        </div>

        {/* Team & support */}
        <div className="flex flex-col gap-1.5 mt-3">
          <TeamPill status={techDisplay.status} label={techDisplay.label} />
          {showSupportAssignee && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ring-1 ring-inset bg-orange-500/8 text-orange-300/90 ring-orange-500/20 max-w-full">
              <Headphones size={10} className="shrink-0" />
              <span className="truncate">{supportLine || 'No support assignee'}</span>
            </span>
          )}
        </div>

        {/* Requirements links — only when docs exist */}
        {hasRequirements && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {requirementsDocs.slice(0, 3).map((doc) => (
              <a
                key={doc._id}
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] px-2 py-1 rounded-lg bg-myth-surface/60 text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors truncate max-w-[140px]"
                title={doc.name}
              >
                {doc.name}
              </a>
            ))}
            {requirementsDocs.length > 3 && (
              <span className="text-[10px] px-2 py-1 text-gray-600">+{requirementsDocs.length - 3} more</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-myth-border/40 flex items-center justify-end">
          <Link
            to={`/projects/${project._id}`}
            className="text-xs text-cyan-400/90 hover:text-cyan-300 inline-flex items-center gap-0.5 transition-colors"
          >
            Open project <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
