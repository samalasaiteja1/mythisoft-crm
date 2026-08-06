import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Eye, Pencil, LayoutGrid, List, Handshake } from 'lucide-react';
import toast from 'react-hot-toast';
import { dealsAPI, usersAPI, DEAL_STAGES, formatCurrency, formatDate } from '../services/api';
import { DEAL_PIPELINE_STAGES, normalizeDealStage } from '../constants/dealPipeline';
import { DEAL_STAGES_ORDER } from '../constants/workflow';
import WorkflowProgress from '../components/workflow/WorkflowProgress';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import DealAssignModal from '../components/deals/DealAssignModal';
import DealPipelineCard from '../components/deals/DealPipelineCard';
import PipelineKanbanColumn, { PipelineEmptyColumn } from '../components/pipeline/PipelineKanbanColumn';
import {
  ADMIN_DEAL_NAV,
  countDealsByAssignment,
  dealIsAssigned,
  dealIsUnassigned,
  formatDealOwnerName,
  getDealManagerName,
} from '../constants/adminDealViews';
import {
  ASSIGN_DROPDOWN_COPY,
  getAssignManagerFieldLabel,
  getAssignSalesFieldLabel,
  getAssignManagerSelectValue,
  getAssignSalesSelectValue,
  salesOptionsForAssignee,
  enrichAssignedRecord,
  filterActiveSalesUsers,
  formatAssigneeName,
} from '../constants/adminLeadViews';

const dealStages = DEAL_STAGES_ORDER.map((key) => ({
  key,
  label: DEAL_STAGES[key]?.label || key.replace(/_/g, ' '),
}));

const ROLE_COPY = {
  admin: ADMIN_DEAL_NAV.all,
  manager: { title: 'All Deals', subtitle: 'Monitor deals across discovery, proposal, negotiation, and closing' },
  sales: { title: 'My Deal Pipeline', subtitle: 'Move your deals from qualified lead through to customer conversion' },
};

