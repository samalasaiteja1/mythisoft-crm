/** Lead pipeline — single source of truth */

export const LEAD_PIPELINE_STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-500/20 text-blue-400', border: 'border-blue-500/30' },
  { key: 'contacted', label: 'Contacted', color: 'bg-yellow-500/20 text-yellow-400', border: 'border-yellow-500/30' },
  { key: 'interested', label: 'Interested', color: 'bg-purple-500/20 text-purple-400', border: 'border-purple-500/30' },
  { key: 'not_interested', label: 'Not Interested', color: 'bg-red-500/20 text-red-400', border: 'border-red-500/30', branch: true },
  { key: 'qualified', label: 'Qualified', color: 'bg-teal-500/20 text-teal-400', border: 'border-teal-500/30' },
];

/** Stages users can pick in dropdown / drag on kanban (deal conversion is a separate action) */
export const LEAD_SELECTABLE_STAGES = LEAD_PIPELINE_STAGES;

export const LEAD_PIPELINE_KEYS = [...LEAD_PIPELINE_STAGES.map((s) => s.key), 'converted_to_deal'];

const LEGACY_STATUS_MAP = {
  lead_created: 'new',
  assigned: 'contacted',
  follow_up: 'contacted',
  quotation_sent: 'converted_to_deal',
  deal_won: 'converted_to_deal',
  customer_created: 'converted_to_deal',
  project_started: 'converted_to_deal',
  negotiation: 'qualified',
  proposal_sent: 'interested',
  meeting_scheduled: 'contacted',
  won: 'converted_to_deal',
  lost: 'not_interested',
};

export const normalizeLeadStatus = (status, workflowStage) => {
  if (status && LEAD_PIPELINE_KEYS.includes(status)) return status;
  if (LEGACY_STATUS_MAP[status]) return LEGACY_STATUS_MAP[status];
  if (workflowStage && LEAD_PIPELINE_KEYS.includes(workflowStage)) return workflowStage;
  if (workflowStage && LEGACY_STATUS_MAP[workflowStage]) return LEGACY_STATUS_MAP[workflowStage];
  return 'new';
};

export const LEAD_STATUSES = Object.fromEntries(
  LEAD_PIPELINE_STAGES.map((s) => [s.key, { label: s.label, color: s.color }]),
);
LEAD_STATUSES.converted_to_deal = { label: 'Deal Created', color: 'bg-green-500/20 text-green-400' };

/** Group converted leads under Qualified column in kanban */
export const getLeadKanbanStage = (status, workflowStage) => {
  const normalized = normalizeLeadStatus(status, workflowStage);
  return normalized === 'converted_to_deal' ? 'qualified' : normalized;
};

export const getLeadDealId = (lead) => {
  if (!lead?.convertedToDeal) return null;
  return lead.convertedToDeal._id || lead.convertedToDeal;
};

export const hasLeadDeal = (lead) => {
  const stage = normalizeLeadStatus(lead?.status, lead?.workflowStage);
  return Boolean(getLeadDealId(lead)) || stage === 'converted_to_deal';
};

export const canConvertLeadToDeal = (lead) => {
  const stage = normalizeLeadStatus(lead?.status, lead?.workflowStage);
  return stage === 'qualified' && !hasLeadDeal(lead);
};
