import { Link } from 'react-router-dom';
import { ArrowRight, GitBranch, UserPlus, Handshake } from 'lucide-react';
import {
  LEAD_DEAL_GUIDE_ADMIN_LINKS,
  LEAD_DEAL_GUIDE_MANAGER_LINKS,
  LEAD_DEAL_GUIDE_SALES_LINKS,
  LEAD_DEAL_GUIDE_TIMELINE,
} from '../../constants/leadDealFollowUpGuide';

const TRACK_STYLES = {
  lead: 'border-blue-500/30 bg-blue-500/10 hover:border-blue-400/50',
  deal: 'border-purple-500/30 bg-purple-500/10 hover:border-purple-400/50',
  all: 'border-myth-accent/30 bg-myth-accent/10 hover:border-myth-accent/50',
};

export default function LeadDealFollowUpGuide({ variant = 'admin' }) {
  const links = variant === 'manager'
    ? LEAD_DEAL_GUIDE_MANAGER_LINKS
    : variant === 'sales'
      ? LEAD_DEAL_GUIDE_SALES_LINKS
      : LEAD_DEAL_GUIDE_ADMIN_LINKS;
  const leadLinks = links.filter((l) => l.track === 'lead');
  const dealLinks = links.filter((l) => l.track === 'deal');
  const todayLink = links.find((l) => l.track === 'all');

  return (
    <div className="card border-myth-accent/20 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-myth-accent/15 text-myth-accent shrink-0">
          <GitBranch size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Follow leads and deals separately</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-3xl">
            Work <span className="text-blue-300">lead follow-ups</span> until a lead is qualified and converted.
            After convert, use <span className="text-purple-300">deal follow-ups</span> for proposals, negotiation, and close.
            Use <span className="text-myth-accent">Today</span> for your daily due list across all types.
          </p>
        </div>
      </div>

      <div className="mb-4 p-3 rounded-lg border border-myth-border/60 bg-myth-surface/30">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Pipeline flow</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {LEAD_DEAL_GUIDE_TIMELINE.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-300 px-2 py-0.5 rounded bg-myth-surface/60 border border-myth-border/50">
                {step}
              </span>
              {i < LEAD_DEAL_GUIDE_TIMELINE.length - 1 && (
                <ArrowRight size={12} className="text-gray-600 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-300 mb-2 flex items-center gap-1.5">
            <UserPlus size={14} /> Lead track
          </p>
          <div className="grid grid-cols-2 gap-2">
            {leadLinks.map((item) => (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`p-2.5 rounded-lg border text-xs text-center transition-colors ${TRACK_STYLES.lead}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
            <Handshake size={14} /> Deal track
          </p>
          <div className="grid grid-cols-2 gap-2">
            {dealLinks.map((item) => (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`p-2.5 rounded-lg border text-xs text-center transition-colors ${TRACK_STYLES.deal}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {todayLink && (
        <div className="mt-3">
          <Link
            to={todayLink.path}
            className={`block p-2.5 rounded-lg border text-xs text-center transition-colors ${TRACK_STYLES.all}`}
          >
            {todayLink.label}
          </Link>
        </div>
      )}
    </div>
  );
}
