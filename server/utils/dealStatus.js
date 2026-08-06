export const DEAL_PIPELINE_STAGES = [
  'deal_created',
  'discovery',
  'requirement_gathering',
  'proposal_sent',
  'quotation_sent',
  'negotiation',
  'customer_approval',
  'contract_signed',
  'advance_payment_received',
  'won',
  'converted_to_customer',
];

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
  if (stage && DEAL_PIPELINE_STAGES.includes(stage)) return stage;
  if (LEGACY_STAGE_MAP[stage]) return LEGACY_STAGE_MAP[stage];
  return stage || 'deal_created';
};

export const stageProbabilities = {
  qualified_lead: 5,
  deal_created: 10,
  discovery: 15,
  requirement_gathering: 25,
  proposal_sent: 40,
  quotation_sent: 50,
  negotiation: 65,
  customer_approval: 75,
  contract_signed: 85,
  advance_payment_received: 95,
  won: 100,
  converted_to_customer: 100,
  lost: 0,
  closed_lost: 0,
  closed_won: 100,
};

export const stageFilterValues = (stage) => {
  const aliases = {
    qualified_lead: ['qualified_lead', 'prospecting', 'qualification'],
    deal_created: ['deal_created', 'new'],
    discovery: ['discovery', 'contacted', 'meeting'],
    requirement_gathering: ['requirement_gathering', 'demo'],
    proposal_sent: ['proposal_sent', 'proposal'],
    quotation_sent: ['quotation_sent'],
    negotiation: ['negotiation'],
    customer_approval: ['customer_approval'],
    contract_signed: ['contract_signed'],
    advance_payment_received: ['advance_payment_received'],
    won: ['won', 'closed_won'],
    converted_to_customer: ['converted_to_customer'],
    lost: ['lost', 'closed_lost'],
  };
  return aliases[stage] || [stage];
};

export const applyDealStage = (deal, stage) => {
  const normalized = normalizeDealStage(stage);
  deal.stage = normalized;
  deal.probability = stageProbabilities[normalized] ?? deal.probability ?? 10;
  if (normalized === 'won' || normalized === 'converted_to_customer') {
    deal.actualCloseDate = deal.actualCloseDate || new Date();
  }
  return deal;
};
