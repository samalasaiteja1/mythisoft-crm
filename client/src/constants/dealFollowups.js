import { DEAL_PIPELINE_STAGES, normalizeDealStage } from './dealPipeline';

export { FOLLOWUP_TYPES } from './leadFollowups';

export const DEAL_FOLLOWUP_STATUSES = [
  { key: 'scheduled', label: 'Scheduled', color: 'bg-blue-500/20 text-blue-400' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  { key: 'awaiting_customer_response', label: 'Awaiting Customer Response', color: 'bg-purple-500/20 text-purple-400' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400' },
  { key: 'rescheduled', label: 'Rescheduled', color: 'bg-amber-500/20 text-amber-400' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400' },
  { key: 'overdue', label: 'Overdue', color: 'bg-red-500/20 text-red-400' },
];

export const DEAL_FOLLOWUP_OUTCOMES = [
  { key: 'customer_responded', label: 'Customer Responded' },
  { key: 'no_response', label: 'No Response' },
  { key: 'meeting_scheduled', label: 'Meeting Scheduled' },
  { key: 'proposal_accepted', label: 'Proposal Accepted' },
  { key: 'proposal_revised', label: 'Proposal Revised' },
  { key: 'quotation_accepted', label: 'Quotation Accepted' },
  { key: 'negotiation_ongoing', label: 'Negotiation Ongoing' },
  { key: 'contract_signed', label: 'Contract Signed' },
  { key: 'payment_received', label: 'Payment Received' },
  { key: 'deal_won', label: 'Deal Won' },
  { key: 'converted_to_customer', label: 'Converted to Customer' },
];

export const DEAL_STAGE_FOLLOWUP_GROUPS = [
  {
    key: 'deal_created',
    label: 'Deal Created',
    options: [
      { key: 'initial_contact', label: 'Initial Contact', activityType: 'phone_call' },
      { key: 'schedule_discovery_call', label: 'Schedule Discovery Call', activityType: 'phone_call' },
      { key: 'send_intro_email', label: 'Send Introduction Email', activityType: 'email' },
      { key: 'assign_sales_owner', label: 'Assign Sales Owner', activityType: 'general' },
      { key: 'confirm_availability', label: 'Confirm Customer Availability', activityType: 'phone_call' },
    ],
  },
  {
    key: 'discovery',
    label: 'Discovery',
    options: [
      { key: 'discovery_call', label: 'Discovery Call', activityType: 'phone_call' },
      { key: 'discovery_meeting', label: 'Discovery Meeting', activityType: 'meeting' },
      { key: 'identify_decision_maker', label: 'Identify Decision Maker', activityType: 'phone_call' },
      { key: 'understand_business_needs', label: 'Understand Business Needs', activityType: 'meeting' },
      { key: 'gather_initial_info', label: 'Gather Initial Information', activityType: 'email' },
      { key: 'schedule_requirement_meeting', label: 'Schedule Requirement Meeting', activityType: 'meeting' },
    ],
  },
  {
    key: 'requirement_gathering',
    label: 'Requirement Gathering',
    options: [
      { key: 'collect_requirements', label: 'Collect Requirements', activityType: 'meeting' },
      { key: 'technical_discussion', label: 'Technical Discussion', activityType: 'video_call' },
      { key: 'scope_confirmation', label: 'Scope Confirmation', activityType: 'email' },
      { key: 'budget_discussion', label: 'Budget Discussion', activityType: 'quotation_discussion' },
      { key: 'timeline_discussion', label: 'Timeline Discussion', activityType: 'phone_call' },
      { key: 'requirement_review_meeting', label: 'Requirement Review Meeting', activityType: 'meeting' },
    ],
  },
  {
    key: 'proposal_sent',
    label: 'Proposal Sent',
    options: [
      { key: 'proposal_followup', label: 'Proposal Follow-up', activityType: 'phone_call' },
      { key: 'explain_proposal', label: 'Explain Proposal', activityType: 'meeting' },
      { key: 'proposal_review_meeting', label: 'Proposal Review Meeting', activityType: 'meeting' },
      { key: 'answer_customer_questions', label: 'Answer Customer Questions', activityType: 'email' },
      { key: 'revise_proposal', label: 'Revise Proposal', activityType: 'email' },
      { key: 'await_customer_feedback', label: 'Await Customer Feedback', activityType: 'general' },
    ],
  },
  {
    key: 'quotation_sent',
    label: 'Quotation Sent',
    options: [
      { key: 'quotation_followup', label: 'Quotation Follow-up', activityType: 'phone_call' },
      { key: 'pricing_discussion', label: 'Pricing Discussion', activityType: 'quotation_discussion' },
      { key: 'discount_approval', label: 'Discount Approval', activityType: 'general' },
      { key: 'clarify_payment_terms', label: 'Clarify Payment Terms', activityType: 'email' },
      { key: 'send_revised_quotation', label: 'Send Revised Quotation', activityType: 'email' },
      { key: 'await_customer_response', label: 'Await Customer Response', activityType: 'general' },
    ],
  },
  {
    key: 'negotiation',
    label: 'Negotiation',
    options: [
      { key: 'price_negotiation', label: 'Price Negotiation', activityType: 'quotation_discussion' },
      { key: 'feature_negotiation', label: 'Feature Negotiation', activityType: 'meeting' },
      { key: 'contract_discussion', label: 'Contract Discussion', activityType: 'meeting' },
      { key: 'final_offer', label: 'Final Offer', activityType: 'email' },
      { key: 'internal_approval', label: 'Internal Approval', activityType: 'general' },
      { key: 'decision_followup', label: 'Decision Follow-up', activityType: 'phone_call' },
    ],
  },
  {
    key: 'customer_approval',
    label: 'Customer Approval',
    options: [
      { key: 'approval_confirmation', label: 'Approval Confirmation', activityType: 'phone_call' },
      { key: 'collect_approval_documents', label: 'Collect Approval Documents', activityType: 'email' },
      { key: 'prepare_agreement', label: 'Prepare Agreement', activityType: 'general' },
      { key: 'confirm_project_start', label: 'Confirm Project Start Date', activityType: 'phone_call' },
      { key: 'schedule_contract_signing', label: 'Schedule Contract Signing', activityType: 'meeting' },
    ],
  },
  {
    key: 'contract_signed',
    label: 'Contract Signed',
    options: [
      { key: 'verify_signed_contract', label: 'Verify Signed Contract', activityType: 'general' },
      { key: 'send_invoice', label: 'Send Invoice', activityType: 'email' },
      { key: 'request_advance_payment', label: 'Request Advance Payment', activityType: 'email' },
      { key: 'project_kickoff_planning', label: 'Project Kickoff Planning', activityType: 'meeting' },
      { key: 'internal_handover', label: 'Internal Handover', activityType: 'general' },
    ],
  },
  {
    key: 'advance_payment_received',
    label: 'Advance Payment Received',
    options: [
      { key: 'payment_confirmation', label: 'Payment Confirmation', activityType: 'email' },
      { key: 'generate_receipt', label: 'Generate Receipt', activityType: 'email' },
      { key: 'assign_project_manager', label: 'Assign Project Manager', activityType: 'general' },
      { key: 'schedule_kickoff_meeting', label: 'Schedule Kickoff Meeting', activityType: 'meeting' },
      { key: 'notify_technical_team', label: 'Notify Technical Team', activityType: 'email' },
    ],
  },
  {
    key: 'won',
    label: 'Won',
    options: [
      { key: 'welcome_customer', label: 'Welcome Customer', activityType: 'email' },
      { key: 'create_project', label: 'Create Project', activityType: 'general' },
      { key: 'team_assignment', label: 'Team Assignment', activityType: 'general' },
      { key: 'kickoff_meeting', label: 'Kickoff Meeting', activityType: 'meeting' },
      { key: 'customer_onboarding', label: 'Customer Onboarding', activityType: 'meeting' },
      { key: 'handover_to_support', label: 'Handover to Support', activityType: 'general' },
    ],
  },
  {
    key: 'converted_to_customer',
    label: 'Convert to Customer',
    options: [
      { key: 'create_customer_record', label: 'Create Customer Record', activityType: 'general' },
      { key: 'activate_customer_account', label: 'Activate Customer Account', activityType: 'general' },
      { key: 'assign_account_manager', label: 'Assign Account Manager', activityType: 'general' },
      { key: 'send_welcome_email', label: 'Send Welcome Email', activityType: 'email' },
      { key: 'close_deal', label: 'Close Deal', activityType: 'general' },
    ],
  },
];

export const DEAL_FOLLOWUP_STATUS_LABELS = Object.fromEntries(
  DEAL_FOLLOWUP_STATUSES.map((s) => [s.key, s.label]),
);

export const DEAL_FOLLOWUP_STATUS_COLORS = Object.fromEntries(
  DEAL_FOLLOWUP_STATUSES.map((s) => [s.key, s.color]),
);

export const DEAL_FOLLOWUP_OUTCOME_LABELS = Object.fromEntries(
  DEAL_FOLLOWUP_OUTCOMES.map((o) => [o.key, o.label]),
);

const allDealOptions = DEAL_STAGE_FOLLOWUP_GROUPS.flatMap((g) => g.options);
export const DEAL_FOLLOWUP_OPTION_LABELS = Object.fromEntries(
  allDealOptions.map((o) => [o.key, o.label]),
);

export const DEAL_STAGE_LABELS = Object.fromEntries(
  DEAL_PIPELINE_STAGES.map((s) => [s.key, s.label]),
);

export const getDealStageGroup = (dealStage) =>
  DEAL_STAGE_FOLLOWUP_GROUPS.find((g) => g.key === dealStage) || DEAL_STAGE_FOLLOWUP_GROUPS[0];

export const getDealFollowUpOption = (dealStage, optionKey) => {
  const group = getDealStageGroup(dealStage);
  return group.options.find((o) => o.key === optionKey);
};

export const normalizeDealStageForFollowup = (stage) => normalizeDealStage(stage);

export const normalizeDealFollowupStatus = (status) => {
  if (status === 'pending') return 'scheduled';
  if (status === 'missed') return 'overdue';
  return status || 'scheduled';
};

export const getDealStageStyle = (dealStage) => {
  const stage = DEAL_PIPELINE_STAGES.find((s) => s.key === dealStage);
  return stage || DEAL_PIPELINE_STAGES[0];
};
