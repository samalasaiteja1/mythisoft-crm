import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { customersAPI } from '../../../services/api';
import FollowUpForm from '../../../components/followups/FollowUpForm';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

export default function AddCustomerFollowUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId');
  const [prefill, setPrefill] = useState(null);
  const [loading, setLoading] = useState(!!customerId);

  useEffect(() => {
    if (!customerId) return;
    customersAPI.getOne(customerId)
      .then(({ data }) => {
        const customer = data.customer || data;
        setPrefill({
          workflowStage: 'customer',
          customer: customer._id,
          title: `Customer follow-up: ${customer.firstName} ${customer.lastName}`,
          contactName: `${customer.firstName} ${customer.lastName}`.trim(),
          contactEmail: customer.email,
          contactPhone: customer.phone,
          contactTitle: customer.title,
          company: customer.companyName || customer.company?.name,
          notes: customer.notes,
        });
      })
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Add customer follow-up</h2>
        <p className="text-sm text-gray-500">Contact info loads from the customer record</p>
      </div>
      <FollowUpForm
        workflowStage="customer"
        initial={prefill}
        submitLabel="Create customer follow-up"
        onSuccess={() => navigate(FOLLOW_UP_PATHS.customer.list)}
      />
    </div>
  );
}
