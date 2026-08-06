import { Link } from 'react-router-dom';
import {
  UserPlus, Handshake, CheckSquare, TrendingUp, DollarSign, Calendar, Phone,
} from 'lucide-react';
import { formatCurrency } from '../../services/api';

const StatCard = ({ label, value, color, link, icon: Icon, format }) => {
  const display = format === 'currency' ? formatCurrency(value) : format === 'percent' ? `${value ?? 0}%` : value ?? 0;
  return (
    <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 lg:p-4">
      <div className="flex items-center gap-2 text-[10px] lg:text-xs text-gray-500 mb-1">
        {Icon && <Icon size={12} lg:size={14} />}
        {label}
      </div>
      {link ? (
        <Link to={link} className={`text-xl lg:text-2xl font-bold ${color} hover:underline`}>{display}</Link>
      ) : (
        <p className={`text-xl lg:text-2xl font-bold ${color}`}>{display}</p>
      )}
    </div>
  );
};

export default function SalesOverview({ roleStats }) {
  const stats = roleStats?.sales || {};

  const cards = [
    { label: "Today's Follow-ups", value: stats.pendingFollowUps, color: 'text-myth-accent', link: '/follow-ups/today', icon: CheckSquare },
    { label: 'New Leads', value: stats.newLeads, color: 'text-blue-400', link: '/leads', icon: UserPlus },
    { label: 'My Leads', value: stats.myLeads, color: 'text-sky-400', link: '/leads', icon: UserPlus },
    { label: 'Active Deals', value: stats.activeDeals, color: 'text-purple-400', link: '/deals', icon: Handshake },
    { label: 'Won Deals', value: stats.wonDeals, color: 'text-green-400', link: '/deals?stage=won', icon: Handshake },
    { label: 'Sales Target', value: stats.salesTargetProgress, color: 'text-yellow-400', link: '/reports/sales', icon: TrendingUp, format: 'percent' },
    { label: 'Revenue', value: stats.revenue, color: 'text-emerald-400', link: '/reports', icon: DollarSign, format: 'currency' },
    { label: "Today's Meetings", value: stats.todayMeetings, color: 'text-indigo-400', link: '/calendar', icon: Calendar },
    { label: "Today's Calls", value: stats.todaysCalls, color: 'text-cyan-400', link: '/communications', icon: Phone },
  ];

  return (
    <div className="card border-blue-500/20">
      <div className="mb-4 lg:mb-5">
        <h2 className="text-base lg:text-lg font-semibold text-white">Sales Overview</h2>
        <p className="text-xs lg:text-sm text-gray-400 mt-1">Your pipeline, follow-ups, meetings, and revenue at a glance</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  );
}
