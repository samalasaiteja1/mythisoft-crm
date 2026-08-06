import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Handshake, Download, Upload, LayoutGrid, List, UserCheck, Users, UserPlus, TrendingUp, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { leadsAPI, usersAPI, authAPI, LEAD_STATUSES } from '../services/api';
import { LEAD_SELECTABLE_STAGES, normalizeLeadStatus, getLeadKanbanStage, canConvertLeadToDeal, hasLeadDeal, getLeadDealId } from '../constants/leadPipeline';
import { PLACEHOLDERS, LEAD_ASSIGNMENT_EXAMPLES } from '../constants/projectSamples';
import WorkflowProgress from '../components/workflow/WorkflowProgress';
import { LEAD_WORKFLOW_STAGES } from '../constants/workflow';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LeadAssignModal from '../components/leads/LeadAssignModal';
import LeadManagerAssignModal from '../components/leads/LeadManagerAssignModal';
import LeadPipelineCard from '../components/leads/LeadPipelineCard';
import PipelineKanbanColumn, { PipelineEmptyColumn } from '../components/pipeline/PipelineKanbanColumn';
import ContactInfoModal from '../components/pipeline/ContactInfoModal';
import { contactFromLead } from '../utils/pipelineContact';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import {
  ADMIN_LEAD_NAV,
  countLeadsByAssignment,
  leadAssignmentState,
  leadHasManager,
  leadHasExecutive,
  leadIsAssignedForAdmin,
  leadIsUnassignedForAdmin,
  formatAssigneeName,
  ASSIGN_DROPDOWN_COPY,
  getAssignManagerFieldLabel,
  getAssignSalesFieldLabel,
  getAssignManagerSelectValue,
  getAssignSalesSelectValue,
  salesOptionsForAssignee,
  enrichAssignedRecord,
  filterActiveSalesUsers,
} from '../constants/adminLeadViews';

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', alternatePhone: '', website: '', company: '', industry: '',
  title: '', source: 'website', status: 'new', value: 0, budget: 0, score: 0, priority: 'medium',
  interestedService: '', description: '', notes: '', assignedManager: '', assignedTo: '', customerPassword: '',
};

const ROLE_COPY = {
  admin: ADMIN_LEAD_NAV.all,
  manager: { title: 'Leads', subtitle: 'Leads routed to you — assign to your sales team and track progress' },
  sales: { title: 'My Leads', subtitle: 'Leads assigned to you — update status, follow up, and convert' },
};

