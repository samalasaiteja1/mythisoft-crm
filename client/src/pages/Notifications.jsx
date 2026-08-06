import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { dashboardAPI, formatDateTime } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminStatStrip,
  AdminContentCard,
  AdminEmptyState,
} from '../components/admin/adminUi';

const typeColors = {
  info: 'bg-blue-500/20 text-blue-400',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  error: 'bg-red-500/20 text-red-400',
  task: 'bg-purple-500/20 text-purple-400',
  deal: 'bg-myth-accent/20 text-myth-accent',
  lead: 'bg-orange-500/20 text-orange-400',
  project: 'bg-cyan-500/20 text-cyan-400',
  ticket: 'bg-orange-500/20 text-orange-300',
};

export default function Notifications() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get('type') || '';
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    dashboardAPI.getNotifications()
      .then(({ data }) => { setNotifications(data.notifications); setUnreadCount(data.unreadCount); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    if (!typeFilter) return notifications;
    return notifications.filter((n) => n.type === typeFilter);
  }, [notifications, typeFilter]);

  const markAllRead = async () => {
    await dashboardAPI.markAllRead();
    fetch();
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await dashboardAPI.markRead(notification._id);
      setNotifications((prev) => prev.map((n) => (
        n._id === notification._id ? { ...n, isRead: true } : n
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  if (loading) return <LoadingSpinner />;

  const titleSuffix = typeFilter ? ` — ${typeFilter}` : '';

  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={Bell}
        title={`Notifications${titleSuffix}`}
        subtitle="System alerts, task updates, and workflow notifications"
        meta={`${unreadCount} unread · ${notifications.length} total`}
        actions={unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-2">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      />

      <AdminStatStrip stats={[
        { label: 'Unread', value: unreadCount, color: unreadCount > 0 ? 'text-myth-accent' : 'text-white', highlight: unreadCount > 0 },
        { label: 'Total', value: notifications.length, color: 'text-white' },
        { label: 'Showing', value: filtered.length, color: 'text-gray-300' },
      ]} />

      <AdminContentCard>
        {filtered.length === 0 ? (
          <AdminEmptyState message={typeFilter ? `No ${typeFilter} notifications` : 'No notifications yet'} icon={Bell} />
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-myth-accent/40 ${
                  !n.isRead ? 'border-myth-accent/30 bg-myth-accent/5' : 'border-myth-border/60 bg-myth-surface/30 opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-white">{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-myth-accent shrink-0" />}
                      {n.type && <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[n.type] || 'bg-gray-500/20 text-gray-400'}`}>{n.type}</span>}
                    </div>
                    {n.message && <p className="text-sm text-gray-400">{n.message}</p>}
                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {n.link && <ExternalLink size={16} className="text-gray-500 shrink-0 mt-1" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminContentCard>
    </AdminPageShell>
  );
}
