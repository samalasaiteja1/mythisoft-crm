export const emptyProjectReqs = {
  name: '',
  category: '',
  description: '',
  scope: '',
  deliverables: '',
  technologyStack: '',
  startDate: '',
  endDate: '',
  priority: 'medium',
  estimatedBudget: 0,
};

export const emptyDealForm = {
  dealType: 'project',
  title: '',
  value: 0,
  probability: 25,
  description: '',
  expectedCloseDate: '',
  assignedManager: '',
  assignedTo: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  alternatePhone: '',
  website: '',
  companyName: '',
  contactTitle: '',
  industry: '',
  projectRequirements: { ...emptyProjectReqs },
};

const parseTechStack = (value) => (
  typeof value === 'string'
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : Array.isArray(value) ? value : []
);

const formatDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

export const buildFormFromLead = (lead) => ({
  dealType: 'project',
  title: `${lead.company || `${lead.firstName} ${lead.lastName}`.trim()} - Deal`,
  value: lead.budget || lead.value || 0,
  probability: lead.qualification?.probability || lead.score || 25,
  description: lead.description || lead.notes || '',
  expectedCloseDate: '',
  assignedManager: lead.assignedManager?._id || lead.assignedManager || '',
  assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
  firstName: lead.firstName || '',
  lastName: lead.lastName || '',
  email: lead.email || '',
  phone: lead.phone || '',
  alternatePhone: lead.alternatePhone || '',
  website: lead.website || '',
  companyName: lead.company || '',
  contactTitle: lead.title || '',
  industry: lead.industry || '',
  projectRequirements: {
    name: `${lead.company || `${lead.firstName} ${lead.lastName}`.trim()} Project`,
    category: '',
    description: lead.description || lead.qualification?.requirements || '',
    scope: lead.interestedService || lead.qualification?.requirements || '',
    deliverables: '',
    technologyStack: '',
    startDate: '',
    endDate: '',
    priority: lead.priority || 'medium',
    estimatedBudget: lead.budget || lead.value || 0,
  },
});

export const buildFormFromCustomer = (customer) => ({
  dealType: 'project',
  title: `${customer.companyName || `${customer.firstName} ${customer.lastName}`.trim()} - Deal`,
  value: 0,
  probability: 25,
  description: '',
  expectedCloseDate: '',
  assignedManager: '',
  assignedTo: customer.assignedTo?._id || customer.assignedTo || '',
  firstName: customer.firstName || '',
  lastName: customer.lastName || '',
  email: customer.email || '',
  phone: customer.phone || '',
  alternatePhone: '',
  website: customer.website || '',
  companyName: customer.companyName || '',
  contactTitle: customer.title || '',
  industry: customer.industry || '',
  projectRequirements: { ...emptyProjectReqs },
});

export const buildFormFromDeal = (deal) => ({
  dealType: 'project',
  title: deal.title || '',
  value: deal.value || 0,
  probability: deal.probability ?? 25,
  description: deal.description || '',
  expectedCloseDate: formatDateInput(deal.expectedCloseDate),
  assignedManager: deal.assignedManager?._id || deal.assignedManager || deal.lead?.assignedManager?._id || deal.lead?.assignedManager || '',
  assignedTo: deal.assignedTo?._id || deal.assignedTo || '',
  firstName: deal.firstName || '',
  lastName: deal.lastName || '',
  email: deal.email || '',
  phone: deal.phone || '',
  alternatePhone: deal.alternatePhone || '',
  website: deal.website || '',
  companyName: deal.companyName || '',
  contactTitle: deal.contactTitle || '',
  industry: deal.industry || '',
  projectRequirements: {
    name: deal.projectRequirements?.name || '',
    category: deal.projectRequirements?.category?._id || deal.projectRequirements?.category || '',
    description: deal.projectRequirements?.description || '',
    scope: deal.projectRequirements?.scope || '',
    deliverables: deal.projectRequirements?.deliverables || '',
    technologyStack: (deal.projectRequirements?.technologyStack || []).join(', '),
    startDate: formatDateInput(deal.projectRequirements?.startDate),
    endDate: formatDateInput(deal.projectRequirements?.endDate),
    priority: deal.projectRequirements?.priority || 'medium',
    estimatedBudget: deal.projectRequirements?.estimatedBudget || 0,
  },
});

export const buildDealPayload = (form) => {
  const { projectRequirements, dealType, ...dealFields } = form;
  const payload = { ...dealFields, dealType: 'project' };
  if (!payload.assignedManager) delete payload.assignedManager;
  if (!payload.assignedTo) delete payload.assignedTo;
  if (!payload.expectedCloseDate) delete payload.expectedCloseDate;

  payload.projectRequirements = {
    ...projectRequirements,
    category: projectRequirements.category || undefined,
    technologyStack: parseTechStack(projectRequirements.technologyStack),
    estimatedBudget: Number(projectRequirements.estimatedBudget) || 0,
    startDate: projectRequirements.startDate || undefined,
    endDate: projectRequirements.endDate || undefined,
  };

  return payload;
};

/** Lead convert — includes manager/sales for lead update; deal assignedTo only if set */
export const buildLeadConvertPayload = (form) => {
  const payload = buildDealPayload(form);
  payload.assignedManager = form.assignedManager || '';
  payload.assignedTo = form.assignedTo || '';
  return payload;
};

export const hasProjectRequirements = (form) => Boolean(
  form?.projectRequirements?.name
  || form?.projectRequirements?.category
  || form?.projectRequirements?.description
  || form?.projectRequirements?.scope
  || form?.projectRequirements?.deliverables
  || (form?.projectRequirements?.technologyStack || '').length
  || form?.projectRequirements?.estimatedBudget
  || form?.projectRequirements?.startDate
  || form?.projectRequirements?.endDate
);

export const getDealDeliverySummary = (deal) => {
  if (deal?.projectRequirements?.name) {
    return deal.projectRequirements.name;
  }
  return 'Project deal';
};

export const validateDealForm = (form) => {
  if (!form.firstName?.trim()) return 'Contact first name is required';
  if (!form.lastName?.trim()) return 'Contact last name is required';
  if (!form.email?.trim()) return 'Contact email is required';
  if (hasProjectRequirements(form)) {
    if (!form.projectRequirements?.category) {
      return 'Project category is required';
    }
    if (!form.projectRequirements?.name?.trim()) {
      return 'Project name is required';
    }
  }
  if (!form.title?.trim()) return 'Deal title is required';
  return null;
};
