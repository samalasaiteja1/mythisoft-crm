/** Whether the project was delivered to the customer (awaiting or completed acceptance). */
export function isAwaitingCustomerAcceptance(project) {
  if (!project) return false;
  if (project.deliveryChecklist?.clientAcceptance) return false;
  if (project.supportHandoffAt) return true;
  if (['in_support', 'closed', 'verified', 'submitted_to_customer', 'support_active'].includes(project.supportReviewStatus)) return true;
  if (['delivered', 'support', 'completed'].includes(project.workflowStage)) return true;
  if (['delivered', 'completed'].includes(project.status)) return true;
  return false;
}

export function isCustomerAccepted(project) {
  return Boolean(project?.deliveryChecklist?.clientAcceptance);
}

/** Submitted to customer and waiting for acceptance (Support Manager can record manually). */
export function isPendingCustomerAcceptance(project) {
  if (!project || isCustomerAccepted(project)) return false;
  return project.supportReviewStatus === 'submitted_to_customer' || Boolean(project.submittedToCustomerAt);
}

export function customerAcceptanceDate(project) {
  return project?.deliveryChecklist?.clientAcceptanceAt || null;
}

export function customerAcceptanceNotes(project) {
  return project?.deliveryChecklist?.clientAcceptanceNotes?.trim() || '';
}
