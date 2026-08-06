import { useState, useEffect } from 'react';
import { Headphones } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ticketsAPI, TICKET_PRIORITIES } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const TECH_LABELS = {
  assigned: 'Assigned', in_progress: 'In Progress', testing: 'Testing',
  need_information: 'Need Information', resolved: 'Resolved', closed: 'Closed', unassigned: 'Unassigned',
};

export default function AssignedTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketsAPI.getAll()
      .then(({ data }) => {
        const items = data.items || [];
        setTickets(items.filter((t) => String(t.technicalAssignee?._id || t.technicalAssignee) === String(user._id)));
      })
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, [user._id]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Headphones className="text-myth-accent" size={24} /> Assigned Tickets
        </h1>
        <p className="text-gray-400 mt-1">Tickets assigned to you from the support team</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Ticket #</th>
              <th className="table-header">Subject</th>
              <th className="table-header">Priority</th>
              <th className="table-header">Technical Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan={4} className="table-cell text-center text-gray-500 py-8">No assigned tickets</td></tr>
            ) : tickets.map((t) => (
              <tr key={t._id} className="border-t border-myth-border">
                <td className="table-cell">{t.ticketNumber}</td>
                <td className="table-cell">{t.subject}</td>
                <td className="table-cell"><StatusBadge status={t.priority} config={TICKET_PRIORITIES} /></td>
                <td className="table-cell">
                  <span className="badge bg-myth-accent/10 text-myth-accent">
                    {TECH_LABELS[t.technicalStatus] || t.technicalStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
