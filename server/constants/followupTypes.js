export const FOLLOWUP_ACTIVITY_TYPES = [
  'phone_call', 'email', 'whatsapp', 'meeting', 'video_call', 'product_demo',
  'site_visit', 'send_brochure', 'quotation_discussion', 'general',
  'call', 'chat', 'note', 'task',
];

export const FOLLOWUP_STATUS_VALUES = [
  'scheduled', 'completed', 'missed', 'cancelled', 'rescheduled', 'pending',
  'awaiting_customer_response', 'in_progress', 'overdue',
];

export const LEAD_STATUS_VALUES = [
  'new', 'contacted', 'interested', 'not_interested', 'qualified',
];

export const normalizeActivityType = (type) => {
  const map = { call: 'phone_call', chat: 'whatsapp', note: 'general', task: 'general' };
  return map[type] || type || 'general';
};

export const normalizeFollowupStatus = (status) => (status === 'pending' ? 'scheduled' : status || 'scheduled');

export const normalizeLeadStatusForFollowup = (status) => {
  const map = {
    lead_created: 'new',
    assigned: 'contacted',
    follow_up: 'contacted',
    proposal_sent: 'interested',
    negotiation: 'qualified',
    converted_to_deal: 'qualified',
  };
  if (LEAD_STATUS_VALUES.includes(status)) return status;
  return map[status] || 'new';
};

export const isMeetingActivity = (type) =>
  ['meeting', 'video_call', 'product_demo', 'site_visit'].includes(normalizeActivityType(type));
