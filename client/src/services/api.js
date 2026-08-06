import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: 'Bearer ' + token };
  }
  return config;
});
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  getCustomerProfile: () => API.get('/auth/customer-profile'),
  updateCustomerProfile: (data) => API.put('/auth/customer-profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => API.put(`/auth/reset-password/${token}`, { password }),
  checkUserExists: (email) => API.get('/auth/check-user', { params: { email } }),
};

export const dashboardAPI = {
  getDashboard: () => API.get('/dashboard'),
  getActivities: (params) => API.get('/activities', { params }),
  getCommunications: (params) => API.get('/communications', { params }),
  createCommunication: (data) => API.post('/communications', data),
  getNotes: (params) => API.get('/notes', { params }),
  createNote: (data) => API.post('/notes', data),
  getNotifications: () => API.get('/notifications'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
  getReports: () => API.get('/reports'),
};

export const leadsAPI = {
  getAll: (params) => API.get('/leads', { params }),
  getOptions: (params) => API.get('/leads/options', { params }),
  getOne: (id) => API.get(`/leads/${id}`),
  create: (data) => API.post('/leads', data),
  update: (id, data) => API.put(`/leads/${id}`, data),
  delete: (id) => API.delete(`/leads/${id}`),
  convert: (id) => API.post(`/leads/${id}/convert`),
  assign: (id, data) => API.post(`/leads/${id}/assign`, data),
  assignManager: (id, data) => API.post(`/leads/${id}/assign-manager`, data),
  getSalesTeam: () => API.get('/users/sales-team'),
  qualify: (id, data) => API.post(`/leads/${id}/qualify`, data),
  convertToDeal: (id, data) => API.post(`/leads/${id}/convert-deal`, data),
  exportCsv: () => API.get('/leads/export', { responseType: 'blob' }),
  getStats: () => API.get('/leads/stats'),
};

export const customersAPI = {
  getAll: (params) => API.get('/customers', { params }),
  getOptions: (params) => API.get('/customers/options', { params }),
  getOne: (id) => API.get(`/customers/${id}`),
  create: (data) => API.post('/customers', data),
  update: (id, data) => API.put(`/customers/${id}`, data),
  delete: (id) => API.delete(`/customers/${id}`),
  getHub: (type) => API.get(`/customers/hub/${type}`),
};

export const contactsAPI = {
  getAll: (params) => API.get('/contacts', { params }),
  getOne: (id) => API.get(`/contacts/${id}`),
  create: (data) => API.post('/contacts', data),
  update: (id, data) => API.put(`/contacts/${id}`, data),
  delete: (id) => API.delete(`/contacts/${id}`),
};

export const companiesAPI = {
  getAll: (params) => API.get('/companies', { params }),
  getOne: (id) => API.get(`/companies/${id}`),
  create: (data) => API.post('/companies', data),
  update: (id, data) => API.put(`/companies/${id}`, data),
  delete: (id) => API.delete(`/companies/${id}`),
};

export const dealsAPI = {
  getAll: (params) => API.get('/deals', { params }),
  getOne: (id) => API.get(`/deals/${id}`),
  create: (data) => API.post('/deals', data),
  update: (id, data) => API.put(`/deals/${id}`, data),
  updateStage: (id, stage) => API.patch(`/deals/${id}/stage`, { stage }),
  delete: (id) => API.delete(`/deals/${id}`),
  getPipelineStats: () => API.get('/deals/pipeline/stats'),
  convertToCustomer: (id, data) => API.post(`/deals/${id}/convert-customer`, data || {}),
  createProject: (id, data) => API.post(`/deals/${id}/create-project`, data || {}),
  assignProject: (id, data) => API.post(`/deals/${id}/assign-project`, data || {}),
  assign: (id, data) => API.post(`/deals/${id}/assign`, data),
};

export const tasksAPI = {
  getAll: (params) => API.get('/tasks', { params }),
  getOne: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
  getCalendar: (params) => API.get('/tasks/calendar', { params }),
};

export const usersAPI = {
  getAll: (params) => API.get('/users', { params }),
  checkEmail: (email) => API.get('/users/check-email', { params: { email } }),
  getSalesTeam: () => API.get('/users/sales-team'),
  getManagers: () => API.get('/users/managers'),
  getOne: (id) => API.get(`/users/${id}`),
  create: (data) => API.post('/users', data),
  update: (id, data) => {
    if (data instanceof FormData) {
      return API.put(`/users/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return API.put(`/users/${id}`, data);
  },
  delete: (id) => API.delete(`/users/${id}`),
  changePassword: (id, data) => API.put(`/users/${id}/change-password`, data),
  getTeams: () => API.get('/users/teams'),
  createTeam: (data) => API.post('/users/teams', data),
  updateTeam: (id, data) => API.put(`/users/teams/${id}`, data),
  deleteTeam: (id) => API.delete(`/users/teams/${id}`),
};

export const settingsAPI = {
  get: () => API.get('/settings'),
  update: (data) => API.put('/settings', data),
  addApiKey: (name) => API.post('/settings/api-keys', { name }),
  revokeApiKey: (id) => API.delete(`/settings/api-keys/${id}`),
};

export const documentsAPI = {
  getAll: (params) => API.get('/documents', { params }),
  create: (data) => API.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => API.delete(`/documents/${id}`),
};

export const whatsappAPI = {
  getAll: (params) => API.get('/whatsapp', { params }),
  send: (data) => API.post('/whatsapp', data),
  getTemplates: () => API.get('/whatsapp/templates'),
};

export const subscriptionsAPI = {
  getAll: () => API.get('/subscriptions'),
  getStats: () => API.get('/subscriptions/stats'),
  create: (data) => API.post('/subscriptions', data),
  update: (id, data) => API.put(`/subscriptions/${id}`, data),
};

export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

import { LEAD_STATUSES } from '../constants/leadPipeline.js';

export { LEAD_STATUSES };

export const feedbackAPI = {
  getAll: () => API.get('/feedback'),
  create: (data) => API.post('/feedback', data),
  publish: (id) => API.post(`/feedback/${id}/publish`),
};

import { DEAL_STAGES } from '../constants/dealPipeline.js';

export { DEAL_STAGES };

export const PIPELINE_STAGES_CONFIG = DEAL_STAGES;

export const TASK_PRIORITIES = {
  low: { label: 'Low', color: 'bg-gray-500/20 text-gray-400' },
  medium: { label: 'Medium', color: 'bg-blue-500/20 text-blue-400' },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  urgent: { label: 'Urgent', color: 'bg-red-500/20 text-red-400' },
};

export const TASK_STATUSES = {
  new: { label: 'New', color: 'bg-gray-500/20 text-gray-300' },
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
  on_hold: { label: 'On Hold', color: 'bg-amber-500/20 text-amber-400' },
};

export const TICKET_STATUSES = {
  open: { label: 'New', color: 'bg-blue-500/20 text-blue-400' },
  reopened: { label: 'Reopened', color: 'bg-orange-500/20 text-orange-300' },
  assigned: { label: 'Assigned', color: 'bg-yellow-500/20 text-yellow-400' },
  accepted: { label: 'Accepted', color: 'bg-indigo-500/20 text-indigo-300' },
  working: { label: 'In Progress', color: 'bg-orange-500/20 text-orange-400' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500/20 text-orange-400' },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-300' },
  reviewed: { label: 'Reviewed', color: 'bg-violet-500/20 text-violet-300' },
  waiting_customer: { label: 'Awaiting Confirmation', color: 'bg-purple-500/20 text-purple-400' },
  escalated: { label: 'Escalated', color: 'bg-red-500/20 text-red-400' },
  resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-400' },
  closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-400' },
};

export const BUG_STATUSES = {
  unassigned: { label: 'Open', color: 'bg-blue-500/20 text-blue-400' },
  assigned: { label: 'Assigned', color: 'bg-yellow-500/20 text-yellow-400' },
  investigating: { label: 'Investigating', color: 'bg-purple-500/20 text-purple-400' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500/20 text-orange-400' },
  testing: { label: 'Testing', color: 'bg-indigo-500/20 text-indigo-400' },
  need_information: { label: 'Need Information', color: 'bg-gray-500/20 text-gray-400' },
  resolved: { label: 'Fixed', color: 'bg-green-500/20 text-green-400' },
  closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-400' },
};

export const TICKET_PRIORITIES = {
  low: { label: 'Low', color: 'bg-gray-500/20 text-gray-400' },
  medium: { label: 'Medium', color: 'bg-blue-500/20 text-blue-400' },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400' },
};

export const INVOICE_STATUSES = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400' },
  sent: { label: 'Sent', color: 'bg-blue-500/20 text-blue-400' },
  paid: { label: 'Paid', color: 'bg-green-500/20 text-green-400' },
  partially_paid: { label: 'Partially Paid', color: 'bg-yellow-500/20 text-yellow-400' },
  overdue: { label: 'Overdue', color: 'bg-red-500/20 text-red-400' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400' },
};

export { PROJECT_STATUSES, PROJECT_STATUS_KEYS, TECHNICAL_PROJECT_STATUSES, ACTIVE_PROJECT_STATUSES } from '../constants/projectStatuses.js';

export const QUOTATION_STATUSES = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400' },
  sent: { label: 'Sent', color: 'bg-blue-500/20 text-blue-400' },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400' },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
  expired: { label: 'Expired', color: 'bg-orange-500/20 text-orange-400' },
};

const crudAPI = (base) => ({
  getAll: (params) => API.get(base, { params }),
  getOne: (id) => API.get(`${base}/${id}`),
  create: (data) => API.post(base, data),
  update: (id, data) => API.put(`${base}/${id}`, data),
  delete: (id) => API.delete(`${base}/${id}`),
});

export const departmentsAPI = crudAPI('/departments');
export const rolesAPI = crudAPI('/roles');
export const projectCategoriesAPI = {
  ...crudAPI('/project-categories'),
  getOptions: () => API.get('/project-categories/options'),
};
export const staffRolesAPI = {
  ...crudAPI('/staff-roles'),
  getOptions: (params) => API.get('/staff-roles/options', { params }),
};
export const quotationsAPI = { ...crudAPI('/quotations'), approve: (id) => API.post(`/quotations/${id}/approve`), send: (id) => API.post(`/quotations/${id}/send`) };
export const projectsAPI = {
  ...crudAPI('/projects'),
  updateWorkflow: (id, workflowStage) => API.patch(`/projects/${id}/workflow`, { workflowStage }),
  getTechnicalTeam: () => API.get('/projects/team/technical'),
  assignTeam: (id, { assignedTo, manager, memberRoleLabels } = {}) => API.patch(`/projects/${id}/assign-team`, { assignedTo, manager, memberRoleLabels }),
  uploadRequirementsDocument: (id, data) => API.post(`/projects/${id}/requirements-document`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCustomerRequirementsDocument: (id, data) => API.post(`/projects/${id}/customer-requirements-document`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getRequirementsDocuments: (id) => API.get(`/projects/${id}/requirements-documents`),
  getCustomerRequirementsDocuments: (id) => API.get(`/projects/${id}/customer-requirements-documents`),
  listRequirementsDocuments: () => API.get('/projects/requirements-documents'),
  listCustomerRequirementsDocuments: () => API.get('/projects/customer-requirements-documents'),
  getDeliveryDocuments: (id) => API.get(`/projects/${id}/delivery-documents`),
  listDeliveryDocuments: () => API.get('/projects/delivery-documents'),
  listAssignedDeliveryDocuments: () => API.get('/projects/delivery-documents'),
  uploadDeliveryDocument: (id, data) => API.post(`/projects/${id}/delivery-document`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSupportTeam: () => API.get('/projects/team/support'),
  handoffToSupport: (id, data) => API.post(`/projects/${id}/handoff-to-support`, data),
  listSupportHandoffDocuments: () => API.get('/projects/support-handoff-documents'),
  getSupportReviewQueue: (params) => API.get('/projects/support-review-queue', { params }),
  reviewSupportHandoff: (id, data) => API.post(`/projects/${id}/support-review`, data),
  getSupportTasks: (id) => API.get(`/projects/${id}/support-tasks`),
  getSupportTask: (projectId, taskId) => API.get(`/projects/${projectId}/support-tasks/${taskId}`),
  getMySupportTasks: () => API.get('/projects/my-support-tasks'),
  getSupportManagerTasks: (params) => API.get('/projects/support-manager-tasks', { params }),
  getSupportTaskProjects: () => API.get('/projects/support-task-projects'),
  getSupportTaskAssignees: (category) => API.get('/projects/support-task-assignees', { params: { category } }),
  getSupportTaskTeamMembers: (staffRoleId, category) => API.get('/projects/support-task-team-members', {
    params: { staffRoleId, ...(category ? { category } : {}) },
  }),
  createSupportTask: (projectId, data) => {
    if (data instanceof FormData) {
      return API.post(`/projects/${projectId}/support-tasks`, data);
    }
    return API.post(`/projects/${projectId}/support-tasks`, data);
  },
  deleteSupportTask: (projectId, taskId) => API.delete(`/projects/${projectId}/support-tasks/${taskId}`),
  completeSupportTask: (projectId, taskId, data) => API.post(`/projects/${projectId}/support-tasks/${taskId}/complete`, data),
  addSupportTaskProgress: (projectId, taskId, data) => {
    if (data instanceof FormData) {
      return API.post(`/projects/${projectId}/support-tasks/${taskId}/progress`, data);
    }
    return API.post(`/projects/${projectId}/support-tasks/${taskId}/progress`, data);
  },
  getSupportMainTaskBatch: (projectId, batchId) => API.get(`/projects/${projectId}/support-task-batches/${batchId}`),
  approveSupportMainTaskBatch: (projectId, batchId) => API.post(`/projects/${projectId}/support-task-batches/${batchId}/approve`),
  verifySupportTasks: (id, data) => API.post(`/projects/${id}/verify-support-tasks`, data || {}),
  submitToCustomer: (id, data) => API.post(`/projects/${id}/submit-to-customer`, data || {}),
  assignSupportTeam: (id, data) => API.post(`/projects/${id}/assign-support-team`, data),
  startUpdateRequestFix: (id, data) => API.post(`/projects/${id}/start-update-fix`, data),
  resubmitToSupport: (id, data) => API.post(`/projects/${id}/resubmit-to-support`, data),
  verifySupportFix: (id, data) => API.post(`/projects/${id}/verify-support-fix`, data),
  acceptProject: (id, data) => API.post(`/projects/${id}/accept`, data),
  markCustomerAcceptance: (id, data) => API.post(`/projects/${id}/mark-customer-acceptance`, data || {}),
};
export const ticketsAPI = {
  ...crudAPI('/tickets'),
  create: (data) => API.post('/tickets', data, data instanceof FormData ? {} : undefined),
  addComment: (id, data) => API.post(`/tickets/${id}/comments`, data),
  confirmResolution: (id, data) => API.post(`/tickets/${id}/confirm-resolution`, data),
  reopen: (id, data) => API.post(`/tickets/${id}/reopen`, data),
  escalate: (id, data) => API.post(`/tickets/${id}/escalate`, data),
  resolve: (id, data) => API.post(`/tickets/${id}/resolve`, data),
  sendToTechnical: (id, data) => API.post(`/tickets/${id}/send-to-technical`, data),
  reviewChangeScope: (id, data) => API.post(`/tickets/${id}/review-change-scope`, data),
  completeTechnical: (id, data) => API.post(`/tickets/${id}/complete-technical`, data),
  verifyFix: (id, data) => API.post(`/tickets/${id}/verify-fix`, data),
  updateWorkStatus: (id, data) => API.post(`/tickets/${id}/update-work-status`, data),
  reviewResolution: (id, data) => API.post(`/tickets/${id}/review-resolution`, data),
  assignTechnical: (id, data) => API.post(`/tickets/${id}/assign-technical`, data),
  assignSupport: (id, data) => API.post(`/tickets/${id}/assign-support`, data),
  assignTicketByManager: (id, data) => API.post(`/tickets/${id}/assign-by-manager`, data),
  getSupportLogs: (params) => API.get('/tickets/support-logs', { params }),
};
export const invoicesAPI = { ...crudAPI('/invoices'), send: (id) => API.post(`/invoices/${id}/send`), recordPayment: (id, data) => API.post(`/invoices/${id}/payment`, data) };
export const paymentsAPI = crudAPI('/payments');
export const meetingsAPI = crudAPI('/meetings');
export const followupsAPI = {
  getAll: (params) => API.get('/followups', { params }),
  getStats: () => API.get('/followups/stats'),
  getOne: (id) => API.get(`/followups/${id}`),
  create: (data) => API.post('/followups', data),
  update: (id, data) => API.put(`/followups/${id}`, data),
  complete: (id, data) => API.post(`/followups/${id}/complete`, data),
  delete: (id) => API.delete(`/followups/${id}`),
  getReports: () => API.get('/followups/reports'),
};
export const expensesAPI = { ...crudAPI('/expenses'), approve: (id) => API.post(`/expenses/${id}/approve`) };
export const auditAPI = { getAll: (params) => API.get('/audit', { params }), getSystemLogs: (params) => API.get('/audit/system', { params }), getPermissions: () => API.get('/audit/permissions') };
export const attendanceAPI = crudAPI('/attendance');
export const leaveAPI = { ...crudAPI('/leave'), approve: (id) => API.post(`/leave/${id}/approve`), reject: (id) => API.post(`/leave/${id}/reject`) };
export const performanceAPI = { get: () => API.get('/performance') };

export const MILESTONE_STATUSES = {
  not_started: { label: 'Not Started', color: 'bg-gray-500/20 text-gray-300' },
  pending: { label: 'Pending', color: 'bg-gray-500/20 text-gray-300' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-300' },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  delayed: { label: 'Delayed', color: 'bg-amber-500/20 text-amber-400' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-500/20 text-yellow-300' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
};

export const milestonesAPI = crudAPI('/milestones');

