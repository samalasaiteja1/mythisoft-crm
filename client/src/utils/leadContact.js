/** Map lead record fields into follow-up contact + defaults */
export function mapLeadToFollowUpContact(lead) {
  if (!lead) return {};
  const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
  return {
    contactName: name,
    contactEmail: lead.email || '',
    contactPhone: lead.phone || '',
    contactAlternatePhone: lead.alternatePhone || '',
    contactWebsite: lead.website || '',
    contactTitle: lead.title || '',
    contactIndustry: lead.industry || '',
    company: lead.company || '',
    priority: lead.priority || 'medium',
    assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
    title: name ? `Follow up: ${name}` : '',
    notes: lead.interestedService ? `Interested in: ${lead.interestedService}` : '',
  };
}

export function unwrapLeadResponse(data) {
  return data?.lead || data;
}
