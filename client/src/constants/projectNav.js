import {
  FolderKanban, Users, Layers, Flag, Send, Inbox, FileText, CheckCircle2, ListTodo, GitBranch, Headphones, Wrench,
} from 'lucide-react';

export const PROJECT_NAV_ITEMS = [
  { key: 'all', label: 'All Projects', path: '/projects', icon: FolderKanban, end: true },
  {
    key: 'assign',
    label: 'Assign Projects',
    path: '/projects/assign',
    icon: Users,
    roles: ['admin', 'manager'],
    hint: 'Step 1 — technical manager & team',
  },
  {
    key: 'allocation',
    label: 'Team Allocation',
    path: '/projects/team-allocation',
    icon: Layers,
    roles: ['admin', 'manager'],
  },
  {
    key: 'milestones',
    label: 'Milestones',
    path: '/projects/milestones',
    icon: Flag,
    roles: ['admin'],
  },
  {
    key: 'milestones-completed',
    label: 'Complete Milestones',
    path: '/projects/milestones/completed',
    icon: CheckCircle2,
    roles: ['admin'],
  },
  {
    key: 'tasks',
    label: 'Tasks',
    path: '/projects/tasks',
    icon: ListTodo,
    roles: ['admin'],
  },
  {
    key: 'code-review',
    label: 'Code Review',
    path: '/projects/status/code_review',
    icon: GitBranch,
    roles: ['admin', 'manager'],
    hint: 'Review projects awaiting code review',
  },
  {
    key: 'tech-submissions',
    label: 'Tech Submissions',
    path: '/projects/tech-submissions',
    icon: Send,
    roles: ['admin', 'manager'],
    hint: 'Technical team delivery documents',
  },
  {
    key: 'customer-requirements',
    label: 'Customer Requirements',
    path: '/projects/customer-requirements',
    icon: Inbox,
    roles: ['admin', 'manager'],
    hint: 'Customer portal uploads',
  },
];

/** Tech manager — matches main sidebar My Projects group */
export const PROJECT_NAV_TECH_MANAGER = [
  { key: 'all', label: 'All My Projects', path: '/projects', icon: FolderKanban, end: true },
  { key: 'active', label: 'Active Projects', path: '/projects/active', icon: Layers },
  { key: 'completed', label: 'Completed', path: '/projects/status/completed', icon: CheckCircle2 },
  { key: 'customer-requirements', label: 'Customer Requirements', path: '/projects/customer-requirements', icon: Inbox },
  { key: 'documents', label: 'Documents', path: '/documents', icon: FileText },
  { key: 'tech-submissions', label: 'Change Requests', path: '/projects/tech-submissions', icon: Send },
  { key: 'support-handoff', label: 'Submit to Support', path: '/projects/support-handoff', icon: Headphones },
  { key: 'support-updates', label: 'Support Updates', path: '/projects/support-updates', icon: Wrench },
];

export const PROJECT_NAV_TECHNICAL = [
  { key: 'all', label: 'My Projects', path: '/projects', icon: FolderKanban, end: true },
  { key: 'requirements', label: 'Requirements', path: '/technical/requirements', icon: Inbox },
  { key: 'milestones', label: 'Milestones', path: '/technical/milestones', icon: Flag },
  { key: 'workload', label: 'My Workload', path: '/projects/team-allocation', icon: Layers },
];

export const getProjectNavForRole = (role, { isTechManager = false } = {}) => {
  if (isTechManager) return PROJECT_NAV_TECH_MANAGER;
  if (role === 'technical') return PROJECT_NAV_TECHNICAL;
  return PROJECT_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
};

export const ADD_PROJECT_PATH = '/projects?add=1';
