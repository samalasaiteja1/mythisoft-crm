import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Phone, Mail, Video, Pencil, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { followupsAPI, formatDateTime, leadsAPI } from '../../../services/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { ACTIVITY_TYPE_LABELS, WORKFLOW_STAGE_LABELS, FOLLOWUP_STATUS_LABELS_MAP, FOLLOWUP_OPTION_LABELS_MAP } from '../../../constants/followups';
import {
  getLeadStatusGroup,
  normalizeFollowupStatus,
  FOLLOWUP_STATUS_COLORS,
} from '../../../constants/leadFollowups';
import { contactEmail, contactPhone, contactAlternatePhone, contactWebsite, contactTitle, companyName } from '../../../components/followups/followUpHelpers';
import { mapLeadToFollowUpContact, unwrapLeadResponse } from '../../../utils/leadContact';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

export default function LeadFollowUpDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isVirtual = searchParams.get('virtual') === '1';
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVirtual) {
      leadsAPI.getOne(id)
        .then(({ data }) => {
          const lead = unwrapLeadResponse(data);
          setItem({
            virtual: true,
            workflowStage: 'lead',
            activityType: 'phone_call',
            leadStatus: 'new',
            followUpOption: 'first_call',
            title: `Follow up: ${lead.firstName} ${lead.lastName}`,
            scheduledAt: lead.nextFollowUp,
            status: 'scheduled',
            lead,
            assignedTo: lead.assignedTo,
            ...mapLeadToFollowUpContact(lead),
          });
        })
        .catch(() => toast.error('Not found'))
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
      navigate(FOLLOW_UP_PATHS.lead.addWithLead(item.lead._id));
      return;
    }
    try {
      await followupsAPI.complete(item._id, {});
      toast.success('Completed');
      navigate(FOLLOW_UP_PATHS.lead.list);
    } catch {
      toast.error('Failed');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!item) return <p className="text-gray-500">Follow-up not found</p>;

  const deal = item.deal;
  const pr = deal?.projectRequirements;
  const statusKey = normalizeFollowupStatus(item.status);
  const statusColor = FOLLOWUP_STATUS_COLORS[statusKey] || 'bg-gray-500/20 text-gray-400';
  const leadStatusGroup = item.leadStatus ? getLeadStatusGroup(item.leadStatus) : null;

  return (
    <div className="space-y-4">
      <Link to={FOLLOW_UP_PATHS.lead.list} className="text-sm text-myth-accent hover:underline flex items-center gap-1">
        <ArrowLeft size={14} /> Back to lead follow-ups
      </Link>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">
              {WORKFLOW_STAGE_LABELS.lead} · {ACTIVITY_TYPE_LABELS[item.activityType] || item.activityType}
              {item.followUpOption && ` · ${FOLLOWUP_OPTION_LABELS_MAP[item.followUpOption] || ''}`}
            </p>
            <h2 className="text-xl font-bold text-white mt-1">{item.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                {FOLLOWUP_STATUS_LABELS_MAP[statusKey]}
              </span>
              {leadStatusGroup && (
                <span className="text-xs text-gray-400">
                  {leadStatusGroup.dot} {leadStatusGroup.label}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">Scheduled: {formatDateTime(item.scheduledAt)}</p>
          </div>
          <div className="flex gap-2">
            {!item.virtual && (
              <Link to={FOLLOW_UP_PATHS.lead.edit(item._id)} className="btn-secondary flex items-center gap-1">
                <Pencil size={14} /> Edit
              </Link>
            )}
            {item.status !== 'completed' && item.status !== 'cancelled' && (
              <button type="button" onClick={complete} className="btn-primary flex items-center gap-1">
                <CheckCircle2 size={14} /> Complete
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-myth-border">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Contact</p>
            <p className="text-white">{item.contactName || `${item.lead?.firstName} ${item.lead?.lastName}`}</p>
            <p className="text-gray-400 text-sm">{companyName(item)}</p>
            {contactTitle(item) && <p className="text-gray-400 text-sm">{contactTitle(item)}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              {contactPhone(item) && <a href={`tel:${contactPhone(item)}`} className="p-2 text-green-400 bg-green-400/10 rounded-lg"><Phone size={14} /></a>}
              {contactAlternatePhone(item) && contactAlternatePhone(item) !== contactPhone(item) && (
                <a href={`tel:${contactAlternatePhone(item)}`} className="p-2 text-green-400 bg-green-400/10 rounded-lg text-xs" title="Alternate">Alt</a>
              )}
              {contactEmail(item) && <a href={`mailto:${contactEmail(item)}`} className="p-2 text-blue-400 bg-blue-400/10 rounded-lg"><Mail size={14} /></a>}
              {contactWebsite(item) && <a href={contactWebsite(item).startsWith('http') ? contactWebsite(item) : `https://${contactWebsite(item)}`} target="_blank" rel="noreferrer" className="p-2 text-purple-400 bg-purple-400/10 rounded-lg text-xs">Web</a>}
              {item.meetingLink && <a href={item.meetingLink} target="_blank" rel="noreferrer" className="p-2 text-purple-400 bg-purple-400/10 rounded-lg"><Video size={14} /></a>}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Notes</p>
            <p className="text-gray-300 text-sm">{item.notes || 'No notes'}</p>
            {item.outcome && <p className="text-teal-400 text-sm mt-2">Outcome: {item.outcome}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Linked records</p>
            {item.lead && (
              <Link to={`/leads/${item.lead._id}`} className="text-myth-accent hover:underline text-sm block">
                Lead: {item.lead.firstName} {item.lead.lastName}
              </Link>
            )}
            {deal && (
              <>
                <Link to={`/deals/${deal._id}`} className="text-myth-accent hover:underline text-sm block mt-1">
                  Deal: {deal.title}
                </Link>
                {pr && (
                  <div className="mt-2 text-xs text-gray-400 space-y-1">
                    {pr.scope && <p>Scope: {pr.scope}</p>}
                    {pr.technologyStack?.length > 0 && <p>Tech: {pr.technologyStack.join(', ')}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
