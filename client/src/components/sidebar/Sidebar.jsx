import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Handshake,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  FolderKanban,
  Headphones,
  Bell,
  KeyRound,
  Calendar,
  FileText,
  Bug,
  Rocket,
  HelpCircle,
  Package,
  Layers,
  ScrollText,
  Send,
  FileEdit,
  ClipboardList,
  Briefcase,
  Ticket,
  MessageSquare,
  Contact,
  Files,
  CircleUser,
  ListTodo,
  Inbox,
  CheckCircle2,
  PlayCircle,
  CircleCheckBig,
  LayoutGrid,
  Activity,
  ClipboardCheck,
  UserCheck,
  Radio,
  Archive,
  TicketPlus,
  Clock,
  CheckCheck,
  ShieldCheck,
  PieChart,
  ListChecks,
  PlusCircle,
  Truck,
  UserRoundCheck,
  History,
  AlertTriangle,
  XCircle,
  UsersRound,
  Gauge,
  DollarSign,
  Cpu,
  Flag,
  GitBranch,
  Wrench,
  TrendingUp,
  FlaskConical,
  Upload,
} from 'lucide-react';
import { getNavForUser } from '../../constants/navigation';
import { canAccessModule, canPerformAction } from '../../constants/permissions';
import { getPanelIconKey, getPanelIconClass } from '../../utils/roleContext';

