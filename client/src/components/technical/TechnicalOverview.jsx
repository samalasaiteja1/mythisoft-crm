import { Link } from 'react-router-dom';
import {
  FolderKanban, ListTodo, Clock, CheckCircle2, GitBranch, FlaskConical, Bug, Bell, Cpu,
} from 'lucide-react';

const StatCard = ({ label, value, color, link, icon: Icon }) => (
  <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-4">
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
      {Icon && <Icon size={14} />}
      {label}
    </div>
    {link ? (
      <Link to={link} className={`text-2xl font-bold ${color} hover:underline`}>{value ?? 0}</Link>
    ) : (
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
    )}
  </div>
);

export default function TechnicalOverview({ technicalOverview, roleStats }) {
  const stats = technicalOverview || {};
  const techStats = roleStats?.technical || {};

  const cards = [
    { label: 'Assigned Projects', value: stats.totalAssigned, color: 'text-cyan-400', link: '/projects', icon: FolderKanban },
    { label: 'Total Tasks', value: stats.totalTasks, color: 'text-violet-300', link: '/technical/tasks', icon: ListTodo },
    { label: 'Pending Tasks', value: stats.pendingTasks, color: 'text-amber-400', link: '/technical/tasks?filter=pending', icon: Clock },
    { label: 'In Progress', value: stats.inProgressTasks, color: 'text-blue-400', link: '/technical/tasks?filter=in_progress', icon: ListTodo },
    { label: 'Completed Tasks', value: stats.completedTasks, color: 'text-green-400', link: '/technical/tasks?filter=completed', icon: CheckCircle2 },
    { label: 'Code Review Pending', value: stats.codeReviewPending, color: 'text-purple-300', link: '/technical/code-review', icon: GitBranch },
    { label: 'Testing Pending', value: stats.testingPending, color: 'text-indigo-300', link: '/technical/testing', icon: FlaskConical },
    { label: 'Assigned Bugs', value: stats.assignedBugs ?? techStats.assignedTickets, color: 'text-red-400', link: '/technical/bugs', icon: Bug },
  ];

  return (
    <div className="space-y-6">
      <div className="card border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Cpu size={20} className="text-cyan-400" /> Overview
            </h2>
            <p className="text-sm text-gray-400 mt-1">Your assigned work — projects, tasks, reviews, and bugs</p>
          </div>
          <Link to="/notifications" className="btn-secondary text-sm inline-flex items-center gap-1">
            <Bell size={14} /> Notifications
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-myth-border">
          <Link to="/technical/tasks" className="btn-primary text-sm">View Tasks</Link>
          <Link to="/projects" className="btn-secondary text-sm">Open Projects</Link>
          <Link to="/technical/requirements" className="btn-secondary text-sm">View Requirements</Link>
        </div>
      </div>
    </div>
  );
}
