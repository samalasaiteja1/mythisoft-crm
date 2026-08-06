import { Link } from 'react-router-dom';
import { Clock, ExternalLink, Ticket, MessageSquare, Activity, UserCog } from 'lucide-react';
import { formatDateTime, TICKET_STATUSES, TICKET_PRIORITIES } from '../../services/api';

const LOG_META = {
  created: {
    label: 'Ticket opened',
    icon: Ticket,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    accent: 'border-l-cyan-500',
    messageBg: 'bg-cyan-500/5 border-cyan-500/15',
  },
  comment: {
    label: 'Reply',
    icon: MessageSquare,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    accent: 'border-l-green-500',
    messageBg: 'bg-green-500/5 border-green-500/15',
  },
  internal_note: {
    label: 'Internal note',
    icon: UserCog,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    accent: 'border-l-amber-500',
    messageBg: 'bg-amber-500/5 border-amber-500/15',
  },
  activity: {
    label: 'Status update',
    icon: Activity,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    accent: 'border-l-purple-500',
    messageBg: 'bg-purple-500/5 border-purple-500/15',
  },
};

function authorInitials(author) {
  if (!author) return 'S';
  const first = author.firstName?.[0] || '';
  const last = author.lastName?.[0] || '';
  const initials = `${first}${last}`.toUpperCase();
  if (initials) return initials;
  return author.email?.[0]?.toUpperCase() || '?';
}

function authorName(author) {
  if (!author) return 'System';
  const name = `${author.firstName || ''} ${author.lastName || ''}`.trim();
  return name || author.email || 'Unknown';
}

function formatRole(role) {
  if (!role) return null;
  return String(role).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusPill({ status }) {
  if (!status) return null;
  const meta = TICKET_STATUSES[status] || {
    label: String(status).replace(/_/g, ' '),
    color: 'bg-gray-500/20 text-gray-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function PriorityPill({ priority }) {
  if (!priority) return null;
  const meta = TICKET_PRIORITIES[priority] || {
    label: priority,
    color: 'bg-gray-500/20 text-gray-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>
      {meta.label}
    </span>
  );
}

export default function TicketHistoryCard({ log }) {
  const meta = LOG_META[log.logType] || LOG_META.activity;
  const Icon = meta.icon || Ticket;
  const displayTitle = log.logType === 'activity' && log.title ? log.title : null;
  const showTicketMeta = log.logType === 'created';

  return (
    <article
      className={`card border border-myth-border/80 border-l-4 ${meta.accent} p-0 overflow-hidden hover:border-myth-accent/25 transition-colors group`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`p-2.5 rounded-xl shrink-0 ${meta.bg} ${meta.color} ring-1 ring-inset ${meta.border}`}>
              <Icon size={18} strokeWidth={1.75} />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${meta.bg} ${meta.color} ring-1 ring-inset ${meta.border}`}>
                  {meta.label}
                </span>
                <Link
                  to={`/tickets/${log.ticketId}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-myth-accent hover:text-orange-300 transition-colors"
                >
                  <Ticket size={14} className="opacity-80" />
                  {log.ticketNumber}
                </Link>
                {showTicketMeta && log.priority && <PriorityPill priority={log.priority} />}
                {showTicketMeta && log.status && <StatusPill status={log.status} />}
              </div>

              {log.subject && (
                <p className="text-sm text-gray-400 line-clamp-1" title={log.subject}>
                  {log.subject}
                </p>
              )}

              {displayTitle && (
                <p className="text-sm font-semibold text-white">{displayTitle}</p>
              )}

              {log.message && (
                <div className={`rounded-xl border px-4 py-3 ${meta.messageBg}`}>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {log.message}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${meta.bg} ${meta.color}`}>
                    {authorInitials(log.author)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{authorName(log.author)}</p>
                    {log.author?.role && (
                      <p className="text-xs text-gray-500">{formatRole(log.author.role)}</p>
                    )}
                  </div>
                </div>

                <span className="hidden sm:block w-px h-8 bg-myth-border/60" />

                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={13} className="shrink-0" />
                  <time dateTime={log.createdAt}>{formatDateTime(log.createdAt)}</time>
                </div>

                {!showTicketMeta && log.status && (
                  <>
                    <span className="hidden sm:block w-px h-5 bg-myth-border/60" />
                    <StatusPill status={log.status} />
                  </>
                )}
              </div>
            </div>
          </div>

          <Link
            to={`/tickets/${log.ticketId}`}
            className="btn-secondary text-xs shrink-0 inline-flex items-center gap-1.5 self-start lg:mt-1 group-hover:border-orange-500/30 group-hover:text-orange-200 transition-colors"
          >
            View ticket
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export { LOG_META };
