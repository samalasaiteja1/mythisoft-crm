import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { followupsAPI } from '../../../services/api';
import FollowUpForm from '../../../components/followups/FollowUpForm';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

export default function EditCustomerFollowUp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    followupsAPI.getOne(id)
      .then(({ data }) => setItem(data))
      .catch(() => toast.error('Follow-up not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!item) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Edit customer follow-up</h2>
        <p className="text-sm text-gray-500">{item.title}</p>
      </div>
      <FollowUpForm
        workflowStage="customer"
        initial={item}
        submitLabel="Update follow-up"
        onSuccess={() => navigate(FOLLOW_UP_PATHS.customer.detail(id))}
      />
    </div>
  );
}
