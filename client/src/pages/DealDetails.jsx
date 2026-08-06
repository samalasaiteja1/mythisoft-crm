import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Handshake, UserPlus, FolderKanban, Pencil, Trash2, UserCheck } from 'lucide-react';
import { dealsAPI, usersAPI, projectsAPI, DEAL_STAGES, formatCurrency, formatDate, formatDateTime } from '../services/api';
import { normalizeDealStage, isDealWon, canConvertDealToCustomer } from '../constants/dealPipeline';
import { DEAL_STAGES_ORDER } from '../constants/workflow';
import { buildFormFromDeal, buildDealPayload, validateDealForm, getDealDeliverySummary } from '../utils/dealForm';
import { contactFromDeal } from '../utils/pipelineContact';
import ContactInfoPanel from '../components/pipeline/ContactInfoPanel';
import { useDealForm } from '../hooks/useDealForm';
import DealDeliveryFields from '../components/deals/DealDeliveryFields';
import DealAssignModal from '../components/deals/DealAssignModal';
import DealAssignProjectModal from '../components/deals/DealAssignProjectModal';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import WorkflowProgress from '../components/workflow/WorkflowProgress';
import { usePermissions } from '../hooks/usePermissions';
import useActiveProjectCategories, { categoryLabel } from '../hooks/useProjectCategories';

const dealStages = DEAL_STAGES_ORDER.map((key) => ({
  key,
  label: DEAL_STAGES[key]?.label || key.replace(/_/g, ' '),
}));

const ALL_TABS = ['Overview', 'Project Requirements', 'Customer', 'Notes', 'Activities'];

