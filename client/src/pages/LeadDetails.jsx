import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2, Handshake, Globe, Briefcase, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { leadsAPI, LEAD_STATUSES, formatCurrency, formatDateTime } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import WorkflowProgress from '../components/workflow/WorkflowProgress';
import { LEAD_WORKFLOW_STAGES } from '../constants/workflow';
import { normalizeLeadStatus, canConvertLeadToDeal } from '../constants/leadPipeline';
import LeadAssignModal from '../components/leads/LeadAssignModal';
import LeadManagerAssignModal from '../components/leads/LeadManagerAssignModal';
import { useAuth } from '../context/AuthContext';

const TABS = ['Basic Information', 'Communication History', 'Notes', 'Attachments', 'Timeline', 'Activities'];

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, canWrite, canAction, isAdmin, isManager } = usePermissions();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('Basic Information');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showManagerAssign, setShowManagerAssign] = useState(false);

  const fetchLead = () => leadsAPI.getOne(id).then(({ data: d }) => setData(d.lead ? d : { lead: d, activities: [], communications: [], documents: [], notes: [] }));

  useEffect(() => {
    fetchLead().catch(() => toast.error('Lead not found')).finally(() => setLoading(false));
  }, [id]);

  const runAction = async (fn, successMsg) => {
    setActing(true);
    try {
      await fn();
      toast.success(successMsg);
      await fetchLead();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  const createDeal = () => navigate(`/deals/create?leadId=${id}`);

  if (loading) return <LoadingSpinner />;
  if (!data?.lead) return <div className="text-center text-gray-400 py-12">Lead not found</div>;

  const { lead, activities, communications, documents, notes } = data;
  const stage = normalizeLeadStatus(lead.status, lead.workflowStage);
  const hasDeal = Boolean(lead.convertedToDeal);

  return (
    <div className="space-y-6">
      <Link to="/leads" className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm">
        <ArrowLeft size={16} /> Back to {role === 'sales' ? 'My Leads' : 'Leads'}
      </Link>

      <div className="card">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Lead workflow</p>
        <WorkflowProgress stages={LEAD_WORKFLOW_STAGES} currentStage={stage === 'converted_to_deal' ? 'qualified' : stage} />
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{lead.firstName} {lead.lastName}</h1>
              <StatusBadge status={stage} config={LEAD_STATUSES} />
              <span className="text-xs text-myth-accent">{lead.leadNumber}</span>
            </div>
            <p className="text-gray-400">{lead.title} {lead.company && `at ${lead.company}`}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-start">
            {isAdmin && canAction('leads', 'assign') && !lead.assignedManager && (
              <button type="button" onClick={() => setShowManagerAssign(true)} className="btn-secondary flex items-center gap-2 text-sm">
                <UserCheck size={16} /> Assign to Manager
              </button>
            )}
            {canAction('leads', 'assign') && lead.assignedManager && !lead.assignedTo && (
              (isAdmin || (isManager && String(lead.assignedManager?._id || lead.assignedManager) === String(user?._id))) && (
              <button type="button" onClick={() => setShowAssign(true)} className="btn-secondary flex items-center gap-2 text-sm">
                <UserCheck size={16} /> Assign to Sales
              </button>
            ))}
            {canAction('leads', 'assign') && lead.assignedTo && (
              <button type="button" onClick={() => setShowAssign(true)} className="btn-secondary flex items-center gap-2 text-sm">
                <UserCheck size={16} /> Reassign Sales
              </button>
            )}
            {canAction('deals', 'create') && canConvertLeadToDeal(lead) && (
              <button type="button" disabled={acting} onClick={createDeal} className="btn-primary flex items-center gap-2 text-sm">
                <Handshake size={16} /> Convert to Deal
              </button>
            )}
            {hasDeal && (
              <Link to={`/deals/${lead.convertedToDeal._id || lead.convertedToDeal}`} className="btn-secondary text-sm">View Deal</Link>
            )}
            <p className="text-2xl font-bold text-myth-accent w-full md:w-auto md:text-right">{formatCurrency(lead.budget || lead.value)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-myth-border pb-2">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-2 text-sm rounded-t-lg ${tab === t ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      <div className="card">
        {tab === 'Basic Information' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Contact information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-myth-accent shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a href={`mailto:${lead.email}`} className="text-gray-300 hover:text-myth-accent">{lead.email}</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-myth-accent shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    {lead.phone ? <a href={`tel:${lead.phone}`} className="text-gray-300 hover:text-myth-accent">{lead.phone}</a> : <span className="text-gray-300">N/A</span>}
                  </div>
                </div>
                {lead.alternatePhone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-myth-accent shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Alternate phone</p>
                      <a href={`tel:${lead.alternatePhone}`} className="text-gray-300 hover:text-myth-accent">{lead.alternatePhone}</a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Building2 size={16} className="text-myth-accent shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <span className="text-gray-300">{lead.company || 'N/A'}</span>
                  </div>
                </div>
                {lead.title && (
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-myth-accent shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Job title</p>
                      <span className="text-gray-300">{lead.title}</span>
                    </div>
                  </div>
                )}
                {lead.industry && (
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-myth-accent shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Industry</p>
                      <span className="text-gray-300">{lead.industry}</span>
                    </div>
                  </div>
                )}
                {lead.website && (
                  <div className="flex items-center gap-3">
                    <Globe size={16} className="text-myth-accent shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Website</p>
                      <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-myth-accent hover:underline">{lead.website}</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 pt-4 border-t border-myth-border">
              {[['Source', lead.source], ['Priority', lead.priority], ['Stage', LEAD_STATUSES[stage]?.label || stage], ['Manager', lead.assignedManager ? `${lead.assignedManager.firstName} ${lead.assignedManager.lastName}` : '—'], ['Sales Rep', lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'], ['Interested Service', lead.interestedService], ['Created', formatDateTime(lead.createdAt)]].map(([k, v]) => (
                <div key={k}><dt className="text-gray-400 text-sm">{k}</dt><dd className="text-white text-sm capitalize">{v || '-'}</dd></div>
              ))}
            </dl>
            {lead.description && (
              <div className="pt-4 border-t border-myth-border">
                <p className="text-gray-400 text-sm mb-1">Description</p>
                <p className="text-gray-300 text-sm">{lead.description}</p>
              </div>
            )}
          </div>
        )}
        {tab === 'Communication History' && (
          <div className="space-y-3">{communications?.length ? communications.map((c) => (
            <div key={c._id} className="p-3 rounded-lg bg-myth-surface/50"><p className="text-sm text-white">{c.subject || c.type}</p><p className="text-xs text-gray-500">{formatDateTime(c.createdAt)}</p></div>
          )) : <p className="text-gray-500">No communications yet</p>}</div>
        )}
        {tab === 'Notes' && <p className="text-gray-300 text-sm">{lead.notes || (notes?.length ? notes.map((n) => n.content).join('\n') : 'No notes yet.')}</p>}
        {tab === 'Attachments' && (
          <div className="space-y-2">{documents?.length ? documents.map((d) => (
            <a key={d._id} href={d.fileUrl} target="_blank" rel="noreferrer" className="block text-myth-accent hover:underline text-sm">{d.name}</a>
          )) : <p className="text-gray-500">No attachments</p>}</div>
        )}
        {(tab === 'Timeline' || tab === 'Activities') && (
          <div className="space-y-3">{activities?.length ? activities.map((a) => (
            <div key={a._id} className="flex gap-3 p-3 rounded-lg bg-myth-surface/50"><div><p className="text-sm text-white">{a.title}</p><p className="text-xs text-gray-500">{formatDateTime(a.createdAt)} · {a.user?.firstName} {a.user?.lastName}</p></div></div>
          )) : <p className="text-gray-500">No activity yet</p>}</div>
        )}
      </div>

      <LeadManagerAssignModal
        lead={lead}
        isOpen={showManagerAssign}
        onClose={() => setShowManagerAssign(false)}
        onAssigned={(updated) => setData((prev) => ({ ...prev, lead: { ...prev.lead, ...updated } }))}
      />

      <LeadAssignModal
        lead={lead}
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        onAssigned={(updated) => setData((prev) => ({ ...prev, lead: { ...prev.lead, ...updated } }))}
      />
    </div>
  );
}
