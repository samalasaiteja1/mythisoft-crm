import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileEdit } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, ticketsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CUSTOMER_CHANGE_TYPES, CUSTOMER_PRIORITIES } from '../../constants/customerPortalNav';

export default function RequestChange() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillProject = searchParams.get('project');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [form, setForm] = useState({
    project: prefillProject || '',
    subject: '',
    changeType: 'Enhancement',
    description: '',
    businessReason: '',
    priority: 'medium',
    expectedCompletion: '',
  });

  useEffect(() => {
    projectsAPI.getAll({ limit: 100 })
      .then(({ data }) => setProjects(data.items || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project || !form.subject.trim() || !form.description.trim()) {
      toast.error('Project, title, and description are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        requestKind: 'change_request',
        project: form.project,
        subject: form.subject.trim(),
        description: form.description.trim(),
        changeType: form.changeType,
        businessReason: form.businessReason.trim(),
        priority: form.priority,
        expectedCompletion: form.expectedCompletion || undefined,
        category: 'Change Request',
      };
      let data;
      if (attachments.length) {
        const fd = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== '') fd.append(key, value);
        });
        attachments.forEach((file) => fd.append('attachments', file));
        ({ data } = await ticketsAPI.create(fd));
      } else {
        ({ data } = await ticketsAPI.create(payload));
      }
      toast.success('Change request submitted');
      navigate(`/change-requests/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit change request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/change-requests" className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back to Change Requests
      </Link>

      <div className="card">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileEdit className="text-myth-accent" size={22} /> Request Change
        </h1>
        <p className="text-sm text-gray-400 mt-1">Submit a formal change request for your delivered project.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Project *</label>
            <select className="input-field w-full" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} required>
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Request Title *</label>
            <input className="input-field w-full" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Change Type *</label>
            <select className="input-field w-full" value={form.changeType} onChange={(e) => setForm({ ...form, changeType: e.target.value })} required>
              {CUSTOMER_CHANGE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description *</label>
            <textarea className="input-field w-full" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Business Reason</label>
            <textarea className="input-field w-full" rows={3} value={form.businessReason} onChange={(e) => setForm({ ...form, businessReason: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Priority *</label>
              <select className="input-field w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} required>
                {CUSTOMER_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expected Completion</label>
              <input type="date" className="input-field w-full" value={form.expectedCompletion} onChange={(e) => setForm({ ...form, expectedCompletion: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Attachments (optional)</label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
              className="input-field w-full"
              onChange={(e) => setAttachments(Array.from(e.target.files || []))}
            />
            {attachments.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{attachments.length} file(s) selected</p>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
