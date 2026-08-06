import {
  FOLLOWUP_TYPES,
  FOLLOWUP_STATUSES,
  LEAD_STATUS_FOLLOWUP_GROUPS,
  FOLLOWUP_TYPE_LABELS,
  FOLLOWUP_STATUS_LABELS,
  FOLLOWUP_OPTION_LABELS,
} from './leadFollowups';
import {
  DEAL_FOLLOWUP_STATUSES,
  DEAL_STAGE_FOLLOWUP_GROUPS,
  DEAL_FOLLOWUP_OUTCOMES,
  DEAL_FOLLOWUP_STATUS_LABELS,
  DEAL_FOLLOWUP_OPTION_LABELS,
  DEAL_FOLLOWUP_OUTCOME_LABELS,
} from './dealFollowups';

export const WORKFLOW_STAGES = [
  { key: 'all', label: 'All' },
  { key: 'lead', label: 'Leads' },
  { key: 'deal', label: 'Deals' },
  { key: 'customer', label: 'Customers' },
];

export { FOLLOWUP_TYPES, FOLLOWUP_STATUSES, LEAD_STATUS_FOLLOWUP_GROUPS };
export {
  DEAL_FOLLOWUP_STATUSES,
  DEAL_STAGE_FOLLOWUP_GROUPS,
  DEAL_FOLLOWUP_OUTCOMES,
};

export const FOLLOWUP_PRIORITIES = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
];

export const ACTIVITY_TYPES = [
  { key: 'call', label: 'Call' },
  { key: 'email', label: 'Email' },
  { key: 'chat', label: 'Chat' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'note', label: 'Note' },
  { key: 'task', label: 'Task' },
];

export const WORKFLOW_STAGE_LABELS = {
  lead: 'Lead',
  deal: 'Deal',
  customer: 'Customer',
};

export const ACTIVITY_TYPE_LABELS = {
  ...Object.fromEntries(ACTIVITY_TYPES.map((t) => [t.key, t.label])),
  ...FOLLOWUP_TYPE_LABELS,
};

export const FOLLOWUP_STATUS_LABELS_MAP = {
  ...FOLLOWUP_STATUS_LABELS,
  ...DEAL_FOLLOWUP_STATUS_LABELS,
};
export const FOLLOWUP_OPTION_LABELS_MAP = {
  ...FOLLOWUP_OPTION_LABELS,
  ...DEAL_FOLLOWUP_OPTION_LABELS,
};
export const FOLLOWUP_OUTCOME_LABELS_MAP = DEAL_FOLLOWUP_OUTCOME_LABELS;

export const defaultFollowUpForm = () => {
  const scheduled = new Date();
  scheduled.setDate(scheduled.getDate() + 1);
  scheduled.setMinutes(0, 0, 0);
  return {
    activityType: 'phone_call',
    leadStatus: 'new',
    dealStage: 'deal_created',
    followUpOption: '',
    followUpOutcome: '',
    status: 'scheduled',
    title: '',
    notes: '',
    scheduledAt: scheduled.toISOString().slice(0, 16),
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactAlternatePhone: '',
    contactWebsite: '',
    contactTitle: '',
    contactIndustry: '',
    company: '',
    meetingLink: '',
    duration: 30,
    priority: 'medium',
    workflowStage: 'lead',
    lead: '',
    deal: '',
    customer: '',
    assignedTo: '',
  };
};
