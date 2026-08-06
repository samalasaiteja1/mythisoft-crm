import { normalizeDealStage } from '../utils/dealStatus.js';

export const DEAL_STAGE_VALUES = [
  'deal_created', 'discovery', 'requirement_gathering', 'proposal_sent', 'quotation_sent',
  'negotiation', 'customer_approval', 'contract_signed', 'advance_payment_received',
  'won', 'converted_to_customer',
];

export const DEAL_FOLLOWUP_STATUS_VALUES = [
  'scheduled', 'completed', 'awaiting_customer_response', 'in_progress',
  'rescheduled', 'cancelled', 'overdue', 'missed', 'pending',
];

export const normalizeDealStageForFollowup = (stage) => normalizeDealStage(stage);

export const normalizeDealFollowupStatus = (status) => {
  if (status === 'pending') return 'scheduled';
  if (status === 'missed') return 'overdue';
  return status || 'scheduled';
};

export const DEAL_ACTIVE_STATUSES = [
  'scheduled', 'pending', 'rescheduled', 'awaiting_customer_response', 'in_progress', 'overdue',
];
