export function contactFromLead(lead) {
  if (!lead) return null;
  return {
    firstName: lead.firstName || '',
    lastName: lead.lastName || '',
    email: lead.email || '',
    phone: lead.phone || '',
    alternatePhone: lead.alternatePhone || '',
    website: lead.website || '',
    company: lead.company || '',
    title: lead.title || '',
    industry: lead.industry || '',
  };
}

export function contactFromDeal(deal) {
  if (!deal) return null;
  const customer = deal.customer;
  const lead = deal.lead;
  const contact = {
    firstName: customer?.firstName || lead?.firstName || '',
    lastName: customer?.lastName || lead?.lastName || '',
    email: customer?.email || lead?.email || '',
    phone: customer?.phone || lead?.phone || '',
    alternatePhone: lead?.alternatePhone || '',
    website: lead?.website || '',
    company: customer?.companyName || lead?.company || '',
    title: customer?.title || lead?.title || '',
    industry: lead?.industry || '',
    customerId: customer?._id || customer || null,
  };
  return contact;
}

export function hasPipelineContact(contact) {
  if (!contact) return false;
  return Boolean(
    contact.firstName
    || contact.lastName
    || contact.email
    || contact.phone
    || contact.alternatePhone
    || contact.company
    || contact.title
    || contact.industry
    || contact.website,
  );
}

export function formatContactName(contact) {
  return `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim();
}
