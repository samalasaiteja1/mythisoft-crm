import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';

const CUSTOMER_STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-500/20 text-green-400' },
  inactive: { label: 'Inactive', color: 'bg-gray-500/20 text-gray-400' },
  new: { label: 'New', color: 'bg-blue-500/20 text-blue-400' },
  prospect: { label: 'Prospect', color: 'bg-purple-500/20 text-purple-300' },
  vip: { label: 'VIP', color: 'bg-amber-500/20 text-amber-300' },
};

export default function SupportPersonMyCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    customersAPI.getAll({ limit: 200 })
      .then(({ data }) => {
        if (cancelled) return;
        const list = data?.customers || data?.items || (Array.isArray(data) ? data : []);
        setCustomers(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load customers');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    return name.includes(q) || (c.companyName || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={24} className="text-blue-400" /> My Customers
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Customers linked to your assigned projects and support tickets.
        </p>
      </div>

      <div className="card">
        <input
          className="input-field w-full max-w-md mb-4"
          placeholder="Search by name, company, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No customers assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-myth-border">
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Company</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} className="border-t border-myth-border/50 hover:bg-myth-surface/30">
                    <td className="py-3 pr-4 text-white font-medium">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="py-3 pr-4 text-gray-300">{c.companyName || '—'}</td>
                    <td className="py-3 pr-4 text-gray-400">{c.email || '—'}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={c.status || 'active'} config={CUSTOMER_STATUS_CONFIG} />
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/customers/${c._id}`} className="text-myth-accent hover:underline text-xs">View</Link>
                        <Link to={FOLLOW_UP_PATHS.support.addWithCustomer(c._id)} className="text-orange-300 hover:underline text-xs">Follow-up</Link>
                        <Link to="/support/tickets/assigned" className="text-gray-400 hover:underline text-xs">Tickets</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
