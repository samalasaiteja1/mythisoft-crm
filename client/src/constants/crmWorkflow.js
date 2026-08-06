/** End-to-end CRM workflow — matches admin onboarding + lead pipeline */
export const CRM_WORKFLOW_STEPS = [
  { step: 1, label: 'Login', desc: 'Sign in with admin credentials', href: '/login' },
  { step: 2, label: 'Dashboard', desc: 'Role-based control center', href: '/dashboard' },
  { step: 3, label: 'Create Roles', desc: 'Job titles per department', href: '/settings?tab=roles' },
  { step: 4, label: 'Create Teams', desc: 'Manager + work teams', href: '/settings?tab=teams' },
  { step: 5, label: 'Add Employees', desc: 'Hire staff in Settings', href: '/settings?tab=hire' },
  { step: 6, label: 'Assign Role', desc: 'Role name from Settings → Roles', href: '/settings?tab=hire' },
  { step: 7, label: 'Assign Manager', desc: 'Reporting manager on hire form', href: '/settings?tab=hire' },
  { step: 8, label: 'Employee Login', desc: 'Password created at hire', href: '/settings?tab=hire' },
  { step: 9, label: 'Create Lead', desc: 'Add a new sales lead', href: '/leads/create' },
  { step: 10, label: 'Assign to Manager', desc: 'Admin routes lead to department manager', href: '/leads/assign-manager' },
  { step: 11, label: 'Manager → Sales', desc: 'Manager assigns to salesperson', href: '/leads/assign' },
  { step: 12, label: 'Monitor Progress', desc: 'Pipeline, follow-ups, reports', href: '/leads' },
];

export const MANAGER_WORKFLOW_STEPS = CRM_WORKFLOW_STEPS.filter((s) =>
  ['Dashboard', 'Manager → Sales', 'Monitor Progress', 'Create Lead'].some((k) => s.label.includes(k) || s.label === 'Dashboard')
);
