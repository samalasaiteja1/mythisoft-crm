import { CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import CustomerAcceptanceBadge from './CustomerAcceptanceBadge';
import MarkCustomerAcceptedButton from './MarkCustomerAcceptedButton';
import {
  isAwaitingCustomerAcceptance,
  isCustomerAccepted,
  isPendingCustomerAcceptance,
  customerAcceptanceDate,
  customerAcceptanceNotes,
} from '../../utils/customerAcceptance';
import { useAuth } from '../../context/AuthContext';
import { isSupportManagerUser } from '../../utils/roleContext';

export default function CustomerAcceptancePanel({ project, onUpdated }) {
  const { user } = useAuth();
  const canMarkAcceptance = user?.role === 'admin' || isSupportManagerUser(user);

  if (!project?.supportHandoffAt && !isCustomerAccepted(project) && !isAwaitingCustomerAcceptance(project)) {
    return null;
  }

  const accepted = isCustomerAccepted(project);
  const pending = isAwaitingCustomerAcceptance(project);
  const pendingSubmission = isPendingCustomerAcceptance(project);
  const notes = customerAcceptanceNotes(project);
  const acceptedAt = customerAcceptanceDate(project);

  return (
    <div className={`card border ${accepted ? 'border-green-500/30 bg-green-500/5' : pending ? 'border-amber-500/30 bg-amber-500/5' : 'border-myth-border'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {accepted ? <CheckCircle2 className="text-green-400" size={20} /> : <Clock className="text-amber-400" size={20} />}
            Customer Acceptance
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {accepted
              ? 'Customer acceptance has been recorded.'
              : pendingSubmission
                ? 'Waiting for the customer to accept delivery — you can mark as accepted if they confirmed offline.'
                : pending
                  ? 'Waiting for the customer to accept delivery from their portal.'
                  : 'Customer acceptance is not applicable yet.'}
          </p>
        </div>
        <CustomerAcceptanceBadge project={project} />
      </div>

      {(accepted || pending) && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <dt className="text-gray-500">Status</dt>
            <dd className="text-white mt-0.5">{accepted ? 'Accepted' : 'Pending'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{accepted ? 'Accepted on' : 'Submitted to customer'}</dt>
            <dd className="text-gray-300 mt-0.5">
              {accepted && acceptedAt
                ? new Date(acceptedAt).toLocaleString()
                : project.submittedToCustomerAt
                  ? new Date(project.submittedToCustomerAt).toLocaleString()
                  : project.supportHandoffAt
                    ? new Date(project.supportHandoffAt).toLocaleString()
                    : '—'}
            </dd>
          </div>
          {notes && (
            <div className="sm:col-span-2">
              <dt className="text-gray-500 flex items-center gap-1">
                <MessageSquare size={14} /> Comments
              </dt>
              <dd className="text-gray-300 mt-1 whitespace-pre-wrap">{notes}</dd>
            </div>
          )}
        </dl>
      )}

      {canMarkAcceptance && pendingSubmission && (
        <div className="mt-4 pt-4 border-t border-myth-border/60">
          <MarkCustomerAcceptedButton project={project} onDone={onUpdated} />
        </div>
      )}
    </div>
  );
}
