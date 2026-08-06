import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalIcon } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useFollowUpList } from '../../components/followups/useFollowUpList';
import { formatDateTime } from '../../services/api';
import { ACTIVITY_TYPE_LABELS, WORKFLOW_STAGE_LABELS } from '../../constants/followups';
import { detailPath } from '../../components/followups/followUpHelpers';
import { AdminContentCard, AdminEmptyState } from '../../components/admin/adminUi';

export default function CalendarView() {
  const { items, loading } = useFollowUpList({ status: 'scheduled' });

  const grouped = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const day = new Date(item.scheduledAt).toDateString();
      if (!map[day]) map[day] = [];
      map[day].push(item);
    });
    return Object.entries(map).sort(([a], [b]) => new Date(a) - new Date(b));
  }, [items]);

  if (loading) return <LoadingSpinner />;

  return (
    <AdminContentCard title="Follow-up calendar">
      <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
        <CalIcon className="text-myth-accent" size={16} />
        Pending follow-ups grouped by date
      </p>

      {grouped.length === 0 ? (
        <AdminEmptyState message="No scheduled follow-ups" icon={CalIcon} />
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, dayItems]) => (
            <div key={day} className="rounded-xl border border-myth-border/80 bg-myth-surface/30 p-4">
              <h3 className="text-white font-medium mb-3">{day}</h3>
              <div className="space-y-2">
                {dayItems.map((item) => {
                  const href = detailPath(item, item.workflowStage);
                  return (
                    <div key={item._id} className="flex items-center justify-between p-3 rounded-lg bg-myth-surface/50 border border-myth-border/60">
                      <div>
                        <p className="text-white text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {WORKFLOW_STAGE_LABELS[item.workflowStage]} · {ACTIVITY_TYPE_LABELS[item.activityType]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{formatDateTime(item.scheduledAt)}</p>
                        {href && (
                          <Link to={href} className="text-xs text-myth-accent hover:underline">View</Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminContentCard>
  );
}
