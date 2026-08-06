import { getCustomerTechAssignmentDisplay, TECH_ASSIGNMENT_COPY } from '../../utils/customerTechAssignment';

export default function CustomerTechAssignmentBadge({ customer }) {
  const { status, label } = getCustomerTechAssignmentDisplay(customer, customer?.techAssignment);

  if (status === 'none') {
    return (
      <p className="text-xs font-medium text-red-400 border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 rounded-lg">
        {TECH_ASSIGNMENT_COPY.none}
      </p>
    );
  }

  if (status === 'tech_manager') {
    return (
      <p className="text-xs font-medium text-emerald-300 border border-emerald-500/40 bg-emerald-600/15 px-2.5 py-1.5 rounded-lg">
        {TECH_ASSIGNMENT_COPY.tech_manager}: {label}
      </p>
    );
  }

  return (
    <p className="text-xs font-medium text-emerald-300 border border-emerald-500/40 bg-emerald-600/15 px-2.5 py-1.5 rounded-lg">
      {TECH_ASSIGNMENT_COPY.tech}: {label}
    </p>
  );
}
