import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Phone, Mail, Video, Pencil, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { followupsAPI, customersAPI, formatDateTime } from '../../../services/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import {
  ACTIVITY_TYPE_LABELS,
  WORKFLOW_STAGE_LABELS,
  FOLLOWUP_STATUS_LABELS_MAP,
} from '../../../constants/followups';
import { normalizeFollowupStatus, FOLLOWUP_STATUS_COLORS } from '../../../constants/leadFollowups';
import { contactEmail, contactPhone, companyName, contactTitle } from '../../../components/followups/followUpHelpers';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';

export default function CustomerFollowUpDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isVirtual = searchParams.get('virtual') === '1';
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVirtual) {
      customersAPI.getOne(id)
        .then(({ data }) => {
          const customer = data.customer || data;
          setItem({
            virtual: true,
            workflowStage: 'customer',
            activityType: 'phone_call',
            title: `Customer follow-up: ${customer.firstName} ${customer.lastName}`,
            scheduledAt: customer.updatedAt || customer.createdAt,
            status: 'scheduled',
            customer,
            assignedTo: customer.assignedTo,
            contactName: `${customer.firstName} ${customer.lastName}`.trim(),
            contactEmail: customer.email,
            contactPhone: customer.phone,
            contactTitle: customer.title,
            company: customer.companyName || customer.company?.name,
            notes: customer.notes,
          });
        })
        .catch(() => toast.error('Customer not found'))
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
      navigate(FOLLOW_UP_PATHS.customer.addWithCustomer(item.customer._id));
      return;
    }
    try {
      await followupsAPI.complete(item._id, {});
      toast.success('Completed');
      setItem({ ...item, status: 'completed' });
    } catch {
      toast.error('Failed');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!item) return null;

  const statusKey = item.status === 'pending' ? 'scheduled' : item.status;
  const statusColor = FOLLOWUP_STATUS_COLORS[statusKey] || 'bg-gray-500/20 text-gray-400';
  const customerId = item.customer?._id || item.customer;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to={FOLLOW_UP_PATHS.customer.list} className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back to customer follow-ups
      </Link>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{WORKFLOW_STAGE_LABELS.customer}</p>
            <h1 className="text-xl font-bold text-white mt-1">{item.title}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {ACTIVITY_TYPE_LABELS[item.activityType] || item.activityType}
              {' · '}
              {formatDateTime(item.scheduledAt)}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full ${statusColor}`}>
            {FOLLOWUP_STATUS_LABELS_MAP[statusKey] || statusKey}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-myth-border pt-4">
          <div>
            <p className="text-xs text-gray-500">Contact</p>
            <p className="text-white font-medium">{item.contactName || '—'}</p>
            {contactTitle(item) && <p className="text-gray-400">{contactTitle(item)}</p>}
            {companyName(item) && <p className="text-gray-400">{companyName(item)}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500">Assigned to</p>
            <p className="text-white">
              {item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : '—'}
            </p>
          </div>
          {contactEmail(item) && (
            <div className="flex items-center gap-2 text-gray-300">
              <Mail size={14} className="text-myth-accent" /> {contactEmail(item)}
            </div>
          )}
          {contactPhone(item) && (
            <div className="flex items-center gap-2 text-gray-300">
              <Phone size={14} className="text-green-400" /> {contactPhone(item)}
            </div>
          )}
        </div>

        {customerId && (
          <Link to={`/customers/${customerId}`} className="text-sm text-myth-accent hover:underline inline-block">
            View customer profile →
          </Link>
        )}

        {item.notes && (
          <div className="border-t border-myth-border pt-4">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-myth-border">
          {contactPhone(item) && (
            <a href={`tel:${contactPhone(item)}`} className="btn-secondary text-sm inline-flex items-center gap-1.5">
              <Phone size={14} /> Call
            </a>
          )}
          {contactEmail(item) && (
            <a href={`mailto:${contactEmail(item)}`} className="btn-secondary text-sm inline-flex items-center gap-1.5">
              <Mail size={14} /> Email
            </a>
          )}
          {item.meetingLink && (
            <a href={item.meetingLink} target="_blank" rel="noreferrer" className="btn-secondary text-sm inline-flex items-center gap-1.5">
              <Video size={14} /> Meeting
            </a>
          )}
          {!item.virtual && (
            <Link to={FOLLOW_UP_PATHS.customer.edit(item._id)} className="btn-secondary text-sm inline-flex items-center gap-1.5">
              <Pencil size={14} /> Edit
            </Link>
          )}
          {item.status !== 'completed' && item.status !== 'cancelled' && (
            <button type="button" onClick={complete} className="btn-primary text-sm inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} /> {item.virtual ? 'Schedule follow-up' : 'Mark complete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
