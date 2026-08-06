import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';

const { all, lead, deal } = FOLLOW_UP_PATHS;

const SALES_TILES = [
  { key: 'assignedFollowUps', label: 'Assigned Follow-ups', path: all.root },
  { key: 'leadFollowUps', label: 'Lead Follow-ups', path: lead.list },
  { key: 'unassignedLeadFollowUps', label: 'Unassigned Lead Follow-ups', path: lead.unassigned },
  { key: 'dealFollowUps', label: 'Deal Follow-ups', path: deal.list },
  { key: 'overdueDealFollowUps', label: 'Overdue Deals', path: deal.overdue },
  { key: 'unassignedDealFollowUps', label: 'Unassigned Deal Follow-ups', path: deal.unassigned },
];

const TECH_TILES = [
  { key: 'customerFollowUps', label: 'Customer Follow-ups', path: '/customers/follow-ups' },
  { key: 'todayFollowUps', label: 'Today\'s Follow-ups', path: all.today },
  { key: 'overdueFollowUps', label: 'Overdue Follow-ups', path: all.overdue },
];

const SALES_REP_TILES = [
  { key: 'assignedFollowUps', label: 'My Follow-ups', path: all.root },
  { key: 'todayFollowUps', label: "Today's Follow-ups", path: all.today },
  { key: 'leadFollowUps', label: 'Lead Follow-ups', path: lead.list },
  { key: 'dealFollowUps', label: 'Deal Follow-ups', path: deal.list },
  { key: 'overdueFollowUps', label: 'Overdue Follow-ups', path: all.overdue },
];

const SUPPORT_TILES = [
  { key: 'customerFollowUps', label: 'Customer Follow-ups', path: '/support/follow-ups' },
  { key: 'todayFollowUps', label: "Today's Follow-ups", path: '/support/follow-ups/today' },
  { key: 'overdueFollowUps', label: 'Overdue Follow-ups', path: '/support/follow-ups/overdue' },
];

const SUPPORT_MANAGER_TILES = [
  { key: 'customerFollowUps', label: 'Team Follow-ups', path: '/support/follow-ups' },
  { key: 'todayFollowUps', label: "Today's Follow-ups", path: '/support/follow-ups/today' },
  { key: 'overdueFollowUps', label: 'Overdue Follow-ups', path: '/support/follow-ups/overdue' },
  { key: 'completedFollowUps', label: 'Completed', path: '/support/follow-ups/completed' },
];

export default function FollowUpSummaryPanel({
  overview,
  variant = 'sales',
  title = 'Follow-up Summary',
  todayLink: todayLinkProp,
}) {
  if (!overview) return null;

  const tiles = variant === 'technical'
    ? TECH_TILES
    : variant === 'supportManager' || variant === 'supportAdmin'
      ? SUPPORT_MANAGER_TILES
      : variant === 'support'
        ? SUPPORT_TILES
        : variant === 'salesRep'
          ? SALES_REP_TILES
          : SALES_TILES;

  const todayLink = todayLinkProp
    ?? ((variant === 'support' || variant === 'supportManager' || variant === 'supportAdmin')
      ? '/support/follow-ups/today'
      : all.today);

  return (
    <div className="card border border-myth-border/80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar size={18} className="text-orange-400" /> {title}
        </h3>
        <Link to={todayLink} className="text-sm text-myth-accent hover:underline">Today&apos;s list</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <Link key={tile.key} to={tile.path} className="stat-card hover:border-myth-accent/30 p-4">
            <p className="text-xs text-gray-400">{tile.label}</p>
            <p className="text-xl font-bold text-white mt-1">{overview[tile.key] ?? 0}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
