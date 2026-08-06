import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Activity, Send, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { dashboardAPI, formatDateTime } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const statusColors = {
  sent: 'bg-green-500/20 text-green-400',
  delivered: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
};

export default function Communications() {
  const [tab, setTab] = useState('timeline');
  const [composeMode, setComposeMode] = useState('email');
  const [activities, setActivities] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  const [smsForm, setSmsForm] = useState({ to: '', body: '' });

  const loadData = () =>
    Promise.all([dashboardAPI.getActivities(), dashboardAPI.getCommunications()]).then(([act, comm]) => {
      setActivities(act.data);
      setCommunications(comm.data);
    });

  useEffect(() => {
    setLoading(true);
    loadData().catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const sendEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await dashboardAPI.createCommunication({ type: 'email', ...emailForm });
      toast.success('Email sent successfully!');
      setEmailForm({ to: '', subject: '', body: '' });
      setTab('email');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const sendSms = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await dashboardAPI.createCommunication({ type: 'sms', to: smsForm.to, body: smsForm.body });
      toast.success('SMS sent successfully!');
      setSmsForm({ to: '', body: '' });
      setTab('sms');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const tabs = [
    { id: 'timeline', label: 'Activity Timeline', icon: Activity },
    { id: 'email', label: 'Email History', icon: Mail },
    { id: 'sms', label: 'SMS History', icon: MessageSquare },
    { id: 'compose', label: 'Compose', icon: Send },
  ];

  if (loading) return <LoadingSpinner />;

  const emailList = communications.filter((c) => c.type === 'email');
  const smsList = communications.filter((c) => c.type === 'sms');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Communications</h1>
        <p className="text-gray-400 mt-1">Track emails, SMS, notes, and activities</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === id ? 'bg-myth-accent/20 text-myth-accent border border-myth-accent/30' : 'bg-myth-surface text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={16} /> {label}
            {id === 'email' && emailList.length > 0 && (
              <span className="text-xs bg-myth-accent/20 px-1.5 rounded-full">{emailList.length}</span>
            )}
            {id === 'sms' && smsList.length > 0 && (
              <span className="text-xs bg-myth-accent/20 px-1.5 rounded-full">{smsList.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'timeline' && (
        <div className="card space-y-3">
          {activities.map((a) => (
            <div key={a._id} className="flex gap-3 p-3 rounded-lg bg-myth-surface/50">
              <div className="w-8 h-8 rounded-full bg-myth-accent/20 flex items-center justify-center text-myth-accent text-xs font-bold shrink-0">
                {a.user?.firstName?.[0]}{a.user?.lastName?.[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{a.title}</p>
                {a.description && <p className="text-xs text-gray-400 mt-0.5">{a.description}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {a.user?.firstName} {a.user?.lastName} · {formatDateTime(a.createdAt)}
                </p>
              </div>
              <span className="badge bg-myth-accent/10 text-myth-accent capitalize">{a.type}</span>
            </div>
          ))}
          {activities.length === 0 && <p className="text-center py-8 text-gray-500">No activities yet</p>}
        </div>
      )}

      {tab === 'email' && (
        <div className="card space-y-3">
          {emailList.map((c) => (
            <div key={c._id} className="p-4 rounded-lg bg-myth-surface/50 border border-myth-border">
              <div className="flex justify-between mb-2 gap-2">
                <div>
                  <p className="text-sm font-medium text-white">{c.subject || '(no subject)'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">To: {c.to}</p>
                </div>
                <span className={`badge shrink-0 ${statusColors[c.status] || statusColors.pending}`}>{c.status}</span>
              </div>
              <p className="text-sm text-gray-300">{c.body}</p>
              <p className="text-xs text-gray-500 mt-2">{formatDateTime(c.createdAt)}</p>
            </div>
          ))}
          {emailList.length === 0 && <p className="text-center py-8 text-gray-500">No emails sent yet. Use Compose to send one.</p>}
        </div>
      )}

      {tab === 'sms' && (
        <div className="card space-y-3">
          {smsList.map((c) => (
            <div key={c._id} className="p-4 rounded-lg bg-myth-surface/50 border border-myth-border">
              <div className="flex justify-between mb-2 gap-2">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-myth-accent" />
                  <p className="text-sm font-medium text-white">{c.to}</p>
                </div>
                <span className={`badge shrink-0 ${statusColors[c.status] || statusColors.pending}`}>{c.status}</span>
              </div>
              <p className="text-sm text-gray-300">{c.body}</p>
              <p className="text-xs text-gray-500 mt-2">{formatDateTime(c.createdAt)}</p>
            </div>
          ))}
          {smsList.length === 0 && <p className="text-center py-8 text-gray-500">No SMS sent yet. Use Compose → Send SMS.</p>}
        </div>
      )}

      {tab === 'compose' && (
        <div className="card max-w-2xl">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setComposeMode('email')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${composeMode === 'email' ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}
            >
              <Mail size={16} /> Send Email
            </button>
            <button
              type="button"
              onClick={() => setComposeMode('sms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${composeMode === 'sms' ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}
            >
              <MessageSquare size={16} /> Send SMS
            </button>
          </div>

          {composeMode === 'email' ? (
            <form onSubmit={sendEmail} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">To (email)</label>
                <input type="email" value={emailForm.to} onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })} className="input-field" placeholder="customer@example.com" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Subject</label>
                <input value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} className="input-field" placeholder="Follow up on your inquiry" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Message</label>
                <textarea value={emailForm.body} onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} className="input-field h-32" required />
              </div>
              <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
                <Send size={16} /> {sending ? 'Sending...' : 'Send Email'}
              </button>
              <p className="text-xs text-gray-500">Sent via Gmail SMTP in server/.env</p>
            </form>
          ) : (
            <form onSubmit={sendSms} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">To (phone number)</label>
                <input
                  type="tel"
                  value={smsForm.to}
                  onChange={(e) => setSmsForm({ ...smsForm, to: e.target.value })}
                  className="input-field"
                  placeholder="+91 9876543210 or 9876543210"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Message</label>
                <textarea
                  value={smsForm.body}
                  onChange={(e) => setSmsForm({ ...smsForm, body: e.target.value })}
                  className="input-field h-24"
                  maxLength={160}
                  placeholder="Your SMS message (max 160 characters)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{smsForm.body.length}/160 characters</p>
              </div>
              <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
                <MessageSquare size={16} /> {sending ? 'Sending...' : 'Send SMS'}
              </button>
              <p className="text-xs text-gray-500">Requires Twilio credentials in server/.env (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)</p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
