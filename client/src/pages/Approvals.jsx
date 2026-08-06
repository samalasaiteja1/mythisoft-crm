import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { quotationsAPI, formatCurrency, QUOTATION_STATUSES } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Approvals() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    quotationsAPI.getAll({ status: 'sent' })
      .then(({ data }) => setQuotations(data.items || []))
      .catch(() => toast.error('Failed to load approvals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleApprove = async (id) => {
    try {
      await quotationsAPI.approve(id);
      toast.success('Quotation approved');
      fetch();
    } catch { toast.error('Approval failed'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Approvals</h1>
        <p className="text-gray-400 mt-1">Review and approve pending quotations</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Quote #</th>
              <th className="table-header">Title</th>
              <th className="table-header">Amount</th>
              <th className="table-header">Status</th>
              <th className="table-header text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr><td colSpan={5} className="table-cell text-center text-gray-500 py-8">No pending approvals</td></tr>
            ) : quotations.map((q) => (
              <tr key={q._id} className="border-t border-myth-border">
                <td className="table-cell">{q.quotationNumber}</td>
                <td className="table-cell">{q.title}</td>
                <td className="table-cell">{formatCurrency(q.total)}</td>
                <td className="table-cell"><StatusBadge status={q.status} config={QUOTATION_STATUSES} /></td>
                <td className="table-cell text-right">
                  <button onClick={() => handleApprove(q._id)} className="btn-primary text-sm flex items-center gap-1 ml-auto">
                    <CheckCircle size={16} /> Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link to="/quotations" className="text-myth-accent hover:underline text-sm">View all quotations →</Link>
    </div>
  );
}