/** Nav key → Lucide icon (support person + shared CRM sidebar) */
const iconMap = {
  dashboard: LayoutDashboard,
  'dashboard-group': LayoutDashboard,

  leads: UserPlus,
  'leads-group': UserPlus,
  deals: Handshake,
  'deals-group': Handshake,
  customers: Users,
  'customers-group': Users,

  projects: FolderKanban,
  'projects-group': FolderKanban,
  tasks: CheckSquare,
  tickets: Ticket,
  'support-group': Headphones,

  reports: PieChart,
  'reports-group': PieChart,
  users: Shield,
  roles: KeyRound,
  settings: Settings,
  'settings-group': Settings,
  notifications: Bell,
  profile: CircleUser,

  qualified: CheckSquare,
  followups: Calendar,
  delivery: FileText,
  calendar: Calendar,
  performance: Gauge,
  documents: Files,
  deployment: Rocket,
  bugtracker: Bug,
  knowledgebase: HelpCircle,
  products: Package,
  'teams-group': Layers,
  'sales-team': UsersRound,
  'technical-team': FolderKanban,
  'support-team-group': UsersRound,

  escalations: AlertTriangle,
  'support-logs': History,
  'submitted-projects': Inbox,
  'project-delivery': Truck,
  'customer-acceptance': UserRoundCheck,
  'create-task': PlusCircle,
  'task-status': ListChecks,
  'review-projects': ClipboardCheck,
  'change-requests': FileEdit,
  'support-tickets-group': Ticket,

  'support-work-group': ClipboardList,
  'my-work-group': Briefcase,
  'my-work-tasks-group': ListTodo,
  'my-projects-group': FolderKanban,
  'my-projects': FolderKanban,
  'my-tickets-group': Ticket,

  'my-tasks': ListTodo,
  'tasks-accept': Inbox,
  'tasks-accepted': CheckCircle2,
  'tasks-progress': PlayCircle,
  'tasks-completed': CircleCheckBig,

  'projects-all': LayoutGrid,
  'projects-active': Activity,
  'projects-tasks': ClipboardCheck,
  'projects-customer': UserCheck,
  'projects-live': Radio,
  'projects-closed': Archive,

  'tickets-all': Ticket,
  'tickets-active': Ticket,
  'tickets-assigned': TicketPlus,
  'tickets-accept': TicketPlus,
  'tickets-progress': Clock,
  'tickets-completed': CheckCheck,
  'tickets-resolved': ShieldCheck,
  'tickets-escalated': AlertTriangle,
  'tickets-closed': XCircle,
  'tickets-history': History,

  'customer-requests': MessageSquare,
  'my-customers': Contact,

  'team-create': PlusCircle,
  'team-members': UsersRound,
  'team-workload': BarChart3,
  'team-performance': Gauge,

  'reports-hub': PieChart,
  'reports-delivery': Truck,
  'reports-acceptance': UserRoundCheck,
  'reports-tickets': Ticket,
  'reports-sla': Clock,
  'reports-team': Gauge,

  'customer-projects-group': FolderKanban,
  'customer-projects-all': LayoutGrid,
  'customer-projects-accept': ClipboardCheck,
  'customer-projects-active': Activity,
  'customer-projects-support': Radio,
  'customer-projects-closed': Archive,
  'customer-support-group': Headphones,
  'customer-tickets-all': Ticket,
  'customer-tickets-open': Inbox,
  'customer-tickets-progress': PlayCircle,
  'customer-tickets-confirm': ShieldCheck,
  'tickets-create': TicketPlus,
  invoices: DollarSign,

  'support-followups-group': Calendar,
  'support-followups-today': Calendar,
  'support-followups-all': ListTodo,
  'support-followups-overdue': AlertTriangle,
  'support-followups-completed': CheckCircle2,
  'support-followups-add': PlusCircle,
  'support-followups-history': History,

  'sm-delivery-group': Truck,
  'sm-tasks-group': ClipboardList,
  'sm-support-active': Radio,

  // Admin — Leads
  'leads-all': LayoutGrid,
  'leads-assigned': UserCheck,
  'leads-unsigned': Inbox,
  'leads-analytics': BarChart3,

  // Admin — Deals
  'deals-pipeline': Handshake,
  'deals-assigned': UserCheck,
  'deals-unassigned': Inbox,
  'deals-followups': Calendar,
  'deals-won': CheckCircle2,
  'deals-lost': XCircle,

  // Admin — Customers
  'customers-all': Users,
  'customers-active': Activity,
  'customers-projects': FolderKanban,
  'customers-followups': Calendar,
  'customers-history': History,
  'customers-tech-assigned': Cpu,
  'customers-tech-unassigned': Cpu,
  'customers-support-assigned': Headphones,
  'customers-support-unassigned': Headphones,

  // Admin — Projects
  'projects-assign': UserPlus,
  'projects-allocation': Layers,
  'projects-milestones': Flag,
  'projects-milestones-completed': CheckCircle2,
  'projects-code-review': GitBranch,
  'projects-tech-submissions': Send,
  'projects-customer-requirements': Inbox,

  // Panel labels (sidebar header)
  cpu: Cpu,
  briefcase: Briefcase,
  shield: Shield,
  'circle-user': CircleUser,
  'user-plus': UserPlus,
  headphones: Headphones,

  // Technical Manager sidebar groups
  'tech-dashboard-group': LayoutDashboard,
  'tech-projects-group': FolderKanban,
  'tech-teams-group': UsersRound,
  'tech-milestones-group': Flag,
  'tech-delivery-group': ListTodo,
  'tech-reports-group': PieChart,
  'tech-settings-group': Settings,

  // Technical Manager — Dashboard
  'dashboard-overview': LayoutDashboard,
  'dashboard-active-projects': Activity,
  'dashboard-pending-tasks': ListTodo,
  'dashboard-overdue-tasks': Clock,
  'dashboard-delayed-projects': AlertTriangle,
  'dashboard-notifications': Bell,

  // Technical Manager — Projects
  'projects-completed': CircleCheckBig,
  'projects-requirements': Inbox,
  'projects-documents': Files,
  'projects-changes': FileEdit,

  // Technical Manager — Teams
  'teams-create': PlusCircle,
  'teams-my': UsersRound,
  'teams-assignments': FolderKanban,
  'teams-members': Users,
  'teams-workload': BarChart3,
  'teams-performance': Gauge,

  // Technical Manager — Milestones
  'milestones-all': Flag,
  'milestones-completed': CheckCircle2,

  // Technical Manager — Tasks & Delivery
  'tasks-list': ListTodo,
  'tasks-create': PlusCircle,
  'tasks-board': LayoutGrid,
  'tasks-code-review': GitBranch,
  'tasks-testing': ClipboardCheck,
  'tasks-bug-fixing': Bug,
  'tasks-bugs': Bug,
  'tasks-deployment': Rocket,
  'tasks-support-handoff': Headphones,
  'tasks-support-updates': Wrench,
  'tasks-deploy-requests': Rocket,

  // Technical Manager — Reports
  'reports-progress': TrendingUp,
  'reports-tasks': ListChecks,
  'reports-utilization': BarChart3,

  // Technical Manager — Settings
  'settings-profile': CircleUser,
  'settings-notifications': Bell,

  // Tech Team (technical person) sidebar groups
  'tech-person-dashboard': LayoutDashboard,
  'tech-person-projects': FolderKanban,
  'tech-person-tasks': ListTodo,
  'tech-person-code-review': GitBranch,
  'tech-person-testing': FlaskConical,
  'tech-person-bugs': Bug,
  'tech-person-profile': CircleUser,

  // Tech Team — Dashboard
  'tp-overview': LayoutDashboard,
  'tp-my-projects': FolderKanban,
  'tp-my-tasks': ListTodo,
  'tp-support-handoff': ClipboardList,
  'tp-notifications': Bell,

  // Tech Team — Projects
  'tp-view-project': FolderKanban,
  'tp-view-requirements': Inbox,
  'tp-view-milestones': Flag,

  // Tech Team — Tasks
  'tp-tasks-list': ListTodo,
  'tp-task-details': ListTodo,
  'tp-update-status': PlayCircle,
  'tp-upload-work': Upload,

  // Tech Team — Code Review
  'tp-review-comments': GitBranch,
  'tp-resubmit': Send,

  // Tech Team — Testing
  'tp-test-results': FlaskConical,

  // Tech Team — Bugs
  'tp-assigned-bugs': Bug,
  'tp-update-bug': Bug,

  // Tech Team — Profile
  'tp-my-profile': CircleUser,
  'tp-change-password': KeyRound,
};

