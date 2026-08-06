import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Headphones, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsAPI, TICKET_STATUSES, TICKET_PRIORITIES, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { SUPPORT_MANAGER_TICKET_TABS } from '../../constants/supportManagerNav';
import {
  SupportManagerPageShell,
  SupportManagerPageHeader,
  SupportManagerStatStrip,
  SupportManagerTabBar,
  SupportManagerContentCard,
  SupportManagerEmptyState,
} from '../../components/supportManager/supportManagerUi';

const VIEW_CONFIG = {
  all: {
    title: 'All Tickets',
    subtitle: 'View every customer support ticket across your team.',
    filter: (items) => items.filter((t) => t.requestKind !== 'change_request'),
  },
  assigned: {
    title: 'Assigned Tickets',
    subtitle: 'Tickets assigned to support executives — monitor progress and escalations.',
    filter: (items) => items.filter((t) => t.supportAssignee && t.status !== 'closed' && t.requestKind !== 'change_request'),
  },
  escalated: {
    title: 'Escalated Tickets',
    subtitle: 'Tickets sent to the technical team for deeper investigation.',
    filter: (items) => items.filter((t) => t.escalated && t.status !== 'closed'),
  },
  closed: {
    title: 'Closed Tickets',
    subtitle: 'Completed and closed support tickets for reference.',
    filter: (items) => items.filter((t) => t.status === 'closed' && t.requestKind !== 'change_request'),
  },
};

const personName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—');

export default function SupportManagerTickets() {
  const { view = 'all' } = useParams();
  const config = VIEW_CONFIG[view] || VIEW_CONFIG.all;
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ticketsAPI.getAll({ limit: 200 })
      .then(({ data }) => setAllItems(data.items || []))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => config.filter(allItems), [allItems, config]);

  const tabCounts = useMemo(() => {
    const map = {};
    SUPPORT_MANAGER_TICKET_TABS.forEach((tab) => {
      const tabConfig = VIEW_CONFIG[tab.key];
      map[tab.key] = tabConfig ? tabConfig.filter(allItems).length : 0;
    });
    return map;
  }, [allItems]);

  const stats = useMemo(() => {
    const supportTickets = allItems.filter((t) => t.requestKind !== 'change_request');
    const open = supportTickets.filter((t) => !['closed', 'resolved'].includes(t.status));
    const unassigned = open.filter((t) => !t.supportAssignee);
    const escalated = supportTickets.filter((t) => t.escalated && t.status !== 'closed');
    const highPriority = open.filter((t) => ['high', 'urgent'].includes(t.priority));
    return [
      { label: 'Open tickets', value: open.length, color: 'text-white', highlight: open.length > 0 },
      { label: 'Unassigned', value: unassigned.length, color: 'text-rose-400', highlight: unassigned.length > 0 },
      { label: 'Escalated', value: escalated.length, color: 'text-orange-400', link: '/support/tickets/escalated' },
      { label: 'High priority', value: highPriority.length, color: 'text-amber-400' },
      { label: 'Closed', value: supportTickets.filter((t) => t.status === 'closed').length, color: 'text-gray-400', link: '/support/tickets/closed' },
    ];
  }, [allItems]);

  const tabs = useMemo(
    () => SUPPORT_MANAGER_TICKET_TABS.map((tab) => ({ ...tab, count: tabCounts[tab.key] })),
    [tabCounts],
  );

  if (loading) return <LoadingSpinner />;

  const HeaderIcon = view === 'escalated' ? AlertTriangle : Headphones;

  return (
    <SupportManagerPageShell>
      <SupportManagerPageHeader
        icon={HeaderIcon}
        title={config.title}
        subtitle={config.subtitle}
        workflow={['New ticket', 'Assign executive', 'Resolve or escalate', 'Close']}
      />

      <SupportManagerStatStrip stats={stats} />

      <SupportManagerTabBar tabs={tabs} activeKey={view} />

      <SupportManagerContentCard title={`${config.title} (${items.length})`}>
        {items.length === 0 ? (
          <SupportManagerEmptyState message="No tickets in this queue." icon={Headphones} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header">Ticket ID</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Subject</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Assignee</th>
                  <th className="table-header">Updated</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t._id} className="border-t border-myth-border hover:bg-myth-surface/30 transition-colors">
                    <td className="table-cell font-mono text-myth-accent">{t.ticketNumber}</td>
                    <td className="table-cell text-gray-300">{personName(t.customer)}</td>
                    <td className="table-cell text-white">{t.subject}</td>
                    <td className="table-cell"><StatusBadge status={t.priority} config={TICKET_PRIORITIES} /></td>
                    <td className="table-cell"><StatusBadge status={t.status} config={TICKET_STATUSES} /></td>
                    <td className="table-cell text-gray-400 text-xs">
                      {t.supportAssignee ? personName(t.supportAssignee) : <span className="text-rose-400">Unassigned</span>}
                    </td>
                    <td className="table-cell text-gray-400">{formatDateTime(t.updatedAt)}</td>
                    <td className="table-cell">
                      <Link to={`/tickets/${t._id}`} className="text-myth-accent hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SupportManagerContentCard>
    </SupportManagerPageShell>
  );
}
