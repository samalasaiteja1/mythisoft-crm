import Followup from '../models/Followup.js';
import Task from '../models/Task.js';
import Communication from '../models/Communication.js';
import Meeting from '../models/Meeting.js';
import { normalizeLeadStatusForFollowup } from '../constants/followupTypes.js';
import { normalizeDealStageForFollowup } from '../constants/dealFollowupTypes.js';

const ACTIVE_STATUSES = ['scheduled', 'pending', 'rescheduled'];

export const defaultFollowUpDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
};

export const contactFromLead = (lead) => ({
  contactName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
  contactEmail: lead.email,
  contactPhone: lead.phone || '',
  contactAlternatePhone: lead.alternatePhone || '',
  contactWebsite: lead.website || '',
  contactTitle: lead.title || '',
  contactIndustry: lead.industry || '',
  company: lead.company,
});

const buildLeadFollowUpNotes = (lead) => {
  const parts = [];
  if (lead.company) parts.push(`Company: ${lead.company}`);
  if (lead.interestedService) parts.push(`Interested in: ${lead.interestedService}`);
  if (lead.description) parts.push(lead.description);
  if (lead.notes) parts.push(lead.notes);
  return parts.filter(Boolean).join('\n') || undefined;
};

/** Create or refresh a pending lead follow-up using the lead's contact info */
export async function ensureLeadFollowUpFromContact(lead, userId, options = {}) {
  if (!lead?.email) return null;

  const contact = contactFromLead(lead);
  const scheduledAt = options.scheduledAt || lead.nextFollowUp || defaultFollowUpDate();
  const assignee = options.assignedTo || lead.assignedTo || userId;
  const title = options.title || `Follow up: ${lead.firstName} ${lead.lastName}`;
  const notes = options.notes || buildLeadFollowUpNotes(lead);
  const activityType = options.activityType || 'phone_call';
  const leadStatus = options.leadStatus || normalizeLeadStatusForFollowup(lead.status);
  const followUpOption = options.followUpOption || 'first_call';

  const existing = await Followup.findOne({ lead: lead._id, status: { $in: ACTIVE_STATUSES } });
  if (existing) {
    Object.assign(existing, {
      ...contact,
      workflowStage: 'lead',
      activityType: existing.activityType || activityType,
      leadStatus: existing.leadStatus || leadStatus,
      followUpOption: existing.followUpOption || followUpOption,
      title: existing.title || title,
      notes: existing.notes || notes,
      scheduledAt: existing.scheduledAt || scheduledAt,
      assignedTo: existing.assignedTo || assignee,
      priority: lead.priority || existing.priority || 'medium',
    });
    await existing.save();
    return existing;
  }

  return createFollowUpRecord({
    workflowStage: 'lead',
    activityType,
    leadStatus,
    followUpOption,
    title,
    notes,
    scheduledAt,
    assignedTo: assignee,
    createdBy: userId,
    lead: lead._id,
    contact,
    priority: lead.priority || 'medium',
    status: 'scheduled',
  });
}

/** Keep pending follow-up contact fields in sync when lead contact changes */
export async function syncLeadContactToPendingFollowups(lead) {
  if (!lead?._id) return;
  const contact = contactFromLead(lead);
  await Followup.updateMany(
    { lead: lead._id, status: { $in: ACTIVE_STATUSES } },
    { $set: { ...contact, title: `Follow up: ${lead.firstName} ${lead.lastName}` } },
  );
}

export const contactFromDeal = (deal, lead) => {
  if (lead) return contactFromLead(lead);
  const customer = deal.customer;
  if (customer && typeof customer === 'object') {
    return {
      contactName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      contactEmail: customer.email,
      contactPhone: customer.phone,
      company: customer.company?.name || customer.company,
    };
  }
  return { contactName: deal.title, company: deal.title };
};

export const contactFromCustomer = (customer) => ({
  contactName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
  contactEmail: customer.email,
  contactPhone: customer.phone,
  contactTitle: customer.title,
  company: customer.companyName || customer.company?.name || customer.company,
});

export async function createFollowUpRecord({
  workflowStage,
  activityType = 'general',
  leadStatus,
  dealStage,
  followUpOption,
  title,
  notes,
  scheduledAt,
  assignedTo,
  createdBy,
  lead,
  deal,
  customer,
  project,
  contact,
  priority = 'medium',
  meetingLink,
  duration,
  status = 'scheduled',
  outcome,
}) {
  return Followup.create({
    workflowStage,
    activityType,
    leadStatus,
    dealStage,
    followUpOption,
    title,
    notes,
    scheduledAt: scheduledAt || defaultFollowUpDate(),
    assignedTo,
    createdBy,
    lead,
    deal,
    customer,
    project,
    priority,
    meetingLink,
    duration,
    status,
    outcome,
    ...contact,
  });
}

export async function syncFollowUpForLead(lead, userId, updates = {}) {
  if (updates.status !== 'follow_up' && lead.status !== 'follow_up') return updates;

  const scheduledAt = updates.nextFollowUp || lead.nextFollowUp || defaultFollowUpDate();
  if (!updates.nextFollowUp) updates.nextFollowUp = scheduledAt;

  await ensureLeadFollowUpFromContact(lead, userId, {
    scheduledAt,
    activityType: 'task',
  });

  const assignee = updates.assignedTo || lead.assignedTo || userId;
  const title = `Follow up: ${lead.firstName} ${lead.lastName}`;

  const existingTask = await Task.findOne({
    'relatedTo.type': 'lead',
    'relatedTo.id': lead._id,
    status: { $in: ['pending', 'in_progress'] },
  });
  if (!existingTask) {
    await Task.create({
      title,
      description: `Follow up with ${lead.company || lead.email}`,
      priority: lead.priority === 'urgent' ? 'urgent' : 'medium',
      status: 'pending',
      dueDate: scheduledAt,
      assignedTo: assignee,
      createdBy: userId,
      relatedTo: { type: 'lead', id: lead._id },
    });
  }

  return updates;
}

