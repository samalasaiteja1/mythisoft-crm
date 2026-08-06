import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { contactsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', title: '', department: '', isPrimary: false };

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const fetch = () => {
    setLoading(true);
    contactsAPI.getAll({ search }).then(({ data }) => setContacts(data.contacts)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) await contactsAPI.update(editId, form); else await contactsAPI.create(form);
      toast.success(editId ? 'Updated' : 'Created'); setModal(null); fetch();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-white">Contacts</h1><p className="text-gray-400 mt-1">Manage business contacts</p></div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setModal('form'); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Contact</button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search contacts..." />
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-myth-surface/50"><tr>
              <th className="table-header">Name</th><th className="table-header">Email</th><th className="table-header">Phone</th>
              <th className="table-header">Company</th><th className="table-header">Title</th><th className="table-header">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-myth-border">
              {contacts.map((c) => (
                <tr key={c._id} className="hover:bg-myth-surface/30">
                  <td className="table-cell font-medium text-white">{c.firstName} {c.lastName} {c.isPrimary && <span className="badge bg-myth-accent/20 text-myth-accent ml-2">Primary</span>}</td>
                  <td className="table-cell">{c.email}</td><td className="table-cell">{c.phone || '-'}</td>
                  <td className="table-cell">{c.company?.name || '-'}</td><td className="table-cell">{c.title || '-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => { setForm(c); setEditId(c._id); setModal('form'); }} className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-white"><Pencil size={16} /></button>
                      <button onClick={async () => { if (confirm('Delete?')) { await contactsAPI.delete(c._id); fetch(); } }} className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-500">No contacts found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Contact' : 'Add Contact'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {['firstName', 'lastName', 'email', 'phone', 'title', 'department'].map((f) => (
              <div key={f}><label className="block text-sm text-gray-300 mb-1 capitalize">{f.replace(/([A-Z])/g, ' $1')}{f === 'firstName' || f === 'lastName' || f === 'email' ? ' *' : ''}</label>
                <input type={f === 'email' ? 'email' : 'text'} value={form[f] || ''} onChange={(e) => setForm({ ...form, [f]: e.target.value })} className="input-field" required={['firstName', 'lastName', 'email'].includes(f)} /></div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} className="rounded" /> Primary Contact</label>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editId ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
