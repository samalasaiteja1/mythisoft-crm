import { useEffect, useState } from 'react';
import { BarChart3, Star, Clock, CheckCircle2, Ticket } from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function SupportPersonReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getDashboard()
      .then(({ data: res }) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const stats = data?.roleStats?.support || data?.roleStats || {};

  const cards = [
    { label: 'My Completed Tasks', value: stats.completedSupportTasks ?? 0, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'My Resolved Tickets', value: stats.resolvedTickets ?? 0, icon: Ticket, color: 'text-emerald-400' },
    { label: 'Avg Resolution Time', value: stats.avgResponseTime != null ? `${stats.avgResponseTime}h` : '—', icon: Clock, color: 'text-blue-400' },
    { label: 'Customer Rating', value: stats.customerRating ? `${stats.customerRating}/5` : '—', icon: Star, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 size={24} className="text-myth-accent" /> Reports
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Personal performance — your completed tasks, resolved tickets, and customer feedback.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card border border-myth-border/80">
              <Icon size={20} className={`${card.color} mb-2`} />
              <p className="text-xs text-gray-400">{card.label}</p>
              <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="card text-sm text-gray-400 space-y-2">
        <p className="text-white font-medium">Additional metrics</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Open tasks: {stats.pendingSupportTasks ?? 0} pending · {stats.inProgressTasks ?? 0} in progress</li>
          <li>Open tickets: {stats.openTickets ?? 0}</li>
          <li>Assigned projects: {stats.myProjects ?? 0}</li>
          <li>SLA: {stats.slaStatus || 'On track'}</li>
        </ul>
      </div>
    </div>
  );
}
