/** Lead follow-up types, statuses, and options by lead pipeline stage */

export const FOLLOWUP_TYPES = [
  { key: 'phone_call', label: 'Phone Call', icon: '📞' },
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { key: 'meeting', label: 'Meeting', icon: '🤝' },
  { key: 'video_call', label: 'Video Call', icon: '🎥' },
  { key: 'product_demo', label: 'Product Demo', icon: '🖥' },
  { key: 'site_visit', label: 'Site Visit', icon: '🏢' },
  { key: 'send_brochure', label: 'Send Brochure', icon: '📄' },
  { key: 'quotation_discussion', label: 'Quotation Discussion', icon: '💰' },
  { key: 'general', label: 'General Follow-up', icon: '📝' },
];

export const FOLLOWUP_STATUSES = [
  { key: 'scheduled', label: 'Scheduled', color: 'bg-blue-500/20 text-blue-400' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  { key: 'missed', label: 'Missed', color: 'bg-red-500/20 text-red-400' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400' },
  { key: 'rescheduled', label: 'Rescheduled', color: 'bg-amber-500/20 text-amber-400' },
];

export const LEAD_STATUS_FOLLOWUP_GROUPS = [
  {
    key: 'new',
    label: 'New',
    color: 'text-green-400',
    dot: '🟢',
    options: [
      { key: 'first_call', label: 'First Call', activityType: 'phone_call' },
      { key: 'send_intro_email', label: 'Send Introduction Email', activityType: 'email' },
      { key: 'send_whatsapp', label: 'Send WhatsApp', activityType: 'whatsapp' },
      { key: 'no_response', label: 'No Response', activityType: 'general' },
      { key: 'wrong_number', label: 'Wrong Number', activityType: 'general' },
      { key: 'call_scheduled', label: 'Call Scheduled', activityType: 'phone_call' },
    ],
  },
  {
    key: 'contacted',
    label: 'Contacted',
    color: 'text-yellow-400',
    dot: '🟡',
    options: [
      { key: 'requirement_discussion', label: 'Requirement Discussion', activityType: 'phone_call' },
      { key: 'followup_call', label: 'Follow-up Call', activityType: 'phone_call' },
      { key: 'meeting_scheduled', label: 'Meeting Scheduled', activityType: 'meeting' },
      { key: 'demo_scheduled', label: 'Demo Scheduled', activityType: 'product_demo' },
      { key: 'call_back_later', label: 'Call Back Later', activityType: 'phone_call' },
      { key: 'need_more_info', label: 'Need More Information', activityType: 'email' },
    ],
  },
  {
    key: 'interested',
    label: 'Interested',
    color: 'text-blue-400',
    dot: '🔵',
    options: [
      { key: 'product_demo', label: 'Product Demo', activityType: 'product_demo' },
      { key: 'send_brochure', label: 'Send Brochure', activityType: 'send_brochure' },
      { key: 'send_proposal', label: 'Send Proposal', activityType: 'email' },
      { key: 'send_quotation', label: 'Send Quotation', activityType: 'quotation_discussion' },
      { key: 'pricing_discussion', label: 'Pricing Discussion', activityType: 'phone_call' },
      { key: 'decision_pending', label: 'Decision Pending', activityType: 'general' },
    ],
  },
  {
    key: 'not_interested',
    label: 'Not Interested',
    color: 'text-red-400',
    dot: '🔴',
    options: [
      { key: 'budget_issue', label: 'Budget Issue', activityType: 'general' },
      { key: 'no_requirement', label: 'No Requirement', activityType: 'general' },
      { key: 'using_competitor', label: 'Already Using Competitor', activityType: 'general' },
      { key: 'wrong_contact', label: 'Wrong Contact', activityType: 'general' },
      { key: 'future_followup', label: 'Future Follow-up', activityType: 'general' },
      { key: 'close_lead', label: 'Close Lead', activityType: 'general' },
    ],
  },
  {
    key: 'qualified',
    label: 'Qualified',
    color: 'text-purple-400',
    dot: '🟣',
    options: [
      { key: 'create_deal', label: 'Create Deal', activityType: 'general' },
      { key: 'send_proposal_qualified', label: 'Send Proposal', activityType: 'email' },
      { key: 'negotiation_started', label: 'Negotiation Started', activityType: 'quotation_discussion' },
      { key: 'customer_approved', label: 'Customer Approved', activityType: 'general' },
      { key: 'move_to_deal_pipeline', label: 'Move to Deal Pipeline', activityType: 'general' },
    ],
  },
];

export const FOLLOWUP_TYPE_LABELS = Object.fromEntries(FOLLOWUP_TYPES.map((t) => [t.key, t.label]));
export const FOLLOWUP_TYPE_ICONS = Object.fromEntries(FOLLOWUP_TYPES.map((t) => [t.key, t.icon]));
export const FOLLOWUP_STATUS_LABELS = Object.fromEntries(FOLLOWUP_STATUSES.map((s) => [s.key, s.label]));
export const FOLLOWUP_STATUS_COLORS = Object.fromEntries(FOLLOWUP_STATUSES.map((s) => [s.key, s.color]));

const allOptions = LEAD_STATUS_FOLLOWUP_GROUPS.flatMap((g) => g.options);
export const FOLLOWUP_OPTION_LABELS = Object.fromEntries(allOptions.map((o) => [o.key, o.label]));

export const getLeadStatusGroup = (leadStatus) =>
  LEAD_STATUS_FOLLOWUP_GROUPS.find((g) => g.key === leadStatus) || LEAD_STATUS_FOLLOWUP_GROUPS[0];

export const getFollowUpOption = (leadStatus, optionKey) => {
  const group = getLeadStatusGroup(leadStatus);
  return group.options.find((o) => o.key === optionKey);
};

export const normalizeLeadStatusForFollowup = (status) => {
  const map = {
    lead_created: 'new',
    assigned: 'contacted',
    follow_up: 'contacted',
    proposal_sent: 'interested',
    negotiation: 'qualified',
    converted_to_deal: 'qualified',
  };
  if (LEAD_STATUS_FOLLOWUP_GROUPS.some((g) => g.key === status)) return status;
  return map[status] || 'new';
};

/** Legacy activity types → new keys */
export const LEGACY_ACTIVITY_MAP = {
  call: 'phone_call',
  chat: 'whatsapp',
  note: 'general',
  task: 'general',
};

export const normalizeActivityType = (type) => LEGACY_ACTIVITY_MAP[type] || type || 'general';

export const normalizeFollowupStatus = (status) => (status === 'pending' ? 'scheduled' : status || 'scheduled');

export const isMeetingActivity = (type) =>
  ['meeting', 'video_call', 'product_demo', 'site_visit'].includes(normalizeActivityType(type));
