import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { companiesAPI, formatCurrency } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';

const emptyForm = { name: '', industry: '', website: '', email: '', phone: '', employeeCount: '', description: '' };

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const fetch = () => {
    setLoading(true);
    companiesAPI.getAll({ search }).then(({ data }) => setCompanies(data.companies)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) await companiesAPI.update(editId, form); else await companiesAPI.create(form);
      toast.success(editId ? 'Updated' : 'Created'); setModal(null); fetch();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-white">Companies</h1><p className="text-gray-400 mt-1">Manage organization accounts</p></div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setModal('form'); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Company</button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search companies..." />
      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((co) => (
            <div key={co._id} className="card hover:border-myth-accent/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-myth-accent/10 flex items-center justify-center">
                  {co.logo ? <img src={co.logo} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <Building2 size={24} className="text-myth-accent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{co.name}</h3>
                  <p className="text-sm text-gray-400">{co.industry || 'No industry'}</p>
                  {co.annualRevenue && <p className="text-sm text-myth-accent mt-1">{formatCurrency(co.annualRevenue)} revenue</p>}
                </div>
              </div>
              <div className="flex gap-1 mt-4 pt-4 border-t border-myth-border">
                <Link to={`/companies/${co._id}`} className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-myth-accent"><Eye size={16} /></Link>
                <button onClick={() => { setForm(co); setEditId(co._id); setModal('form'); }} className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-white"><Pencil size={16} /></button>
                <button onClick={async () => { if (confirm('Delete?')) { await companiesAPI.delete(co._id); fetch(); } }} className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {companies.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">No companies found</div>}
        </div>
      )}
      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Company' : 'Add Company'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm text-gray-300 mb-1">Company Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
            {['industry', 'website', 'email', 'phone', 'employeeCount'].map((f) => (
              <div key={f}><label className="block text-sm text-gray-300 mb-1 capitalize">{f.replace(/([A-Z])/g, ' $1')}</label>
                <input value={form[f] || ''} onChange={(e) => setForm({ ...form, [f]: e.target.value })} className="input-field" /></div>
            ))}
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20" /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editId ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