function getNavIcon(key) {
  return iconMap[key] || null;
}

const hasAccessibleChild = (role, item) => {
  if (item.roles && !item.roles.includes(role)) return false;
  if (item.path) {
    if (item.action && !canPerformAction(role, item.module, item.action)) return false;
    return canAccessModule(role, item.module);
  }
  if (!item.children?.length) return false;
  return item.children.some((child) => hasAccessibleChild(role, child));
};

const filterNav = (role, items) => items
  .filter((item) => hasAccessibleChild(role, item))
  .map((item) => (item.children
    ? { ...item, children: filterNav(role, item.children) }
    : item));

function isNavPathActive(location, path) {
  const [pathname, query = ''] = path.split('?');
  if (location.pathname !== pathname && !location.pathname.startsWith(`${pathname}/`)) {
    return false;
  }
  const expected = new URLSearchParams(query);
  const current = new URLSearchParams(location.search);
  if ([...expected.keys()].length === 0) {
    const tab = current.get('tab');
    if (pathname === '/support/my-tasks') return !tab || tab === 'open';
    if (pathname === '/support/my-projects') return !tab || tab === 'all';
    if (pathname === '/support/tickets/assigned') return !tab || tab === 'active';
    if (pathname === '/projects') return !tab || tab === 'all';
    if (pathname === '/tickets') return !tab || tab === 'all';
    if (pathname === '/support/follow-ups') return !tab;
    return true;
  }
  for (const [key, val] of expected.entries()) {
    if (current.get(key) !== val) return false;
  }
  return true;
}

function NavIcon({ iconKey, size = 18, className = '' }) {
  const Icon = getNavIcon(iconKey) || LayoutDashboard;
  return <Icon size={size} className={`shrink-0 ${className}`} strokeWidth={1.75} />;
}

