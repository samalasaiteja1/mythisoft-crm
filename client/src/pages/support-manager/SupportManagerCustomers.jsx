import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { customersAPI, ticketsAPI, projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';
import {
  SupportManagerPageShell,
  SupportManagerPageHeader,
  SupportManagerStatStrip,
  SupportManagerContentCard,
  SupportManagerEmptyState,
} from '../../components/supportManager/supportManagerUi';

const personName = (c) => `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.companyName || '—';

export default function SupportManagerCustomers() {
  const [customers, setCustomers] = useState([]);
  const [ticketCounts, setTicketCounts] = useState({});
  const [projectCounts, setProjectCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customersAPI.getAll({ limit: 200 }),
      ticketsAPI.getAll({ limit: 500 }),
      projectsAPI.getAll({ limit: 200 }),
    ])
      .then(([custRes, ticketRes, projectRes]) => {
        const custs = custRes.data?.items || custRes.data?.customers || custRes.data || [];
        setCustomers(Array.isArray(custs) ? custs : []);

        const openByCustomer = {};
        (ticketRes.data?.items || []).forEach((t) => {
          if (!t.customer || ['closed', 'resolved'].includes(t.status)) return;
          const id = String(t.customer._id || t.customer);
          openByCustomer[id] = (openByCustomer[id] || 0) + 1;
        });
        setTicketCounts(openByCustomer);

        const projByCustomer = {};
        (projectRes.data?.items || []).forEach((p) => {
          if (!p.customer) return;
          const id = String(p.customer._id || p.customer);
          projByCustomer[id] = (projByCustomer[id] || 0) + 1;
        });
        setProjectCounts(projByCustomer);
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const withOpenTickets = customers.filter((c) => (ticketCounts[String(c._id)] || 0) > 0).length;
  const withProjects = customers.filter((c) => (projectCounts[String(c._id)] || 0) > 0).length;
  const totalOpenTickets = Object.values(ticketCounts).reduce((a, b) => a + b, 0);

  const stats = [
    { label: 'Customers', value: customers.length, color: 'text-white' },
    { label: 'With open tickets', value: withOpenTickets, color: 'text-amber-400', highlight: withOpenTickets > 0 },
    { label: 'Open tickets', value: totalOpenTickets, color: 'text-orange-400', link: '/support/tickets/all' },
    { label: 'With projects', value: withProjects, color: 'text-blue-400' },
    { label: 'Follow-ups', value: withOpenTickets, color: 'text-purple-400', link: '/support/follow-ups/today' },
  ];

  return (
    <SupportManagerPageShell>
      <SupportManagerPageHeader
        icon={Users}
        title="Customers"
        subtitle="Support customers — active projects, open tickets, and contact actions."
        workflow={['View customer', 'Check tickets & projects', 'Schedule follow-up', 'Resolve issues']}
      />

      <SupportManagerStatStrip stats={stats} />

      <SupportManagerContentCard title={`Customer directory (${customers.length})`}>
        {customers.length === 0 ? (
          <SupportManagerEmptyState message="No customers found." icon={Users} />
        ) : (
          <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-header">Customer</th>
              <th className="table-header">Company</th>
              <th className="table-header">Active Projects</th>
              <th className="table-header">Open Tickets</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? null : customers.map((c) => {
              const id = String(c._id);
              return (
                <tr key={id} className="border-t border-myth-border hover:bg-myth-surface/30 transition-colors">
                  <td className="table-cell text-white font-medium">{personName(c)}</td>
                  <td className="table-cell text-gray-300">{c.companyName || c.company?.name || '—'}</td>
                  <td className="table-cell text-gray-400">{projectCounts[id] || 0}</td>
                  <td className="table-cell text-gray-400">{ticketCounts[id] || 0}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/customers/${id}`} className="text-myth-accent hover:underline text-xs">View</Link>
                      <Link to={`/tickets?customer=${id}`} className="text-gray-400 hover:underline text-xs">Tickets</Link>
                      <Link to={FOLLOW_UP_PATHS.support.addWithCustomer(id)} className="text-gray-400 hover:underline text-xs">Follow-up</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
          </div>
        )}
      </SupportManagerContentCard>
    </SupportManagerPageShell>
  );
}