export default function DealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { canWrite, isAdmin, isManager } = usePermissions();
  const [deal, setDeal] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [salesUsers, setSalesUsers] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [showAssignProject, setShowAssignProject] = useState(false);
  const [assignProjectMode, setAssignProjectMode] = useState('full');
  const [showQuickAssign, setShowQuickAssign] = useState(false);
  const [techMembers, setTechMembers] = useState([]);
  const [loadingTech, setLoadingTech] = useState(false);
  const [selectedTech, setSelectedTech] = useState('');
  const [assigningTech, setAssigningTech] = useState(false);

  const {
    form, setForm, setDeal: setDealField, setProject,
  } = useDealForm();

  const canAssign = isAdmin || isManager;
  const canAssignProject = isAdmin || isManager;
  const { categories: projectCategories } = useActiveProjectCategories();
  const canEdit = canWrite('deals');
  const canDelete = isAdmin;

  const fetchDeal = () => dealsAPI.getOne(id).then(({ data }) => {
    const doc = data.deal || data;
    setDeal(doc);
    return doc;
  });

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab);
  }, [location.state?.tab]);

  useEffect(() => {
    fetchDeal()
      .then((doc) => {
        if (location.state?.edit && canWrite('deals')) {
          setForm(buildFormFromDeal(doc));
          setEditing(true);
        }
      })
      .catch(() => toast.error('Deal not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!canAssign) return;
    usersAPI.getSalesTeam().then(({ data }) => setSalesUsers(data.members || [])).catch(() => {});
  }, [canAssign]);

  // Load technical team when quick assign is opened
  useEffect(() => {
    if (!showQuickAssign) return;
    let mounted = true;
    setLoadingTech(true);
    (async () => {
      try {
        const members = [];
        try {
          const { data } = await projectsAPI.getTechnicalTeam();
          (data?.members || []).forEach((m) => members.push(m));
        } catch (err) {
          // ignore
        }
        try {
          const { data: allUsers } = await usersAPI.getAll();
          (allUsers || []).filter((u) => u.role === 'technical' && u.isActive !== false).forEach((u) => members.push(u));
        } catch (err) {
          // ignore
        }
        const map = {};
        members.filter(Boolean).forEach((u) => { map[u._id] = u; });
        const merged = Object.values(map).sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
        if (mounted) setTechMembers(merged);
      } catch (err) {
        toast.error('Failed to load technical team');
      } finally {
        if (mounted) setLoadingTech(false);
      }
    })();
    return () => { mounted = false; };
  }, [showQuickAssign]);

  useEffect(() => {
    if (location.state?.assignProject && canAssignProject) {
      setAssignProjectMode('full');
      setShowAssignProject(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.assignProject, canAssignProject, location.pathname, navigate]);

  const startEdit = () => {
    setForm(buildFormFromDeal(deal));
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async (e) => {
    e.preventDefault();
    const err = validateDealForm(form);
    if (err) { toast.error(err); return; }
    setActing(true);
    try {
      const { data } = await dealsAPI.update(id, buildDealPayload(form));
      setDeal(data);
      setEditing(false);
      toast.success('Deal updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update deal');
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this deal permanently?')) return;
    setActing(true);
    try {
      await dealsAPI.delete(id);
      toast.success('Deal deleted');
      navigate('/deals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setActing(false);
    }
  };

  const run = async (fn, msg) => {
    setActing(true);
    try {
      const result = await fn();
      if (msg) toast.success(msg);
      return result;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
      return null;
    } finally {
      setActing(false);
    }
  };

  const markWon = () => run(async () => {
    const { data } = await dealsAPI.updateStage(id, 'won');
    setDeal(data);
  }, 'Deal marked as Won — convert to customer next');

  const hasProjectRequirements = (dealData) => Boolean(
    dealData?.projectRequirements?.name
    || dealData?.projectRequirements?.category
    || dealData?.projectRequirements?.description
    || dealData?.projectRequirements?.scope
    || dealData?.projectRequirements?.deliverables
    || (dealData?.projectRequirements?.technologyStack || []).length
    || dealData?.projectRequirements?.estimatedBudget
    || dealData?.projectRequirements?.startDate
    || dealData?.projectRequirements?.endDate
  );

  const createCustomer = () => run(async () => {
    const { data } = await dealsAPI.convertToCustomer(id);
    setDeal(data.deal);
    if (canAssignProject && !hasProjectRequirements(data.deal)) {
      setAssignProjectMode('requirements');
      setShowAssignProject(true);
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      navigate(`/customers/${data.customer._id}`);
    }
  }, 'Customer created');

  const handleProjectAssigned = (data) => {
    if (data?.project?._id) {
      navigate(`/projects/${data.project._id}`);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!deal) return <div className="text-center text-gray-400 py-12">Deal not found</div>;

  const stage = normalizeDealStage(deal.stage);
  const isWon = isDealWon(stage);
  const isConverted = stage === 'converted_to_customer';
  const customerId = deal.customer?._id || deal.customer;
  const deliverySummary = getDealDeliverySummary(deal);
  const tabs = ALL_TABS;

  if (editing) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Link to="/deals" className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">← Back to Deal Pipeline</Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Deal</h1>
          <p className="text-gray-400 mt-1">Update deal details and project requirements</p>
        </div>
        <form onSubmit={saveEdit} className="space-y-6">
          <DealDeliveryFields
            form={form}
            setDeal={setDealField}
            setProject={setProject}
            canAssign={canAssign}
            salesUsers={salesUsers}
            projectCategories={projectCategories}
          />
          <div className="flex flex-wrap gap-3 justify-end">
            <button type="button" onClick={cancelEdit} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={acting} className="btn-primary">{acting ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/deals" className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">← Back to Deal Pipeline</Link>

      <div className="card">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Deal workflow</p>
        <WorkflowProgress stages={dealStages} currentStage={stage} />
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{deal.title}</h1>
              <StatusBadge status={stage} config={DEAL_STAGES} />
              <span className="text-xs px-2 py-1 rounded-full bg-myth-surface text-gray-300 border border-myth-border">
                Project
              </span>
            </div>
            <p className="text-gray-400">{customerId ? `${deal.customer?.firstName || ''} ${deal.customer?.lastName || ''}`.trim() || 'Customer linked' : 'No customer linked yet'}</p>
            {deliverySummary && <p className="text-sm text-myth-accent mt-2">{deliverySummary}</p>}
          </div>
          <div className="flex flex-wrap gap-2 items-start">
            {canAssign && (
              <button type="button" onClick={() => setShowAssign(true)} className="btn-secondary flex items-center gap-2 text-sm">
                <UserCheck size={16} /> {deal.assignedTo ? 'Reassign' : 'Assign to Sales'}
              </button>
            )}
            {canEdit && (
              <button type="button" disabled={acting} onClick={startEdit} className="btn-secondary flex items-center gap-2 text-sm">
                <Pencil size={16} /> Edit deal
              </button>
            )}
            {canDelete && (
              <button type="button" disabled={acting} onClick={handleDelete} className="btn-secondary flex items-center gap-2 text-sm text-red-400 border-red-400/30">
                <Trash2 size={16} /> Delete
              </button>
            )}
            {canWrite('deals') && !isWon && stage !== 'lost' && (
              <button type="button" disabled={acting} onClick={markWon} className="btn-primary flex items-center gap-2 text-sm">
                <Handshake size={16} /> Mark as Won
              </button>
            )}
            {canWrite('customers') && isWon && !isConverted && !customerId && canConvertDealToCustomer(stage) && (
              <button type="button" disabled={acting} onClick={createCustomer} className="btn-primary flex items-center gap-2 text-sm">
                <UserPlus size={16} /> Convert to Customer
              </button>
            )}
            {canAssignProject && customerId && (
              <div className="relative">
                <button type="button" disabled={acting} onClick={() => setShowQuickAssign((s) => !s)} className="btn-primary flex items-center gap-2 text-sm">
                  <FolderKanban size={16} /> Assign to Technical Team
                </button>
                {showQuickAssign && (
                  <div className="absolute right-0 mt-2 w-72 bg-myth-surface border border-myth-border rounded-lg p-3 z-50">
                    {loadingTech ? (
                      <p className="text-sm text-gray-400">Loading technical team…</p>
                    ) : techMembers.length === 0 ? (
                      <p className="text-sm text-gray-400">No technical team members found.</p>
                    ) : (
                      <>
                        <label className="block text-xs text-gray-400 mb-2">Select technical member</label>
                        <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="input-field w-full mb-3">
                          <option value="">Select member</option>
                          {techMembers.map((m) => (
                            <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
                          ))}
                        </select>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => { setShowQuickAssign(false); setSelectedTech(''); }} className="btn-secondary">Cancel</button>
                          <button type="button" disabled={!selectedTech || assigningTech} onClick={async () => {
                            if (!selectedTech) return;
                            setAssigningTech(true);
                            try {
                              // Assign the deal to technical member(s) via API
                              await dealsAPI.assignProject(deal._id, { assignedTo: [selectedTech] });
                              toast.success('Assigned to technical member');
                              await fetchDeal();
                              setShowQuickAssign(false);
                              setSelectedTech('');
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Assignment failed');
                            } finally {
                              setAssigningTech(false);
                            }
                          }} className="btn-primary">{assigningTech ? 'Assigning…' : 'Assign'}</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            {customerId && <Link to={`/customers/${customerId}`} className="btn-secondary text-sm">View Customer</Link>}
            <div className="text-right w-full md:w-auto">
              <p className="text-2xl font-bold text-myth-accent">{formatCurrency(deal.value)}</p>
              <p className="text-sm text-gray-400">{deal.probability}% probability</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-myth-border pb-2">
        {tabs.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-t-lg ${tab === t ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      <div className="card">
        {tab === 'Overview' && (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[['Delivery', deliverySummary || '-'], ['Salesperson', deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : '-'], ['Stage', DEAL_STAGES[stage]?.label || stage], ['Expected Close', formatDate(deal.expectedCloseDate)], ['Created', formatDateTime(deal.createdAt)], ['Description', deal.description || '-']].map(([k, v]) => (
              <div key={k}><dt className="text-gray-400 text-sm">{k}</dt><dd className="text-white mt-1">{v}</dd></div>
            ))}
            {deal.lead && (
              <div className="md:col-span-2">
                <dt className="text-gray-400 text-sm">Source lead</dt>
                <dd className="text-white mt-1">
                  <Link to={`/leads/${deal.lead._id || deal.lead}`} className="text-myth-accent hover:underline">
                    {deal.lead.firstName} {deal.lead.lastName}{deal.lead.company ? ` · ${deal.lead.company}` : ''}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        )}
        {tab === 'Project Requirements' && (
          deal.projectRequirements ? (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[['Project category', categoryLabel(deal.projectRequirements.category)], ['Project name', deal.projectRequirements.name], ['Priority', deal.projectRequirements.priority], ['Estimated budget', formatCurrency(deal.projectRequirements.estimatedBudget)], ['Planned start', formatDate(deal.projectRequirements.startDate)], ['Target end', formatDate(deal.projectRequirements.endDate)], ['Technology', (deal.projectRequirements.technologyStack || []).join(', ') || '-']].map(([k, v]) => (
                <div key={k}><dt className="text-gray-400 text-sm">{k}</dt><dd className="text-white mt-1">{v || '-'}</dd></div>
              ))}
              {deal.projectRequirements.scope && <div className="md:col-span-2"><dt className="text-gray-400 text-sm">Scope</dt><dd className="text-white mt-1 whitespace-pre-wrap">{deal.projectRequirements.scope}</dd></div>}
              {deal.projectRequirements.deliverables && <div className="md:col-span-2"><dt className="text-gray-400 text-sm">Deliverables</dt><dd className="text-white mt-1 whitespace-pre-wrap">{deal.projectRequirements.deliverables}</dd></div>}
              {deal.projectRequirements.description && <div className="md:col-span-2"><dt className="text-gray-400 text-sm">Description</dt><dd className="text-white mt-1 whitespace-pre-wrap">{deal.projectRequirements.description}</dd></div>}
            </dl>
          ) : <p className="text-gray-500 text-sm">No project requirements. {canEdit && <button type="button" onClick={startEdit} className="text-myth-accent hover:underline ml-1">Add now</button>}</p>
        )}
        {tab === 'Customer' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              {customerId
                ? 'Customer record linked to this deal.'
                : deal.lead
                  ? 'Contact details from the source lead until the deal is converted to a customer.'
                  : 'No customer or lead contact on this deal yet.'}
            </p>
            <ContactInfoPanel
              contact={contactFromDeal(deal)}
              profileLink={customerId ? `/customers/${customerId}` : null}
            />
            {!customerId && canWrite('customers') && isWon && canConvertDealToCustomer(stage) && (
              <p className="text-sm text-gray-400">
                Win and convert this deal to create a customer profile.
              </p>
            )}
          </div>
        )}
        {tab === 'Notes' && <p className="text-gray-300 text-sm">{deal.description || 'No notes yet.'}</p>}
        {tab === 'Activities' && <p className="text-gray-500 text-sm">Deal activities appear on the dashboard and customer timeline.</p>}
      </div>

      <DealAssignModal
        deal={deal}
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        onAssigned={(updated) => setDeal(updated)}
      />

      <DealAssignProjectModal
        deal={deal}
        isOpen={showAssignProject}
        mode={assignProjectMode}
        onClose={() => setShowAssignProject(false)}
        onAssigned={handleProjectAssigned}
      />
    </div>
  );
}
