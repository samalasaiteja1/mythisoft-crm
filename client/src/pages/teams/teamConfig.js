import {
  Users, TrendingUp, Briefcase, Headphones, FolderKanban, ClipboardList,
} from 'lucide-react';

export const TEAM_TYPE_LABELS = {
  sales: 'Sales Team',
  technical: 'Technical Team',
  support: 'Support Team',
  manager: 'Manager Team',
};

export const TEAM_TYPE_SECTIONS = {
  sales: [
    { key: 'overview', label: 'Teams Overview', icon: Users },
    { key: 'members', label: 'Team Members', icon: Users },
    { key: 'leads', label: 'Assigned Leads', icon: Users },
    { key: 'deals', label: 'Active Deals', icon: Briefcase },
    { key: 'performance', label: 'Performance', icon: TrendingUp },
    { key: 'workload', label: 'Workload', icon: TrendingUp },
  ],
  technical: [
    { key: 'my-teams', label: 'My Teams', icon: Users },
    { key: 'admin-teams', label: 'Admin Created Teams', icon: Users },
    { key: 'overview', label: 'All Teams', icon: Users },
    { key: 'members', label: 'Team Members', icon: Users },
    { key: 'assignments', label: 'Project Assignments', icon: FolderKanban },
    { key: 'active', label: 'Active Projects', icon: FolderKanban },
    { key: 'pending', label: 'Pending Projects', icon: FolderKanban },
    { key: 'completed', label: 'Completed Projects', icon: FolderKanban },
    { key: 'workload', label: 'Team Workload', icon: TrendingUp },
    { key: 'performance', label: 'Performance', icon: TrendingUp },
    { key: 'attendance', label: 'Attendance', icon: ClipboardList },
  ],
  support: [
    { key: 'overview', label: 'Teams Overview', icon: Users },
    { key: 'members', label: 'Team Members', icon: Users },
    { key: 'assigned-tickets', label: 'Assigned Tickets', icon: Headphones },
    { key: 'open-tickets', label: 'Open Tickets', icon: Headphones },
    { key: 'resolved-tickets', label: 'Resolved Tickets', icon: Headphones },
    { key: 'workload', label: 'Team Workload', icon: TrendingUp },
    { key: 'performance', label: 'Performance', icon: TrendingUp },
    { key: 'attendance', label: 'Attendance', icon: ClipboardList },
  ],
  manager: [
    { key: 'overview', label: 'Teams Overview', icon: Users },
    { key: 'members', label: 'Managers', icon: Users },
  ],
};

export const teamTypeFromGroup = (teamGroup) => {
  if (teamGroup === 'sales') return 'sales';
  if (teamGroup === 'technical') return 'technical';
  if (teamGroup === 'support') return 'support';
  if (teamGroup === 'manager') return 'manager';
  return null;
};

export const sectionMeta = (teamType, section) => {
  const sections = TEAM_TYPE_SECTIONS[teamType] || [];
  return sections.find((s) => s.key === section) || { key: section, label: section, icon: Users };
};
