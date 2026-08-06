import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsAPI, formatDateTime, TICKET_STATUSES, TICKET_PRIORITIES } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

export default function CustomerChangeRequestDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmRating, setConfirmRating] = useState(0);

  const load = () => ticketsAPI.getOne(id)
    .then(({ data }) => setItem(data))
    .catch(() => toast.error('Change request not found'));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const { data } = await ticketsAPI.addComment(id, { message: message.trim() });
      setItem(data);
      setMessage('');
      toast.success('Comment sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send comment');
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      const { data } = await ticketsAPI.confirmResolution(id, confirmRating ? { rating: confirmRating } : {});
      setItem(data);
      toast.success('Change accepted — request closed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    const reopenMessage = window.prompt('Optional: describe what still needs to change');
    if (reopenMessage === null) return;
    setActionLoading(true);
    try {
      const { data } = await ticketsAPI.reopen(id, { message: reopenMessage });
      setItem(data);
      toast.success('Change request reopened');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reopen');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Change request not found</p>
        <Link to="/change-requests" className="text-myth-accent hover:underline text-sm mt-2 inline-block">Back</Link>
      </div>
    );
  }

  const comments = [...(item.comments || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="space-y-6">
      <Link to="/change-requests" className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back to Change Requests
      </Link>

      <div className="card">
        <p className="text-sm text-myth-accent font-mono">{item.ticketNumber}</p>
        <h1 className="text-2xl font-bold text-white mt-1">{item.subject}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          <StatusBadge status={item.priority} config={TICKET_PRIORITIES} />
          <StatusBadge status={item.status} config={TICKET_STATUSES} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-3 text-sm">
          <h3 className="text-lg font-semibold text-white">Request Details</h3>
          <div><span className="text-gray-500">Project</span><p className="text-white">{item.project?.name || '—'}</p></div>
          <div><span className="text-gray-500">Change Type</span><p className="text-white">{item.changeType || '—'}</p></div>
          <div><span className="text-gray-500">Description</span><p className="text-gray-300 whitespace-pre-wrap">{item.description || '—'}</p></div>
          <div><span className="text-gray-500">Business Reason</span><p className="text-gray-300 whitespace-pre-wrap">{item.businessReason || '—'}</p></div>
          <div><span className="text-gray-500">Submitted</span><p className="text-gray-300">{formatDateTime(item.createdAt)}</p></div>
          <div><span className="text-gray-500">Expected Completion</span><p className="text-gray-300">{item.expectedCompletion ? new Date(item.expectedCompletion).toLocaleDateString() : '—'}</p></div>
          {item.closedAt && (
            <div><span className="text-gray-500">Completion Date</span><p className="text-gray-300">{formatDateTime(item.closedAt)}</p></div>
          )}
          {['resolved', 'waiting_customer'].includes(item.status) && (
            <div className="border-t border-myth-border pt-4 space-y-3">
              <p className="text-sm text-emerald-300">Your change has been implemented — please review and confirm.</p>
              <div>
                <p className="text-xs text-gray-400 mb-2">Rate your experience (optional)</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setConfirmRating(value === confirmRating ? 0 : value)}
                      className="p-1 rounded hover:bg-myth-surface transition-colors"
                    >
                      <Star size={18} className={value <= confirmRating ? 'fill-amber-300 text-amber-300' : 'text-gray-500'} />
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={handleConfirm} disabled={actionLoading} className="btn-primary text-sm w-full">
                Accept Change
              </button>
              <button type="button" onClick={handleReopen} disabled={actionLoading} className="btn-secondary text-sm w-full">
                Request Further Changes
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Conversation</h3>
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500">No comments yet.</p>
            ) : comments.map((c) => {
              const author = c.author;
              const name = author ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email : 'User';
              return (
                <div key={c._id} className="p-3 rounded-lg border border-myth-border bg-myth-surface/30">
                  <div className="flex justify-between gap-2 mb-1">
                    <p className="text-sm text-white">{name}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(c.createdAt)}</p>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.message}</p>
                </div>
              );
            })}
          </div>
          <form onSubmit={handleReply} className="space-y-3 border-t border-myth-border pt-4">
            <textarea className="input-field w-full min-h-[80px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a comment..." />
            <button type="submit" disabled={sending || !message.trim()} className="btn-primary inline-flex items-center gap-2 text-sm">
              <Send size={14} /> {sending ? 'Sending…' : 'Send Comment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
