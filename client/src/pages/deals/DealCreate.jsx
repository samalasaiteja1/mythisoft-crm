import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, User, Briefcase, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { dealsAPI, leadsAPI, customersAPI, usersAPI, documentsAPI, projectsAPI, authAPI, formatCurrency } from '../../services/api';
import { getDealCreationSteps } from '../../constants/workflow';
import { canConvertLeadToDeal } from '../../constants/leadPipeline';
import { buildFormFromLead, buildFormFromCustomer, buildDealPayload, buildLeadConvertPayload, validateDealForm, hasProjectRequirements } from '../../utils/dealForm';
import { useDealForm } from '../../hooks/useDealForm';
import DealDeliveryFields from '../../components/deals/DealDeliveryFields';
import WorkflowProgress from '../../components/workflow/WorkflowProgress';
import LoadingSpinner from '../../components/LoadingSpinner';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import useActiveProjectCategories from '../../hooks/useProjectCategories';

export default function DealCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const customerId = searchParams.get('customerId');
  const { user } = useAuth();
  const { isAdmin, isManager, canWrite } = usePermissions();

  const [lead, setLead] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [salesUsers, setSalesUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(Boolean(leadId || customerId));
  const [submitting, setSubmitting] = useState(false);
  const [requirementsDocument, setRequirementsDocument] = useState(null);
  const [userExistsForEmail, setUserExistsForEmail] = useState(false);

  const { form, setForm, setDeal, setProject } = useDealForm();

  const canAssign = isAdmin || isManager;
  const { categories: projectCategories } = useActiveProjectCategories();
  const workflowSteps = useMemo(() => getDealCreationSteps(), []);

  useEffect(() => {
    if (!canAssign) return;
    const fetchSales = async () => {
      try {
        const members = [];
        if (isAdmin) {
          try {
            const { data } = await usersAPI.getManagers();
            setManagers(Array.isArray(data) ? data : []);
          } catch {
            // ignore
          }
        }
        try {
          const { data } = await usersAPI.getSalesTeam();
          (data?.members || []).forEach((m) => members.push(m));
        } catch (err) {
          // ignore — fallback
        }
        try {
          const { data: allUsers } = await usersAPI.getAll();
          (allUsers || []).filter((u) => u.role === 'sales').forEach((u) => members.push(u));
        } catch (err) {
          // ignore
        }
        const map = {};
        members.filter(Boolean).forEach((u) => { map[u._id] = u; });
        let merged = Object.values(map);
        if (isManager) {
          merged = merged.filter((u) => String(u.reportsTo?._id || u.reportsTo) === String(user?._id));
        }
        merged.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
        setSalesUsers(merged);
      } catch (err) {
        // noop
      }
    };
    fetchSales();
  }, [canAssign, isAdmin, isManager, user]);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    leadsAPI.getOne(leadId)
      .then(({ data }) => {
        const leadDoc = data.lead || data;
        if (!canConvertLeadToDeal(leadDoc)) {
          toast.error('Lead must be qualified before creating a deal');
          navigate(`/leads/${leadId}`);
          return;
        }
        setLead(leadDoc);
        setForm(buildFormFromLead(leadDoc));
        setRequirementsDocument(null);
      })
      .catch(() => { toast.error('Lead not found'); navigate('/leads'); })
      .finally(() => setLoading(false));
  }, [leadId, navigate, setForm]);

  useEffect(() => {
    if (!customerId || leadId) return;
    setLoading(true);
    customersAPI.getOne(customerId)
      .then(({ data }) => {
        const customerDoc = data.customer || data;
        setCustomer(customerDoc);
        setForm(buildFormFromCustomer(customerDoc));
      })
      .catch(() => {
        toast.error('Customer not found');
        navigate('/customers');
      })
      .finally(() => setLoading(false));
  }, [customerId, leadId, navigate, setForm]);

  const handleEmailChange = async (email) => {
    setDeal({ email });
    if (email && email.includes('@')) {
      try {
        const { data } = await authAPI.checkUserExists(email);
        setUserExistsForEmail(data.exists);
      } catch {
        setUserExistsForEmail(false);
      }
    } else {
      setUserExistsForEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateDealForm(form);
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    try {
      const payload = leadId ? buildLeadConvertPayload(form) : buildDealPayload(form);
      if (form.customerPassword) {
        payload.customerPassword = form.customerPassword;
      }
      const uploadRequirementsDocument = async (dealId) => {
        if (!requirementsDocument || !dealId) return;
        const fd = new FormData();
        fd.append('file', requirementsDocument);
        fd.append('name', requirementsDocument.name);
        fd.append('folder', 'Project Requirements');
        fd.append('relatedType', 'deal');
        fd.append('relatedId', dealId);
        fd.append('tags', 'requirements');
        await documentsAPI.create(fd);
      };

      if (leadId) {
        const { data } = await leadsAPI.convertToDeal(leadId, payload);
        const dealId = data.deal?._id;
        if (requirementsDocument && dealId) {
          try {
            await uploadRequirementsDocument(dealId);
          } catch {
            toast.error('Deal created, but requirements document upload failed');
          }
        }
        toast.success('Deal created from qualified lead');

        if (hasProjectRequirements(form) && dealId) {
          try {
            const pr = form.projectRequirements || {};
            const parseTech = (value) => (
              typeof value === 'string'
                ? value.split(',').map((s) => s.trim()).filter(Boolean)
                : Array.isArray(value) ? value : []
            );
            await projectsAPI.create({
              name: pr.name || form.title || `Project from deal ${dealId}`,
              description: pr.description,
              scope: pr.scope,
              deliverables: pr.deliverables,
              category: pr.category,
              technologyStack: parseTech(pr.technologyStack),
              startDate: pr.startDate || undefined,
              endDate: pr.endDate || undefined,
              priority: pr.priority || 'medium',
              budget: Number(pr.estimatedBudget) || 0,
              deal: dealId,
            });
            toast.success('Project created from requirements');
          } catch {
            toast.error('Deal created but failed to create project automatically');
          }
        }

        navigate(dealId ? `/deals/${dealId}` : '/deals');
      } else {
        const { data } = await dealsAPI.create(payload);
        const dealId = data._id;
        if (requirementsDocument && dealId) {
          try {
            await uploadRequirementsDocument(dealId);
          } catch {
            toast.error('Deal created, but requirements document upload failed');
          }
        }
        if (hasProjectRequirements(form) && dealId) {
          try {
            const pr = form.projectRequirements || {};
            const parseTech = (value) => (
              typeof value === 'string'
                ? value.split(',').map((s) => s.trim()).filter(Boolean)
                : Array.isArray(value) ? value : []
            );
            await projectsAPI.create({
              name: pr.name || form.title || `Project from deal ${dealId}`,
              description: pr.description,
              scope: pr.scope,
              deliverables: pr.deliverables,
              category: pr.category,
              technologyStack: parseTech(pr.technologyStack),
              startDate: pr.startDate || undefined,
              endDate: pr.endDate || undefined,
              priority: pr.priority || 'medium',
              budget: Number(pr.estimatedBudget) || 0,
              deal: dealId,
            });
            toast.success('Project created from requirements');
          } catch {
            toast.error('Deal created but failed to create project automatically');
          }
        }
        toast.success('Deal created');
        navigate(dealId ? `/deals/${dealId}` : '/deals');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create deal');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canWrite('deals')) {
    return (
      <div className="text-center text-gray-400 py-12">
        You do not have permission to create deals.
        <Link to="/deals" className="block mt-2 text-myth-accent hover:underline">Back to deals</Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to={leadId ? `/leads/${leadId}` : customerId ? `/customers/${customerId}` : '/deals'} className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> {leadId ? 'Back to lead' : customerId ? 'Back to customer' : 'Back to deal pipeline'}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Create Deal</h1>
        <p className="text-gray-400 mt-1">Complete deal details and project requirements</p>
      </div>

      <div className="card">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Lead → Deal → Delivery workflow</p>
        <WorkflowProgress stages={workflowSteps} currentStage="deal" />
      </div>

      {customer && (
        <div className="card border-myth-accent/30">
          <p className="text-xs text-myth-accent uppercase tracking-wide mb-3">Customer info</p>
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
            <div>
              <p className="text-lg font-semibold text-white">{customer.firstName} {customer.lastName}</p>
              <p className="text-gray-400 text-sm">{customer.title}{customer.companyName ? ` · ${customer.companyName}` : ''}</p>
            </div>
            <div className="bg-myth-navy-light p-4 rounded-xl border border-myth-border">
              <h3 className="text-sm font-semibold text-white mb-2">Contact information</h3>
              <p className="text-xs text-gray-500 mb-4">Primary ways to reach this customer — calls, emails, and meetings</p>
              <div className="grid gap-3">
                {customer.email && (
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-myth-accent shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <a href={`mailto:${customer.email}`} className="text-gray-300 hover:text-myth-accent break-all">{customer.email}</a>
                    </div>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-myth-accent shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <a href={`tel:${customer.phone}`} className="text-gray-300 hover:text-myth-accent">{customer.phone}</a>
                    </div>
                  </div>
                )}
                {customer.companyName && (
                  <div className="flex items-start gap-3">
                    <Building2 size={18} className="text-myth-accent shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <span className="text-gray-300">{customer.companyName}</span>
                    </div>
                  </div>
                )}
                {customer.title && (
                  <div className="flex items-start gap-3">
                    <Briefcase size={18} className="text-myth-accent shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Job title</p>
                      <span className="text-gray-300">{customer.title}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <DealDeliveryFields
          form={form}
          setDeal={setDeal}
          setProject={setProject}
          requirementsDocument={requirementsDocument}
          setRequirementsDocument={setRequirementsDocument}
          canAssign={canAssign}
          salesUsers={salesUsers}
          managers={managers}
          projectCategories={projectCategories}
          fromLead={Boolean(leadId)}
          isAdmin={isAdmin}
          isManager={isManager}
          lead={lead}
          userExistsForEmail={userExistsForEmail}
          onEmailChange={handleEmailChange}
        />
        <div className="flex flex-wrap gap-3 justify-end">
          <Link to={leadId ? `/leads/${leadId}` : customerId ? `/customers/${customerId}` : '/deals'} className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating…' : leadId ? 'Create deal from lead' : customerId ? 'Create deal for customer' : 'Create deal'}
          </button>
        </div>
      </form>
    </div>
  );
}
