/** CRM lifecycle navigation — Lead → Deal → Project → Support → Feedback */

export const CRM_LIFECYCLE_NAV = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
    { key: 'leads', label: 'Leads', path: '/leads', module: 'leads' },
    { key: 'leadassign', label: 'Assign Leads', path: '/leads/assign', module: 'leads' },
    { key: 'followups', label: 'Follow-ups', path: '/follow-ups', module: 'followups' },
    { key: 'qualified', label: 'Qualified Leads', path: '/qualified-leads', module: 'leads' },
    { key: 'deals', label: 'Deals', path: '/deals/list', module: 'deals' },
    { key: 'pipeline', label: 'Pipeline', path: '/deals', module: 'deals' },
    { key: 'quotations', label: 'Quotations', path: '/quotations', module: 'quotations' },
    { key: 'approvals', label: 'Customer Approvals', path: '/approvals', module: 'approvals' },
    { key: 'invoices', label: 'Invoices', path: '/invoices', module: 'invoices' },
    { key: 'payments', label: 'Payments', path: '/payments', module: 'payments' },
    { key: 'projects', label: 'Projects', path: '/projects', module: 'projects' },
    { key: 'devboard', label: 'Development', path: '/dev-board', module: 'tasks' },
    { key: 'deployment', label: 'Testing & Deploy', path: '/deployment', module: 'deployment' },
    { key: 'delivery', label: 'Project Delivery', path: '/project-delivery', module: 'projects' },
    { key: 'tickets', label: 'Support', path: '/tickets', module: 'tickets' },
    { key: 'feedback', label: 'Customer Feedback', path: '/feedback', module: 'customers' },
    { key: 'reports', label: 'Reports', path: '/reports', module: 'reports' },
    { key: 'calendar', label: 'Calendar', path: '/calendar', module: 'calendar' },
    { key: 'users', label: 'Users & Roles', path: '/users', module: 'users' },
    { key: 'settings', label: 'Settings', path: '/settings', module: 'settings' },
  ],
  manager: [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
    { key: 'leads', label: 'Leads', path: '/leads', module: 'leads' },
    { key: 'leadassign', label: 'Assign Leads', path: '/leads/assign', module: 'leads' },
    { key: 'qualified', label: 'Qualified Leads', path: '/qualified-leads', module: 'leads' },
    { key: 'pipeline', label: 'Pipeline', path: '/deals', module: 'deals' },
    { key: 'approvals', label: 'Approvals', path: '/approvals', module: 'approvals' },
    { key: 'reports', label: 'Reports', path: '/reports', module: 'reports' },
    { key: 'performance', label: 'Team Performance', path: '/performance', module: 'performance' },
    { key: 'calendar', label: 'Calendar', path: '/calendar', module: 'calendar' },
  ],
  sales: [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
    { key: 'leads', label: 'My Leads', path: '/leads', module: 'leads' },
    { key: 'followups', label: 'Follow-ups', path: '/follow-ups', module: 'followups' },
    { key: 'qualified', label: 'Qualified Leads', path: '/qualified-leads', module: 'leads' },
    { key: 'pipeline', label: 'Pipeline', path: '/deals', module: 'deals' },
    { key: 'quotations', label: 'Quotations', path: '/quotations', module: 'quotations' },
    { key: 'customers', label: 'Customers', path: '/customers/all', module: 'customers' },
    { key: 'documents', label: 'Documents', path: '/documents', module: 'documents' },
    { key: 'email', label: 'Email', path: '/communications', module: 'email' },
    { key: 'whatsapp', label: 'WhatsApp', path: '/whatsapp', module: 'whatsapp' },
    { key: 'calendar', label: 'Calendar', path: '/calendar', module: 'calendar' },
    { key: 'notifications', label: 'Notifications', path: '/notifications', module: 'notifications' },
    { key: 'reports', label: 'Reports', path: '/reports', module: 'reports' },
  ],
};

export const PIPELINE_STAGES = [
  'deal_created', 'discovery', 'requirement_gathering',
  'proposal_sent', 'quotation_sent', 'negotiation', 'customer_approval',
  'contract_signed', 'advance_payment_received', 'won', 'converted_to_customer',
];

export const DEV_BOARD_STAGES = ['backlog', 'todo', 'in_progress', 'code_review', 'testing', 'completed'];

export const APPROVAL_STATUSES = {
  waiting: { label: 'Waiting', color: 'bg-yellow-500/20 text-yellow-400' },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400' },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
  needs_revision: { label: 'Needs Revision', color: 'bg-orange-500/20 text-orange-400' },
};
