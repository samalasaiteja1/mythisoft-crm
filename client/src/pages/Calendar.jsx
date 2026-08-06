import { useState, useEffect } from 'react';
import { Calendar as CalIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { meetingsAPI, tasksAPI, dashboardAPI, formatDateTime } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Calendar() {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [customerEvents, setCustomerEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCustomer) {
      dashboardAPI.getDashboard()
        .then(({ data }) => setCustomerEvents(data.calendarEvents || []))
        .catch(() => setCustomerEvents([]))
        .finally(() => setLoading(false));
      return;
    }

    Promise.all([
      meetingsAPI.getAll({ status: 'scheduled' }),
      tasksAPI.getAll(),
    ])
      .then(([mRes, tRes]) => {
        setMeetings(mRes.data.items || []);
        setTasks(Array.isArray(tRes.data) ? tRes.data : tRes.data.tasks || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isCustomer]);

  if (loading) return <LoadingSpinner />;

  const upcoming = isCustomer
    ? customerEvents.map((e) => ({
      type: e.type,
      title: e.title,
      date: e.scheduledAt,
      color: e.type === 'meeting' ? 'text-myth-accent' : e.type === 'invoice' ? 'text-amber-400' : 'text-cyan-400',
    }))
    : [
      ...meetings.map((m) => ({ type: 'Meeting', title: m.title, date: m.scheduledAt, color: 'text-myth-accent' })),
      ...tasks.filter((t) => t.dueDate).map((t) => ({ type: 'Task', title: t.title, date: t.dueDate, color: 'text-yellow-400' })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalIcon className="text-myth-accent" size={24} /> Calendar
        </h1>
        <p className="text-gray-400 mt-1">
          {isCustomer
            ? 'Your meetings, follow-ups, project milestones & invoice due dates'
            : 'Upcoming meetings and task deadlines'}
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Schedule</h3>
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming events</p>
          ) : upcoming.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-myth-surface/50 border border-myth-border">
              <div>
                <p className="text-white font-medium">{item.title}</p>
                <p className={`text-xs capitalize ${item.color}`}>{item.type}</p>
              </div>
              <p className="text-sm text-gray-400">{formatDateTime(item.date)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
