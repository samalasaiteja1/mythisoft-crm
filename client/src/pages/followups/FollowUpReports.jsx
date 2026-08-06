import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { followupsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ACTIVITY_TYPE_LABELS, WORKFLOW_STAGE_LABELS } from '../../constants/followups';
import {
  AdminContentCard,
  AdminStatStrip,
  AdminEmptyState,
} from '../../components/admin/adminUi';

function ReportSection({ title, rows, renderRow }) {
  return (
    <AdminContentCard title={title}>
      {rows?.length ? (
        <div className="space-y-2">
          {rows.map(renderRow)}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">No data</p>
      )}
    </AdminContentCard>
  );
}

export default function FollowUpReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    followupsAPI.getReports()
      .then(({ data: report }) => setData(report))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <AdminEmptyState message="Unable to load reports" icon={BarChart3} />;

  const totalActivities = data.byActivity?.reduce((s, a) => s + a.count, 0) || 0;

  return (
    <div className="space-y-4">
      <AdminStatStrip stats={[
        { label: 'Completion rate', value: `${data.completionRate}%`, color: 'text-myth-accent' },
        { label: 'Total activities', value: totalActivities, color: 'text-white' },
        { label: 'Active assignees', value: data.byAssignee?.length || 0, color: 'text-purple-400' },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportSection
          title="By activity type"
          rows={data.byActivity}
          renderRow={(row) => (
            <div key={row.activityType} className="flex justify-between items-center p-2 rounded-lg bg-myth-surface/50 border border-myth-border/60">
              <span className="text-gray-300 text-sm">{ACTIVITY_TYPE_LABELS[row.activityType] || row.activityType}</span>
              <span className="text-white text-sm">{row.count} <span className="text-gray-500">({row.completed} done)</span></span>
            </div>
          )}
        />

        <ReportSection
          title="By workflow stage"
          rows={data.byStage}
          renderRow={(row) => (
            <div key={row.stage} className="flex justify-between items-center p-2 rounded-lg bg-myth-surface/50 border border-myth-border/60">
              <span className="text-gray-300 text-sm">{WORKFLOW_STAGE_LABELS[row.stage] || row.stage}</span>
              <span className="text-white text-sm">{row.count} <span className="text-gray-500">({row.pending} pending)</span></span>
            </div>
          )}
        />

        <ReportSection
          title="Top assignees"
          rows={data.byAssignee}
          renderRow={(row, i) => (
            <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-myth-surface/50 border border-myth-border/60">
              <span className="text-gray-300 text-sm">{row.user?.firstName} {row.user?.lastName}</span>
              <span className="text-white text-sm">{row.count} <span className="text-gray-500">({row.completed} done)</span></span>
            </div>
          )}
        />

        <ReportSection
          title="Monthly trend (6 months)"
          rows={data.monthly}
          renderRow={(row) => (
            <div key={row.month} className="flex justify-between items-center p-2 rounded-lg bg-myth-surface/50 border border-myth-border/60">
              <span className="text-gray-300 text-sm">{row.month}</span>
              <span className="text-white text-sm">{row.count}</span>
            </div>
          )}
        />
      </div>
    </div>
  );
}
