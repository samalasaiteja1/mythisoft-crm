import { getCustomerSupportAssignmentDisplay, SUPPORT_ASSIGNMENT_COPY } from '../../utils/customerSupportAssignment';

export default function CustomerSupportAssignmentBadge({ customer }) {
  const { status, label } = getCustomerSupportAssignmentDisplay(customer, customer?.supportAssignment);

  if (status === 'none') {
    return (
      <p className="text-xs font-medium text-amber-400/90 border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 rounded-lg">
        {SUPPORT_ASSIGNMENT_COPY.none}
      </p>
    );
  }

  if (status === 'support_manager') {
    return (
      <p className="text-xs font-medium text-cyan-300 border border-cyan-500/40 bg-cyan-600/15 px-2.5 py-1.5 rounded-lg">
        {SUPPORT_ASSIGNMENT_COPY.support_manager}: {label}
      </p>
    );
  }

  return (
    <p className="text-xs font-medium text-cyan-300 border border-cyan-500/40 bg-cyan-600/15 px-2.5 py-1.5 rounded-lg">
      {SUPPORT_ASSIGNMENT_COPY.support}: {label}
    </p>
  );
}
