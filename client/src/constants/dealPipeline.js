/** Deal pipeline — single source of truth */

export const DEAL_PIPELINE_STAGES = [
  { key: 'deal_created', label: 'Deal Created', color: 'bg-blue-500/20 text-blue-400', border: 'border-blue-500/30' },
  { key: 'discovery', label: 'Discovery', color: 'bg-cyan-500/20 text-cyan-400', border: 'border-cyan-500/30' },
  { key: 'requirement_gathering', label: 'Requirement Gathering', color: 'bg-indigo-500/20 text-indigo-400', border: 'border-indigo-500/30' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'bg-violet-500/20 text-violet-400', border: 'border-violet-500/30' },
  { key: 'quotation_sent', label: 'Quotation Sent', color: 'bg-purple-500/20 text-purple-400', border: 'border-purple-500/30' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-amber-500/20 text-amber-400', border: 'border-amber-500/30' },
  { key: 'customer_approval', label: 'Customer Approval', color: 'bg-yellow-500/20 text-yellow-400', border: 'border-yellow-500/30' },
  { key: 'contract_signed', label: 'Contract Signed', color: 'bg-orange-500/20 text-orange-400', border: 'border-orange-500/30' },
  { key: 'advance_payment_received', label: 'Advance Payment Received', color: 'bg-teal-500/20 text-teal-400', border: 'border-teal-500/30' },
  { key: 'won', label: 'Won', color: 'bg-green-500/20 text-green-400', border: 'border-green-500/30' },
  { key: 'converted_to_customer', label: 'Convert to Customer', color: 'bg-emerald-500/20 text-emerald-400', border: 'border-emerald-500/30' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500/20 text-red-400', border: 'border-red-500/30' },
];

export const DEAL_PIPELINE_KEYS = DEAL_PIPELINE_STAGES.map((s) => s.key);

const LEGACY_STAGE_MAP = {
  new: 'deal_created',
  prospecting: 'deal_created',
  qualification: 'deal_created',
  qualified_lead: 'deal_created',
  contacted: 'discovery',
  meeting: 'discovery',
  demo: 'requirement_gathering',
  proposal: 'proposal_sent',
  closed_won: 'won',
  closed_lost: 'lost',
};

export const normalizeDealStage = (stage) => {
  if (stage && DEAL_PIPELINE_KEYS.includes(stage)) return stage;
  if (LEGACY_STAGE_MAP[stage]) return LEGACY_STAGE_MAP[stage];
  return stage || 'deal_created';
};

export const DEAL_STAGES = Object.fromEntries(
  DEAL_PIPELINE_STAGES.map((s) => [s.key, { label: s.label, color: s.color }]),
);

DEAL_STAGES.lost = { label: 'Lost', color: 'bg-red-500/20 text-red-400' };

export const isDealWon = (stage) => ['won', 'converted_to_customer', 'closed_won'].includes(normalizeDealStage(stage));

export const canConvertDealToCustomer = (stage) => {
  const s = normalizeDealStage(stage);
  return ['won', 'converted_to_customer', 'advance_payment_received', 'contract_signed', 'customer_approval', 'negotiation', 'quotation_sent', 'proposal_sent'].includes(s);
};
