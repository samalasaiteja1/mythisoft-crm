import { Link } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import { DEAL_STAGES, formatCurrency, formatDate } from '../../services/api';
import { getDealDeliverySummary } from '../../utils/dealForm';
import { categoryLabel } from '../../hooks/useProjectCategories';

const Field = ({ label, children }) => (
  <div>
    <dt className="text-gray-400 text-xs uppercase tracking-wide">{label}</dt>
    <dd className="text-white text-sm mt-1">{children || '—'}</dd>
  </div>
);

export function ProjectRequirementsView({ requirements }) {
  if (!requirements?.name && !requirements?.description) {
    return <p className="text-gray-500 text-sm">No project requirements recorded.</p>;
  }

  return (
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Project name">{requirements.name}</Field>
      <Field label="Project category">{categoryLabel(requirements.category)}</Field>
      <Field label="Priority">
        <span className="capitalize">{requirements.priority}</span>
      </Field>
      <Field label="Estimated budget">{formatCurrency(requirements.estimatedBudget)}</Field>
      <Field label="Planned start">{formatDate(requirements.startDate)}</Field>
      <Field label="Target end">{formatDate(requirements.endDate)}</Field>
      <Field label="Technology">
        {(requirements.technologyStack || []).join(', ') || '—'}
      </Field>
      {requirements.scope && (
        <div className="md:col-span-2">
          <Field label="Scope">
            <span className="whitespace-pre-wrap">{requirements.scope}</span>
          </Field>
        </div>
      )}
      {requirements.deliverables && (
        <div className="md:col-span-2">
          <Field label="Deliverables">
            <span className="whitespace-pre-wrap">{requirements.deliverables}</span>
          </Field>
        </div>
      )}
      {requirements.description && (
        <div className="md:col-span-2">
          <Field label="Description">
            <span className="whitespace-pre-wrap">{requirements.description}</span>
          </Field>
        </div>
      )}
    </dl>
  );
}

function DealHeader({ deal }) {
  const summary = getDealDeliverySummary(deal);

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
      <div className="min-w-0">
        <Link to={`/deals/${deal._id}`} className="text-white font-medium hover:text-myth-accent">
          {deal.title}
        </Link>
        <p className="text-xs text-gray-500 mt-1">{summary}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className="badge bg-indigo-500/20 text-indigo-400">Project</span>
        <StatusBadge status={deal.stage} config={DEAL_STAGES} />
        <span className="text-sm text-myth-accent font-semibold">{formatCurrency(deal.value)}</span>
      </div>
    </div>
  );
}

export function DealDeliveryCard({ deal, projects = [], requirementsByKey = {} }) {
  const linkedProject = projects.find((p) => String(p.dealRef) === String(deal._id));
  const projectKey = linkedProject ? `project-${linkedProject._id}` : `deal-${deal._id}`;
  const docs = requirementsByKey[projectKey] || [];

  return (
    <div className="rounded-lg border border-myth-border bg-myth-surface/40 p-4 space-y-4">
      <DealHeader deal={deal} />
      {deal.projectRequirements && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Project requirements</p>
          <ProjectRequirementsView requirements={deal.projectRequirements} />
        </div>
      )}
      {docs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-myth-border">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Requirements document</p>
          <RequirementsDocLinks documents={docs} compact />
        </div>
      )}
    </div>
  );
}

export function DealDeliveryOverview({ deals = [], projects = [], requirementsByKey = {} }) {
  const deliveryDeals = deals.filter((d) => d.projectRequirements?.name);

  if (!deliveryDeals.length) {
    return null;
  }

  return (
    <div className="space-y-3 mt-6">
      <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery from converted deals</p>
      {deliveryDeals.map((deal) => (
        <DealDeliveryCard key={deal._id} deal={deal} projects={projects} requirementsByKey={requirementsByKey} />
      ))}
    </div>
  );
}
