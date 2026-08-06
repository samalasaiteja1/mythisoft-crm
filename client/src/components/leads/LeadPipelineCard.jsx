import { Link } from 'react-router-dom';
import {
  GripVertical, Building2, Mail, DollarSign, UserCheck, Eye, Handshake,
  User, Users, ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '../../services/api';
import { formatAssigneeName } from '../../constants/adminLeadViews';

const PRIORITY_META = {
  low: { label: 'Low', className: 'text-gray-400 bg-gray-500/10' },
  medium: { label: 'Medium', className: 'text-blue-300 bg-blue-500/10' },
  high: { label: 'High', className: 'text-orange-300 bg-orange-500/10' },
  urgent: { label: 'Urgent', className: 'text-red-300 bg-red-500/10' },
};

const STAGE_ACCENT = {
  new: 'border-l-blue-500/80',
  contacted: 'border-l-yellow-500/80',
  interested: 'border-l-purple-500/80',
  not_interested: 'border-l-red-500/80',
  qualified: 'border-l-teal-500/80',
};

function leadInitials(lead) {
  const f = lead.firstName?.[0] || '';
  const l = lead.lastName?.[0] || '';
  return `${f}${l}`.toUpperCase() || '?';
}

function AssigneePill({ label, name, variant = 'manager' }) {
  if (!name) return null;
  const Icon = variant === 'manager' ? User : Users;
  const cls = variant === 'manager'
    ? 'bg-purple-500/8 text-purple-300/90 ring-purple-500/20'
    : 'bg-blue-500/8 text-blue-300/90 ring-blue-500/20';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ring-1 ring-inset max-w-full ${cls}`}>
      <Icon size={10} className="shrink-0" />
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="truncate">{name}</span>
    </span>
  );
}

export default function LeadPipelineCard({
  lead,
  stageKey = 'new',
  draggable,
  onDragStart,
  showManagerAssignee,
  showSalesAssignee,
  managerLabel = 'Manager',
  salesLabel = 'Sales',
  onViewContact,
  dealId,
  hasDeal,
  canConvert,
  onConvert,
  children,
}) {
  const priority = PRIORITY_META[lead.priority] || PRIORITY_META.medium;
  const accent = STAGE_ACCENT[stageKey] || STAGE_ACCENT.new;
  const budget = lead.budget || lead.value;

  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      className={`group relative rounded-xl border border-myth-border/60 border-l-[3px] ${accent} bg-myth-surface/20 hover:bg-myth-surface/35 hover:border-blue-500/25 transition-all ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {draggable && (
            <GripVertical
              size={14}
              className="text-gray-600 mt-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
            {leadInitials(lead)}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to={`/leads/${lead._id}`}
              className="font-semibold text-white text-sm hover:text-blue-300 transition-colors line-clamp-2"
              onClick={(e) => e.stopPropagation()}
            >
              {lead.firstName} {lead.lastName}
            </Link>
            {lead.leadNumber && (
              <p className="text-[10px] font-mono text-blue-400/70 mt-0.5">{lead.leadNumber}</p>
            )}
            <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
              {lead.company ? (
                <><Building2 size={11} className="shrink-0" />{lead.company}</>
              ) : lead.email ? (
                <><Mail size={11} className="shrink-0" />{lead.email}</>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${priority.className}`}>
            {priority.label}
          </span>
          {lead.source && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-myth-surface/80 text-gray-400 capitalize">
              {String(lead.source).replace(/_/g, ' ')}
            </span>
          )}
          {lead.score > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-myth-surface/80 text-gray-500">
              Score {lead.score}
            </span>
          )}
        </div>

        {budget > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-myth-border/40">
            <p className="text-[10px] uppercase tracking-wide text-gray-600 mb-0.5">Budget</p>
            <p className="text-xs font-semibold text-emerald-300/90 inline-flex items-center gap-1">
              <DollarSign size={11} />
              {formatCurrency(budget)}
            </p>
          </div>
        )}

        {(showManagerAssignee || showSalesAssignee) && (
          <div className="flex flex-col gap-1 mt-2.5">
            {showManagerAssignee && formatAssigneeName(lead.assignedManager) && (
              <AssigneePill label={managerLabel} name={formatAssigneeName(lead.assignedManager)} variant="manager" />
            )}
            {showSalesAssignee && formatAssigneeName(lead.assignedTo) && (
              <AssigneePill label={salesLabel} name={formatAssigneeName(lead.assignedTo)} variant="sales" />
            )}
          </div>
        )}

        {children && (
          <div
            className="mt-2.5 pt-2.5 border-t border-myth-border/40 space-y-2"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-myth-border/40">
          <div className="flex flex-wrap gap-1">
            {dealId ? (
              <Link
                to={`/deals/${dealId}`}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-300 hover:bg-green-500/20 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Handshake size={10} /> Deal
              </Link>
            ) : hasDeal ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-300">
                <Handshake size={10} /> Deal created
              </span>
            ) : canConvert ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onConvert?.(); }}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors"
              >
                <UserCheck size={10} /> Convert
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onViewContact?.(); }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-300 hover:bg-blue-500/10 transition-colors opacity-0 group-hover:opacity-100"
              title="View contact"
            >
              <Eye size={14} />
            </button>
            <Link
              to={`/leads/${lead._id}`}
              className="text-[10px] text-blue-400/80 hover:text-blue-300 inline-flex items-center gap-0.5 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Open <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export { PRIORITY_META, STAGE_ACCENT };
