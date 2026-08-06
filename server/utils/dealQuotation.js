import Deal from '../models/Deal.js';
import Quotation from '../models/Quotation.js';
import { logActivity } from '../controllers/authController.js';
import { normalizeDealStage } from './dealStatus.js';

const buildItemsFromDeal = (deal) => {
  if (deal.projectRequirements?.name) {
    const amount = deal.projectRequirements.estimatedBudget || deal.value || 0;
    return [{
      description: deal.projectRequirements.name,
      quantity: 1,
      unitPrice: amount,
      total: amount,
    }];
  }

  const value = deal.value || 0;
  return [{
    description: deal.title,
    quantity: 1,
    unitPrice: value,
    total: value,
  }];
};

const calcTotals = (items) => {
  const subtotal = items.reduce((sum, line) => sum + (line.total || 0), 0);
  return { subtotal, tax: 0, total: subtotal };
};

/**
 * Create or update quotation when deal reaches quotation_sent (pipeline drag / stage update).
 */
export async function ensureQuotationFromDeal(deal, userId) {
  const dealId = deal._id || deal;
  const populated = await Deal.findById(dealId)
    .populate('lead')
    .populate('customer');

  if (!populated) {
    throw new Error('Deal not found');
  }

  const items = buildItemsFromDeal(populated);
  const { subtotal, tax, total } = calcTotals(items);
  const customerId = populated.customer?._id || populated.customer || undefined;
  const leadId = populated.lead?._id || populated.lead || undefined;

  let quotation = await Quotation.findOne({ deal: populated._id });
  let created = false;

  if (quotation) {
    quotation.items = items;
    quotation.subtotal = subtotal;
    quotation.tax = tax;
    quotation.total = total;
    quotation.status = 'sent';
    if (customerId) quotation.customer = customerId;
    if (leadId) quotation.lead = leadId;
    await quotation.save();
  } else {
    quotation = await Quotation.create({
      title: `Quotation — ${populated.title}`,
      deal: populated._id,
      customer: customerId,
      lead: leadId,
      items,
      subtotal,
      tax,
      total,
      status: 'sent',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: userId,
    });
    created = true;
    await logActivity(
      userId,
      'quotation',
      `Quotation created from deal: ${quotation.quotationNumber}`,
      { type: 'quotation', id: quotation._id },
    );
  }

  return { quotation, created };
}

export async function linkQuotationsToCustomer(dealId, customerId, leadId) {
  const filter = { $or: [{ deal: dealId }] };
  if (leadId) filter.$or.push({ lead: leadId });
  await Quotation.updateMany(filter, { $set: { customer: customerId } });
}

export async function syncQuotationOnDealStage(deal, userId) {
  if (normalizeDealStage(deal.stage) !== 'quotation_sent') return null;
  return ensureQuotationFromDeal(deal, userId);
}
