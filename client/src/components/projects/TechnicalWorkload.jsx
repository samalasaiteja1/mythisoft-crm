import { Link } from 'react-router-dom';
import {
  Briefcase, Users, Calendar, AlertCircle, CheckCircle2, PauseCircle, Clock,
} from 'lucide-react';
import { formatCurrency, formatDate, PROJECT_STATUSES } from '../../services/api';
import StatusBadge from '../StatusBadge';
import { ACTIVE_PROJECT_STATUSES } from '../../constants/projectStatuses';
import RequirementsDocLinks from './RequirementsDocLinks';
import { categoryLabel } from '../../hooks/useProjectCategories';
import { useAuth } from '../../context/AuthContext';

const memberOnProject = (project, memberId) => (project.assignedTo || []).some(
  (u) => String(typeof u === 'object' ? u._id : u) === String(memberId),
);

export default function TechnicalWorkload({ projects, techTeam = [], requirementsByProject = {}, deliveryByProject = {}, allRequirements = [], allDelivery = [] }) {
  const { user } = useAuth();

  const myProjects = projects.filter((p) => memberOnProject(p, user?._id));
  const active = myProjects.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status) || p.status === 'in_progress' || p.status === 'delivered');
  const planning = myProjects.filter((p) => ['new', 'planning'].includes(p.status));
  const onHold = myProjects.filter((p) => p.status === 'on_hold');
  const completed = myProjects.filter((p) => p.status === 'completed' || p.status === 'delivered');

  const statCards = [
    { label: 'Total Assigned', value: myProjects.length, icon: Briefcase, color: 'text-cyan-400' },
    { label: 'Active', value: active.length, icon: Clock, color: 'text-blue-400' },
    { label: 'Planning', value: planning.length, icon: AlertCircle, color: 'text-amber-400' },
    { label: 'On Hold', value: onHold.length, icon: PauseCircle, color: 'text-yellow-400' },
    { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-green-400' },
  ];

  const teammateName = (member) => `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;

  const coWorkersOnProject = (project) => {
    const assignees = project.assignedTo || [];
    return assignees
      .map((u) => (typeof u === 'object' ? u : techTeam.find((m) => String(m._id) === String(u))))
      .filter((u) => u && String(u._id) !== String(user?._id));
  };

  const sortedProjects = [...myProjects].sort((a, b) => {
    const aDue = a.endDate ? new Date(a.endDate).getTime() : Infinity;
    const bDue = b.endDate ? new Date(b.endDate).getTime() : Infinity;
    return aDue - bDue;
  });

  const customerLabel = (customer) => {
    if (!customer) return '—';
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || '—';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase size={24} className="text-cyan-400" /> My Workload
        </h1>
        <p className="text-gray-400 mt-1">Your assigned projects, deadlines, and team collaboration overview</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-myth-border">
          <div className="w-10 h-10 rounded-full bg-myth-accent/20 flex items-center justify-center text-myth-accent font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500">{user?.email} · Technical Team</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-lg border border-myth-border bg-myth-surface/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={color} />
                <p className="text-xs text-gray-500">{label}</p>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {(allRequirements.length > 0 || allDelivery.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {allRequirements.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-cyan-400" /> Requirements received
              </h2>
              <div className="space-y-3">
                {allRequirements.map((doc) => (
                  <div key={doc._id}>
                    <p className="text-xs text-gray-500 mb-1">{doc.projectName}</p>
                    <RequirementsDocLinks documents={[doc]} compact />
                  </div>
                ))}
              </div>
            </div>
          )}
          {allDelivery.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400" /> Submitted documents
              </h2>
              <div className="space-y-3">
                {allDelivery.map((doc) => (
                  <div key={doc._id}>
                    <p className="text-xs text-gray-500 mb-1">{doc.projectName}</p>
                    <RequirementsDocLinks documents={[doc]} compact />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {sortedProjects.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No workload assigned yet</p>
          <p className="text-sm text-gray-500 mt-1">Projects assigned by admin or manager will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Assigned projects</h2>
          {sortedProjects.map((project) => {
            const teammates = coWorkersOnProject(project);
            const isOverdue = project.endDate && new Date(project.endDate) < new Date() && !['completed', 'cancelled', 'delivered'].includes(project.status);

            return (
              <div key={project._id} className="card hover:border-myth-accent/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link to={`/projects/${project._id}`} className="text-white font-semibold hover:text-myth-accent">
                        {project.name}
                      </Link>
                      <StatusBadge status={project.status} config={PROJECT_STATUSES} />
                      {project.priority && (
                        <span className="badge bg-myth-surface text-gray-400 text-xs capitalize">{project.priority}</span>
                      )}
                      {isOverdue && (
                        <span className="badge bg-red-500/20 text-red-400 text-xs">Overdue</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {customerLabel(project.customer)}
                      {project.category ? ` · ${categoryLabel(project.category)}` : ''}
                      {' · '}{formatCurrency(project.budget)}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                      {project.endDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} /> Due {formatDate(project.endDate)}
                        </span>
                      )}
                      {teammates.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} />
                          With {teammates.map(teammateName).join(', ')}
                        </span>
                      )}
                    </div>
                    {(requirementsByProject[project._id] || []).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-myth-border/60">
                        <p className="text-xs text-gray-500 mb-2">Requirements</p>
                        <RequirementsDocLinks documents={requirementsByProject[project._id]} compact />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link to={`/projects/${project._id}`} className="btn-primary text-sm">Open</Link>
                    <Link to="/projects/milestones" className="btn-secondary text-sm">Milestones</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sortedProjects.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-white mb-3">Workload by status</h2>
          <div className="space-y-2">
            {Object.entries(PROJECT_STATUSES)
              .filter(([key]) => !['delivered'].includes(key))
              .map(([key, { label, color }]) => {
                const count = myProjects.filter((p) => p.status === key).length;
                if (count === 0) return null;
                const pct = myProjects.length ? Math.round((count / myProjects.length) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className={`badge ${color} w-28 justify-center text-xs`}>{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-myth-surface overflow-hidden">
                      <div className="h-full bg-myth-accent/70 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