export default function Leads({ assignedOnly = false, unsignedOnly = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { role, isAdmin, isManager, isSales, canWrite, canAction } = usePermissions();
  const [leads, setLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [viewMode, setViewMode] = useState('pipeline');
  const [draggedLead, setDraggedLead] = useState(null);
  const [assignLead, setAssignLead] = useState(null);
  const [assignManagerLead, setAssignManagerLead] = useState(null);
  const [contactLead, setContactLead] = useState(null);
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [quickAssigning, setQuickAssigning] = useState(null);
  const [userExistsForEmail, setUserExistsForEmail] = useState(false);

  const copy = assignedOnly
    ? (isAdmin ? ADMIN_LEAD_NAV.assigned : { title: 'Assigned Leads', subtitle: 'Leads assigned to sales executives' })
    : unsignedOnly
      ? (isAdmin ? ADMIN_LEAD_NAV.unsigned : { title: 'Unsigned Leads', subtitle: 'Leads not yet assigned to a sales executive' })
      : (ROLE_COPY[role] || ROLE_COPY.sales);
  const canCreate = canWrite('leads');
  const canEdit = canWrite('leads');
  const canDelete = isAdmin;
  const canAssign = canAction('leads', 'assign');
  const showAssignedColumn = isAdmin || isManager;
  const assignmentQueueView = assignedOnly || unsignedOnly;

  const fetchLeads = () => {
    setLoading(true);
    const params = { search, status: statusFilter };
    if (assignedOnly || unsignedOnly) params.limit = 500;
    if (assignedOnly) {
      params.assignmentFilter = isAdmin ? 'assigned' : 'with_sales';
    } else if (unsignedOnly) {
      params.assignmentFilter = isAdmin ? 'unassigned' : 'unsigned_sales';
    }
    leadsAPI.getAll(params)
      .then(({ data }) => setLeads(data.leads))
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [search, statusFilter, assignedOnly, unsignedOnly, isAdmin]);

  useEffect(() => {
    if (location.pathname.endsWith('/leads/create') && canCreate) {
      openCreate();
    }
  }, [location.pathname]);

  const enrichAssignedLead = (merged) => enrichAssignedRecord(merged, { managers, salesUsers });

  const executivesForManager = useMemo(() => {
    if (!form.assignedManager) return salesUsers;
    return salesUsers.filter(
      (u) => String(u.reportsTo?._id || u.reportsTo) === String(form.assignedManager)
    );
  }, [salesUsers, form.assignedManager]);

  const visibleLeads = useMemo(
    () => {
      let list = leads;
      if (assignedOnly) {
        list = isAdmin
          ? list.filter((l) => leadIsAssignedForAdmin(l))
          : list.filter((l) => l.assignedTo);
      } else if (unsignedOnly) {
        list = isAdmin
          ? list.filter((l) => leadIsUnassignedForAdmin(l))
          : list.filter((l) => !leadHasExecutive(l));
      }
      if (isAdmin && !assignedOnly && !unsignedOnly && assignmentFilter !== 'all') {
        list = list.filter((l) => leadAssignmentState(l) === assignmentFilter);
      }
      return list;
    },
    [leads, assignedOnly, unsignedOnly, isAdmin, assignmentFilter],
  );

  const assignmentCounts = useMemo(() => countLeadsByAssignment(leads), [leads]);

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
        const sales = (Array.isArray(allUsers) ? allUsers : []).filter(
          (u) => u.role === 'sales' && u.isActive !== false
        );
        if (isManager) {
          setSalesUsers(sales.filter((u) => String(u.reportsTo?._id || u.reportsTo) === String(user._id)));
        } else {
          setSalesUsers(sales);
        }
      } catch {
        // swallow
      }
    };
    fetchUsers();
  }, [canAssign, isAdmin, isManager, isSales, user]);

  const openCreate = () => {
    setForm({ ...emptyForm, assignedTo: isSales ? user._id : '', assignedManager: '' });
    setEditId(null);
    setUserExistsForEmail(false);
    setModal('form');
  };

  const openEdit = (lead) => {
    setForm({
      ...emptyForm,
      ...lead,
      status: normalizeLeadStatus(lead.status, lead.workflowStage),
      assignedManager: lead.assignedManager?._id || lead.assignedManager || '',
      assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
    });
    setEditId(lead._id);
    setUserExistsForEmail(!!lead.portalUser);
    setModal('form');
  };

  const handleEmailChange = async (email) => {
    setForm({ ...form, email });
    if (email && email.includes('@')) {
      try {
        const { data } = await authAPI.checkUserExists(email);
        setUserExistsForEmail(data.exists);
      } catch {
        setUserExistsForEmail(false);
      }
    } else {
      setUserExistsForEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!canAssign) {
        delete payload.assignedTo;
        delete payload.assignedManager;
      } else if (isSales) {
        delete payload.assignedManager;
        delete payload.assignedTo;
      } else if (isManager) {
        delete payload.assignedManager;
        if (!payload.assignedTo) payload.assignedTo = '';
      } else if (isAdmin) {
        if (!payload.assignedManager) payload.assignedManager = '';
        if (!payload.assignedTo) payload.assignedTo = '';
      }
      if (editId) {
        await leadsAPI.update(editId, payload);
        toast.success('Lead updated');
      } else {
        await leadsAPI.create(payload);
        toast.success('Lead created — open Follow-ups → Lead to view contact info');
      }
      setModal(null);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await leadsAPI.delete(id);
      toast.success('Lead deleted');
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await leadsAPI.exportCsv();
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads-export.csv';
      a.click();
      toast.success('Leads exported');
    } catch { toast.error('Export failed'); }
  };

  const handleImport = () => toast('Import CSV — connect file upload in settings', { icon: 'ℹ️' });

  const handleConvertToDeal = (id) => {
    navigate(`/deals/create?leadId=${id}`);
  };

  const salesOptionsForLead = (lead) => salesOptionsForAssignee(lead, salesUsers);

  const managerCanAssignLeadSales = (lead) => (
    isManager && String(lead.assignedManager?._id || lead.assignedManager) === String(user._id)
  );

  const handleQuickAssignSales = async (lead, salesId) => {
    if (!salesId) return;
    setQuickAssigning(`${lead._id}-sales`);
    try {
      const { data } = await leadsAPI.assign(lead._id, { assignedTo: salesId });
      setLeads((prev) => prev.map((l) => (
        l._id === lead._id ? enrichAssignedLead({ ...l, ...data }) : l
      )));
      toast.success('Sales executive assigned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setQuickAssigning(null);
    }
  };

  const handleQuickAssignManager = async (lead, managerId) => {
    if (!managerId) return;
    setQuickAssigning(`${lead._id}-mgr`);
    try {
      const { data } = isSales
        ? await leadsAPI.update(lead._id, { assignedManager: managerId })
        : await leadsAPI.assignManager(lead._id, {
          assignedManager: managerId,
          priority: lead.priority || 'medium',
        });
      setLeads((prev) => prev.map((l) => (
        l._id === lead._id ? enrichAssignedLead({ ...l, ...data }) : l
      )));
      toast.success('Manager assigned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Manager assignment failed');
    } finally {
      setQuickAssigning(null);
    }
  };

  const getLeadStage = (lead) => normalizeLeadStatus(lead.status, lead.workflowStage);

  const getLeadsByStage = (stage) => visibleLeads.filter((lead) => getLeadKanbanStage(lead.status, lead.workflowStage) === stage);

  const handleDrop = async (stage) => {
    if (!canEdit || !draggedLead) return;
    if (getLeadKanbanStage(draggedLead.status, draggedLead.workflowStage) === stage) {
      setDraggedLead(null);
      return;
    }
    try {
      await leadsAPI.update(draggedLead._id, { status: stage });
      setLeads(leads.map((l) => (
        l._id === draggedLead._id
          ? { ...l, status: stage, workflowStage: stage, isQualified: stage === 'qualified' || l.isQualified }
          : l
      )));
      toast.success(`Lead moved to ${LEAD_STATUSES[stage]?.label || stage}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stage');
    }
    setDraggedLead(null);
  };

  return (
    <div className="space-y-4">
      <div className="card border-blue-500/20 bg-gradient-to-br from-blue-500/8 via-transparent to-purple-500/5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlus size={22} className="text-blue-400" />
              {copy.title}
            </h1>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">{copy.subtitle}</p>
            {!loading && (
              <p className="text-xs text-gray-500 mt-2">
                {visibleLeads.length} lead{visibleLeads.length !== 1 ? 's' : ''} in view
                {isAdmin && !assignedOnly && !unsignedOnly && ` · ${assignmentCounts.total} total`}
              </p>
            )}
          </div>
          {canCreate && (
            <div className="flex flex-wrap gap-2 shrink-0">
              {canAssign && isAdmin && (
                <Link to="/leads/assign-manager" className="btn-secondary text-sm flex items-center gap-2">
                  <UserCheck size={16} /> Assign to Manager
                </Link>
              )}
              {canAssign && (
                <Link to="/leads/assign" className="btn-secondary text-sm flex items-center gap-2">
                  <Users size={16} /> Assign to Sales
                </Link>
              )}
              <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-2"><Download size={16} /> Export</button>
              <button onClick={handleImport} className="btn-secondary text-sm flex items-center gap-2"><Upload size={16} /> Import</button>
              <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-2"><Plus size={18} /> Add Lead</button>
            </div>
          )}
        </div>
      </div>

      {isAdmin && !assignedOnly && !unsignedOnly && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { key: 'all', label: 'Total', value: assignmentCounts.total, color: 'text-white' },
            { key: 'unassigned', label: 'Unassigned', value: assignmentCounts.unassigned, color: 'text-red-400', highlight: assignmentCounts.unassigned > 0 },
            { key: 'manager_only', label: 'Manager only', value: assignmentCounts.manager_only, color: 'text-amber-400' },
            { key: 'sales_only', label: 'Sales only', value: assignmentCounts.sales_only, color: 'text-blue-400' },
            { key: 'both', label: 'Manager + sales', value: assignmentCounts.both, color: 'text-green-400' },
          ].map((stat) => (
            <button
              key={stat.key}
              type="button"
              onClick={() => setAssignmentFilter(stat.key)}
              className={`p-3 rounded-xl border text-left transition-colors hover:border-blue-500/35 ${
                assignmentFilter === stat.key
                  ? 'border-blue-500/40 bg-blue-500/10'
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

      {isAdmin && unsignedOnly && (
        <div className="card border-red-500/20 bg-red-500/5 py-3 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400">Fully unassigned — no manager or sales executive</p>
            <p className="text-2xl font-bold text-red-400">{visibleLeads.length}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link to="/leads/assign-manager" className="text-blue-300 hover:underline">Assign to manager →</Link>
            <Link to="/leads/assigned" className="text-gray-400 hover:text-blue-300">View assigned leads →</Link>
          </div>
        </div>
      )}

      {isAdmin && assignedOnly && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total assigned', value: visibleLeads.length, color: 'text-white' },
            { label: 'Manager only', value: assignmentCounts.manager_only, color: 'text-amber-400' },
            { label: 'Sales only', value: assignmentCounts.sales_only, color: 'text-blue-400' },
            { label: 'Manager + sales', value: assignmentCounts.both, color: 'text-green-400', link: '/reports/leads' },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl border border-myth-border bg-myth-surface/40">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
              {stat.link && (
                <Link to={stat.link} className="text-xs text-blue-400 hover:underline mt-1 inline-block">Lead Analytics →</Link>
              )}
            </div>
          ))}
        </div>
      )}

      {(isAdmin || isManager) && canAssign && (
        <div className="card border-blue-500/15 bg-blue-500/5 text-sm text-gray-400">
          <span className="text-blue-300 font-medium">Workflow:</span>{' '}
          <Link to="/leads/create" className="text-blue-300 hover:underline">Create lead</Link>
          {isAdmin && <> → <Link to="/leads/assign-manager" className="text-blue-300 hover:underline">Assign to manager</Link></>}
          {' → '}
          <Link to="/leads/assign" className="text-blue-300 hover:underline">Manager assigns to sales</Link>
          {' → monitor on this pipeline.'}
        </div>
      )}

      <div className="card border border-myth-border/80">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-1.5">
          <TrendingUp size={12} className="text-blue-400" /> Lead pipeline
        </p>
        <WorkflowProgress stages={LEAD_WORKFLOW_STAGES} currentStage={statusFilter || 'new'} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Search leads..." /></div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500 hidden sm:block" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-full sm:w-48">
            <option value="">All Stages</option>
            {LEAD_SELECTABLE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex rounded-lg border border-myth-border overflow-hidden shrink-0">
          <button type="button" onClick={() => setViewMode('pipeline')} className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${viewMode === 'pipeline' ? 'bg-blue-500/15 text-blue-300' : 'text-gray-400 hover:text-white'}`}>
            <LayoutGrid size={16} /> Pipeline
          </button>
          <button type="button" onClick={() => setViewMode('table')} className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${viewMode === 'table' ? 'bg-blue-500/15 text-blue-300' : 'text-gray-400 hover:text-white'}`}>
            <List size={16} /> Table
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : viewMode === 'pipeline' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {LEAD_SELECTABLE_STAGES.map((stage) => {
            const stageLeads = getLeadsByStage(stage.key);
            return (
              <PipelineKanbanColumn
                key={stage.key}
                stage={stage}
                count={stageLeads.length}
                widthClass="w-72"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage.key)}
              >
                {stageLeads.map((lead) => (
                  <LeadPipelineCard
                    key={lead._id}
                    lead={lead}
                    stageKey={stage.key}
                      draggable={canEdit}
                      onDragStart={() => setDraggedLead(lead)}
                      showManagerAssignee={(isSales || isAdmin) && (isSales || !assignmentQueueView)}
                      showSalesAssignee={showAssignedColumn && !assignmentQueueView}
                      managerLabel={ASSIGN_DROPDOWN_COPY.managerDisplay}
                      salesLabel={isAdmin ? ASSIGN_DROPDOWN_COPY.salesDisplay : undefined}
                      onViewContact={() => setContactLead(lead)}
                      dealId={getLeadDealId(lead)}
                      hasDeal={hasLeadDeal(lead)}
                      canConvert={canAction('deals', 'create') && canConvertLeadToDeal(lead)}
                      onConvert={() => handleConvertToDeal(lead._id)}
                    >
                      {isSales && (
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-1">
                            {getAssignManagerFieldLabel(Boolean(getAssignManagerSelectValue(lead)))}
                          </label>
                          <select
                            className="w-full text-[10px] px-2 py-1.5 rounded-lg border border-myth-border bg-myth-surface/80 text-gray-300"
                            value={getAssignManagerSelectValue(lead)}
                            onChange={(e) => handleQuickAssignManager(lead, e.target.value)}
                            disabled={quickAssigning === `${lead._id}-mgr` || !managers.length}
                          >
                            <option value="">
                              {formatAssigneeName(lead.assignedManager)
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
                      {canAssign && (isAdmin || managerCanAssignLeadSales(lead)) && (
                        <div className={assignmentQueueView ? 'space-y-2' : 'flex flex-wrap gap-1.5 items-end'}>
                          {isAdmin && (
                            <div className={assignmentQueueView ? 'w-full' : ''}>
                              {assignmentQueueView && (
                                <label className="block text-[10px] text-gray-500 mb-1">
                                  {getAssignManagerFieldLabel(assignedOnly)}
                                </label>
                              )}
                              {assignmentQueueView ? (
                                <select
                                  className="w-full text-[10px] px-2 py-1.5 rounded-lg border border-myth-border bg-myth-surface/80 text-gray-300"
                                  value={getAssignManagerSelectValue(lead)}
                                  onChange={(e) => handleQuickAssignManager(lead, e.target.value)}
                                  disabled={quickAssigning === `${lead._id}-mgr` || !managers.length}
                                >
                                  <option value="">{ASSIGN_DROPDOWN_COPY.selectManager}</option>
                                  {managers.map((u) => (
                                    <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                                  ))}
                                </select>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setAssignManagerLead(lead)}
                                  className="text-[10px] px-2 py-1 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors"
                                >
                                  {formatAssigneeName(lead.assignedManager) ? ASSIGN_DROPDOWN_COPY.changeMgr : ASSIGN_DROPDOWN_COPY.assignMgr}
                                </button>
                              )}
                            </div>
                          )}
                          {(isAdmin || managerCanAssignLeadSales(lead)) && (
                            <div className={assignmentQueueView ? 'w-full' : 'flex-1 min-w-[88px]'}>
                              {assignmentQueueView && (
                                <label className="block text-[10px] text-gray-500 mb-1">
                                  {getAssignSalesFieldLabel(assignedOnly)}
                                </label>
                              )}
                              <select
                                className={`${assignmentQueueView ? 'w-full' : 'w-full'} text-[10px] px-2 py-1.5 rounded-lg border border-myth-border bg-myth-surface/80 text-gray-300 hover:border-blue-500/40 focus:border-blue-500/50 cursor-pointer disabled:opacity-50`}
                                value={getAssignSalesSelectValue(lead)}
                                onChange={(e) => handleQuickAssignSales(lead, e.target.value)}
                                disabled={
                                  quickAssigning === `${lead._id}-sales`
                                  || salesOptionsForLead(lead).length === 0
                                }
                              >
                                <option value="">
                                  {assignmentQueueView
                                    ? ASSIGN_DROPDOWN_COPY.selectSales
                                    : formatAssigneeName(lead.assignedTo) ? ASSIGN_DROPDOWN_COPY.changeSales : ASSIGN_DROPDOWN_COPY.assignSales}
                                </option>
                                {salesOptionsForLead(lead).map((u) => (
                                  <option key={u._id} value={u._id}>
                                    {u.firstName} {u.lastName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </LeadPipelineCard>
                  ))}
                  {!stageLeads.length && <PipelineEmptyColumn message="No leads in this stage" />}
              </PipelineKanbanColumn>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden p-0 border border-myth-border/80">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-myth-surface/50">
                <tr>
                  <th className="table-header">Lead ID</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Company</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Source</th>
                  {showAssignedColumn && <th className="table-header">Manager</th>}
                  {showAssignedColumn && <th className="table-header">Sales Rep</th>}
                  <th className="table-header">Status</th>
                  <th className="table-header">Created</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-myth-border">
                {visibleLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-myth-surface/30 transition-colors">
                    <td className="table-cell text-myth-accent text-xs">{lead.leadNumber || lead._id.slice(-6)}</td>
                    <td className="table-cell font-medium text-white">{lead.firstName} {lead.lastName}</td>
                    <td className="table-cell">{lead.company || '-'}</td>
                    <td className="table-cell">{lead.email}</td>
                    <td className="table-cell">{lead.phone || '-'}</td>
                    <td className="table-cell capitalize">{lead.source?.replace('_', ' ')}</td>
                    {showAssignedColumn && (
                      <td className="table-cell">
                        {formatAssigneeName(lead.assignedManager) || '—'}
                      </td>
                    )}
                    {showAssignedColumn && (
                      <td className="table-cell">
                        {formatAssigneeName(lead.assignedTo) || '—'}
                      </td>
                    )}
                    <td className="table-cell"><StatusBadge status={getLeadStage(lead)} config={LEAD_STATUSES} /></td>
                    <td className="table-cell text-gray-400 text-sm">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <Link to={`/leads/${lead._id}`} className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-myth-accent" title="View"><Eye size={16} /></Link>
                        {canEdit && (
                          <button onClick={() => openEdit(lead)} className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-white" title="Edit"><Pencil size={16} /></button>
                        )}
                        {canAssign && isAdmin && (
                          <button onClick={() => setAssignManagerLead(lead)} className="p-1.5 rounded hover:bg-blue-500/10 text-gray-400 hover:text-blue-400" title="Assign to Manager"><UserCheck size={16} /></button>
                        )}
                        {canAssign && (isAdmin || isManager) && !leadHasExecutive(lead) && (
                          <button onClick={() => setAssignLead(lead)} className="p-1.5 rounded hover:bg-myth-accent/10 text-gray-400 hover:text-myth-accent" title="Assign to Sales"><UserCheck size={16} /></button>
                        )}
                        {canAssign && leadHasExecutive(lead) && (
                          <button onClick={() => setAssignLead(lead)} className="p-1.5 rounded hover:bg-myth-accent/10 text-gray-400 hover:text-myth-accent" title="Reassign Sales"><UserCheck size={16} /></button>
                        )}
                        {getLeadDealId(lead) ? (
                          <Link to={`/deals/${getLeadDealId(lead)}`} className="p-1.5 rounded hover:bg-green-500/10 text-green-400 hover:text-green-300" title="View Deal"><Handshake size={16} /></Link>
                        ) : hasLeadDeal(lead) ? (
                          <span className="text-xs text-green-400 px-1" title="Deal created">✓</span>
                        ) : canAction('deals', 'create') && canConvertLeadToDeal(lead) && (
                          <button onClick={() => handleConvertToDeal(lead._id)} className="p-1.5 rounded hover:bg-green-500/10 text-gray-400 hover:text-green-400" title="Convert to Deal"><Handshake size={16} /></button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(lead._id)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400" title="Delete"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleLeads.length === 0 && (
                  <tr><td colSpan={showAssignedColumn ? 10 : 8} className="text-center py-12 text-gray-500">
                    {isSales ? 'No leads assigned to you or created by you yet' : 'No leads found'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LeadManagerAssignModal
        lead={assignManagerLead}
        isOpen={Boolean(assignManagerLead)}
        onClose={() => setAssignManagerLead(null)}
        onAssigned={(updated) => {
          setLeads((prev) => prev.map((l) => (
            l._id === updated._id ? enrichAssignedLead({ ...l, ...updated }) : l
          )));
        }}
      />

      <ContactInfoModal
        contact={contactLead ? contactFromLead(contactLead) : null}
        isOpen={Boolean(contactLead)}
        onClose={() => setContactLead(null)}
      />

      <LeadAssignModal
        lead={assignLead}
        isOpen={Boolean(assignLead)}
        onClose={() => setAssignLead(null)}
        onAssigned={(updated) => {
          setLeads((prev) => prev.map((l) => (
            l._id === updated._id ? enrichAssignedLead({ ...l, ...updated }) : l
          )));
        }}
      />

      {modal === 'form' && (
        <Modal isOpen onClose={() => setModal(null)} title={editId ? 'Edit Lead' : 'Add Lead'} size="xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Lead name</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">First Name *</label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Last Name *</label>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-field" required />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white">Contact information</h3>
              <p className="text-xs text-gray-500 -mt-2">Primary ways to reach this lead — calls, emails, and meetings</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => handleEmailChange(e.target.value)} className="input-field" required placeholder={PLACEHOLDERS.lead.email} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Phone</label>
                  <input type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder={PLACEHOLDERS.phone} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Alternate phone</label>
                  <input type="tel" value={form.alternatePhone || ''} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} className="input-field" placeholder="Secondary number" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Website</label>
                  <input type="url" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-field" placeholder={PLACEHOLDERS.lead.website} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Company</label>
                  <input value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input-field" placeholder={PLACEHOLDERS.lead.company} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Job title</label>
                  <input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder={PLACEHOLDERS.lead.title} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-300 mb-1">Industry</label>
                  <input value={form.industry || ''} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="input-field" placeholder={PLACEHOLDERS.lead.industry} />
                </div>
              </div>
            </div>

            {!userExistsForEmail && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white">Customer Portal Access (Optional)</h3>
                <p className="text-xs text-gray-500 -mt-2">Provide a password to create a customer portal account for this lead. They can login to track their progress.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-300 mb-1">Customer Password</label>
                    <input 
                      type="password" 
                      value={form.customerPassword || ''} 
                      onChange={(e) => setForm({ ...form, customerPassword: e.target.value })} 
                      className="input-field" 
                      placeholder="Leave empty to skip portal account creation"
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters. Leave empty to not create a portal account.</p>
                  </div>
                </div>
              </div>
            )}
            {userExistsForEmail && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white">Customer Portal Access</h3>
                <p className="text-xs text-gray-500 -mt-2">A portal account already exists for this email. The customer can login with their existing credentials.</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Lead details</h3>
              {isAdmin && canAssign && (
                <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-4 space-y-4 mb-4">
                  <h4 className="text-sm font-semibold text-white">Assignment (optional)</h4>
                  <p className="text-xs text-gray-500">
                    Leave both empty for <strong className="text-gray-400">unassigned</strong> — or pick Sales Manager, then optionally Sales Executive.
                    Sample: {PLACEHOLDERS.lead.firstName} {PLACEHOLDERS.lead.lastName} → Priya Sharma → Rajesh Kumar.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {LEAD_ASSIGNMENT_EXAMPLES.map((ex) => (
                      <div key={ex.id} className="rounded-md bg-myth-surface/50 p-2 border border-myth-border/60">
                        <p className="text-myth-accent font-medium">{ex.label}</p>
                        <p className="text-gray-500 mt-0.5">{ex.lead}</p>
                        <p className="text-gray-400">Mgr: {ex.salesManager} · Exec: {ex.salesExecutive}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Sales Manager</label>
                      <select
                        value={form.assignedManager}
                        onChange={(e) => {
                          const managerId = e.target.value;
                          const pool = managerId
                            ? salesUsers.filter((u) => String(u.reportsTo?._id || u.reportsTo) === String(managerId))
                            : salesUsers;
                          const stillValid = !form.assignedTo
                            || pool.some((u) => String(u._id) === String(form.assignedTo));
                          setForm({
                            ...form,
                            assignedManager: managerId,
                            assignedTo: managerId && stillValid ? form.assignedTo : '',
                          });
                        }}
                        className="input-field"
                      >
                        <option value="">Unassigned (no manager)</option>
                        {managers.map((u) => (
                          <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Sales Executive</label>
                      <select
                        value={form.assignedTo}
                        onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                        className="input-field"
                        disabled={!salesUsers.length}
                      >
                        <option value="">Not assigned to sales</option>
                        {(form.assignedManager ? executivesForManager : salesUsers).map((u) => (
                          <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                        ))}
                      </select>
                      {form.assignedManager && !executivesForManager.length && (
                        <p className="text-xs text-amber-400/80 mt-1">No executives report to this manager.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {isManager && canAssign && (
                <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-4 space-y-3 mb-4">
                  <h4 className="text-sm font-semibold text-white">Assign to Sales Executive (optional)</h4>
                  <p className="text-xs text-gray-500">Lead will be routed to you as manager. Pick an executive on your team or leave unassigned.</p>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Sales Executive</label>
                    <select
                      value={form.assignedTo}
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Unassigned to sales</option>
                      {salesUsers.map((u) => (
                        <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Stage</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                    {LEAD_SELECTABLE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Source</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="input-field">
                    {['website', 'referral', 'social', 'email', 'cold_call', 'event', 'other'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field">
                    {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Interested service</label>
                  <input value={form.interestedService || ''} onChange={(e) => setForm({ ...form, interestedService: e.target.value })} className="input-field" placeholder={PLACEHOLDERS.lead.interestedService} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Budget (INR)</label>
                  <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Value (INR)</label>
                  <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Score (0-100)</label>
                  <input type="number" min="0" max="100" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} className="input-field" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Description</label>
              <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20" placeholder={PLACEHOLDERS.lead.description} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Notes</label>
              <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field h-24" />
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editId ? 'Update' : 'Create'} Lead</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
