import { Link } from 'react-router-dom';
import { formatCurrency } from '../../services/api';

export default function DashboardStatCards({ cards, stats, roleStats, getValue }) {
  if (!cards?.length) return null;

  const resolve = getValue || ((card) => {
    const source = card.roleKey ? roleStats : stats;
    const val = source?.[card.key] ?? stats?.[card.key] ?? 0;
    if (card.format === 'currency') return formatCurrency(val);
    if (card.format === 'percent') return `${val}%`;
    if (card.format === 'hours') return `${val}h`;
    if (card.format === 'rating') return val ? `${val}/5` : 'N/A';
    if (card.format === 'text') return val || 'N/A';
    return val;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
      {cards.map((card) => (
        <Link key={card.label} to={card.link} className="stat-card hover:border-myth-accent/30 transition-all group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs lg:text-sm text-gray-400">{card.label}</p>
              <p className="text-xl lg:text-2xl font-bold text-white mt-1 truncate">{resolve(card)}</p>
            </div>
            <div className={`p-2 lg:p-3 rounded-lg bg-myth-surface ${card.color} group-hover:scale-110 transition-transform shrink-0`}>
              <card.icon size={18} lg:size={22} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
