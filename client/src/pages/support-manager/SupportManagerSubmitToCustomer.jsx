import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Send, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import RequirementsDocLinks from '../../components/projects/RequirementsDocLinks';

const DELIVERY_DOC_TYPES = [
  { key: 'userManual', label: 'User Manual', patterns: ['user manual', 'manual'] },
  { key: 'releaseNotes', label: 'Release Notes', patterns: ['release notes', 'release note', 'release'] },
  { key: 'deploymentGuide', label: 'Deployment Guide', patterns: ['deployment guide', 'deployment'] },
];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function formatDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function docMatchesType(doc, patterns) {
  const name = (doc.name || '').toLowerCase();
  const tags = (doc.tags || []).join(' ').toLowerCase();
  return patterns.some((p) => name.includes(p) || tags.includes(p));
}

export default function SupportManagerSubmitToCustomer() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [deliveryDocs, setDeliveryDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    deliveryVersion: 'v1.0.0',
    deliveryDate: '',
    deliveryNotes: '',
    userManual: true,
    releaseNotes: true,
    deploymentGuide: true,
    sendEmail: true,
    sendPortalNotification: true,
  });

  useEffect(() => {
    Promise.all([
      projectsAPI.getOne(projectId),
      projectsAPI.getDeliveryDocuments(projectId),
    ])
      .then(([projectRes, docsRes]) => {
        const p = projectRes.data;
        setProject(p);
        const docs = Array.isArray(docsRes.data) ? docsRes.data : [];
        setDeliveryDocs(docs);

        const docFlags = {};
        DELIVERY_DOC_TYPES.forEach(({ key, patterns }) => {
          docFlags[key] = docs.some((d) => docMatchesType(d, patterns));
        });

        setForm((prev) => ({
          ...prev,
          deliveryVersion: p.customerSubmission?.deliveryVersion || 'v1.0.0',
          deliveryDate: formatDateInput(p.customerSubmission?.deliveryDate || p.endDate || new Date()),
          deliveryNotes: p.customerSubmission?.deliveryNotes || p.supportReviewNotes || '',
          userManual: docFlags.userManual !== false,
          releaseNotes: docFlags.releaseNotes !== false,
          deploymentGuide: docFlags.deploymentGuide !== false,
          sendEmail: p.customerSubmission?.notifyEmail !== false,
          sendPortalNotification: p.customerSubmission?.notifyPortal !== false,
        }));
      })
      .catch(() => {
        toast.error('Failed to load project');
        navigate('/support/project-delivery');
      })
      .finally(() => setLoading(false));
  }, [projectId, navigate]);

  const customerName = useMemo(() => {
    const c = project?.customer;
    if (!c) return '—';
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.companyName || '—';
  }, [project]);

  const matchedDocs = useMemo(() => {
    return DELIVERY_DOC_TYPES.map(({ key, label, patterns }) => ({
      key,
      label,
      docs: deliveryDocs.filter((d) => docMatchesType(d, patterns)),
    }));
  }, [deliveryDocs]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.deliveryDate) return toast.error('Delivery date is required');

    setSubmitting(true);
    try {
      const { data } = await projectsAPI.submitToCustomer(projectId, {
        deliveryVersion: form.deliveryVersion.trim() || 'v1.0.0',
        deliveryDate: form.deliveryDate,
        deliveryNotes: form.deliveryNotes.trim(),
        documentsIncluded: {
          userManual: form.userManual,
          releaseNotes: form.releaseNotes,
          deploymentGuide: form.deploymentGuide,
        },
        sendEmail: form.sendEmail,
        sendPortalNotification: form.sendPortalNotification,
      });

      const emailStatus = data?.notifications?.email;
      if (emailStatus === 'sent') {
        toast.success('Project submitted — customer notified by email and portal');
      } else if (emailStatus === 'failed_or_dev_mode') {
        toast.success('Project submitted — portal notification sent (email: SMTP not configured)');
      } else {
        toast.success('Project submitted — status set to Pending Customer Acceptance');
      }
      navigate('/support/customer-acceptance');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center border border-myth-border rounded-xl py-4 px-6 bg-myth-surface/30">
        <h1 className="text-lg font-bold text-white tracking-wide flex items-center justify-center gap-2">
          <Send size={20} className="text-orange-400" />
          SUBMIT PROJECT TO CUSTOMER
        </h1>
      </div>

      <form onSubmit={submit} className="card space-y-5 border border-myth-border/80">
        <Field label="Project">
          <input className="input-field w-full bg-myth-surface/50" value={project.name} readOnly />
        </Field>

        <Field label="Customer">
          <input className="input-field w-full bg-myth-surface/50" value={customerName} readOnly />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Version">
            <input
              className="input-field w-full"
              value={form.deliveryVersion}
              onChange={(e) => update('deliveryVersion', e.target.value)}
              placeholder="v1.0.0"
            />
          </Field>
          <Field label="Delivery Date *">
            <input
              type="date"
              className="input-field w-full"
              value={form.deliveryDate}
              onChange={(e) => update('deliveryDate', e.target.value)}
              required
            />
          </Field>
        </div>

        <Field label="Delivery Notes">
          <textarea
            className="input-field w-full min-h-[100px]"
            value={form.deliveryNotes}
            onChange={(e) => update('deliveryNotes', e.target.value)}
            placeholder="Notes for the customer about this delivery…"
          />
        </Field>

        <div>
          <p className="text-sm text-gray-400 mb-2">Attached Documents</p>
          <div className="space-y-2 border border-myth-border rounded-lg p-3">
            {DELIVERY_DOC_TYPES.map(({ key, label }) => {
              const match = matchedDocs.find((m) => m.key === key);
              const hasFile = (match?.docs?.length || 0) > 0;
              return (
                <label key={key} className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => update(key, e.target.checked)}
                    className="rounded border-myth-border"
                  />
                  <span>{label}</span>
                  {!hasFile && (
                    <span className="text-xs text-amber-400/90">(no file uploaded yet)</span>
                  )}
                </label>
              );
            })}
          </div>
          {deliveryDocs.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <FileText size={12} /> Available delivery files
              </p>
              <RequirementsDocLinks documents={deliveryDocs} compact />
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Customer Notification</p>
          <div className="space-y-2 border border-myth-border rounded-lg p-3">
            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendEmail}
                onChange={(e) => update('sendEmail', e.target.checked)}
                className="rounded border-myth-border"
              />
              Send Email
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendPortalNotification}
                onChange={(e) => update('sendPortalNotification', e.target.checked)}
                className="rounded border-myth-border"
              />
              Send Portal Notification
            </label>
          </div>
        </div>

        <Field label="Project Status">
          <div className="input-field w-full bg-purple-500/10 border-purple-500/30 text-purple-300">
            Pending Customer Acceptance
          </div>
        </Field>

        <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-myth-border">
          <button type="submit" disabled={submitting} className="btn-primary min-w-[160px] inline-flex items-center justify-center gap-2">
            <Send size={14} />
            {submitting ? 'Submitting…' : 'Submit to Customer'}
          </button>
          <Link to="/support/project-delivery" className="btn-secondary min-w-[100px] inline-flex items-center justify-center gap-2">
            <X size={14} /> Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
