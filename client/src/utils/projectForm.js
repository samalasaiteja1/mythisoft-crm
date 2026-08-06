import { emptyProjectTeam, parseTechStack } from './customerForm';

export const emptyProjectForm = {
  customer: '',
  name: '',
  category: '',
  description: '',
  scope: '',
  deliverables: '',
  technologyStack: '',
  priority: 'medium',
  status: 'planning',
  budget: 0,
  startDate: '',
  endDate: '',
  projectTeam: { ...emptyProjectTeam },
};

export const hasProjectTeamData = (form) => {
  const team = form?.projectTeam || {};
  return Boolean(team.manager || (team.assignedTo || []).length);
};

export const isProjectTeamComplete = (form) => {
  const team = form?.projectTeam || {};
  return Boolean(team.manager && (team.assignedTo || []).length);
};

export const buildProjectCreatePayload = (form) => {
  const team = form.projectTeam || {};
  return {
    customer: form.customer,
    name: form.name?.trim(),
    category: form.category || undefined,
    description: form.description?.trim() || undefined,
    scope: form.scope?.trim() || undefined,
    deliverables: form.deliverables?.trim() || undefined,
    technologyStack: parseTechStack(form.technologyStack),
    priority: form.priority || 'medium',
    status: form.status || 'planning',
    budget: Number(form.budget) || 0,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    workflowStage: 'project_started',
    manager: team.manager || undefined,
    assignedTo: team.assignedTo || [],
  };
};
