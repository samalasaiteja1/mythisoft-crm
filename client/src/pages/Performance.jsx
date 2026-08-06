import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { performanceAPI, formatCurrency } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminStatStrip,
  AdminContentCard,
  AdminEmptyState,
} from '../components/admin/adminUi';

function MetricList({ items, renderItem, emptyMessage }) {
  if (!items?.length) return <AdminEmptyState message={emptyMessage} icon={TrendingUp} />;
  return (
    <div className="space-y-2">
      {items.map((item, i) => renderItem(item, i))}
    </div>
  );
}

export default function Performance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    performanceAPI.get()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <AdminEmptyState message="Failed to load performance data" icon={TrendingUp} />;

  const totalRevenue = data.salesPerformance?.reduce((s, r) => s + (r.totalRevenue || 0), 0) || 0;
  const totalDeals = data.salesPerformance?.reduce((s, r) => s + (r.totalDeals || 0), 0) || 0;
  const activeDepts = data.departmentStats?.length || 0;
  const supportResolved = data.supportStats?.reduce((s, r) => s + (r.resolved || 0), 0) || 0;

  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={TrendingUp}
        title="Performance"
        subtitle="Employee performance, department metrics, and support ratings"
        meta={`${data.salesPerformance?.length || 0} sales reps · ${activeDepts} departments · ${data.supportStats?.length || 0} support agents`}
      />

      <AdminStatStrip stats={[
        { label: 'Total revenue', value: formatCurrency(totalRevenue), color: 'text-myth-accent' },
        { label: 'Deals closed', value: totalDeals, color: 'text-green-400' },
        { label: 'Departments', value: activeDepts, color: 'text-purple-400' },
        { label: 'Tickets resolved', value: supportResolved, color: 'text-orange-400' },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminContentCard title="Sales performance">
          <MetricList
            items={data.salesPerformance}
            emptyMessage="No sales data yet"
            renderItem={(s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-myth-surface/50 border border-myth-border/60">
                <div>
                  <p className="text-white font-medium">{s.name || 'Unassigned'}</p>
                  <p className="text-xs text-gray-500">{s.totalDeals} deals closed</p>
                </div>
                <p className="text-myth-accent font-bold">{formatCurrency(s.totalRevenue)}</p>
              </div>
            )}
          />
        </AdminContentCard>

        <AdminContentCard title="Department performance">
          <MetricList
            items={data.departmentStats}
            emptyMessage="No departments yet"
            renderItem={(d) => (
              <div key={d._id} className="flex items-center justify-between p-3 rounded-lg bg-myth-surface/50 border border-myth-border/60">
                <div>
                  <p className="text-white font-medium">{d.name}</p>
                  <p className="text-xs text-gray-500">
                    Manager: {d.manager ? `${d.manager.firstName} ${d.manager.lastName}` : 'Not assigned'}
                  </p>
                </div>
                <span className="badge bg-green-500/20 text-green-400">Active</span>
              </div>
            )}
          />
        </AdminContentCard>

        <AdminContentCard title="Support performance">
          <MetricList
            items={data.supportStats}
            emptyMessage="No support data yet"
            renderItem={(s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-myth-surface/50 border border-myth-border/60">
                <p className="text-white">{s.name || 'Unassigned'}</p>
                <p className="text-sm text-gray-400">{s.resolved}/{s.total} resolved</p>
              </div>
            )}
          />
        </AdminContentCard>

        <AdminContentCard title="Task performance">
          <MetricList
            items={data.taskStats}
            emptyMessage="No task data yet"
            renderItem={(t, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-myth-surface/50 border border-myth-border/60">
                <p className="text-white">{t.name || 'Unassigned'}</p>
                <p className="text-sm text-gray-400">{t.completed} done · {t.pending} pending</p>
              </div>
            )}
          />
        </AdminContentCard>
      </div>
    </AdminPageShell>
  );
}
