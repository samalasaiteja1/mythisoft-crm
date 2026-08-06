import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Handshake } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../StatusBadge';
import {
  ASSIGN_DROPDOWN_COPY,
  enrichAssignedRecord,
  filterActiveSalesUsers,
  formatAssigneeName,
  getAssignSalesFieldLabel,
  getAssignSalesSelectValue,
  salesOptionsForAssignee,
} from '../../constants/adminLeadViews';
import {
  leadsAPI,
  dealsAPI,
  usersAPI,
  formatCurrency,
  LEAD_STATUSES,
  DEAL_STAGES,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function AssignableCard({
  title,
  subtitle,
  status,
  statusConfig,
  link,
  assignValue,
  assignOptions,
  assignLabel,
  currentAssignee,
  assigning,
  onAssign,
}) {
  return (
    <div className="p-3 rounded-lg border border-myth-border bg-myth-surface/20">
      <div className="flex items-start justify-between gap-3">
        <Link to={link} className="min-w-0 flex-1">
          <p className="text-white font-medium">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </Link>
        <StatusBadge status={status} config={statusConfig} />
      </div>
      <div className="mt-2 pt-2 border-t border-myth-border/40">
        <label className="block text-[10px] text-gray-500 mb-0.5">{assignLabel}</label>
        <select
          className="w-full text-xs px-2 py-1.5 rounded border border-myth-border bg-myth-surface/80 text-gray-300"
          value={assignValue}
          onChange={(e) => onAssign(e.target.value)}
          disabled={assigning || assignOptions.length === 0}
        >
          <option value="">
            {currentAssignee ? ASSIGN_DROPDOWN_COPY.changeSales : ASSIGN_DROPDOWN_COPY.assignSales}
          </option>
          {assignOptions.map((u) => (
            <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
          ))}
        </select>
        {assignOptions.length === 0 && (
          <p className="text-[10px] text-amber-400/90 mt-1">No sales executives report to you yet.</p>
        )}
      </div>
    </div>
  );
}

export default function SalesManagerLeadsDealsPanel({
  recentLeads: initialLeads = [],
  activeDeals: initialDeals = [],
}) {
  const { user } = useAuth();
  const [leads, setLeads] = useState(initialLeads);
  const [deals, setDeals] = useState(initialDeals);
  const [salesUsers, setSalesUsers] = useState([]);
  const [assigningKey, setAssigningKey] = useState(null);

  useEffect(() => setLeads(initialLeads), [initialLeads]);
  useEffect(() => setDeals(initialDeals), [initialDeals]);

  useEffect(() => {
    usersAPI.getAll()
      .then(({ data }) => {
        const sales = filterActiveSalesUsers(Array.isArray(data) ? data : []);
        setSalesUsers(sales.filter((u) => String(u.reportsTo?._id || u.reportsTo) === String(user?._id)));
      })
      .catch(() => {});
  }, [user?._id]);

  const enrich = (merged) => enrichAssignedRecord(merged, { salesUsers });

  const managerOwnsLead = (lead) => (
    String(lead.assignedManager?._id || lead.assignedManager) === String(user?._id)
  );

  const assignLead = async (leadId, salesId) => {
    if (!salesId) return;
    setAssigningKey(`lead-${leadId}`);
    try {
      const { data } = await leadsAPI.assign(leadId, { assignedTo: salesId });
      setLeads((prev) => prev.map((l) => (l._id === leadId ? enrich({ ...l, ...data }) : l)));
      toast.success('Lead assigned to sales executive');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setAssigningKey(null);
    }
  };

  const assignDeal = async (dealId, salesId) => {
    if (!salesId) return;
    setAssigningKey(`deal-${dealId}`);
    try {
      const { data } = await dealsAPI.assign(dealId, { assignedTo: salesId });
      setDeals((prev) => prev.map((d) => (d._id === dealId ? enrich({ ...d, ...data }) : d)));
      toast.success('Deal assigned to sales executive');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setAssigningKey(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus size={18} className="text-blue-400" /> Team Leads
          </h3>
          <Link to="/leads" className="text-sm text-myth-accent hover:underline">View all</Link>
        </div>
        {leads.length === 0 ? (
          <p className="text-sm text-gray-500">No leads in your scope. Assign from Leads or wait for admin assignment.</p>
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => {
              if (!managerOwnsLead(lead)) {
                return (
                  <Link
                    key={lead._id}
                    to={`/leads/${lead._id}`}
                    className="block p-3 rounded-lg border border-myth-border hover:border-myth-accent/40"
                  >
                    <p className="text-white font-medium">{lead.firstName} {lead.lastName}</p>
                    <p className="text-xs text-gray-500">Assigned to another manager</p>
                  </Link>
                );
              }
              const options = salesOptionsForAssignee(lead, salesUsers);
              return (
                <AssignableCard
                  key={lead._id}
                  title={`${lead.firstName} ${lead.lastName}`}
                  subtitle={lead.company || lead.email}
                  status={lead.status}
                  statusConfig={LEAD_STATUSES}
                  link={`/leads/${lead._id}`}
                  assignValue={getAssignSalesSelectValue(lead)}
                  assignOptions={options}
                  assignLabel={getAssignSalesFieldLabel(formatAssigneeName(lead.assignedTo))}
                  currentAssignee={formatAssigneeName(lead.assignedTo)}
                  assigning={assigningKey === `lead-${lead._id}`}
                  onAssign={(id) => assignLead(lead._id, id)}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Handshake size={18} className="text-purple-400" /> Team Deals
          </h3>
          <Link to="/deals" className="text-sm text-myth-accent hover:underline">View pipeline</Link>
        </div>
        {deals.length === 0 ? (
          <p className="text-sm text-gray-500">No active deals for your team.</p>
        ) : (
          <div className="space-y-2">
            {deals.map((deal) => {
              const options = salesOptionsForAssignee(deal, salesUsers);
              const subtitle = [
                deal.customer
                  ? `${deal.customer.firstName} ${deal.customer.lastName}`
                  : null,
                deal.value ? formatCurrency(deal.value) : null,
              ].filter(Boolean).join(' · ');
              return (
                <AssignableCard
                  key={deal._id}
                  title={deal.title}
                  subtitle={subtitle}
                  status={deal.stage}
                  statusConfig={DEAL_STAGES}
                  link={`/deals/${deal._id}`}
                  assignValue={getAssignSalesSelectValue(deal)}
                  assignOptions={options}
                  assignLabel={getAssignSalesFieldLabel(formatAssigneeName(deal.assignedTo))}
                  currentAssignee={formatAssigneeName(deal.assignedTo)}
                  assigning={assigningKey === `deal-${deal._id}`}
                  onAssign={(id) => assignDeal(deal._id, id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
