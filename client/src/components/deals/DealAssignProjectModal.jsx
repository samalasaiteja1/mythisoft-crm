import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import { dealsAPI, projectsAPI, usersAPI, customersAPI, projectCategoriesAPI } from '../../services/api';
import { ProjectRequirementsView } from '../customers/CustomerDealDelivery';
import RequirementsDocumentField from '../projects/RequirementsDocumentField';
import { uploadRequirementsDocument } from '../../utils/projectDocument';

export default function DealAssignProjectModal({ deal, isOpen, onClose, onAssigned, mode = 'full' }) {
  const navigate = useNavigate();
  const requirements = deal?.projectRequirements || {};
  const isRequirementsOnly = mode === 'requirements';

  const [form, setForm] = useState({
    name: '',
    customer: deal?.customer?._id || '',
    deal: deal?._id || '',
    category: '',
    department: 'technical',
    manager: '',
    priority: 'high',
    startDate: '',
    endDate: '',
    budget: '',
    description: '',
    scope: '',
    deliverables: '',
    technologyStack: '',
    status: 'planning',
    assignedTo: [],
  });

  const [requirementsDocument, setRequirementsDocument] = useState(null);
  const [techMembers, setTechMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !deal) return;

    // Prefill form from deal and requirements
    setForm((prev) => ({
      ...prev,
      name: requirements.name || `${deal.title} — Delivery`,
      description: requirements.description || deal.description || '',
      scope: requirements.scope || '',
      deliverables: requirements.deliverables || '',
      technologyStack: Array.isArray(requirements.technologyStack)
        ? requirements.technologyStack.join(', ')
        : requirements.technologyStack || '',
      startDate: requirements.startDate || '',
      endDate: requirements.endDate || '',
      budget: requirements.estimatedBudget || deal.value || '',
      category: requirements.category || '',
      customer: deal.customer?._id || '',
      deal: deal._id,
    }));

    setRequirementsDocument(null);
    setLoadingTeam(true);
    setLoadingRefs(true);

    // Load technical team (merge team + all technical users)
    const fetchTech = async () => {
      try {
        const members = [];
        try {
          const { data } = await projectsAPI.getTechnicalTeam();
          (data?.members || []).forEach((m) => members.push(m));
        } catch (err) {
          // ignore
        }
        try {
          const { data: allUsers } = await usersAPI.getAll();
          (allUsers || []).filter((u) => u.role === 'technical' && u.isActive !== false).forEach((u) => members.push(u));
        } catch (err) {
          // ignore
        }
        const map = {};
        members.filter(Boolean).forEach((u) => { map[u._id] = u; });
        const merged = Object.values(map).sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
        setTechMembers(merged);
      } catch (err) {
        toast.error('Failed to load technical team');
      } finally {
        setLoadingTeam(false);
      }
    };

    // Load reference data: customers, won deals, categories, managers
    const fetchRefs = async () => {
      try {
        const [custRes, dealsRes, catsRes, usersRes] = await Promise.all([
          customersAPI.getAll().catch(() => ({ data: [] })),
          dealsAPI.getAll({ stage: 'won' }).catch(() => ({ data: [] })),
          projectCategoriesAPI.getAll().catch(() => ({ data: [] })),
          usersAPI.getAll().catch(() => ({ data: [] })),
        ]);
        setCustomers(Array.isArray(custRes.data) ? custRes.data : (custRes.data?.items || []));
        setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
        const cats = Array.isArray(catsRes.data) ? catsRes.data : (catsRes.data?.items || []);
        setCategories(cats.filter(c => c.status !== 'inactive'));
        const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
        setManagers(allUsers.filter(u => u.role === 'manager' && u.isActive !== false));
      } catch (err) {
        // ignore
      } finally {
        setLoadingRefs(false);
      }
    };

    fetchTech();
    fetchRefs();
  }, [isOpen, deal?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isRequirementsOnly && !form.name?.trim()) { toast.error('Project name is required'); return; }
    if (!isRequirementsOnly && !form.customer) { toast.error('Customer is required'); return; }
    if (!isRequirementsOnly && !form.deal) { toast.error('Deal is required'); return; }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        scope: form.scope || undefined,
        deliverables: form.deliverables || undefined,
        category: form.category || undefined,
        manager: form.manager || undefined,
        priority: form.priority || 'medium',
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        status: form.status || 'planning',
        technologyStack: form.technologyStack
          ? form.technologyStack.split(',').map((item) => item.trim()).filter(Boolean)
          : undefined,
        assignedTo: Array.isArray(form.assignedTo) ? form.assignedTo : [],
      };

      // create project from deal
      const { data } = await dealsAPI.createProject(form.deal, payload);

      if (requirementsDocument && data.project?._id) {
        await uploadRequirementsDocument(data.project._id, requirementsDocument);
      }

      toast.success(isRequirementsOnly ? 'Project requirements saved' : 'Project created');
      onAssigned?.(data);
      onClose();
      if (!isRequirementsOnly && data?.project?._id) {
        navigate(`/projects/${data.project._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  if (!deal) return null;

  const customerLabel = deal.customer
    ? `${deal.customer.firstName || ''} ${deal.customer.lastName || ''}`.trim() || deal.customer.companyName || 'Customer'
    : 'Customer';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isRequirementsOnly ? 'Project requirements' : 'Create Project'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-sm text-gray-400 mb-3">
            {isRequirementsOnly
                        ? 'Capture initial delivery requirements for this customer (optional). If the deal already contains requirements, no action is needed.'
              : 'Customer is linked. Review requirements from the deal, attach the requirements document, and create the project.'}
          </p>
          {!isRequirementsOnly && (
            <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Requirements from deal</p>
              <ProjectRequirementsView requirements={requirements} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Project Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field w-full"
                          required={!isRequirementsOnly}
            />
          </div>

          {isRequirementsOnly ? (
            <>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Customer</label>
                <p className="input-field bg-myth-surface text-white py-2.5">{customerLabel}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Deal</label>
                <p className="input-field bg-myth-surface text-white py-2.5">{deal.title}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Customer *</label>
                <select value={form.customer || ''} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="input-field w-full" required>
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>{c.firstName ? `${c.firstName} ${c.lastName || ''}`.trim() : (c.companyName || c.name)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Deal *</label>
                <select value={form.deal || ''} onChange={(e) => setForm({ ...form, deal: e.target.value })} className="input-field w-full" required>
                  <option value="">Select Won Deal</option>
                  {deals.map((d) => (
                    <option key={d._id} value={d._id}>{d.title}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-1">{isRequirementsOnly ? 'Project category' : 'Project category *'}</label>
                        <select value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field w-full" required={!isRequirementsOnly}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {isRequirementsOnly ? null : (
            <>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Department *</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field w-full">
                  <option value="technical">Technical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Technical Manager *</label>
                <select value={form.manager || ''} onChange={(e) => setForm({ ...form, manager: e.target.value })} className="input-field w-full">
                  <option value="">Select Technical Manager</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Assigned *</label>
                {loadingTeam ? (
                  <p className="text-sm text-gray-500">Loading technical team…</p>
                ) : techMembers.length === 0 ? (
                  <p className="text-sm text-gray-500">No technical team members found.</p>
                ) : (
                  <select multiple value={form.assignedTo} onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setForm({ ...form, assignedTo: opts });
                  }} className="input-field w-full h-36">
                    {techMembers.map((member) => (
                      <option key={member._id} value={member._id}>{member.firstName} {member.lastName}</option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-1">Project description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field w-full min-h-[80px]" rows={3} />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Scope / requirements</label>
            <textarea value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="input-field w-full min-h-[80px]" rows={3} />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Deliverables</label>
            <textarea value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} className="input-field w-full min-h-[80px]" rows={3} />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Technology stack</label>
            <input value={form.technologyStack} onChange={(e) => setForm({ ...form, technologyStack: e.target.value })} className="input-field w-full" placeholder="React, Node.js (comma-separated)" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Priority *</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field w-full">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Planned start</label>
            <input type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field w-full" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Target end</label>
            <input type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field w-full" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Estimated budget (INR)</label>
            <input type="number" min="0" value={form.budget || ''} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="input-field w-full" />
          </div>

          {!isRequirementsOnly && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Status *</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field w-full">
                <option value="planning">Planning</option>
                <option value="development">Development</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>

        <RequirementsDocumentField file={requirementsDocument} onChange={setRequirementsDocument} />

        <div className="flex justify-end gap-3 pt-2 border-t border-myth-border">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (isRequirementsOnly ? 'Saving…' : 'Creating…') : (isRequirementsOnly ? 'Save requirements' : 'Create Project')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
