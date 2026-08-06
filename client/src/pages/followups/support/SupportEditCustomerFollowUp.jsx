import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { followupsAPI } from '../../../services/api';
import FollowUpForm from '../../../components/followups/FollowUpForm';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

const P = FOLLOW_UP_PATHS.support;

export default function SupportEditCustomerFollowUp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    followupsAPI.getOne(id)
      .then(({ data }) => setInitial(data))
      .catch(() => toast.error('Failed to load follow-up'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!initial) return <p className="text-gray-500">Follow-up not found.</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Edit follow-up</h2>
        <p className="text-sm text-gray-500">Update schedule, notes, or assignment</p>
      </div>
      <FollowUpForm
        workflowStage="customer"
        initial={initial}
        followupId={id}
        submitLabel="Save changes"
        onSuccess={() => navigate(P.detail(id))}
      />
    </div>
  );
}
