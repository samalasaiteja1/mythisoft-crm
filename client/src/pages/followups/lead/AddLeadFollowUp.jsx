import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { leadsAPI } from '../../../services/api';
import { mapLeadToFollowUpContact, unwrapLeadResponse } from '../../../utils/leadContact';
import { normalizeLeadStatusForFollowup } from '../../../constants/leadFollowups';
import FollowUpForm from '../../../components/followups/FollowUpForm';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

export default function AddLeadFollowUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const [prefill, setPrefill] = useState(null);
  const [loading, setLoading] = useState(!!leadId);

  useEffect(() => {
    if (!leadId) return;
    leadsAPI.getOne(leadId)
      .then(({ data }) => {
        const lead = unwrapLeadResponse(data);
        setPrefill({
          workflowStage: 'lead',
          lead: lead._id,
          leadStatus: normalizeLeadStatusForFollowup(lead.status),
          ...mapLeadToFollowUpContact(lead),
        });
      })
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Add lead follow-up</h2>
        <p className="text-sm text-gray-500">Contact info is loaded from the lead — schedule a call, meeting, email, or chat</p>
      </div>
      <FollowUpForm
        workflowStage="lead"
        initial={prefill}
        submitLabel="Create lead follow-up"
        onSuccess={() => navigate(FOLLOW_UP_PATHS.lead.list)}
      />
    </div>
  );
}
