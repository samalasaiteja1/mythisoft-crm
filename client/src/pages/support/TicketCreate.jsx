import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Headphones, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersAPI, ticketsAPI, projectsAPI, TICKET_PRIORITIES } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import {
  TICKET_MODULES,
  TICKET_ISSUE_CATEGORY_GROUPS,
  TICKET_PRIORITY_OPTIONS,
} from '../../constants/supportTickets';

const STAFF_CATEGORIES = ['Bug', 'Technical Support', 'Feature Request'];

const EMPTY_CUSTOMER = {
  project: '',
  module: '',
  subject: '',
  category: '',
  priority: 'medium',
  description: '',
  stepsToReproduce: '',
  preferredContact: 'email',
};

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">
        {label}{required ? ' *' : ''}
      </label>
      {children}
    </div>
  );
}

export default function TicketCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customer') || searchParams.get('customerId');
  const prefillProject = searchParams.get('project');
  const { user } = useAuth();
  const { canAction, isCustomer } = usePermissions();
  const [customer, setCustomer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(!!customerId || isCustomer);
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [form, setForm] = useState({
    ...EMPTY_CUSTOMER,
    project: prefillProject || '',
    customer: customerId || '',
    category: '',
    priority: 'medium',
    subject: '',
    description: '',
  });

  useEffect(() => {
    if (isCustomer && user?.customerRef) {
      const c = typeof user.customerRef === 'object' ? user.customerRef : null;
      if (c) {
        setCustomer(c);
        setForm((prev) => ({ ...prev, customer: c._id }));
      }
      projectsAPI.getAll({ limit: 100 })
        .then(({ data }) => setProjects(data.items || []))
        .catch(() => setProjects([]));
      setLoading(false);
      return;
    }
    if (!customerId) return;
    customersAPI.getOne(customerId)
      .then(({ data }) => {
        const c = data.customer || data;
        setCustomer(c);
        setForm((prev) => ({
          ...prev,
          customer: c._id,
          subject: prev.subject || `Support request: ${c.firstName} ${c.lastName}`.trim(),
        }));
      })
      .catch(() => toast.error('Customer not found'))
      .finally(() => setLoading(false));
  }, [customerId, isCustomer, user]);

  if (!canAction('tickets', 'create')) {
    return <div className="text-center text-gray-400 py-12">You do not have permission to create support tickets.</div>;
  }

  if (loading) return <LoadingSpinner />;

  const customerName = customer
    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email
    : '—';

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setAttachment(null);
    setForm({
      ...EMPTY_CUSTOMER,
      customer: customer?._id || customerId || '',
      project: prefillProject || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCustomer) {
      if (!form.project) return toast.error('Select a project');
      if (!form.module) return toast.error('Select a module');
      if (!form.category) return toast.error('Select an issue category');
    }
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Subject and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        customer: form.customer || undefined,
        project: form.project || undefined,
        module: form.module || undefined,
        stepsToReproduce: form.stepsToReproduce?.trim() || undefined,
        preferredContact: form.preferredContact || 'email',
        requestKind: 'customer_ticket',
        status: 'open',
      };

      let data;
      if (attachment) {
        const fd = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== '') fd.append(key, value);
        });
        fd.append('attachments', attachment);
        ({ data } = await ticketsAPI.create(fd));
      } else {
        ({ data } = await ticketsAPI.create(payload));
      }
      toast.success(isCustomer ? 'Support ticket created — our team will review it shortly' : 'Support ticket created');
      navigate(`/tickets/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const backTo = isCustomer ? '/tickets' : customerId ? `/customers/${customerId}` : '/tickets';
  const priorityOptions = isCustomer
    ? TICKET_PRIORITY_OPTIONS
    : Object.entries(TICKET_PRIORITIES).map(([value, { label }]) => ({ value, label }));

  if (isCustomer) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center border border-myth-border rounded-xl py-4 px-6 bg-myth-surface/30">
          <h1 className="text-lg font-bold text-white tracking-wide flex items-center justify-center gap-2">
            <Headphones size={20} className="text-orange-400" />
            CREATE SUPPORT TICKET
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5 border border-myth-border/80">
          <Field label="Customer" required>
            <input className="input-field w-full bg-myth-surface/50" value={customerName} readOnly />
          </Field>

          <Field label="Company">
            <input className="input-field w-full bg-myth-surface/50" value={customer?.companyName || '—'} readOnly />
          </Field>

          <Field label="Project" required>
            <select
              className="input-field w-full"
              value={form.project}
              onChange={(e) => update('project', e.target.value)}
              required
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Module" required>
            <select
              className="input-field w-full"
              value={form.module}
              onChange={(e) => update('module', e.target.value)}
              required
            >
              <option value="">Select module</option>
              {TICKET_MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label="Subject" required>
            <input
              className="input-field w-full"
              value={form.subject}
              onChange={(e) => update('subject', e.target.value)}
              placeholder="Brief summary of the issue"
              required
            />
          </Field>

          <Field label="Issue Category" required>
            <select
              className="input-field w-full"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              required
            >
              <option value="">Select category</option>
              {TICKET_ISSUE_CATEGORY_GROUPS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field label="Priority" required>
            <div className="flex flex-wrap gap-4 pt-1">
              {TICKET_PRIORITY_OPTIONS.map((p) => (
                <label key={p.value} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    checked={form.priority === p.value}
                    onChange={(e) => update('priority', e.target.value)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Description" required>
            <textarea
              className="input-field w-full min-h-[100px]"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe the issue in detail…"
              required
            />
          </Field>

          <Field label="Steps to Reproduce">
            <textarea
              className="input-field w-full min-h-[80px]"
              value={form.stepsToReproduce}
              onChange={(e) => update('stepsToReproduce', e.target.value)}
              placeholder="1. Go to…&#10;2. Click…&#10;3. See error…"
            />
          </Field>

          <Field label="Attachment">
            <input
              type="file"
              className="input-field w-full"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
              onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            />
            {attachment && <p className="text-xs text-gray-500 mt-1">{attachment.name}</p>}
          </Field>

          <Field label="Preferred Contact">
            <div className="flex flex-wrap gap-4 pt-1">
              {[
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="preferredContact"
                    value={opt.value}
                    checked={form.preferredContact === opt.value}
                    onChange={(e) => update('preferredContact', e.target.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Status">
            <div className="input-field w-full bg-blue-500/10 border-blue-500/30 text-blue-300">New</div>
          </Field>

          <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-myth-border">
            <button type="submit" disabled={submitting} className="btn-primary min-w-[140px]">
              {submitting ? 'Creating…' : 'Create Ticket'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary min-w-[100px] inline-flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Reset
            </button>
            <Link to={backTo} className="btn-secondary min-w-[100px] inline-flex items-center justify-center gap-2">
              <X size={14} /> Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={backTo} className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="card max-w-3xl">
        <h1 className="text-xl font-bold text-white mb-1">Create Support Ticket</h1>
        <p className="text-sm text-gray-400 mb-6">Log a support ticket on behalf of a customer.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {customer && (
            <p className="text-sm text-gray-400">
              For {customer.firstName} {customer.lastName}
              {customer.companyName ? ` · ${customer.companyName}` : ''}
            </p>
          )}
          <Field label="Subject" required>
            <input className="input-field w-full" value={form.subject} onChange={(e) => update('subject', e.target.value)} required />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Category" required>
              <select className="input-field w-full" value={form.category} onChange={(e) => update('category', e.target.value)} required>
                <option value="">Select</option>
                {STAFF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Priority" required>
              <select className="input-field w-full" value={form.priority} onChange={(e) => update('priority', e.target.value)} required>
                {priorityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description" required>
            <textarea className="input-field w-full min-h-[100px]" value={form.description} onChange={(e) => update('description', e.target.value)} required />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Create Ticket'}
            </button>
            <Link to={backTo} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