export async function completeFollowUpForLead(leadId) {
  await Followup.updateMany(
    { lead: leadId, status: { $in: ACTIVE_STATUSES } },
    { status: 'completed', completedAt: new Date() },
  );
  await Task.updateMany(
    { 'relatedTo.type': 'lead', 'relatedTo.id': leadId, status: { $in: ['pending', 'in_progress'] } },
    { status: 'completed' },
  );
}

export async function syncFollowUpForDeal(deal, userId, leadDoc = null) {
  const scheduledAt = deal.expectedCloseDate || defaultFollowUpDate();
  const assignee = deal.assignedTo || userId;
  const contact = contactFromDeal(deal, leadDoc);
  const title = `Deal follow-up: ${deal.title}`;

  const existing = await Followup.findOne({ deal: deal._id, status: { $in: ACTIVE_STATUSES } });
  if (!existing) {
    await createFollowUpRecord({
      workflowStage: 'deal',
      activityType: 'phone_call',
      dealStage: normalizeDealStageForFollowup(deal.stage),
      followUpOption: 'initial_contact',
      title,
      notes: deal.description,
      scheduledAt,
      assignedTo: assignee,
      createdBy: userId,
      lead: deal.lead,
      deal: deal._id,
      contact,
      priority: deal.projectRequirements?.priority || 'medium',
      status: 'scheduled',
    });
  }
}

export async function linkFollowupsLeadToDeal(leadId, dealId) {
  await Followup.updateMany(
    { lead: leadId, status: { $in: ACTIVE_STATUSES } },
    { deal: dealId, workflowStage: 'deal' },
  );
}

export async function syncFollowUpForCustomer(customer, userId, dealId = null, leadId = null) {
  const scheduledAt = defaultFollowUpDate();
  const assignee = customer.assignedTo || userId;
  const contact = contactFromCustomer(customer);
  const title = `Customer check-in: ${contact.contactName}`;

  const existing = await Followup.findOne({ customer: customer._id, status: { $in: ACTIVE_STATUSES } });
  if (!existing) {
    await createFollowUpRecord({
      workflowStage: 'customer',
      activityType: 'phone_call',
      title,
      notes: 'Post-conversion customer follow-up',
      scheduledAt,
      assignedTo: assignee,
      createdBy: userId,
      lead: leadId,
      deal: dealId,
      customer: customer._id,
      contact,
      priority: 'medium',
    });
  }
}

export async function linkFollowupsDealToCustomer(dealId, customerId) {
  await Followup.updateMany(
    { deal: dealId },
    { customer: customerId, workflowStage: 'customer' },
  );
}

export async function logFollowUpCommunication(followup, userId, { type, subject, body, to }) {
  return Communication.create({
    type,
    subject,
    body,
    to: to || followup.contactEmail,
    from: String(userId),
    user: userId,
    status: 'sent',
    relatedTo: {
      type: followup.deal ? 'deal' : followup.lead ? 'lead' : 'customer',
      id: followup.deal || followup.lead || followup.customer,
    },
  });
}

export async function scheduleFollowUpMeeting(followup, userId, data = {}) {
  return Meeting.create({
    title: data.title || followup.title,
    description: followup.notes,
    lead: followup.lead,
    deal: followup.deal,
    customer: followup.customer,
    scheduledAt: data.scheduledAt || followup.scheduledAt,
    duration: data.duration || followup.duration || 30,
    type: data.meetingType || 'video',
    location: data.meetingLink || followup.meetingLink,
    notes: followup.notes,
    assignedTo: followup.assignedTo,
    createdBy: userId,
  });
}

/** Virtual follow-up row for a customer without an active follow-up record yet */
export const buildVirtualCustomerFollowup = (customer) => {
  const contact = contactFromCustomer(customer);
  return {
    _id: `customer-${customer._id}`,
    virtual: true,
    workflowStage: 'customer',
    activityType: 'phone_call',
    title: `Customer follow-up: ${contact.contactName}`,
    notes: customer.notes,
    scheduledAt: customer.updatedAt || customer.createdAt,
    status: 'scheduled',
    priority: 'medium',
    customer,
    assignedTo: customer.assignedTo,
    ...contact,
  };
};

/** Virtual follow-up row for a deal converted from a lead (no follow-up record yet) */
export const buildVirtualDealFollowup = (deal) => {
  const lead = deal.lead;
  const contact = contactFromDeal(deal, lead);
  return {
    _id: `deal-${deal._id}`,
    virtual: true,
    workflowStage: 'deal',
    activityType: 'phone_call',
    dealStage: normalizeDealStageForFollowup(deal.stage),
    followUpOption: 'initial_contact',
    title: `Deal follow-up: ${deal.title}`,
    notes: deal.description,
    scheduledAt: deal.expectedCloseDate || deal.createdAt,
    status: 'scheduled',
    priority: deal.projectRequirements?.priority || 'medium',
    deal,
    lead,
    assignedTo: deal.assignedTo,
    ...contact,
  };
};
