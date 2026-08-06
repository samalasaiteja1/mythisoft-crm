import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dealsAPI } from '../../../services/api';
import { mapLeadToFollowUpContact } from '../../../utils/leadContact';
import { normalizeDealStageForFollowup } from '../../../constants/dealFollowups';
import FollowUpForm from '../../../components/followups/FollowUpForm';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

export default function AddDealFollowUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get('dealId');
  const [prefill, setPrefill] = useState(null);
  const [loading, setLoading] = useState(!!dealId);

  useEffect(() => {
    if (!dealId) return;
    dealsAPI.getOne(dealId)
      .then(({ data }) => {
        const lead = data.lead;
        setPrefill({
          workflowStage: 'deal',
          deal: data._id,
          dealStage: normalizeDealStageForFollowup(data.stage),
          lead: lead?._id,
          title: `Deal follow-up: ${data.title}`,
          notes: data.description,
          ...(lead ? mapLeadToFollowUpContact(lead) : { contactName: data.title, company: data.title }),
        });
      })
      .finally(() => setLoading(false));
  }, [dealId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Add deal follow-up</h2>
        <p className="text-sm text-gray-500">Contact info loaded from the deal&apos;s linked lead</p>
      </div>
      <FollowUpForm
        workflowStage="deal"
        initial={prefill}
        submitLabel="Create deal follow-up"
        onSuccess={() => navigate(FOLLOW_UP_PATHS.deal.list)}
      />
    </div>
  );
}
