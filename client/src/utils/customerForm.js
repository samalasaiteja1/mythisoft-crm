import { DEAL_STAGES, normalizeDealStage } from '../constants/dealPipeline';

const stageLabel = (stage) => {
  const key = normalizeDealStage(stage);
  return DEAL_STAGES[key]?.label || key.replace(/_/g, ' ');
};

const buildDealNotes = (deal, lead) => {
  const stage = stageLabel(deal?.stage).toLowerCase();
  if (!lead && !deal?.contact) {
    if (deal?.description?.trim()) return deal.description.trim();
    const dealKind = 'project';
    return `Standalone ${dealKind} in ${stage}`;
  }
  const extra = [
    lead?.notes,
    lead?.description,
    lead?.interestedService && `Service: ${lead.interestedService}`,
    deal?.description,
  ].filter(Boolean);
  if (extra.length) return extra.join('\n');
  return `Converted from deal: ${deal?.title || 'Deal'} (${stageLabel(deal?.stage)})`;
};

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
  status: 'planning',
};

const formatDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

export const emptyProjectTeam = {
  manager: '',
  assignedTo: [],
  memberRoles: {},
};

export const emptyCustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyName: '',
  title: '',
  status: 'active',
  notes: '',
  assignedTo: '',
  address: {
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  },
  projectRequirements: { ...emptyProjectReqs },
  projectTeam: { ...emptyProjectTeam },
};

export const parseTechStack = (value) => (
  typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : Array.isArray(value) ? value : []
);

export const hasProjectRequirementsData = (form) => {
  const pr = form?.projectRequirements || {};
  return Boolean(
    pr.name
    || pr.category
    || pr.description
    || pr.scope
    || pr.deliverables
    || parseTechStack(pr.technologyStack).length
    || pr.estimatedBudget
    || pr.startDate
    || pr.endDate,
  );
};

export const hasProjectTeamData = (form) => {
  const team = form?.projectTeam || {};
  return Boolean(team.manager || (team.assignedTo || []).length);
};

export const isProjectTeamComplete = (form) => {
  const team = form?.projectTeam || {};
  return Boolean(team.manager && (team.assignedTo || []).length);
};

export const shouldCreateProjectForCustomer = (form, requirementsDocument) => (
  hasProjectRequirementsData(form) || hasProjectTeamData(form) || Boolean(requirementsDocument)
);

export const buildProjectPayloadFromCustomerForm = (form, { customerId, dealId, dealValue, sourceRequirements } = {}) => {
  const formPr = form.projectRequirements || {};
  const dealPr = sourceRequirements || {};
  const category = formPr.category || dealPr.category?._id || dealPr.category;
  const techFromDeal = Array.isArray(dealPr.technologyStack) ? dealPr.technologyStack : [];
  const techFromForm = parseTechStack(formPr.technologyStack);
  const pr = {
    name: formPr.name || dealPr.name,
    description: formPr.description || dealPr.description,
    scope: formPr.scope || dealPr.scope,
    deliverables: formPr.deliverables || dealPr.deliverables,
    category,
    technologyStack: techFromForm.length ? techFromForm : techFromDeal,
    startDate: formPr.startDate || dealPr.startDate,
    endDate: formPr.endDate || dealPr.endDate,
    priority: formPr.priority || dealPr.priority || 'medium',
    estimatedBudget: formPr.estimatedBudget || dealPr.estimatedBudget,
  };
  const team = form.projectTeam || {};
  return {
    name: pr.name || `${form.firstName || 'Customer'} ${form.lastName || ''} Project`.trim(),
    description: pr.description,
    scope: pr.scope,
    deliverables: pr.deliverables,
    category: pr.category || undefined,
    technologyStack: pr.technologyStack,
    startDate: pr.startDate || undefined,
    endDate: pr.endDate || undefined,
    priority: pr.priority || 'medium',
    budget: Number(pr.estimatedBudget) || Number(dealValue) || 0,
    status: formPr.status || dealPr.status || 'planning',
    workflowStage: 'project_started',
    customer: customerId,
    deal: dealId || undefined,
    manager: team.manager || undefined,
    assignedTo: team.assignedTo || [],
    memberRoleLabels: team.memberRoles || undefined,
  };
};

