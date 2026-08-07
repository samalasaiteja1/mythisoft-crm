import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, DollarSign, Building2, User, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  customersAPI, formatCurrency, formatDate, formatDateTime,
  DEAL_STAGES, PROJECT_STATUSES, QUOTATION_STATUSES, projectsAPI, documentsAPI,
} from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import CustomerQuickActions from '../components/customers/CustomerQuickActions';
import { DealDeliveryCard, DealDeliveryOverview, ProjectRequirementsView } from '../components/customers/CustomerDealDelivery';
import RequirementsDocLinks from '../components/projects/RequirementsDocLinks';
import { CUSTOMER_DETAIL_TABS } from '../constants/customerNav';
import { PROJECT_WORKFLOW_STAGES } from '../constants/workflow';
import { usePermissions } from '../hooks/usePermissions';

const PROJECT_WORKFLOW_BADGES = Object.fromEntries(
  PROJECT_WORKFLOW_STAGES.map((s) => [s.key, { label: s.label, color: 'bg-indigo-500/20 text-indigo-400' }]),
);

const Empty = ({ text }) => <p className="text-gray-500 text-sm text-center py-6">{text}</p>;

const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="text-gray-400 border-b border-myth-border">
          {headers.map((h) => <th key={h} className="pb-3 pr-4 font-medium text-xs uppercase tracking-wide align-middle">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-myth-border/40">
            {row.map((cell, j) => <td key={j} className="py-3 pr-4 text-gray-300 align-middle">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DetailField = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <Icon size={16} className="text-myth-accent shrink-0 mt-0.5" />
    <div className="min-w-0">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm text-gray-200 break-words">{children || '—'}</div>
    </div>
  </div>
);

export default function CustomerProfile() {
  const { id } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const initialTab = location.state?.tab || 'Overview';
  const [tab, setTab] = useState(
    CUSTOMER_DETAIL_TABS.includes(initialTab) ? initialTab : 'Overview',
  );
  const [loading, setLoading] = useState(true);
  const { isAdmin, isManager } = usePermissions();
  const canAssignProject = isAdmin || isManager;
  const [requirementsByKey, setRequirementsByKey] = useState({});

  useEffect(() => {
    if (!id) {
      toast.error('Invalid customer ID');
      setLoading(false);
      return;
    }
    customersAPI.getOne(id)
      .then(({ data: d }) => setData(d))
      .catch((err) => {
        console.error('Failed to load customer:', err);
        toast.error(err.response?.data?.message || 'Unable to load customer');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (location.state?.tab && CUSTOMER_DETAIL_TABS.includes(location.state.tab)) {
      setTab(location.state.tab);
    }
  }, [location.state?.tab]);

  // Load requirement documents for projects and deals referenced by this customer
  // Must be before any early returns to maintain hook order
  useEffect(() => {
    if (!data?.customer) return;
    const { projects = [], deals = [] } = data;
    const projectDeals = deals.filter((d) => d.projectRequirements?.name);

    let mounted = true;
    async function loadDocs() {
      const map = {};
      try {
        // For each project, fetch customer requirement docs
        await Promise.all((projects || []).map(async (p) => {
          try {
            const { data: docsData } = await projectsAPI.getCustomerRequirementsDocuments(p._id);
            if (mounted) map[`project-${p._id}`] = Array.isArray(docsData) ? docsData : [];
          } catch (err) {
            if (mounted) map[`project-${p._id}`] = [];
          }
        }));

        // For deals without project, fetch documents attached to the deal
        await Promise.all((projectDeals || []).map(async (d) => {
          const linkedProject = projects.find((p) => String(p.dealRef) === String(d._id));
          if (linkedProject) return; // already handled
          try {
            const { data: docsData } = await documentsAPI.getAll({ relatedType: 'deal', relatedId: d._id, tags: 'requirements' });
            if (mounted) map[`deal-${d._id}`] = Array.isArray(docsData) ? docsData : [];
          } catch (err) {
            if (mounted) map[`deal-${d._id}`] = [];
          }
        }));
      } catch (err) {
        // ignore
      }
      if (mounted) setRequirementsByKey(map);
    }
    loadDocs();
    return () => { mounted = false; };
  }, [data]);

  if (loading) return <LoadingSpinner />;
  if (!data?.customer) return <div className="text-center text-gray-400 py-12">Customer not found</div>;

  const {
    customer, deals = [], projects = [], orders = [],
    quotations = [],
    tickets = [], documents = [], activities = [], timeline = [],
  } = data;
  const companyLabel = customer.companyName || customer.company?.name;
  const projectDeals = deals.filter((d) => d.projectRequirements?.name);
  const firstName = customer.firstName || '';
  const lastName = customer.lastName || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || companyLabel || 'Customer';
  const avatarInitials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.trim() || (companyLabel ? companyLabel.charAt(0) : 'C');

  return (
    <div className="space-y-6">
      <Link to="/customers/all" className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back to Customers
      </Link>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 shrink-0 rounded-full bg-myth-accent/20 flex items-center justify-center text-myth-accent text-xl font-bold">
              {avatarInitials}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight">
                {displayName}
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                {customer.title}{companyLabel ? ` · ${companyLabel}` : ''}
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-300">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Mail size={14} className="text-myth-accent shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} className="text-myth-accent shrink-0" />
                  {customer.phone || 'N/A'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-myth-accent font-semibold">
                  <DollarSign size={14} className="shrink-0" />
                  {formatCurrency(customer.lifetimeValue)} LTV
                </span>
              </div>
            </div>
          </div>
          <StatusBadge status={customer.status} config={{
            active: { label: 'Active', color: 'bg-green-500/20 text-green-400' },
            inactive: { label: 'Inactive', color: 'bg-gray-500/20 text-gray-400' },
            vip: { label: 'VIP', color: 'bg-yellow-500/20 text-yellow-400' },
          }} />
        </div>
      </div>

      <CustomerQuickActions customerId={id} customer={customer} />

      <div className="flex gap-1 border-b border-myth-border pb-1 overflow-x-auto">
        {CUSTOMER_DETAIL_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-xs sm:text-sm rounded-t-lg whitespace-nowrap text-left shrink-0 ${
              tab === t ? 'bg-myth-accent/20 text-myth-accent font-medium' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card min-h-[200px]">
        {tab === 'Overview' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[['Deals', deals.length], ['Quotations', quotations.length], ['Projects', projects.length], ['Tickets', tickets.length]].map(([l, v]) => (
                <div key={l} className="stat-card"><p className="text-xs text-gray-400">{l}</p><p className="text-xl font-bold text-white">{v}</p></div>
              ))}
            </div>
            <DealDeliveryOverview deals={deals} projects={projects} requirementsByKey={requirementsByKey} />
          </>
        )}

        {tab === 'Contact Details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField icon={Building2} label="Company">{companyLabel}</DetailField>
            <DetailField icon={Mail} label="Email">{customer.email}</DetailField>
            <DetailField icon={Phone} label="Phone">{customer.phone}</DetailField>
            <DetailField icon={User} label="Status">
              <span className="capitalize">{customer.status}</span>
            </DetailField>
            <DetailField icon={User} label="Sales owner">
              {customer.assignedTo ? `${customer.assignedTo.firstName} ${customer.assignedTo.lastName}` : null}
            </DetailField>
            {customer.address && (customer.address.street || customer.address.city) && (
              <DetailField icon={Building2} label="Address">
                {[
                  customer.address.street,
                  customer.address.city,
                  customer.address.state,
                  customer.address.country,
                  customer.address.zipCode,
                ].filter(Boolean).join(', ')}
              </DetailField>
            )}
            {customer.leadRef && (
              <div className="md:col-span-2">
                <DetailField icon={Link2} label="Source lead">
                  <Link to={`/leads/${customer.leadRef._id}`} className="text-myth-accent hover:underline">
                    {customer.leadRef.firstName} {customer.leadRef.lastName}
                  </Link>
                </DetailField>
              </div>
            )}
          </div>
        )}

        {tab === 'Projects' && (
          <div className="space-y-8">
            {projectDeals.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">From deals</p>
                {projectDeals.map((deal) => {
                  const hasProject = projects.some((p) => String(p.dealRef) === String(deal._id));
                  const linkedProject = projects.find((p) => String(p.dealRef) === String(deal._id));
                  const projectKey = linkedProject ? `project-${linkedProject._id}` : `deal-${deal._id}`;
                  const docs = requirementsByKey[projectKey] || [];
                  return (
                  <div key={deal._id} className="rounded-lg border border-myth-border bg-myth-surface/30 p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Link to={`/deals/${deal._id}`} className="text-white font-medium hover:text-myth-accent">{deal.title}</Link>
                      <span className="badge bg-indigo-500/20 text-indigo-400">Project</span>
                      <StatusBadge status={deal.stage} config={DEAL_STAGES} />
                      {canAssignProject && !hasProject && (
                        <Link to={`/deals/${deal._id}`} className="btn-primary text-xs py-1 px-2 ml-auto">Assign to Technical Team</Link>
                      )}
                    </div>
                    <ProjectRequirementsView requirements={deal.projectRequirements} />
                    {docs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-myth-border">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Requirements document</p>
                        <RequirementsDocLinks documents={docs} compact />
                      </div>
                    )}
                  </div>
                );})}
              </div>
            )}
            {projects.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery projects</p>
                <Table
                  headers={['Project', 'Status', 'Workflow', 'Budget']}
                  rows={projects.map((p) => [
                    <Link key="n" to={`/projects/${p._id}`} className="text-myth-accent hover:underline">{p.name}</Link>,
                    <StatusBadge status={p.status} config={PROJECT_STATUSES} />,
                    <StatusBadge status={p.workflowStage || 'project_started'} config={PROJECT_WORKFLOW_BADGES} />,
                    formatCurrency(p.budget),
                  ])}
                />
              </div>
            ) : projectDeals.length === 0 && <Empty text="No project requirements or delivery projects yet." />}
          </div>
        )}

        {tab === 'Deals' && (deals.length ? (
          <div className="space-y-3">
            {deals.map((d) => (
              <DealDeliveryCard key={d._id} deal={d} />
            ))}
          </div>
        ) : <Empty text="No deals." />)}

        {tab === 'Orders' && (orders.length ? (
          <Table
            headers={['Order', 'Value', 'Stage', 'Date']}
            rows={orders.map((o) => [o.title, formatCurrency(o.value), <StatusBadge status={o.stage} config={DEAL_STAGES} />, formatDate(o.updatedAt)])}
          />
        ) : <Empty text="No orders (won/converted deals)." />)}

        {tab === 'Quotations' && (quotations.length ? (
          <div className="space-y-4">
            {quotations.map((q) => (
              <div key={q._id} className="rounded-lg border border-myth-border bg-myth-surface/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-white font-semibold">{q.quotationNumber || 'Quotation'}</span>
                  <StatusBadge status={q.status} config={QUOTATION_STATUSES} />
                  <span className="text-myth-accent font-semibold ml-auto">{formatCurrency(q.total)}</span>
                </div>
                <p className="text-sm text-gray-300">{q.title}</p>
                {q.deal && (
                  <p className="text-sm">
                    <span className="text-gray-500">Deal: </span>
                    <Link to={`/deals/${q.deal._id || q.deal}`} className="text-myth-accent hover:underline">
                      {q.deal.title}
                    </Link>
                  </p>
                )}
                {q.items?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-gray-400 border-b border-myth-border">
                          {['Item', 'Qty', 'Unit price', 'Total'].map((h) => (
                            <th key={h} className="pb-2 pr-4 text-xs uppercase tracking-wide font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {q.items.map((line, i) => (
                          <tr key={i} className="border-b border-myth-border/40">
                            <td className="py-2 pr-4 text-gray-200">{line.description || 'Item'}</td>
                            <td className="py-2 pr-4 text-gray-300">{line.quantity}</td>
                            <td className="py-2 pr-4 text-gray-300">{formatCurrency(line.unitPrice)}</td>
                            <td className="py-2 pr-4 text-myth-accent">{formatCurrency(line.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Created {formatDate(q.createdAt)}
                  {q.validUntil ? ` · Valid until ${formatDate(q.validUntil)}` : ''}
                </p>
              </div>
            ))}
          </div>
        ) : <Empty text="No quotations yet. Drag a deal to Quotation Sent to auto-create a quotation." />)}

        {tab === 'Support Tickets' && (tickets.length ? (
          <Table
            headers={['Ticket', 'Subject', 'Priority', 'Status']}
            rows={tickets.map((t) => [
              <Link key="t" to={`/tickets/${t._id}`} className="text-myth-accent">{t.ticketNumber}</Link>,
              t.subject, t.priority, t.status,
            ])}
          />
        ) : <Empty text="No support tickets." />)}

        {tab === 'Documents' && (documents.length ? documents.map((d) => (
          <a key={d._id} href={d.fileUrl} target="_blank" rel="noreferrer" className="block text-myth-accent hover:underline text-sm py-1">{d.name}</a>
        )) : <Empty text="No documents." />)}

        {tab === 'Notes' && (
          customer.notes ? <p className="text-gray-300 text-sm whitespace-pre-wrap">{customer.notes}</p> : <Empty text="No notes." />
        )}

        {tab === 'Timeline' && (timeline.length ? timeline.map((e, i) => (
          <div key={i} className="grid grid-cols-[9rem_5rem_1fr] gap-3 py-3 border-b border-myth-border/30 text-sm items-start">
            <span className="text-xs text-gray-500">{formatDateTime(e.date)}</span>
            <span className="text-xs text-gray-400 capitalize">{e.type}</span>
            <span className="text-white">{e.title}</span>
          </div>
        )) : <Empty text="No timeline events." />)}

        {tab === 'Activity Log' && (activities.length ? activities.map((a) => (
          <div key={a._id} className="py-2 border-b border-myth-border/30 text-sm">
            <p className="text-white">{a.title}</p>
            <p className="text-xs text-gray-500">{formatDateTime(a.createdAt)} · {a.user?.firstName} {a.user?.lastName}</p>
          </div>
        )) : <Empty text="No activity." />)}
      </div>
    </div>
  );
}
