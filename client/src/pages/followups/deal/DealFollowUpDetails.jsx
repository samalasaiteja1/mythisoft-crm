import { useEffect, useState } from 'react';

import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Phone, Mail, Video, Pencil, CheckCircle2, ArrowLeft } from 'lucide-react';

import toast from 'react-hot-toast';

import { followupsAPI, dealsAPI, formatDate, formatDateTime } from '../../../services/api';

import LoadingSpinner from '../../../components/LoadingSpinner';

import {

  ACTIVITY_TYPE_LABELS,

  WORKFLOW_STAGE_LABELS,

  FOLLOWUP_STATUS_LABELS_MAP,

  FOLLOWUP_OPTION_LABELS_MAP,

  FOLLOWUP_OUTCOME_LABELS_MAP,

} from '../../../constants/followups';

import { contactEmail, contactPhone, companyName } from '../../../components/followups/followUpHelpers';

import { mapLeadToFollowUpContact } from '../../../utils/leadContact';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

import {

  normalizeDealFollowupStatus,

  normalizeDealStageForFollowup,

  DEAL_FOLLOWUP_STATUS_COLORS,

  DEAL_STAGE_LABELS,

  getDealStageGroup,

} from '../../../constants/dealFollowups';



export default function DealFollowUpDetails() {

  const { id } = useParams();

  const [searchParams] = useSearchParams();

  const isVirtual = searchParams.get('virtual') === '1';

  const navigate = useNavigate();

  const [item, setItem] = useState(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    if (isVirtual) {

      dealsAPI.getOne(id)

        .then(({ data }) => {

          const lead = data.lead;

          setItem({

            virtual: true,

            workflowStage: 'deal',

            activityType: 'phone_call',

            dealStage: normalizeDealStageForFollowup(data.stage),

            followUpOption: 'initial_contact',

            title: `Deal follow-up: ${data.title}`,

            scheduledAt: data.expectedCloseDate || data.createdAt,

            status: 'scheduled',

            deal: data,

            lead,

            assignedTo: data.assignedTo,

            notes: data.description,

            ...mapLeadToFollowUpContact(lead || {}),

            contactName: lead

              ? `${lead.firstName} ${lead.lastName}`.trim()

              : data.title,

            company: lead?.company || data.title,

          });

        })

        .catch(() => toast.error('Deal not found'))

        .finally(() => setLoading(false));

      return;

    }

    followupsAPI.getOne(id)

      .then(({ data }) => setItem(data))

      .catch(() => toast.error('Follow-up not found'))

      .finally(() => setLoading(false));

  }, [id, isVirtual]);



  const complete = async () => {

    if (item.virtual) {

      navigate(FOLLOW_UP_PATHS.deal.addWithDeal(item.deal._id));

      return;

    }

    try {

      await followupsAPI.complete(item._id, {});

      toast.success('Completed');

      navigate(FOLLOW_UP_PATHS.deal.list);

    } catch {

      toast.error('Failed');

    }

  };



  if (loading) return <LoadingSpinner />;

  if (!item) return <p className="text-gray-500">Follow-up not found</p>;



  const deal = item.deal;

  const pr = deal?.projectRequirements;

  const statusKey = normalizeDealFollowupStatus(item.status);

  const statusColor = DEAL_FOLLOWUP_STATUS_COLORS[statusKey] || 'bg-gray-500/20 text-gray-400';

  const dealStageGroup = item.dealStage ? getDealStageGroup(item.dealStage) : null;



  return (

    <div className="space-y-4">

      <Link to={FOLLOW_UP_PATHS.deal.list} className="text-sm text-myth-accent hover:underline flex items-center gap-1">

        <ArrowLeft size={14} /> Back to deal follow-ups

      </Link>



      <div className="card space-y-4">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <p className="text-xs text-gray-500 uppercase">

              {WORKFLOW_STAGE_LABELS.deal} · {ACTIVITY_TYPE_LABELS[item.activityType] || item.activityType}

              {item.followUpOption && ` · ${FOLLOWUP_OPTION_LABELS_MAP[item.followUpOption] || ''}`}

            </p>

            <h2 className="text-xl font-bold text-white mt-1">{item.title}</h2>

            <div className="flex flex-wrap items-center gap-2 mt-2">

              <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>

                {FOLLOWUP_STATUS_LABELS_MAP[statusKey]}

              </span>

              {item.virtual && (

                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">

                  No follow-up scheduled yet

                </span>

              )}

              {item.dealStage && (

                <span className="text-xs text-gray-400">

                  {DEAL_STAGE_LABELS[item.dealStage] || dealStageGroup?.label}

                </span>

              )}

            </div>

            <p className="text-sm text-gray-400 mt-1">Scheduled: {formatDateTime(item.scheduledAt)}</p>

          </div>

          <div className="flex gap-2">

            {!item.virtual && (

              <Link to={FOLLOW_UP_PATHS.deal.edit(item._id)} className="btn-secondary flex items-center gap-1">

                <Pencil size={14} /> Edit

              </Link>

            )}

            {item.virtual && (

              <Link to={FOLLOW_UP_PATHS.deal.addWithDeal(deal._id)} className="btn-secondary flex items-center gap-1">

                <Pencil size={14} /> Schedule follow-up

              </Link>

            )}

            {item.status !== 'completed' && item.status !== 'cancelled' && (

              <button type="button" onClick={complete} className="btn-primary flex items-center gap-1">

                <CheckCircle2 size={14} /> {item.virtual ? 'Create follow-up' : 'Complete'}

              </button>

            )}

          </div>

        </div>



        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-myth-border">

          <div>

            <p className="text-xs text-gray-500 uppercase mb-2">Contact</p>

            <p className="text-white">{item.contactName || deal?.title}</p>

            <p className="text-gray-400 text-sm">{companyName(item)}</p>

            {item.lead && (

              <Link to={`/leads/${item.lead._id}`} className="text-xs text-myth-accent hover:underline mt-1 inline-block">

                Source lead: {item.lead.firstName} {item.lead.lastName}

              </Link>

            )}

            <div className="flex gap-2 mt-2">

              {contactPhone(item) && <a href={`tel:${contactPhone(item)}`} className="p-2 text-green-400 bg-green-400/10 rounded-lg"><Phone size={14} /></a>}

              {contactEmail(item) && <a href={`mailto:${contactEmail(item)}`} className="p-2 text-blue-400 bg-blue-400/10 rounded-lg"><Mail size={14} /></a>}

              {item.meetingLink && <a href={item.meetingLink} target="_blank" rel="noreferrer" className="p-2 text-purple-400 bg-purple-400/10 rounded-lg"><Video size={14} /></a>}

            </div>

          </div>

          <div>

            <p className="text-xs text-gray-500 uppercase mb-2">Notes & outcome</p>

            <p className="text-gray-300 text-sm">{item.notes || 'No notes'}</p>

            {item.outcome && (

              <p className="text-teal-400 text-sm mt-2">

                Outcome: {FOLLOWUP_OUTCOME_LABELS_MAP[item.outcome] || item.outcome}

              </p>

            )}

          </div>

          <div>

            <p className="text-xs text-gray-500 uppercase mb-2">Deal & project</p>

            {deal ? (

              <>

                <Link to={`/deals/${deal._id}`} className="text-myth-accent hover:underline text-sm block">

                  {deal.title}

                </Link>

                <p className="text-xs text-gray-500 mt-1 capitalize">{deal.dealType?.replace('_', ' ')} · {deal.stage?.replace(/_/g, ' ')}</p>

                <p className="text-xs text-gray-500">Value: {deal.value ?? '—'}</p>

                {pr && (

                  <div className="mt-2 text-xs text-gray-400 space-y-1">

                    {pr.scope && <p>Scope: {pr.scope}</p>}

                    {pr.deliverables && <p>Deliverables: {pr.deliverables}</p>}

                    {pr.technologyStack?.length > 0 && <p>Tech: {pr.technologyStack.join(', ')}</p>}

                    {pr.estimatedBudget && <p>Budget: {pr.estimatedBudget}</p>}

                    {(pr.startDate || pr.endDate) && (

                      <p>Timeline: {formatDate(pr.startDate)} – {formatDate(pr.endDate)}</p>

                    )}

                  </div>

                )}

              </>

            ) : (

              <p className="text-gray-500 text-sm">No deal linked</p>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}

