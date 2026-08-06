import { useEffect, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import { ArrowLeft, Send, Headphones, Star, Paperclip } from 'lucide-react';

import toast from 'react-hot-toast';

import { ticketsAPI, formatDateTime, TICKET_STATUSES, TICKET_PRIORITIES } from '../../services/api';

import LoadingSpinner from '../../components/LoadingSpinner';

import StatusBadge from '../../components/StatusBadge';

import SupportContactCard from '../../components/support/SupportContactCard';

import TicketWorkflowPanel from '../../components/support/TicketWorkflowPanel';

import { usePermissions } from '../../hooks/usePermissions';



export default function TicketDetail() {

  const { id } = useParams();

  const { isCustomer, isAdmin, isManager, canAction } = usePermissions();

  const [ticket, setTicket] = useState(null);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState('');

  const [sending, setSending] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [confirmRating, setConfirmRating] = useState(0);
  const [confirmSatisfied, setConfirmSatisfied] = useState('yes');
  const [confirmComments, setConfirmComments] = useState('');



  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;
    setLoading(true);
    setTicket(null);

    ticketsAPI.getOne(id)
      .then(({ data }) => {
        if (!cancelled) setTicket(data);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.response?.data?.message || 'Ticket not found');
          setTicket(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);



  const handleReply = async (e) => {

    e.preventDefault();

    if (!message.trim()) return;

    setSending(true);

    try {

      const { data } = await ticketsAPI.addComment(id, { message: message.trim() });

      setTicket(data);

      setMessage('');

      toast.success('Reply sent');

    } catch (err) {

      toast.error(err.response?.data?.message || 'Failed to send reply');

    } finally {

      setSending(false);

    }

  };



  const handleConfirmResolution = async () => {
    if (confirmSatisfied === 'no') {
      handleReopenWithMessage(confirmComments);
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await ticketsAPI.confirmResolution(id, {
        ...(confirmRating ? { rating: confirmRating } : {}),
        comments: confirmComments.trim(),
      });
      setTicket(data);
      toast.success('Resolution confirmed — ticket closed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm resolution');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenWithMessage = async (message) => {
    setActionLoading(true);
    try {
      const { data } = await ticketsAPI.reopen(id, { message: message || confirmComments });
      setTicket(data);
      toast.success('Ticket reopened — support manager will assign again');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reopen ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!confirmComments.trim() && !window.confirm('Reopen this ticket without comments?')) return;
    handleReopenWithMessage(confirmComments);
  };



  if (loading) return <LoadingSpinner />;

  if (!ticket) {

    return (

      <div className="text-center py-12">

        <p className="text-gray-400">Ticket not found</p>

        <Link to="/tickets" className="text-myth-accent hover:underline text-sm mt-2 inline-block">Back to tickets</Link>

      </div>

    );

  }



  const comments = [...(ticket.comments || [])].sort(

    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),

  );



  const supportContact = isCustomer

    ? ticket.supportAssignee

    : ticket.supportAssignee;



  return (

    <div className="space-y-6">

      <Link to={isCustomer ? '/tickets' : '/tickets'} className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">

        <ArrowLeft size={16} /> Back

      </Link>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <div className="card">

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

              <div>

                <p className="text-sm text-myth-accent font-mono">{ticket.ticketNumber}</p>

                <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">

                  <Headphones size={22} className="text-orange-400" />

                  {ticket.subject}

                </h1>

                <p className="text-sm text-gray-500 mt-2">

                  Opened {formatDateTime(ticket.createdAt)}

                  {ticket.updatedAt && <> · Updated {formatDateTime(ticket.updatedAt)}</>}

                  {ticket.customer && !isCustomer && (

                    <> · {ticket.customer.firstName} {ticket.customer.lastName}</>

                  )}

                  {ticket.project && (

                    <> · Project: {ticket.project.name || 'Linked project'}</>

                  )}

                </p>

              </div>

              <div className="flex flex-wrap gap-2">

                <StatusBadge status={ticket.priority} config={TICKET_PRIORITIES} />

                <StatusBadge status={ticket.status} config={TICKET_STATUSES} />

                {ticket.requestKind === 'change_request' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Change request
                  </span>
                )}

                {ticket.escalated && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Escalated
                  </span>
                )}

              </div>

            </div>

            {ticket.description && (

              <div className="mt-4 p-4 rounded-lg bg-myth-surface/40 border border-myth-border">

                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Description</p>

                <p className="text-sm text-gray-300 whitespace-pre-wrap">{ticket.description}</p>

              </div>

            )}

            {(ticket.module || ticket.category || ticket.issueCategoryGroup || ticket.stepsToReproduce || ticket.preferredContact) && (
              <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                {ticket.module && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Module</p>
                    <p className="text-gray-300">{ticket.module}</p>
                  </div>
                )}
                {ticket.category && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Issue category</p>
                    <p className="text-gray-300">
                      {ticket.category}
                      {ticket.issueCategoryGroup && (
                        <span className="text-xs text-gray-500 block">{ticket.issueCategoryGroup}</span>
                      )}
                    </p>
                  </div>
                )}
                {ticket.preferredContact && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Preferred contact</p>
                    <p className="text-gray-300 capitalize">{ticket.preferredContact}</p>
                  </div>
                )}
              </div>
            )}

            {ticket.stepsToReproduce && (
              <div className="mt-4 p-4 rounded-lg bg-myth-surface/40 border border-myth-border">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Steps to reproduce</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{ticket.stepsToReproduce}</p>
              </div>
            )}

            {ticket.attachments?.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-myth-surface/40 border border-myth-border">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Paperclip size={12} /> Attachments
                </p>
                <ul className="space-y-2">
                  {ticket.attachments.map((file) => (
                    <li key={file._id || file.url}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-myth-accent hover:underline"
                      >
                        {file.name || 'Download file'}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ticket.rating && (
              <p className="text-sm text-gray-400 mt-3">
                Customer rating:{' '}
                <span className="text-amber-300 inline-flex items-center gap-0.5">
                  {Array.from({ length: ticket.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-300 text-amber-300" />
                  ))}
                </span>
              </p>
            )}

            {isCustomer && ticket.category && (
              <p className="text-sm text-gray-400 mt-3">Category: <span className="text-gray-300">{ticket.category}</span></p>
            )}

            {isCustomer && ticket.supportAssignee && (
              <p className="text-sm text-gray-400 mt-1">
                Assigned Support Executive:{' '}
                <span className="text-gray-300">
                  {ticket.supportAssignee.firstName} {ticket.supportAssignee.lastName}
                </span>
              </p>
            )}

          </div>



          <div className="card">

            <h2 className="text-lg font-semibold text-white mb-4">Support conversation</h2>

            <div className="space-y-4 mb-6">

              {comments.length === 0 ? (

                <p className="text-sm text-gray-500">No replies yet. Support team will respond soon.</p>

              ) : comments.map((comment) => {

                const author = comment.author;

                const name = author

                  ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email

                  : 'User';

                const isStaff = author && author.role !== 'customer';



                return (

                  <div

                    key={comment._id}

                    className={`p-4 rounded-lg border ${

                      isStaff ? 'border-myth-accent/20 bg-myth-accent/5' : 'border-myth-border bg-myth-surface/30'

                    }`}

                  >

                    <div className="flex items-center justify-between gap-2 mb-2">

                      <p className="text-sm font-medium text-white">

                        {name}

                        {author?.role && <span className="text-xs text-gray-500 ml-2 capitalize">({author.role})</span>}

                      </p>

                      <p className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</p>

                    </div>

                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.message}</p>

                  </div>

                );

              })}

            </div>



            {canAction('tickets', 'update') && (

              <form onSubmit={handleReply} className="space-y-3 border-t border-myth-border pt-4">

                <label className="block text-sm text-gray-400">Add a reply</label>

                <textarea

                  className="input-field w-full min-h-[100px]"

                  value={message}

                  onChange={(e) => setMessage(e.target.value)}

                  placeholder={isCustomer ? 'Describe your issue or ask a question...' : 'Reply to customer...'}

                />

                <button type="submit" disabled={sending || !message.trim()} className="btn-primary inline-flex items-center gap-2">

                  <Send size={14} />

                  {sending ? 'Sending...' : 'Send reply'}

                </button>

              </form>

            )}

          </div>

        </div>



        <div className="space-y-6">

          <SupportContactCard

            contact={supportContact}

            title={isCustomer ? 'Your Support Contact' : 'Assigned Support'}

          />



          {isCustomer && (
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold text-white">Confirm Resolution</h3>
              {['resolved', 'waiting_customer'].includes(ticket.status) ? (
                <>
                  <p className="text-xs text-gray-400">Was your issue resolved?</p>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input type="radio" name="satisfied" value="yes" checked={confirmSatisfied === 'yes'} onChange={() => setConfirmSatisfied('yes')} />
                      Yes — close ticket
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input type="radio" name="satisfied" value="no" checked={confirmSatisfied === 'no'} onChange={() => setConfirmSatisfied('no')} />
                      No — reopen ticket
                    </label>
                  </div>
                  {confirmSatisfied === 'yes' && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Rate your support experience (optional)</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setConfirmRating(value === confirmRating ? 0 : value)}
                            className="p-1 rounded hover:bg-myth-surface transition-colors"
                            aria-label={`Rate ${value} stars`}
                          >
                            <Star
                              size={20}
                              className={value <= confirmRating ? 'fill-amber-300 text-amber-300' : 'text-gray-500'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Comments</label>
                    <textarea
                      className="input-field w-full min-h-[72px] text-sm"
                      value={confirmComments}
                      onChange={(e) => setConfirmComments(e.target.value)}
                      placeholder={confirmSatisfied === 'yes' ? 'Optional feedback…' : 'Describe what is still wrong…'}
                    />
                  </div>
                  <button type="button" onClick={handleConfirmResolution} disabled={actionLoading} className="btn-primary text-sm w-full">
                    {actionLoading ? 'Submitting…' : confirmSatisfied === 'yes' ? 'Submit — Close Ticket' : 'Submit — Reopen Ticket'}
                  </button>
                </>
              ) : ['closed'].includes(ticket.status) ? (
                <button type="button" onClick={handleReopen} disabled={actionLoading} className="btn-secondary text-sm w-full">
                  Reopen Ticket
                </button>
              ) : (
                <p className="text-xs text-gray-500">Support is working on your ticket. You can confirm resolution once it is marked resolved.</p>
              )}
              <Link to="/support-logs" className="block text-center text-sm text-myth-accent hover:underline">View ticket history</Link>
            </div>
          )}



          {!isCustomer && (
            <TicketWorkflowPanel ticket={ticket} onUpdated={setTicket} />
          )}

        </div>

      </div>

    </div>

  );

}


