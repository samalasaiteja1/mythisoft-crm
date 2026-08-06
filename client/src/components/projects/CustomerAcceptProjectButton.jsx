import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { isPendingCustomerAcceptance } from '../../utils/customerAcceptance';

export default function CustomerAcceptProjectButton({
  project,
  onDone,
  compact = false,
  className = '',
}) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  if (user?.role !== 'customer' || !isPendingCustomerAcceptance(project)) return null;

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const { data } = await projectsAPI.acceptProject(project._id, {});
      toast.success('Project accepted — support is now active');
      onDone?.(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept project');
    } finally {
      setSubmitting(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAccept}
        disabled={submitting}
        className={`text-xs px-2.5 py-1 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 hover:bg-green-500/20 inline-flex items-center gap-1 ${className}`}
      >
        <CheckCircle2 size={12} />
        {submitting ? 'Accepting…' : 'Accept project'}
      </button>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleAccept}
        disabled={submitting}
        className="btn-primary text-sm inline-flex items-center gap-2"
      >
        <CheckCircle2 size={14} />
        {submitting ? 'Accepting…' : 'Accept Project'}
      </button>
      <Link
        to={`/projects/accept?project=${project._id}`}
        className="text-sm text-gray-400 hover:text-myth-accent"
      >
        Add comments
      </Link>
    </div>
  );
}
