import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { dealsAPI, DEAL_STAGES, formatCurrency, formatDate } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';
import { usePermissions } from '../hooks/usePermissions';
import { ADMIN_DEAL_NAV } from '../constants/adminDealViews';

export default function DealList() {
  const { isAdmin } = usePermissions();
  const [searchParams] = useSearchParams();
  const stage = searchParams.get('stage') || '';
  const assignedOnly = searchParams.get('assigned') === 'true';
  const unassignedOnly = searchParams.get('unassigned') === 'true';
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = { search };
    if (stage) params.stage = stage;
    if (assignedOnly) params.assigned = 'true';
    if (unassignedOnly) params.unassigned = 'true';
    dealsAPI.getAll(params).then(({ data }) => setDeals(data)).catch(() => {}).finally(() => setLoading(false));
  }, [search, stage, assignedOnly, unassignedOnly]);

  if (loading) return <LoadingSpinner />;

  const pageTitle = stage === 'won' || stage === 'converted_to_customer'
    ? (isAdmin ? ADMIN_DEAL_NAV.won.title : 'Won Deals')
    : stage === 'lost'
      ? (isAdmin ? ADMIN_DEAL_NAV.lost.title : 'Lost Deals')
      : assignedOnly
        ? (isAdmin ? ADMIN_DEAL_NAV.assigned.title : 'Assigned Deals')
        : unassignedOnly
          ? (isAdmin ? ADMIN_DEAL_NAV.unassigned.title : 'Unassigned Deals')
          : 'Table Info';

  const pageSubtitle = stage === 'won' || stage === 'converted_to_customer'
    ? ADMIN_DEAL_NAV.won.subtitle
    : stage === 'lost'
      ? ADMIN_DEAL_NAV.lost.subtitle
      : assignedOnly
        ? ADMIN_DEAL_NAV.assigned.subtitle
        : unassignedOnly
          ? ADMIN_DEAL_NAV.unassigned.subtitle
          : 'All deals with value, stage, and expected closing dates';

  const pipelineLink = stage === 'won'
    ? '/deals/list?stage=won'
    : stage === 'lost'
      ? '/deals/list?stage=lost'
      : '/deals';

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">{pageTitle}</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-1">{pageSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(stage === 'won' || stage === 'lost') && (
            <Link to={stage === 'won' ? '/deals/list?stage=lost' : '/deals/list?stage=won'} className="btn-secondary text-xs lg:text-sm">
              {stage === 'won' ? 'View lost' : 'View won'}
            </Link>
          )}
          <Link to="/deals" className="btn-secondary text-xs lg:text-sm">View Pipeline</Link>
        </div>
      </div>

      {(stage === 'won' || stage === 'lost') && isAdmin && (
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          <div className="card py-2 lg:py-3 px-3 lg:px-4">
            <p className="text-[10px] lg:text-xs text-gray-400">{stage === 'won' ? 'Won / converted' : 'Lost deals'}</p>
            <p className="text-lg lg:text-xl font-bold text-white">{deals.length}</p>
          </div>
          <div className="card py-2 lg:py-3 px-3 lg:px-4">
            <p className="text-[10px] lg:text-xs text-gray-400">Total value</p>
            <p className="text-lg lg:text-xl font-bold text-myth-accent">{formatCurrency(deals.reduce((s, d) => s + (d.value || 0), 0))}</p>
          </div>
        </div>
      )}

      <SearchBar value={search} onChange={setSearch} placeholder="Search deals..." />
      <div className="card overflow-x-auto">
        <table className="w-full text-xs lg:text-sm">
          <thead><tr>
            <th className="table-header">Deal Name</th><th className="table-header">Customer</th><th className="table-header">Value</th>
            <th className="table-header">Salesperson</th><th className="table-header">Stage</th><th className="table-header">Expected Close</th><th className="table-header">Probability</th>
          </tr></thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-cell text-center text-gray-500 py-8 lg:py-12">No deals found</td>
              </tr>
            ) : deals.map((d) => (
              <tr key={d._id} className="border-t border-myth-border hover:bg-myth-surface/30">
                <td className="table-cell"><Link to={`/deals/${d._id}`} className="text-white font-medium hover:text-myth-accent">{d.title}</Link></td>
                <td className="table-cell">{d.customer ? `${d.customer.firstName} ${d.customer.lastName}` : '-'}</td>
                <td className="table-cell">{formatCurrency(d.value)}</td>
                <td className="table-cell">{d.assignedTo ? `${d.assignedTo.firstName} ${d.assignedTo.lastName}` : 'Unassigned'}</td>
                <td className="table-cell"><StatusBadge status={d.stage} config={DEAL_STAGES} /></td>
                <td className="table-cell">{formatDate(d.expectedCloseDate)}</td>
                <td className="table-cell">{d.probability}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