function NavGroup({ item, collapsed, depth = 0 }) {
  const location = useLocation();
  const childPaths = (nodes) => nodes.flatMap((n) => (n.path ? [n.path] : childPaths(n.children || [])));
  const paths = childPaths(item.children || []);
  const isChildActive = paths.some((p) => isNavPathActive(location, p));
  const [open, setOpen] = useState(isChildActive);

  const padding = collapsed ? '' : depth === 0 ? 'pl-3' : depth === 1 ? 'pl-5' : 'pl-7';
  const groupIconSize = depth === 0 ? 20 : 16;

  if (collapsed) {
    const firstPath = paths[0];
    if (!firstPath) return null;
    return (
      <NavLink
        to={firstPath}
        className={({ isActive }) => (isActive || isChildActive ? 'sidebar-link-active' : 'sidebar-link')}
        title={item.label}
      >
        <NavIcon iconKey={item.key} size={20} />
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`sidebar-link w-full justify-between ${isChildActive ? 'text-myth-accent' : ''} ${padding}`}
      >
        <span className="flex items-center gap-3 min-w-0">
          <NavIcon
            iconKey={item.key}
            size={groupIconSize}
            className={isChildActive ? 'text-myth-accent' : 'text-gray-400'}
          />
          <span className="truncate text-left font-medium">{item.label}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform text-gray-500 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {(item.children || []).map((child) => (
            child.children
              ? <NavGroup key={child.key} item={child} collapsed={false} depth={depth + 1} />
              : (
                <NavLink
                  key={child.key}
                  to={child.path}
                  end={child.path === '/leads' || child.path === '/projects' || child.path === '/deals'}
                  isActive={(_, loc) => isNavPathActive(loc, child.path)}
                  className={({ isActive }) => `${isActive ? 'sidebar-link-active' : 'sidebar-link'} !flex items-center gap-2.5 ${depth === 0 ? 'pl-9' : depth === 1 ? 'pl-11' : 'pl-12'} py-2 text-sm`}
                >
                  {({ isActive }) => (
                    <>
                      <NavIcon
                        iconKey={child.key}
                        size={15}
                        className={isActive ? 'text-myth-accent' : 'text-gray-500'}
                      />
                      <span className="truncate">{child.label}</span>
                    </>
                  )}
                </NavLink>
              )
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, setCollapsed, user, panelLabel, mobileOpen, setMobileOpen }) {
  const role = user?.role;
  const items = filterNav(role, getNavForUser(user));
  const panelIconKey = getPanelIconKey(user);
  const panelIconClass = getPanelIconClass(user);
  const PanelIcon = panelIconKey ? getNavIcon(panelIconKey) : null;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-myth-navy border-r border-myth-border z-50 transition-all duration-300 ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'} ${mobileOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b border-myth-border ${collapsed ? 'px-3' : ''}`}>
            <Link to="/dashboard" className="flex items-center gap-3">
              <img src="/logo.png" alt="MYTHISOFT" className={`rounded-lg object-contain ${collapsed ? 'w-10 h-10' : 'w-full max-h-16'}`} />
            </Link>
            {!collapsed && panelLabel && (
              <p className="text-xs text-myth-accent mt-2 font-medium flex items-center gap-1.5">
                {PanelIcon && <PanelIcon size={14} className={`${panelIconClass} shrink-0`} strokeWidth={1.75} />}
                {panelLabel}
              </p>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {items.map((item) => {
              if (item.children) {
                return <NavGroup key={item.key} item={item} collapsed={collapsed} />;
              }
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end={item.path === '/follow-ups/today'}
                  isActive={(_, loc) => isNavPathActive(loc, item.path)}
                  className={({ isActive }) => `${isActive ? 'sidebar-link-active' : 'sidebar-link'} gap-3`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      <NavIcon
                        iconKey={item.key}
                        size={20}
                        className={isActive ? 'text-myth-accent' : 'text-gray-400'}
                      />
                      {!collapsed && <span className="font-medium">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-myth-border">
            <button type="button" onClick={() => setCollapsed(!collapsed)} className="sidebar-link w-full justify-center gap-2 hidden lg:flex">
              {collapsed ? <ChevronRight size={20} /> : <><ChevronLeft size={20} /><span>Collapse</span></>}
            </button>
            <button 
              type="button" 
              onClick={() => setMobileOpen(false)} 
              className="sidebar-link w-full justify-center gap-2 lg:hidden"
            >
              <ChevronRight size={20} />
              <span>Close</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
