import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customersAPI, formatCurrency, formatDate, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SEGMENT_LABELS } from '../../constants/customerNav';

export default function CustomerHubView({ hubType, segmentKey }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    customersAPI.getHub(hubType)
      .then(({ data }) => {
        setItems(data.items || []);
        setStats(data.stats || null);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, [hubType]);

  if (loading) return <LoadingSpinner />;

  const title = SEGMENT_LABELS[segmentKey] || hubType;

  if (hubType === 'reports' && stats) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="stat-card">
              <p className="text-xs text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-2xl font-bold text-white mt-1">{v}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hubType === 'notes') {
    return (
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
        {items.length === 0 ? <p className="text-gray-500 text-sm">No customer notes yet.</p> : items.map((c) => (
          <div key={c._id} className="p-3 rounded-lg bg-myth-surface/50 border border-myth-border">
            <Link to={`/customers/${c._id}`} className="text-myth-accent font-medium hover:underline">{c.firstName} {c.lastName}</Link>
            <p className="text-gray-300 text-sm mt-2 whitespace-pre-wrap">{c.notes}</p>
            <p className="text-xs text-gray-500 mt-1">{formatDateTime(c.updatedAt)}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No records found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-myth-border">
              <th className="pb-3 pr-4">Title</th>
              <th className="pb-3 pr-4">Customer</th>
              <th className="pb-3 pr-4">Date / Status</th>
              <th className="pb-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const customer = item.customer;
              const customerId = customer?._id || item.customer;
              return (
                <tr key={item._id} className="border-b border-myth-border/40">
                  <td className="py-3 pr-4 text-white">{item.title || item.subject || item.name || item.quotationNumber || item.invoiceNumber || item.ticketNumber || '—'}</td>
                  <td className="py-3 pr-4">
                    {customerId ? (
                      <Link
                        to={`/customers/${customerId}`}
                        state={hubType === 'quotations' ? { tab: 'Quotations' } : undefined}
                        className="text-myth-accent hover:underline"
                      >
                        {customer?.firstName ? `${customer.firstName} ${customer.lastName}` : 'View customer'}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="py-3 pr-4 text-gray-400 capitalize">
                    {item.scheduledAt ? formatDateTime(item.scheduledAt) : item.createdAt ? formatDate(item.createdAt) : item.status || item.stage || '—'}
                  </td>
                  <td className="py-3 text-myth-accent">{item.total != null ? formatCurrency(item.total) : item.value != null ? formatCurrency(item.value) : item.amount != null ? formatCurrency(item.amount) : item.budget != null ? formatCurrency(item.budget) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
