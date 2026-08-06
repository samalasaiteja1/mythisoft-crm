/** Ticket lifecycle — New → Assigned → Accepted → In Progress → Completed → Reviewed → Resolved → Closed */

export const TICKET_STATUS_FLOW = [
  { value: 'open', label: 'New', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'reopened', label: 'Reopened', color: 'bg-orange-500/20 text-orange-300' },
  { value: 'assigned', label: 'Assigned', color: 'bg-yellow-500/20 text-yellow-300' },
  { value: 'accepted', label: 'Accepted', color: 'bg-indigo-500/20 text-indigo-300' },
  { value: 'working', label: 'In Progress', color: 'bg-cyan-500/20 text-cyan-300' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-500/20 text-purple-300' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-violet-500/20 text-violet-300' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500/20 text-green-400' },
  { value: 'waiting_customer', label: 'Awaiting Confirmation', color: 'bg-amber-500/20 text-amber-300' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-500/20 text-gray-300' },
];

export const TICKET_WORKER_NEXT_STATUSES = {
  assigned: 'accepted',
  accepted: 'working',
  working: 'completed',
};

export function ticketStatusMeta(status) {
  const key = typeof status === 'string' ? status : '';
  return TICKET_STATUS_FLOW.find((s) => s.value === key) || {
    value: key,
    label: key ? key.replace(/_/g, ' ') : '—',
    color: 'bg-gray-500/20 text-gray-300',
  };
}

export function canCustomerConfirm(status) {
  return ['resolved', 'waiting_customer'].includes(status);
}

export function canCustomerReopen(status) {
  return ['resolved', 'closed', 'waiting_customer'].includes(status);
}

export function isTicketAssignee(userId, ticket) {
  const uid = String(userId || '');
  if (!uid) return false;
  const supportId = String(ticket?.supportAssignee?._id || ticket?.supportAssignee || '');
  const techId = String(ticket?.technicalAssignee?._id || ticket?.technicalAssignee || '');
  return uid === supportId || uid === techId;
}