export default function Deals({ assignedOnly = false, unassignedOnly = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { role, isAdmin, isManager, isSales, canWrite, canAction } = usePermissions();
  const [deals, setDeals] = useState([]);
  const [pipelineTotal, setPipelineTotal] = useState(0);
  const [salesUsers, setSalesUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [stageFilter, setStageFilter] = useState('');
  const [search, setSearch] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [assignDeal, setAssignDeal] = useState(null);
  const [quickAssigning, setQuickAssigning] = useState(null);
  const [viewMode, setViewMode] = useState('pipeline');

  useEffect(() => {
    const stage = searchParams.get('stage');
    if (stage) setStageFilter(stage);
  }, [searchParams]);

  const showAssignedTable = assignedOnly && isManager;
  const assignmentQueueView = assignedOnly || unassignedOnly;
  const showViewToggle = !assignedOnly && !unassignedOnly;

  const copy = unassignedOnly
    ? (isAdmin ? ADMIN_DEAL_NAV.unassigned : { title: 'Unassigned Deals', subtitle: 'Pipeline of deals without an assigned owner' })
    : assignedOnly
      ? (isAdmin ? ADMIN_DEAL_NAV.assigned : { title: 'Assigned Deals', subtitle: 'Deals assigned to sales executives' })
      : (ROLE_COPY[role] || ROLE_COPY.sales);
  const canCreate = canWrite('deals');
  const canMove = canWrite('deals');
  const canDelete = isAdmin;
  const canAssign = canAction('deals', 'assign');

  useEffect(() => {
    const needsManagers = isAdmin || isSales;
    const needsSalesTeam = canAssign && (isAdmin || isManager);
    if (!needsManagers && !needsSalesTeam) return;

    const fetchUsers = async () => {
      try {
        if (needsManagers) {
          const { data } = await usersAPI.getManagers();
          setManagers(Array.isArray(data) ? data : []);
        }
        if (!needsSalesTeam) return;
        const { data: allUsers } = await usersAPI.getAll();
        const sales = filterActiveSalesUsers(allUsers);
        if (isManager) {
          setSalesUsers(sales.filter((u) => String(u.reportsTo?._id || u.reportsTo) === String(user._id)));
        } else {
          setSalesUsers(sales);
        }
      } catch {
        // noop
      }
    };
    fetchUsers();
  }, [canAssign, isAdmin, isManager, isSales, user]);

  const fetch = () => {
    setLoading(true);
    const params = {};
    if (stageFilter) params.stage = stageFilter;
    if (assignedOnly) params.assigned = 'true';
    if (unassignedOnly) params.unassigned = 'true';
    Promise.all([
      dealsAPI.getAll(params),
      dealsAPI.getPipelineStats().catch(() => ({ data: [] })),
    ])
      .then(([dealsRes, statsRes]) => {
        setDeals(dealsRes.data);
        const stats = statsRes.data || [];
        setPipelineTotal(stats.reduce((sum, s) => sum + (s.totalValue || 0), 0));
      })
      .catch(() => toast.error('Failed to load pipeline'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [stageFilter, assignedOnly, unassignedOnly]);

  const handleDrop = async (stage) => {
    if (!canMove || !draggedDeal || getDealStage(draggedDeal) === stage) return;

    if (stage === 'converted_to_customer' && !draggedDeal.customer) {
      navigate(`/customers/create?dealId=${draggedDeal._id}`, { state: { deal: draggedDeal } });
      setDraggedDeal(null);
      return;
    }

    try {
      const { data } = await dealsAPI.updateStage(draggedDeal._id, stage);
      setDeals(deals.map((d) => (d._id === draggedDeal._id ? { ...d, stage, customer: data.customer || d.customer } : d)));
      if (stage === 'converted_to_customer' && data.convertedCustomer) {
        const c = data.convertedCustomer;
        toast.success(data.customerCreated ? `Customer created: ${c.firstName} ${c.lastName}` : `Customer linked: ${c.firstName} ${c.lastName}`);
      } else if (stage === 'quotation_sent' && data.quotation) {
        toast.success(data.quotationCreated ? `Quotation ${data.quotation.quotationNumber} created` : `Quotation ${data.quotation.quotationNumber} updated`);
      } else {
        toast.success(`Deal moved to ${DEAL_STAGES[stage]?.label || stage}`);
      }
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move deal');
    }
    setDraggedDeal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this deal?')) return;
    try {
      await dealsAPI.delete(id);
      toast.success('Deal deleted');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const getDealStage = (deal) => normalizeDealStage(deal.stage);

  const tableQuery = new URLSearchParams();
  if (stageFilter) tableQuery.set('stage', stageFilter);
  if (assignedOnly) tableQuery.set('assigned', 'true');
  if (unassignedOnly) tableQuery.set('unassigned', 'true');
  const tableLink = `/deals/list${tableQuery.toString() ? `?${tableQuery.toString()}` : ''}`;

  const visibleDeals = useMemo(
    () => {
      let list = deals;
      if (assignedOnly) list = list.filter((d) => dealIsAssigned(d));
      else if (unassignedOnly) list = list.filter((d) => dealIsUnassigned(d));
      if (isAdmin && !assignedOnly && !unassignedOnly && assignmentFilter !== 'all') {
        list = assignmentFilter === 'assigned'
          ? list.filter((d) => dealIsAssigned(d))
          : list.filter((d) => dealIsUnassigned(d));
      }
      return list;
    },
    [deals, assignedOnly, unassignedOnly, isAdmin, assignmentFilter],
  );

  const assignmentCounts = useMemo(() => countDealsByAssignment(deals), [deals]);

  const enrichAssignedDeal = (merged) => enrichAssignedRecord(merged, { managers, salesUsers });

  const handleQuickAssignSales = async (deal, salesId) => {
    if (!salesId) return;
    setQuickAssigning(`${deal._id}-sales`);
    try {
      const { data } = await dealsAPI.assign(deal._id, { assignedTo: salesId });
      setDeals((prev) => prev.map((d) => (
        d._id === deal._id ? enrichAssignedDeal({ ...d, ...data }) : d
      )));
      toast.success('Sales executive assigned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setQuickAssigning(null);
    }
  };

  const handleQuickAssignManager = async (deal, managerId) => {
    if (!managerId) return;
    setQuickAssigning(`${deal._id}-mgr`);
    try {
      const { data } = await dealsAPI.update(deal._id, { assignedManager: managerId });
      setDeals((prev) => prev.map((d) => (
        d._id === deal._id ? enrichAssignedDeal({ ...d, ...data }) : d
      )));
      toast.success('Manager assigned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Manager assignment failed');
    } finally {
      setQuickAssigning(null);
    }
  };

  const salesOptionsForDeal = (deal) => salesOptionsForAssignee(deal, salesUsers);

  const managerCanAssignDealSales = (deal) => (
    isManager && String(deal.assignedManager?._id || deal.assignedManager) === String(user._id)
  );

  const filteredDeals = useMemo(() => {
    if (!search.trim()) return visibleDeals;
    const q = search.toLowerCase();
    return visibleDeals.filter((d) => {
      const customerName = d.customer ? `${d.customer.firstName} ${d.customer.lastName}` : '';
      const ownerName = d.assignedTo ? `${d.assignedTo.firstName} ${d.assignedTo.lastName}` : '';
      const managerName = getDealManagerName(d);
      return (
        d.title?.toLowerCase().includes(q)
        || customerName.toLowerCase().includes(q)
        || ownerName.toLowerCase().includes(q)
        || managerName.toLowerCase().includes(q)
        || DEAL_STAGES[getDealStage(d)]?.label?.toLowerCase().includes(q)
      );
    });
  }, [visibleDeals, search]);

  const getDealsByStage = (stage) => visibleDeals.filter((d) => getDealStage(d) === stage);
  const stageTotal = (stage) => getDealsByStage(stage).reduce((sum, d) => sum + (d.value || 0), 0);
  const wonCount = getDealsByStage('won').length + getDealsByStage('converted_to_customer').length;
  const lostCount = visibleDeals.filter((d) => getDealStage(d) === 'lost').length;

  if (loading) return <LoadingSpinner />;

  if (showAssignedTable) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{copy.title}</h1>
          <p className="text-gray-400 mt-1">{copy.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card"><p className="text-sm text-gray-400">Assigned Deals</p><p className="text-2xl font-bold text-white mt-1">{visibleDeals.length}</p></div>
          <div className="stat-card"><p className="text-sm text-gray-400">Pipeline Value</p><p className="text-2xl font-bold text-myth-accent mt-1">{formatCurrency(visibleDeals.reduce((sum, d) => sum + (d.value || 0), 0))}</p></div>
          <div className="stat-card"><p className="text-sm text-gray-400">Won / Converted</p><p className="text-2xl font-bold text-green-400 mt-1">{wonCount}</p></div>
          <div className="stat-card"><p className="text-sm text-gray-400">Lost</p><p className="text-2xl font-bold text-red-400 mt-1">{lostCount}</p></div>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search deals, customer, or salesperson..." />

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-myth-surface/50">
                <tr>
                  <th className="table-header">Deal Name</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Value</th>
                  <th className="table-header">Salesperson</th>
                  <th className="table-header">Stage</th>
                  <th className="table-header">Expected Close</th>
                  <th className="table-header">Probability</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-myth-border">
                {filteredDeals.map((deal) => (
                  <tr key={deal._id} className="hover:bg-myth-surface/30 transition-colors">
                    <td className="table-cell">
                      <Link to={`/deals/${deal._id}`} className="text-white font-medium hover:text-myth-accent">{deal.title}</Link>
                      <p className="text-xs text-gray-500 mt-0.5">Project</p>
                    </td>
                    <td className="table-cell">
                      {deal.customer ? (
                        <Link to={`/customers/${deal.customer._id || deal.customer}`} className="text-myth-accent hover:underline">
                          {deal.customer.firstName} {deal.customer.lastName}
                        </Link>
                      ) : '-'}
                    </td>
                    <td className="table-cell text-myth-accent">{formatCurrency(deal.value)}</td>
                    <td className="table-cell">
                      {deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : 'Unassigned'}
                    </td>
                    <td className="table-cell"><StatusBadge status={getDealStage(deal)} config={DEAL_STAGES} /></td>
                    <td className="table-cell text-gray-400">{formatDate(deal.expectedCloseDate)}</td>
                    <td className="table-cell">{deal.probability ?? 0}%</td>
                    <td className="table-cell">
                      <Link to={`/deals/${deal._id}`} className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-myth-accent inline-flex" title="View">
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredDeals.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">No assigned deals found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card border-purple-500/20 bg-gradient-to-br from-purple-500/8 via-myth-accent/5 to-cyan-500/5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Handshake size={22} className="text-purple-400" />
              {copy.title}
            </h1>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">{copy.subtitle}</p>
            {!loading && (
              <p className="text-xs text-gray-500 mt-2">
                {visibleDeals.length} deal{visibleDeals.length !== 1 ? 's' : ''} in view
                {isAdmin && !assignedOnly && !unassignedOnly && ` · ${assignmentCounts.total} total`}
              </p>
            )}
          </div>
          {canCreate && (
            <Link to="/deals/create" className="btn-primary text-sm flex items-center gap-2 shrink-0">
              <Plus size={18} /> Create Deal
            </Link>
          )}
        </div>
      </div>

      {isAdmin && !assignedOnly && !unassignedOnly && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'all', label: 'Total deals', value: assignmentCounts.total, color: 'text-white' },
            { key: 'unassigned', label: 'Unassigned', value: assignmentCounts.unassigned, color: 'text-red-400', highlight: assignmentCounts.unassigned > 0 },
            { key: 'assigned', label: 'Assigned', value: assignmentCounts.assigned, color: 'text-green-400' },
          ].map((stat) => (
            <button
              key={stat.key}
              type="button"
              onClick={() => setAssignmentFilter(stat.key)}
              className={`p-3 rounded-xl border text-left transition-colors hover:border-purple-500/35 ${
                assignmentFilter === stat.key
                  ? 'border-purple-500/40 bg-purple-500/10'
                  : stat.highlight
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-myth-border bg-myth-surface/40'
              }`}
            >
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </button>
          ))}
        </div>
      )}

      {isAdmin && unassignedOnly && (
        <div className="card border-red-500/20 bg-red-500/5 py-3 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400">Unassigned — no manager or sales executive</p>
            <p className="text-2xl font-bold text-red-400">{visibleDeals.length}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link to="/deals/assign" className="text-purple-300 hover:underline">Assign deals →</Link>
            <Link to="/deals/assigned" className="text-gray-400 hover:text-purple-300">View assigned →</Link>
          </div>
        </div>
      )}

      {isAdmin && assignedOnly && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-myth-border bg-myth-surface/40">
            <p className="text-xs text-gray-500">Assigned deals</p>
            <p className="text-2xl font-bold text-green-400 mt-0.5">{visibleDeals.length}</p>
          </div>
          <div className="p-3 rounded-xl border border-myth-border bg-myth-surface/40">
            <p className="text-xs text-gray-500">Pipeline value</p>
            <p className="text-2xl font-bold text-myth-accent mt-0.5">{formatCurrency(visibleDeals.reduce((s, d) => s + (d.value || 0), 0))}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Deals', value: visibleDeals.length, color: 'text-white' },
          { label: 'Pipeline Value', value: formatCurrency(pipelineTotal), color: 'text-myth-accent' },
          { label: 'Won / Converted', value: wonCount, color: 'text-green-400' },
          { label: 'Lost', value: lostCount, color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-xl border border-myth-border bg-myth-surface/40">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {(isAdmin || isManager) && canAssign && (
        <div className="card border-myth-accent/20 bg-myth-accent/5 text-sm text-gray-400">
          Workflow: <Link to="/deals/create" className="text-myth-accent hover:underline">Create deal</Link>
          → <Link to="/deals/assign" className="text-myth-accent hover:underline">Assign to sales</Link>
          → move stages on pipeline → <Link to="/deals/list?stage=won" className="text-myth-accent hover:underline">Won</Link>
        </div>
      )}

      <div className="card border border-myth-border/80">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Deal workflow</p>
        <WorkflowProgress stages={dealStages} currentStage={stageFilter || 'deal_created'} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="input-field w-full sm:w-64">
          <option value="">All Stages</option>
          {DEAL_PIPELINE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          <option value="lost">Lost</option>
        </select>
        {showViewToggle && (
          <div className="flex rounded-lg border border-myth-border overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm ${viewMode === 'pipeline' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutGrid size={16} /> Pipeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm ${viewMode === 'table' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white'}`}
            >
              <List size={16} /> Table
            </button>
          </div>
        )}
        {(assignedOnly || unassignedOnly) && (
          <Link to={tableLink} className="btn-secondary whitespace-nowrap">
            Table Info
          </Link>
        )}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search deals, customer, or salesperson..." />

      {showViewToggle && viewMode === 'table' ? (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-myth-surface/50">
                <tr>
                  <th className="table-header">Deal Name</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Value</th>
                  {isAdmin && <th className="table-header">Manager</th>}
                  <th className="table-header">Salesperson</th>
                  <th className="table-header">Stage</th>
                  <th className="table-header">Expected Close</th>
                  <th className="table-header">Probability</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-myth-border">
                {filteredDeals.map((deal) => (
                  <tr key={deal._id} className="hover:bg-myth-surface/30 transition-colors">
                    <td className="table-cell">
                      <Link to={`/deals/${deal._id}`} className="text-white font-medium hover:text-myth-accent">{deal.title}</Link>
                      <p className="text-xs text-gray-500 mt-0.5">Project</p>
                    </td>
                    <td className="table-cell">
                      {deal.customer ? (
                        <Link to={`/customers/${deal.customer._id || deal.customer}`} className="text-myth-accent hover:underline">
                          {deal.customer.firstName} {deal.customer.lastName}
                        </Link>
                      ) : '-'}
                    </td>
                    <td className="table-cell text-myth-accent">{formatCurrency(deal.value)}</td>
                    {isAdmin && (
                      <td className="table-cell">{formatAssigneeName(deal.assignedManager) || '—'}</td>
                    )}
                    <td className="table-cell">
                      {formatAssigneeName(deal.assignedTo) || 'Unassigned'}
                    </td>
                    <td className="table-cell"><StatusBadge status={getDealStage(deal)} config={DEAL_STAGES} /></td>
                    <td className="table-cell text-gray-400">{formatDate(deal.expectedCloseDate)}</td>
                    <td className="table-cell">{deal.probability ?? 0}%</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <Link to={`/deals/${deal._id}`} className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-myth-accent" title="View">
                          <Eye size={16} />
                        </Link>
                        {canMove && (
                          <Link to={`/deals/${deal._id}`} state={{ edit: true }} className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-myth-accent" title="Edit">
                            <Pencil size={16} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDeals.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="text-center py-12 text-gray-500">No deals found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {DEAL_PIPELINE_STAGES.map((stage) => {
          const stageDeals = getDealsByStage(stage.key);
          return (
            <PipelineKanbanColumn
              key={stage.key}
              stage={stage}
              count={stageDeals.length}
              footer={formatCurrency(stageTotal(stage.key))}
              onDragOver={(e) => canMove && e.preventDefault()}
              onDrop={() => handleDrop(stage.key)}
            >
              {stageDeals.map((deal) => (
                <DealPipelineCard
                  key={deal._id}
                  deal={deal}
                  stageKey={stage.key}
                  draggable={canMove}
                  onDragStart={() => canMove && setDraggedDeal(deal)}
                  showManager={(isAdmin || isSales) && !assignmentQueueView}
                  showSales={!assignmentQueueView && (isAdmin || Boolean(formatDealOwnerName(deal.assignedTo)))}
                  managerLabel={ASSIGN_DROPDOWN_COPY.managerDisplay}
                  salesLabel={ASSIGN_DROPDOWN_COPY.salesDisplay}
                  canMove={canMove}
                  canDelete={canDelete}
                  onDelete={() => handleDelete(deal._id)}
                >
                  {isSales && (
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">
                        {getAssignManagerFieldLabel(Boolean(getAssignManagerSelectValue(deal)))}
                      </label>
                      <select
                        className="w-full text-[10px] px-2 py-1.5 rounded-lg border border-myth-border/60 bg-myth-surface/60 text-gray-300"
                        value={getAssignManagerSelectValue(deal)}
                        onChange={(e) => handleQuickAssignManager(deal, e.target.value)}
                        disabled={quickAssigning === `${deal._id}-mgr` || !managers.length}
                      >
                        <option value="">
                          {getDealManagerName(deal)
                            ? ASSIGN_DROPDOWN_COPY.changeManager
                            : ASSIGN_DROPDOWN_COPY.selectManager}
                        </option>
                        {managers.map((u) => (
                          <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                        ))}
                      </select>
                      {!managers.length && (
                        <p className="text-[10px] text-amber-400/90 mt-1">No sales managers available.</p>
                      )}
                    </div>
                  )}
                  {canAssign && (isAdmin || managerCanAssignDealSales(deal)) && (
                    <div className={assignmentQueueView ? 'space-y-2' : 'flex flex-wrap gap-1.5 items-end'}>
                      {isAdmin && (
                        <div className={assignmentQueueView ? 'w-full' : 'flex-1 min-w-[88px]'}>
                          {assignmentQueueView && (
                            <label className="block text-[10px] text-gray-500 mb-1">
                              {assignedOnly ? ASSIGN_DROPDOWN_COPY.changeManager : getAssignManagerFieldLabel(assignedOnly)}
                            </label>
                          )}
                          <select
                            className="w-full text-[10px] px-2 py-1.5 rounded-lg border border-myth-border/60 bg-myth-surface/60 text-gray-300"
                            value={getAssignManagerSelectValue(deal)}
                            onChange={(e) => handleQuickAssignManager(deal, e.target.value)}
                            disabled={quickAssigning === `${deal._id}-mgr` || !managers.length}
                          >
                            <option value="">
                              {assignmentQueueView
                                ? (assignedOnly ? ASSIGN_DROPDOWN_COPY.changeManager : ASSIGN_DROPDOWN_COPY.selectManager)
                                : getAssignManagerSelectValue(deal) ? ASSIGN_DROPDOWN_COPY.changeMgr : ASSIGN_DROPDOWN_COPY.assignMgr}
                            </option>
                            {managers.map((u) => (
                              <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {(isAdmin || managerCanAssignDealSales(deal)) && (
                        <div className={assignmentQueueView ? 'w-full' : 'flex-1 min-w-[88px]'}>
                          {assignmentQueueView && (
                            <label className="block text-[10px] text-gray-500 mb-1">
                              {assignedOnly ? ASSIGN_DROPDOWN_COPY.changePerson : getAssignSalesFieldLabel(assignedOnly)}
                            </label>
                          )}
                          <select
                            className="w-full text-[10px] px-2 py-1.5 rounded-lg border border-myth-border/60 bg-myth-surface/60 text-gray-300"
                            value={getAssignSalesSelectValue(deal)}
                            onChange={(e) => handleQuickAssignSales(deal, e.target.value)}
                            disabled={quickAssigning === `${deal._id}-sales` || !salesOptionsForDeal(deal).length}
                          >
                            <option value="">
                              {assignmentQueueView
                                ? (assignedOnly ? ASSIGN_DROPDOWN_COPY.changePerson : ASSIGN_DROPDOWN_COPY.selectSales)
                                : formatAssigneeName(deal.assignedTo) ? ASSIGN_DROPDOWN_COPY.changeSales : ASSIGN_DROPDOWN_COPY.assignSales}
                            </option>
                            {salesOptionsForDeal(deal).map((u) => (
                              <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </DealPipelineCard>
              ))}
              {!stageDeals.length && <PipelineEmptyColumn message="No deals in this stage" />}
            </PipelineKanbanColumn>
          );
        })}
      </div>
      )}

      <DealAssignModal
        deal={assignDeal}
        isOpen={Boolean(assignDeal)}
        onClose={() => setAssignDeal(null)}
        onAssigned={(updated) => {
          setDeals((prev) => prev.map((d) => (d._id === updated._id ? enrichAssignedDeal({ ...d, ...updated }) : d)));
        }}
      />
    </div>
  );
}
