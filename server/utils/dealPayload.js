export const DEAL_TYPES = ['project'];

export const prepareDealPayload = (body = {}) => {
  const payload = { ...body, dealType: 'project' };

  if (!payload.projectRequirements?.name?.trim()) {
    const err = new Error('Project name is required for project deals');
    err.statusCode = 400;
    throw err;
  }

  delete payload.productItems;
  return payload;
};

export const prepareDealUpdatePayload = (existing, body = {}) => {
  const existingDoc = existing?.toObject ? existing.toObject() : { ...existing };
  const merged = {
    dealType: 'project',
    title: existingDoc.title,
    value: existingDoc.value,
    probability: existingDoc.probability,
    description: existingDoc.description,
    expectedCloseDate: existingDoc.expectedCloseDate,
    assignedManager: existingDoc.assignedManager,
    assignedTo: existingDoc.assignedTo,
    projectRequirements: existingDoc.projectRequirements,
    ...body,
  };
  return prepareDealPayload(merged);
};