export const formFromCustomer = (customer) => ({
  ...emptyCustomerForm,
  firstName: customer.firstName || '',
  lastName: customer.lastName || '',
  email: customer.email || '',
  phone: customer.phone || '',
  companyName: customer.companyName || customer.company?.name || '',
  title: customer.title || '',
  status: customer.status || 'active',
  notes: customer.notes || '',
  assignedTo: customer.assignedTo?._id || customer.assignedTo || '',
  address: { ...emptyCustomerForm.address, ...(customer.address || {}) },
});

export const formFromDeal = (deal) => {
  const lead = deal?.lead && typeof deal.lead === 'object' ? deal.lead : null;
  const contact = deal?.contact && typeof deal.contact === 'object' ? deal.contact : null;
  const companyName = lead?.company || deal.company?.name || '';

  const firstName = lead?.firstName || contact?.firstName || '';
  const lastName = lead?.lastName || contact?.lastName || '';
  const email = lead?.email || contact?.email || '';
  const phone = lead?.phone || lead?.alternatePhone || contact?.phone || contact?.mobile || '';
  const title = lead?.title || contact?.title || '';

  const hasLeadOrContact = Boolean(lead || contact);
  const notes = buildDealNotes(deal, lead);

  return {
    ...emptyCustomerForm,
    firstName: firstName || (hasLeadOrContact ? '' : 'Customer'),
    lastName: lastName || (hasLeadOrContact ? '' : deal?.title || 'Deal'),
    email: email || (hasLeadOrContact ? '' : `deal-${deal?._id || 'new'}@mythisoft.local`),
    phone,
    companyName,
    title,
    status: 'active',
    notes,
    assignedTo: '',
    projectRequirements: {
      name: deal?.projectRequirements?.name || '',
      category: deal?.projectRequirements?.category?._id || deal?.projectRequirements?.category || '',
      description: deal?.projectRequirements?.description || '',
      scope: deal?.projectRequirements?.scope || '',
      deliverables: deal?.projectRequirements?.deliverables || '',
      technologyStack: Array.isArray(deal?.projectRequirements?.technologyStack) ? deal.projectRequirements.technologyStack.join(', ') : (deal?.projectRequirements?.technologyStack || ''),
      startDate: formatDateInput(deal?.projectRequirements?.startDate),
      endDate: formatDateInput(deal?.projectRequirements?.endDate),
      priority: deal?.projectRequirements?.priority || 'medium',
      estimatedBudget: deal?.projectRequirements?.estimatedBudget || 0,
      status: 'planning',
    },
  };
};

export const hasDealContactInfo = (deal) => {
  const form = formFromDeal(deal);
  return Boolean(
    (form.firstName && form.firstName !== 'Customer')
    || form.email
    || form.phone
    || form.companyName,
  );
};

export const buildCustomerPayload = (form) => {
  const payload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone?.trim() || undefined,
    companyName: form.companyName?.trim() || undefined,
    title: form.title?.trim() || undefined,
    status: form.status,
    notes: form.notes?.trim() || undefined,
  };

  if (form.assignedTo) payload.assignedTo = form.assignedTo;

  const address = Object.fromEntries(
    Object.entries(form.address || {})
      .map(([key, value]) => [key, value?.trim() || ''])
      .filter(([, value]) => value),
  );
  if (Object.keys(address).length) payload.address = address;

  const pr = form.projectRequirements || {};
  const hasReq = hasProjectRequirementsData(form);
  if (hasReq) {
    payload.projectRequirements = {
      name: pr.name || undefined,
      category: pr.category || undefined,
      description: pr.description || undefined,
      scope: pr.scope || undefined,
      deliverables: pr.deliverables || undefined,
      technologyStack: parseTechStack(pr.technologyStack),
      startDate: pr.startDate || undefined,
      endDate: pr.endDate || undefined,
      priority: pr.priority || 'medium',
      estimatedBudget: Number(pr.estimatedBudget) || 0,
    };
  }

  return payload;
};
