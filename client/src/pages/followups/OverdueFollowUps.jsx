import { useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import FollowUpListTable from '../../components/followups/FollowUpListTable';
import { useFollowUpList, useFollowUpStats } from '../../components/followups/useFollowUpList';
import { AdminContentCard } from '../../components/admin/adminUi';

const STAGE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'deal', label: 'Deals' },
  { key: 'lead', label: 'Leads' },
  { key: 'customer', label: 'Customers' },
];

export default function OverdueFollowUps() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stage = searchParams.get('stage') || 'all';
  const stats = useFollowUpStats();

  const query = stage === 'all' ? { filter: 'overdue' } : { filter: 'overdue', workflowStage: stage };
  const { items, loading, refresh } = useFollowUpList(query);

  const setStage = (key) => {
    if (key === 'all') setSearchParams({});
    else setSearchParams({ stage: key });
  };

  const countFor = (key) => {
    if (key === 'all') return stats.overdue ?? 0;
    if (key === 'deal') return stats.overdueDeals ?? 0;
    return null;
  };

  if (loading) return <LoadingSpinner />;

  const stageLabel = stage === 'all' ? '' : ` ${stage}`;

  return (
    <AdminContentCard
      title="Overdue follow-ups"
      toolbar={(
        <div className="flex flex-wrap gap-2">
          {STAGE_TABS.map((tab) => {
            const count = countFor(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStage(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  stage === tab.key
                    ? 'border-red-500/40 bg-red-500/10 text-red-300 font-medium'
                    : 'border-myth-border text-gray-400 hover:text-white hover:border-myth-border/80'
                }`}
              >
                {tab.label}
                {count != null ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      )}
    >
      <p className="text-sm text-gray-500 mb-4">Pending activities past their scheduled date or marked overdue in the form</p>
      <FollowUpListTable
        items={items}
        stage={stage === 'all' ? undefined : stage}
        showStageColumn={stage === 'all'}
        onRefresh={refresh}
        emptyMessage={`No overdue${stageLabel} follow-ups — you're on track!`}
      />
    </AdminContentCard>
  );
}
