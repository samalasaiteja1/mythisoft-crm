/** CRM lifecycle — single source of truth for workflow stages */

export const LEAD_WORKFLOW_STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'interested', label: 'Interested' },
  { key: 'not_interested', label: 'Not Interested' },
  { key: 'qualified', label: 'Qualified' },
];

export const DEAL_STAGES_ORDER = [
  'deal_created', 'discovery', 'requirement_gathering',
  'proposal_sent', 'quotation_sent', 'negotiation', 'customer_approval',
  'contract_signed', 'advance_payment_received', 'won', 'converted_to_customer',
];

export const PROJECT_WORKFLOW_STAGES = [
  { key: 'project_started', label: 'Project Started' },
  { key: 'development', label: 'Development' },
  { key: 'testing', label: 'Testing' },
  { key: 'deployment', label: 'Deployment' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'support', label: 'Support' },
  { key: 'completed', label: 'Completed' },
];

export const TICKET_WORKFLOW_STAGES = [
  { key: 'open', label: 'Open' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'working', label: 'Working' },
  { key: 'waiting_customer', label: 'Waiting Customer' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

export const DEAL_CREATION_STEPS = [
  { key: 'lead', label: 'Lead Qualified' },
  { key: 'deal', label: 'Deal Details' },
  { key: 'delivery', label: 'Delivery Plan' },
];

export const getDealCreationSteps = () => (
  DEAL_CREATION_STEPS.map((step) => (
    step.key === 'delivery' ? { ...step, label: 'Project Requirements' } : step
  ))
);

export const CRM_WORKFLOW_PHASES = [
  { phase: 'Setup', roles: ['admin'], path: '/users', label: 'Admin configures CRM & users' },
  { phase: 'Lead', roles: ['admin', 'manager', 'sales'], path: '/leads', label: 'Lead created & assigned' },
  { phase: 'Qualify', roles: ['sales', 'manager'], path: '/qualified-leads', label: 'Sales qualifies lead' },
  { phase: 'Deal', roles: ['sales', 'manager'], path: '/deals', label: 'Deal pipeline' },
  { phase: 'Customer', roles: ['sales', 'admin'], path: '/customers/all', label: 'Won deal → customer' },
  { phase: 'Project', roles: ['admin', 'manager', 'technical'], path: '/projects', label: 'Project delivery' },
  { phase: 'Support', roles: ['support', 'manager', 'technical'], path: '/projects/support-review', label: 'Support review & tickets' },
];

export const getStageIndex = (stages, current) => {
  const idx = stages.findIndex((s) => s.key === current);
  return idx >= 0 ? idx : 0;
};

export const getNextProjectStage = (current) => {
  const idx = PROJECT_WORKFLOW_STAGES.findIndex((s) => s.key === current);
  return idx >= 0 && idx < PROJECT_WORKFLOW_STAGES.length - 1
    ? PROJECT_WORKFLOW_STAGES[idx + 1].key
    : null;
};
