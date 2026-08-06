import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionsAPI, companiesAPI, formatCurrency, formatDate } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const PLAN_CONFIG = {
  starter: { label: 'Starter', color: 'bg-gray-500/20 text-gray-400' },
  professional: { label: 'Professional', color: 'bg-blue-500/20 text-blue-400' },
  enterprise: { label: 'Enterprise', color: 'bg-purple-500/20 text-purple-400' },
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-500/20 text-green-400' },
  trial: { label: 'Trial', color: 'bg-yellow-500/20 text-yellow-400' },
  suspended: { label: 'Suspended', color: 'bg-red-500/20 text-red-400' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400' },
};

const emptyForm = { company: '', plan: 'professional', status: 'active', seats: 10, monthlyPrice: 35000, billingCycle: 'monthly' };

export default function Subscriptions() {
  const { canWrite } = usePermissions();
  const [subscriptions, setSubscriptions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetch = () => {
    setLoading(true);
    Promise.all([
      subscriptionsAPI.getAll(),
      subscriptionsAPI.getStats(),
      companiesAPI.getAll(),
    ])
      .then(([subRes, statsRes, compRes]) => {
        setSubscriptions(Array.isArray(subRes.data) ? subRes.data : []);
        setStats(statsRes.data);
        setCompanies(compRes.data.companies || compRes.data || []);
      })
      .catch(() => toast.error('Failed to load subscriptions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subscriptionsAPI.create(form);
      toast.success('Subscription created');
      setModal(false);
      setForm(emptyForm);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subscription');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-gray-400 mt-1">Manage company subscriptions, plans, and billing</p>
        </div>
        {canWrite('subscriptions') && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Subscription
          </button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active', value: stats.active, color: 'text-green-400' },
            { label: 'Trial', value: stats.trial, color: 'text-yellow-400' },
            { label: 'Suspended', value: stats.suspended, color: 'text-red-400' },
            { label: 'MRR', value: formatCurrency(stats.mrr), color: 'text-myth-accent' },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <p className="text-sm text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Company</th>
              <th className="table-header">Plan</th>
              <th className="table-header">Status</th>
              <th className="table-header">Seats</th>
              <th className="table-header">Monthly Price</th>
              <th className="table-header">Start Date</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center text-gray-500 py-8">No subscriptions found</td></tr>
            ) : subscriptions.map((s) => (
              <tr key={s._id} className="border-t border-myth-border">
                <td className="table-cell font-medium">{s.company?.name || '-'}</td>
                <td className="table-cell"><StatusBadge status={s.plan} config={PLAN_CONFIG} /></td>
                <td className="table-cell"><StatusBadge status={s.status} config={STATUS_CONFIG} /></td>
                <td className="table-cell">{s.seats}</td>
                <td className="table-cell">{formatCurrency(s.monthlyPrice)}</td>
                <td className="table-cell text-gray-400">{formatDate(s.startDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Subscription">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Company *</label>
            <select className="input-field w-full" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required>
              <option value="">Select company</option>
              {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Plan</label>
              <select className="input-field w-full" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select className="input-field w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Seats</label>
              <input type="number" className="input-field w-full" value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monthly Price</label>
              <input type="number" className="input-field w-full" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
