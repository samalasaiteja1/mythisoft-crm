import { CheckCircle2, Clock } from 'lucide-react';
import {
  isAwaitingCustomerAcceptance,
  isCustomerAccepted,
  customerAcceptanceDate,
} from '../../utils/customerAcceptance';

export default function CustomerAcceptanceBadge({ project, showWhenIdle = false }) {
  if (!project) return null;

  if (isCustomerAccepted(project)) {
    const date = customerAcceptanceDate(project);
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
        <CheckCircle2 size={12} />
        Customer accepted
        {date && <span className="text-green-300/80">· {new Date(date).toLocaleDateString()}</span>}
      </span>
    );
  }

  if (isAwaitingCustomerAcceptance(project)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <Clock size={12} />
        Pending customer acceptance
      </span>
    );
  }

  if (!showWhenIdle) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 border border-myth-border">
      Not yet delivered to customer
    </span>
  );
}
