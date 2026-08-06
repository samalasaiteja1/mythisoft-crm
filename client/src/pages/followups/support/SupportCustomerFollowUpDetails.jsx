import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { followupsAPI, formatDateTime } from '../../../services/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { FOLLOW_UP_PATHS } from '../../../constants/followUpPaths';
import { ACTIVITY_TYPE_LABELS, FOLLOWUP_STATUS_LABELS_MAP } from '../../../constants/followups';

const P = FOLLOW_UP_PATHS.support;

export default function SupportCustomerFollowUpDetails() {
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

  const complete = async () => {
    try {
      await followupsAPI.complete(id, {});
      toast.success('Marked complete');
      navigate(P.list);
    } catch {
      toast.error('Failed to complete');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!item) return <p className="text-gray-500">Follow-up not found.</p>;

  return (
    <div className="space-y-4">
      <Link to={P.list} className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back to follow-ups
      </Link>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">{item.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {ACTIVITY_TYPE_LABELS[item.activityType] || item.activityType}
              {' · '}
              {FOLLOWUP_STATUS_LABELS_MAP[item.status] || item.status}
            </p>
          </div>
          <div className="flex gap-2">
            {item.status !== 'completed' && (
              <button type="button" onClick={complete} className="btn-primary text-sm inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Complete
              </button>
            )}
            <Link to={P.edit(id)} className="btn-secondary text-sm inline-flex items-center gap-1.5">
              <Pencil size={14} /> Edit
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase">Scheduled</p>
            <p className="text-white">{formatDateTime(item.scheduledAt)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase">Assigned to</p>
            <p className="text-white">
              {item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase">Created by</p>
            <p className="text-white">
              {item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase">Customer</p>
            <p className="text-white">
              {item.customer
                ? `${item.customer.firstName} ${item.customer.lastName}${item.customer.companyName ? ` · ${item.customer.companyName}` : ''}`
                : item.contactName || '—'}
            </p>
          </div>
        </div>

        {item.notes && (
          <div>
            <p className="text-gray-500 text-xs uppercase mb-1">Notes</p>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
