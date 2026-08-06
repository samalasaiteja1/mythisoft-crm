import { Link } from 'react-router-dom';
import {
  GripVertical, Building2, DollarSign, Eye, Pencil, Trash2, ChevronRight,
  User, Users, Percent,
} from 'lucide-react';
import { formatCurrency } from '../../services/api';
import { normalizeDealStage } from '../../constants/dealPipeline';
import { getDealDeliverySummary } from '../../utils/dealForm';
import {
  formatDealOwnerName,
  getDealManagerName,
} from '../../constants/adminDealViews';

const STAGE_ACCENT = {
  deal_created: 'border-l-blue-500/80',
  discovery: 'border-l-cyan-500/80',
  requirement_gathering: 'border-l-indigo-500/80',
  proposal_sent: 'border-l-violet-500/80',
  quotation_sent: 'border-l-purple-500/80',
  negotiation: 'border-l-amber-500/80',
  customer_approval: 'border-l-yellow-500/80',
  contract_signed: 'border-l-orange-500/80',
  advance_payment_received: 'border-l-teal-500/80',
  won: 'border-l-green-500/80',
  converted_to_customer: 'border-l-emerald-500/80',
};

function dealInitial(title = '') {
  return (title.trim()[0] || 'D').toUpperCase();
}

function customerLabel(customer) {
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  return name || customer.companyName || customer.email || null;
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

export default function DealPipelineCard({
  deal,
  stageKey,
  draggable,
  onDragStart,
  showManager = false,
  showSales = false,
  managerLabel = 'Manager',
  salesLabel = 'Sales',
  canMove = false,
  canDelete = false,
  onDelete,
  children,
}) {
  const stage = normalizeDealStage(stageKey || deal.stage);
  const accent = STAGE_ACCENT[stage] || STAGE_ACCENT.deal_created;
  const delivery = getDealDeliverySummary(deal);
  const managerName = getDealManagerName(deal);
  const salesName = formatDealOwnerName(deal.assignedTo);
  const customer = customerLabel(deal.customer);

  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      className={`group relative rounded-xl border border-myth-border/60 border-l-[3px] ${accent} bg-myth-surface/20 hover:bg-myth-surface/35 hover:border-purple-500/25 transition-all ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {draggable && (
            <GripVertical
              size={14}
              className="text-gray-600 mt-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center text-xs font-bold shrink-0">
            {dealInitial(deal.title)}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to={`/deals/${deal._id}`}
              className="font-semibold text-white text-sm hover:text-purple-300 transition-colors line-clamp-2"
              onClick={(e) => e.stopPropagation()}
            >
              {deal.title}
            </Link>
            {customer && (
              <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                <Building2 size={11} className="shrink-0" />
                {customer}
              </p>
            )}
            {delivery && (
              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{delivery}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-myth-border/40">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-600 mb-0.5">Value</p>
            <p className="text-xs font-semibold text-purple-300/90 inline-flex items-center gap-1">
              <DollarSign size={11} />
              {formatCurrency(deal.value || 0)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-600 mb-0.5">Probability</p>
            <p className="text-xs text-gray-300 inline-flex items-center gap-1">
              <Percent size={11} className="text-gray-500" />
              {deal.probability ?? 0}%
            </p>
          </div>
        </div>

        {(showManager || showSales) && (managerName || salesName) && (
          <div className="flex flex-col gap-1 mt-2.5">
            {showManager && managerName && (
              <AssigneePill label={managerLabel} name={managerName} variant="manager" />
            )}
            {showSales && salesName && (
              <AssigneePill label={salesLabel} name={salesName} variant="sales" />
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
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canMove && (
              <Link
                to={`/deals/${deal._id}`}
                state={{ edit: true }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                title="Edit"
                onClick={(e) => e.stopPropagation()}
              >
                <Pencil size={14} />
              </Link>
            )}
            <Link
              to={`/deals/${deal._id}`}
              className="p-1.5 rounded-lg text-gray-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
              title="View"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye size={14} />
            </Link>
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <Link
            to={`/deals/${deal._id}`}
            className="text-[10px] text-purple-400/80 hover:text-purple-300 inline-flex items-center gap-0.5 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Open <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}
