import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { isSupportManagerUser } from '../../utils/roleContext';
import { isPendingCustomerAcceptance } from '../../utils/customerAcceptance';

export default function MarkCustomerAcceptedButton({
  project,
  onDone,
  compact = false,
  className = '',
}) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [comments, setComments] = useState('');

  const canMark = (user?.role === 'admin' || isSupportManagerUser(user))
    && isPendingCustomerAcceptance(project);

  if (!canMark) return null;

  const handleMark = async () => {
    setSubmitting(true);
    try {
      const { data } = await projectsAPI.markCustomerAcceptance(project._id, {
        comments: comments.trim(),
      });
      toast.success('Project marked as customer accepted');
      onDone?.(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record acceptance');
    } finally {
      setSubmitting(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleMark}
        disabled={submitting}
        className={`text-xs px-2.5 py-1 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 hover:bg-green-500/20 inline-flex items-center gap-1 ${className}`}
      >
        <CheckCircle2 size={12} />
        {submitting ? 'Saving…' : 'Mark accepted'}
      </button>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showNotes && (
        <textarea
          className="input-field w-full min-h-[60px] text-sm"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Optional notes (e.g. customer confirmed by phone)…"
        />
      )}
      <button
        type="button"
        onClick={() => {
          if (showNotes) handleMark();
          else setShowNotes(true);
        }}
        disabled={submitting}
        className="btn-primary text-sm inline-flex items-center gap-2"
      >
        <CheckCircle2 size={14} />
        {submitting ? 'Saving…' : showNotes ? 'Confirm customer accepted' : 'Mark as Customer Accepted'}
      </button>
      {showNotes && (
        <button
          type="button"
          onClick={() => setShowNotes(false)}
          className="text-xs text-gray-500 hover:text-gray-300 ml-2"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
