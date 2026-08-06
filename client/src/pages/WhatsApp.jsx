import { useState, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { whatsappAPI, formatDateTime } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';

export default function WhatsApp() {
  const { user } = useAuth();
  const { canWrite } = usePermissions();
  const [messages, setMessages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ phone: '', message: '', template: '' });

  const fetch = () => {
    setLoading(true);
    Promise.all([
      whatsappAPI.getAll({ search }),
      whatsappAPI.getTemplates(),
    ])
      .then(([msgRes, tplRes]) => {
        setMessages(Array.isArray(msgRes.data) ? msgRes.data : []);
        setTemplates(Array.isArray(tplRes.data) ? tplRes.data : []);
      })
      .catch(() => toast.error('Failed to load WhatsApp data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [search]);

  const applyTemplate = (id) => {
    const tpl = templates.find((t) => t.id === id);
    if (tpl) setForm({ ...form, template: id, message: tpl.body });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await whatsappAPI.send({ ...form, sentBy: user._id });
      toast.success('WhatsApp message sent');
      setForm({ phone: '', message: '', template: '' });
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
        <p className="text-gray-400 mt-1">Send messages, use templates, and view conversation history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canWrite('whatsapp') && (
          <div className="card lg:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Send size={18} className="text-myth-accent" /> Send Message</h3>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Template</label>
                <select className="input-field w-full" value={form.template} onChange={(e) => applyTemplate(e.target.value)}>
                  <option value="">Select template (optional)</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone *</label>
                <input className="input-field w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Message *</label>
                <textarea className="input-field w-full h-28" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2"><Send size={16} /> Send WhatsApp</button>
            </form>
          </div>
        )}

        <div className={`card ${canWrite('whatsapp') ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><MessageCircle size={18} className="text-myth-accent" /> Conversation History</h3>
            <SearchBar value={search} onChange={setSearch} placeholder="Search messages..." />
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No messages yet</p>
              ) : messages.map((m) => (
                <div key={m._id} className={`p-4 rounded-lg ${m.direction === 'outbound' ? 'bg-myth-accent/10 border border-myth-accent/20 ml-8' : 'bg-myth-surface/50 mr-8'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{m.phone}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(m.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-300">{m.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="capitalize">{m.status}</span>
                    {m.template && <span>· Template: {m.template}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
