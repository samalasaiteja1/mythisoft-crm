export const LEAD_PIPELINE_STATUSES = [
  'new',
  'contacted',
  'interested',
  'not_interested',
  'qualified',
  'converted_to_deal',
];

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
  if (status && LEAD_PIPELINE_STATUSES.includes(status)) return status;
  if (LEGACY_STATUS_MAP[status]) return LEGACY_STATUS_MAP[status];
  if (workflowStage && LEAD_PIPELINE_STATUSES.includes(workflowStage)) return workflowStage;
  if (workflowStage && LEGACY_STATUS_MAP[workflowStage]) return LEGACY_STATUS_MAP[workflowStage];
  return 'new';
};

export const applyLeadStatus = (lead, status) => {
  const normalized = normalizeLeadStatus(status, lead.workflowStage);
  lead.status = normalized;
  lead.workflowStage = normalized;
  if (normalized === 'qualified') lead.isQualified = true;
  if (normalized === 'not_interested') lead.isQualified = false;
  return lead;
};

export const statusFilterValues = (status) => {
  const aliases = {
    new: ['new', 'lead_created'],
    contacted: ['contacted', 'assigned', 'meeting_scheduled', 'follow_up'],
    interested: ['interested', 'proposal_sent'],
    not_interested: ['not_interested', 'lost'],
    qualified: ['qualified', 'negotiation'],
    converted_to_deal: ['converted_to_deal', 'quotation_sent', 'deal_won', 'customer_created', 'won'],
  };
  return aliases[status] || [status];
};
