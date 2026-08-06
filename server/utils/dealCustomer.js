import Deal from '../models/Deal.js';
import Lead from '../models/Lead.js';
import Customer from '../models/Customer.js';
import { applyDealStage, normalizeDealStage } from './dealStatus.js';
import { linkFollowupsDealToCustomer, syncFollowUpForCustomer } from './followupSync.js';
import { linkQuotationsToCustomer } from './dealQuotation.js';

/**
 * Create or return the customer linked to a deal (used by convert API and pipeline drag).
 */
export async function ensureCustomerFromDeal(deal, userId, { body = {} } = {}) {
  const dealId = deal._id || deal;
  const populated = await Deal.findById(dealId).populate('lead').populate('customer');

  if (!populated) {
    throw new Error('Deal not found');
  }

  if (populated.customer) {
    const customerId = populated.customer._id || populated.customer;
    const customer = await Customer.findById(customerId);
    if (normalizeDealStage(populated.stage) !== 'converted_to_customer') {
      applyDealStage(populated, 'converted_to_customer');
      await populated.save();
    }
    if (populated.lead) {
      await Deal.updateMany(
        { lead: populated.lead, customer: { $in: [null, undefined] } },
        { $set: { customer: customerId } },
      );
      await linkQuotationsToCustomer(populated._id, customerId, populated.lead);
    }
    return { customer, deal: populated, created: false };
  }

  const lead = populated.lead;
  let customer;

  if (lead) {
    const noteParts = [
      body.notes,
      !body.notes && lead.notes,
      !body.notes && lead.description,
      !body.notes && lead.interestedService && `Service: ${lead.interestedService}`,
    ].filter(Boolean);
    customer = await Customer.create({
      firstName: body.firstName || lead.firstName,
      lastName: body.lastName || lead.lastName,
      email: body.email || lead.email,
      phone: body.phone || lead.phone || '',
      title: body.title || lead.title || '',
      companyName: body.companyName || lead.company || '',
      assignedTo: body.assignedTo || lead.assignedTo || populated.assignedTo || userId,
      createdBy: userId,
      leadRef: lead._id,
      lifetimeValue: body.lifetimeValue ?? populated.value ?? lead.value ?? 0,
      status: body.status || 'active',
      notes: noteParts.length ? noteParts.join('\n') : undefined,
      ...(body.address && Object.keys(body.address).length ? { address: body.address } : {}),
    });
    await Lead.findByIdAndUpdate(lead._id, {
      status: 'won',
      workflowStage: 'customer_created',
      convertedToCustomer: customer._id,
    });
  } else {
    customer = await Customer.create({
      firstName: body.firstName || 'Customer',
      lastName: body.lastName || populated.title,
      email: body.email || `deal-${populated._id}@mythisoft.local`,
      phone: body.phone || '',
      title: body.title || '',
      companyName: body.companyName || '',
      assignedTo: body.assignedTo || populated.assignedTo || userId,
      createdBy: userId,
      lifetimeValue: body.lifetimeValue ?? populated.value ?? 0,
      status: body.status || 'active',
      notes: body.notes || undefined,
      ...(body.address && Object.keys(body.address).length ? { address: body.address } : {}),
    });
  }

  populated.customer = customer._id;
  applyDealStage(populated, 'converted_to_customer');
  await populated.save();

  // Ensure all deals for the same lead are linked to this customer
  if (lead?._id) {
    await Deal.updateMany(
      { lead: lead._id, customer: { $in: [null, undefined] } },
      { $set: { customer: customer._id } },
    );
  }

  await linkFollowupsDealToCustomer(populated._id, customer._id);
  await linkQuotationsToCustomer(populated._id, customer._id, lead?._id);
  await syncFollowUpForCustomer(customer, userId, populated._id, lead?._id);

  return { customer, deal: populated, created: true };
}
