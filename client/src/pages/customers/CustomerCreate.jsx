import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersAPI, dealsAPI, documentsAPI, projectsAPI, authAPI } from '../../services/api';
import { uploadRequirementsDocument } from '../../utils/projectDocument';
import CustomerForm from '../../components/customers/CustomerForm';
import { emptyCustomerForm, buildCustomerPayload, formFromDeal, hasDealContactInfo, shouldCreateProjectForCustomer, isProjectTeamComplete, hasProjectTeamData, buildProjectPayloadFromCustomerForm } from '../../utils/customerForm';
import { usePermissions } from '../../hooks/usePermissions';
import LoadingSpinner from '../../components/LoadingSpinner';
import useActiveProjectCategories from '../../hooks/useProjectCategories';

export default function CustomerCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get('dealId');
  const dealFromNav = location.state?.deal?._id === dealId ? location.state.deal : null;
  const { canWrite, isAdmin, isManager } = usePermissions();
  const canAssign = isAdmin || isManager;

  const [form, setForm] = useState(() => ({
    ...emptyCustomerForm,
    ...(dealFromNav ? formFromDeal(dealFromNav) : {}),
  }));
  const [deal, setDeal] = useState(dealFromNav);
  const [loadingDeal, setLoadingDeal] = useState(!!dealId && !dealFromNav);
  const [submitting, setSubmitting] = useState(false);
  const [requirementsDocument, setRequirementsDocument] = useState(null);
  const [userExistsForEmail, setUserExistsForEmail] = useState(false);
  const { categories: projectCategories } = useActiveProjectCategories();

  useEffect(() => {
    if (!dealId) return;
    setLoadingDeal(true);
    dealsAPI.getOne(dealId)
      .then(({ data }) => {
        if (data.customer) {
          const customerId = data.customer._id || data.customer;
          navigate(`/customers/${customerId}`, { replace: true });
          return;
        }
        setDeal(data);
        setForm(formFromDeal(data));
      })
      .catch(() => {
        toast.error('Deal not found');
        navigate('/deals');
      })
      .finally(() => setLoadingDeal(false));
  }, [dealId, navigate]);

  const handleEmailChange = async (email) => {
    setForm({ ...form, email });
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

    if (hasProjectTeamData(form) && !isProjectTeamComplete(form)) {
      toast.error('Select both a technical manager and at least one team member');
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildCustomerPayload(form);
      if (form.customerPassword) {
        payload.customerPassword = form.customerPassword;
      }
      const createProjectAfterCustomer = shouldCreateProjectForCustomer(form, requirementsDocument);

      const uploadCustomerRequirementsDoc = async (customerId) => {
        if (!requirementsDocument || !customerId) return;
        try {
          const fd = new FormData();
          fd.append('file', requirementsDocument);
          fd.append('name', requirementsDocument.name);
          fd.append('folder', 'Project Requirements');
          fd.append('relatedType', 'customer');
          fd.append('relatedId', customerId);
          fd.append('tags', 'requirements');
          await documentsAPI.create(fd);
        } catch {
          toast.error('Customer created, but requirements document upload failed');
        }
      };

      const finishWithProject = async (customerId, dealData, dealIdForProject) => {
        try {
          const projectPayload = buildProjectPayloadFromCustomerForm(form, {
            customerId,
            dealId: dealIdForProject,
            dealValue: dealData?.value,
            sourceRequirements: dealData?.projectRequirements,
          });
          const { data: projectResp } = await projectsAPI.create(projectPayload);
          const projectId = projectResp._id || projectResp.data?._id || projectResp.id || projectResp;

          if (requirementsDocument && projectId) {
            try {
              await uploadRequirementsDocument(projectId, requirementsDocument);
            } catch {
              toast.error('Project created but failed to upload requirements document');
            }
          }

          toast.success('Project created');
          navigate(`/projects/${projectId}`);
        } catch {
          toast.error('Customer created but failed to create project automatically');
          navigate(`/customers/${customerId}`);
        }
      };

      if (dealId) {
        const { data } = await dealsAPI.convertToCustomer(dealId, payload);
        toast.success('Customer created from deal');
        const customerId = data.customer?._id || data.customer;
        await uploadCustomerRequirementsDoc(customerId);

        const dealData = data.deal || data;
        const dealHasPR = Boolean(
          dealData?.projectRequirements?.name
          || dealData?.projectRequirements?.category
          || dealData?.projectRequirements?.description
        );

        if (createProjectAfterCustomer || dealHasPR) {
          await finishWithProject(customerId, dealData, dealId);
          return;
        }

        if (canAssign) {
          navigate(`/deals/${dealId}`, { state: { assignProject: true } });
        } else {
          navigate(`/customers/${customerId}`);
        }
      } else {
        const { data } = await customersAPI.create(payload);
        const customerId = data._id;
        await uploadCustomerRequirementsDoc(customerId);

        if (createProjectAfterCustomer) {
          await finishWithProject(customerId);
          return;
        }

        toast.success('Customer created');
        navigate(`/customers/${customerId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canWrite('customers')) {
    return (
      <div className="text-center text-gray-400 py-12">
        You do not have permission to add customers.
        <Link to="/customers/all" className="block mt-2 text-myth-accent hover:underline">Back to customers</Link>
      </div>
    );
  }

  if (loadingDeal) return <LoadingSpinner />;

  const backTo = dealId ? '/deals' : '/customers/all';

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to={backTo} className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back to {dealId ? 'deals' : 'customers'}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">{dealId ? 'Convert deal to customer' : 'Add Customer'}</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {dealId
            ? 'Contact details are loaded from the deal. Review account settings and confirm.'
            : 'Create a new customer account with contact and company details'}
        </p>
      </div>

      <div className="card">
        <CustomerForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onCancel={() => navigate(backTo)}
          submitLabel={dealId ? 'Create customer & convert deal' : 'Create customer'}
          submitting={submitting}
          fromDealConversion={Boolean(dealId)}
          dealTitle={deal?.title || dealFromNav?.title || ''}
          contactLocked={Boolean(dealId && hasDealContactInfo(deal || dealFromNav))}
          projectCategories={projectCategories}
          requirementsDocument={requirementsDocument}
          setRequirementsDocument={setRequirementsDocument}
          showProjectSetup={true}
          canAssignTeam={canAssign}
          userExistsForEmail={userExistsForEmail}
          onEmailChange={handleEmailChange}
        />
      </div>
    </div>
  );
}
