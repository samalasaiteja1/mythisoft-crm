import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, Globe, Building2, Briefcase, Calendar, Clock, User,
  ChevronDown, Sparkles, Target, FileText, Video, Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { followupsAPI, usersAPI, leadsAPI, dealsAPI, customersAPI } from '../../services/api';
import {
  ACTIVITY_TYPES,
  FOLLOWUP_PRIORITIES,
  FOLLOWUP_TYPES,
  FOLLOWUP_STATUSES,
  LEAD_STATUS_FOLLOWUP_GROUPS,
  DEAL_FOLLOWUP_STATUSES,
  DEAL_STAGE_FOLLOWUP_GROUPS,
  DEAL_FOLLOWUP_OUTCOMES,
  defaultFollowUpForm,
} from '../../constants/followups';
import {
  getLeadStatusGroup,
  getFollowUpOption,
  normalizeLeadStatusForFollowup,
  normalizeActivityType,
  normalizeFollowupStatus,
  isMeetingActivity,
  FOLLOWUP_STATUS_COLORS,
} from '../../constants/leadFollowups';
import {
  getDealStageGroup,
  getDealFollowUpOption,
  normalizeDealStageForFollowup,
  normalizeDealFollowupStatus,
  DEAL_FOLLOWUP_STATUS_COLORS,
  getDealStageStyle,
} from '../../constants/dealFollowups';
import { mapLeadToFollowUpContact } from '../../utils/leadContact';

const applyContact = (base, contact) => ({
  ...base,
  ...contact,
  title: base.title || contact.title || '',
  notes: base.notes || contact.notes || '',
});

const PRIORITY_STYLES = {
  low: 'border-gray-500/40 text-gray-400 hover:border-gray-400',
  medium: 'border-blue-500/40 text-blue-300 hover:border-blue-400',
  high: 'border-amber-500/40 text-amber-300 hover:border-amber-400',
  urgent: 'border-red-500/40 text-red-300 hover:border-red-400',
};

const PRIORITY_ACTIVE = {
  low: 'border-gray-400 bg-gray-500/15 text-white',
  medium: 'border-blue-400 bg-blue-500/15 text-white',
  high: 'border-amber-400 bg-amber-500/15 text-white',
  urgent: 'border-red-400 bg-red-500/15 text-white',
};

function Section({ icon: Icon, title, subtitle, children, accent = false }) {
  return (
    <section
      className={`rounded-xl border p-3 lg:p-5 sm:p-6 space-y-3 lg:space-y-5 ${
        accent
          ? 'border-myth-accent/25 bg-gradient-to-br from-myth-accent/8 via-myth-card to-myth-card shadow-glow'
          : 'border-myth-border bg-myth-card shadow-card'
      }`}
    >
      <div className="flex items-start gap-2 lg:gap-3">
        {Icon && (
          <span className="flex h-8 w-8 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-lg bg-myth-surface border border-myth-border text-myth-accent">
            <Icon size={14} lg:size={18} />
          </span>
        )}
        <div>
          <h3 className="text-xs lg:text-sm font-semibold text-white tracking-wide">{title}</h3>
          {subtitle && <p className="text-[10px] lg:text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-400 mb-1.5">
      {children}
      {required && <span className="text-myth-accent ml-0.5">*</span>}
    </label>
  );
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function FollowUpForm({
  workflowStage = 'lead',
  initial = null,
  onSuccess,
  submitLabel = 'Save follow-up',
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({
    ...defaultFollowUpForm(),
    workflowStage,
  }));
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [contactSource, setContactSource] = useState('');
  const [showContactEdit, setShowContactEdit] = useState(false);

  const isLeadWorkflow = workflowStage === 'lead';
  const isDealWorkflow = workflowStage === 'deal';
  const isCustomerWorkflow = workflowStage === 'customer';
  const leadStatusGroup = getLeadStatusGroup(form.leadStatus);
  const dealStageGroup = getDealStageGroup(form.dealStage);
  const statusOptions = isDealWorkflow ? DEAL_FOLLOWUP_STATUSES : FOLLOWUP_STATUSES;
  const statusColors = isDealWorkflow ? DEAL_FOLLOWUP_STATUS_COLORS : FOLLOWUP_STATUS_COLORS;

  useEffect(() => {
    usersAPI.getAll().then(({ data }) => setUsers(Array.isArray(data) ? data : data.users || [])).catch(() => {});
    if (workflowStage === 'lead') {
      leadsAPI.getOptions().then(({ data }) => setLeads(data || [])).catch(() => {});
    }
    if (workflowStage === 'deal') {
      dealsAPI.getAll().then(({ data }) => setDeals(Array.isArray(data) ? data : [])).catch(() => {});
    }
    if (workflowStage === 'customer') {
      customersAPI.getOptions().then(({ data }) => setCustomers(Array.isArray(data) ? data : [])).catch(() => {});
    }
  }, [workflowStage]);

  useEffect(() => {
    if (initial) {
      setForm({
        ...defaultFollowUpForm(),
        activityType: normalizeActivityType(initial.activityType || 'phone_call'),
        leadStatus: initial.leadStatus || normalizeLeadStatusForFollowup(initial.lead?.status) || 'new',
        dealStage: initial.dealStage || normalizeDealStageForFollowup(initial.deal?.stage) || 'deal_created',
        followUpOption: initial.followUpOption || '',
        followUpOutcome: initial.followUpOutcome || initial.outcome || '',
        status: isDealWorkflow
          ? normalizeDealFollowupStatus(initial.status)
          : normalizeFollowupStatus(initial.status),
        title: initial.title || '',
        notes: initial.notes || '',
        scheduledAt: initial.scheduledAt
          ? new Date(initial.scheduledAt).toISOString().slice(0, 16)
          : defaultFollowUpForm().scheduledAt,
        contactName: initial.contactName || '',
        contactEmail: initial.contactEmail || '',
        contactPhone: initial.contactPhone || '',
        contactAlternatePhone: initial.contactAlternatePhone || '',
        contactWebsite: initial.contactWebsite || '',
        contactTitle: initial.contactTitle || '',
        contactIndustry: initial.contactIndustry || '',
        company: initial.company || '',
        meetingLink: initial.meetingLink || '',
        duration: initial.duration || 30,
        priority: initial.priority || 'medium',
        workflowStage: initial.workflowStage || workflowStage,
        lead: initial.lead?._id || initial.lead || '',
        deal: initial.deal?._id || initial.deal || '',
        customer: initial.customer?._id || initial.customer || '',
        assignedTo: initial.assignedTo?._id || initial.assignedTo || '',
      });
      if (initial.lead) setContactSource('lead');
      if (initial.deal) setContactSource(initial.deal?.title || 'deal');
      if (initial.customer) setContactSource(initial.customer?.firstName ? `${initial.customer.firstName} ${initial.customer.lastName}` : 'customer');
    }
  }, [initial, workflowStage]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const fillFromLead = (lead) => {
    if (!lead) return;
    const contact = mapLeadToFollowUpContact(lead);
    const leadStatus = normalizeLeadStatusForFollowup(lead.status);
    setForm((f) => applyContact(f, {
      ...contact,
      lead: lead._id,
      leadStatus,
      followUpOption: '',
    }));
    setContactSource(lead.label || `${lead.firstName} ${lead.lastName}`);
  };

  const handleLeadChange = (leadId) => {
    set('lead', leadId);
    if (!leadId) {
      setContactSource('');
      return;
    }
    const option = leads.find((l) => l._id === leadId);
    if (option) fillFromLead(option);
  };

  const handleLeadStatusChange = (leadStatus) => {
    setForm((f) => ({ ...f, leadStatus, followUpOption: '' }));
  };

  const handleFollowUpOptionChange = (optionKey) => {
    const opt = getFollowUpOption(form.leadStatus, optionKey);
    setForm((f) => ({
      ...f,
      followUpOption: optionKey,
      activityType: opt?.activityType || f.activityType,
      title: f.title || opt?.label || f.title,
    }));
  };

  const handleDealStageChange = (dealStage) => {
    setForm((f) => ({ ...f, dealStage, followUpOption: '' }));
  };

  const handleDealFollowUpOptionChange = (optionKey) => {
    const opt = getDealFollowUpOption(form.dealStage, optionKey);
    setForm((f) => ({
      ...f,
      followUpOption: optionKey,
      activityType: opt?.activityType || f.activityType,
      title: f.title || opt?.label || f.title,
    }));
  };

  const handleDealChange = async (dealId) => {
    set('deal', dealId);
    if (!dealId) {
      setContactSource('');
      return;
    }
    try {
      const { data: deal } = await dealsAPI.getOne(dealId);
      const lead = deal.lead;
      setForm((f) => ({
        ...f,
        deal: dealId,
        lead: lead?._id || f.lead,
        dealStage: normalizeDealStageForFollowup(deal.stage),
        followUpOption: '',
        title: f.title || `Deal follow-up: ${deal.title}`,
        notes: f.notes || deal.description || '',
        ...(lead ? mapLeadToFollowUpContact(lead) : { contactName: deal.title, company: deal.title }),
      }));
      setContactSource(lead ? `${lead.firstName} ${lead.lastName}` : deal.title);
    } catch {
      toast.error('Could not load deal contact info');
    }
  };

  const handleCustomerChange = async (customerId) => {
    set('customer', customerId);
    if (!customerId) {
      setContactSource('');
      return;
    }
    try {
      const { data } = await customersAPI.getOne(customerId);
      const customer = data.customer || data;
      setForm((f) => ({
        ...f,
        customer: customerId,
        title: f.title || `Customer follow-up: ${customer.firstName} ${customer.lastName}`,
        notes: f.notes || customer.notes || '',
        contactName: `${customer.firstName} ${customer.lastName}`.trim(),
        contactEmail: customer.email,
        contactPhone: customer.phone,
        contactTitle: customer.title,
        company: customer.companyName || customer.company?.name,
      }));
      setContactSource(`${customer.firstName} ${customer.lastName}`);
    } catch {
      const option = customers.find((c) => c._id === customerId);
      if (option) setContactSource(option.label);
      toast.error('Could not load customer contact info');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (isLeadWorkflow && !form.lead) {
      toast.error('Please select a lead');
      return;
    }
    if (isDealWorkflow && !form.deal) {
      toast.error('Please select a deal');
      return;
    }
    if (isCustomerWorkflow && !form.customer) {
      toast.error('Please select a customer');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        workflowStage,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        lead: form.lead || undefined,
        deal: form.deal || undefined,
        customer: form.customer || undefined,
        assignedTo: form.assignedTo || undefined,
        leadStatus: isLeadWorkflow ? form.leadStatus : undefined,
        dealStage: isDealWorkflow ? form.dealStage : undefined,
        followUpOption: (isLeadWorkflow || isDealWorkflow) ? form.followUpOption : undefined,
        followUpOutcome: isDealWorkflow ? form.followUpOutcome : undefined,
        outcome: isDealWorkflow ? form.followUpOutcome : form.outcome,
      };
      if (initial?._id && !initial.virtual) {
        await followupsAPI.update(initial._id, payload);
        toast.success('Follow-up updated');
      } else {
        await followupsAPI.create(payload);
        toast.success('Follow-up created');
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const isMeeting = isMeetingActivity(form.activityType);
  const hasContact = form.contactName || form.contactEmail || form.contactPhone;
  const selectedType = FOLLOWUP_TYPES.find((t) => t.key === form.activityType);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-3 lg:space-y-5 animate-fade-in">
      {/* Record selection */}
      <Section
        icon={Target}
        title={isLeadWorkflow ? 'Select lead' : isCustomerWorkflow ? 'Select customer' : 'Select deal'}
        subtitle={isLeadWorkflow
          ? 'Contact details load automatically when you pick a lead'
          : isCustomerWorkflow
            ? 'Contact info is pulled from the customer record'
            : 'Contact info is pulled from the linked lead'}
      >
        {isLeadWorkflow ? (
          <div>
            <FieldLabel required>Lead</FieldLabel>
            <select
              className="input-field"
              value={form.lead}
              onChange={(e) => handleLeadChange(e.target.value)}
              required
            >
              <option value="">Choose a lead…</option>
              {leads.map((l) => (
                <option key={l._id} value={l._id}>{l.label}</option>
              ))}
            </select>
          </div>
        ) : isCustomerWorkflow ? (
          <div>
            <FieldLabel required>Customer</FieldLabel>
            <select className="input-field" value={form.customer} onChange={(e) => handleCustomerChange(e.target.value)} required>
              <option value="">Choose a customer…</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <FieldLabel required>Deal</FieldLabel>
            <select className="input-field" value={form.deal} onChange={(e) => handleDealChange(e.target.value)} required>
              <option value="">Choose a deal…</option>
              {deals.map((d) => (
                <option key={d._id} value={d._id}>{d.title}</option>
              ))}
            </select>
          </div>
        )}
      </Section>

      {/* Contact preview */}
      {hasContact && (
        <div className="rounded-xl border border-myth-accent/30 bg-gradient-to-r from-myth-accent/10 via-myth-card to-myth-card p-3 lg:p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
            <div className="flex h-12 w-12 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-full bg-myth-accent/20 border border-myth-accent/40 text-base lg:text-lg font-bold text-myth-accent">
              {getInitials(form.contactName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base lg:text-lg font-semibold text-white">{form.contactName}</p>
                {form.contactTitle && (
                  <span className="text-[10px] lg:text-xs px-2 py-0.5 rounded-full bg-myth-surface border border-myth-border text-gray-400">
                    {form.contactTitle}
                  </span>
                )}
              </div>
              {(form.company || form.contactIndustry) && (
                <p className="text-xs lg:text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <Building2 size={11} lg:size={13} className="text-myth-accent shrink-0" />
                  {form.company}{form.contactIndustry ? ` · ${form.contactIndustry}` : ''}
                </p>
              )}
              {contactSource && (
                <p className="text-[10px] lg:text-xs text-myth-accent mt-1">Linked: {contactSource}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {form.contactPhone && (
                <a
                  href={`tel:${form.contactPhone}`}
                  className="inline-flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] lg:text-sm hover:bg-green-500/20 transition-colors"
                >
                  <Phone size={12} lg:size={14} /> Call
                </a>
              )}
              {form.contactEmail && (
                <a
                  href={`mailto:${form.contactEmail}`}
                  className="inline-flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] lg:text-sm hover:bg-blue-500/20 transition-colors"
                >
                  <Mail size={12} lg:size={14} /> Email
                </a>
              )}
            </div>
          </div>
          <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-myth-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs lg:text-sm">
            {form.contactEmail && (
              <div className="flex items-center gap-2 text-gray-400">
                <Mail size={12} lg:size={14} className="text-myth-accent shrink-0" />
                <span className="truncate">{form.contactEmail}</span>
              </div>
            )}
            {form.contactPhone && (
              <div className="flex items-center gap-2 text-gray-400">
                <Phone size={12} lg:size={14} className="text-green-400 shrink-0" />
                <span>{form.contactPhone}</span>
              </div>
            )}
            {form.contactAlternatePhone && (
              <div className="flex items-center gap-2 text-gray-400">
                <Phone size={12} lg:size={14} className="text-green-400 shrink-0" />
                <span>{form.contactAlternatePhone} (alt)</span>
              </div>
            )}
            {form.contactWebsite && (
              <div className="flex items-center gap-2 text-gray-400">
                <Globe size={12} lg:size={14} className="text-myth-accent shrink-0" />
                <a
                  href={form.contactWebsite.startsWith('http') ? form.contactWebsite : `https://${form.contactWebsite}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-myth-accent hover:underline truncate"
                >
                  {form.contactWebsite}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Type, status & priority */}
      {(isLeadWorkflow || isDealWorkflow || isCustomerWorkflow) ? (
        <Section icon={Sparkles} title="Follow-up type & status" subtitle="How will you reach out?">
          <div>
            <FieldLabel>Follow-up type</FieldLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {FOLLOWUP_TYPES.map((t) => {
                const active = form.activityType === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => set('activityType', t.key)}
                    className={`group flex flex-col items-center gap-1.5 p-2 lg:p-3 rounded-xl border text-center transition-all duration-200 ${
                      active
                        ? 'border-myth-accent bg-myth-accent/15 shadow-glow scale-[1.02]'
                        : 'border-myth-border bg-myth-surface/50 text-gray-400 hover:border-myth-accent/40 hover:bg-myth-surface'
                    }`}
                  >
                    <span className="text-xl lg:text-2xl leading-none">{t.icon}</span>
                    <span className={`text-[10px] lg:text-xs font-medium leading-tight ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5">
            <div>
              <FieldLabel>Follow-up status</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((s) => {
                  const active = form.status === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => set('status', s.key)}
                      className={`px-2 lg:px-3 py-1.5 rounded-full text-[10px] lg:text-xs font-medium border transition-all ${
                        active
                          ? `${statusColors[s.key]} border-transparent ring-1 ring-white/10`
                          : 'border-myth-border text-gray-500 hover:border-myth-accent/40 hover:text-gray-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <FieldLabel>Priority</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {FOLLOWUP_PRIORITIES.map((p) => {
                  const active = form.priority === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => set('priority', p.key)}
                      className={`px-2 lg:px-3 py-1.5 rounded-full text-[10px] lg:text-xs font-medium border capitalize transition-all ${
                        active ? PRIORITY_ACTIVE[p.key] : PRIORITY_STYLES[p.key]
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>
      ) : (
        <Section icon={Sparkles} title="Activity details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <FieldLabel>Activity type</FieldLabel>
              <select className="input-field" value={form.activityType} onChange={(e) => set('activityType', e.target.value)}>
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Priority</FieldLabel>
              <select className="input-field" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {FOLLOWUP_PRIORITIES.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>
      )}

      {/* Lead status actions */}
      {isLeadWorkflow && form.lead && (
        <Section
          icon={Layers}
          title="Action by lead status"
          subtitle="Pick the pipeline stage, then choose what to do next"
          accent
        >
          <div className="flex flex-wrap gap-2">
            {LEAD_STATUS_FOLLOWUP_GROUPS.map((g) => {
              const active = form.leadStatus === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => handleLeadStatusChange(g.key)}
                  className={`inline-flex items-center gap-1.5 px-2 lg:px-3.5 py-2 rounded-full text-xs lg:text-sm font-medium border transition-all ${
                    active
                      ? 'border-myth-accent bg-myth-accent/15 text-white shadow-glow'
                      : 'border-myth-border bg-myth-surface/40 text-gray-400 hover:border-myth-accent/40 hover:text-gray-200'
                  }`}
                >
                  <span>{g.dot}</span>
                  {g.label}
                </button>
              );
            })}
          </div>

          <div>
            <FieldLabel>{leadStatusGroup.dot} {leadStatusGroup.label} — select action</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {leadStatusGroup.options.map((opt) => {
                const active = form.followUpOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleFollowUpOptionChange(opt.key)}
                    className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-myth-accent bg-myth-accent/10 text-white'
                        : 'border-myth-border bg-myth-surface/30 text-gray-400 hover:border-myth-accent/30 hover:text-gray-200'
                    }`}
                  >
                    <span className={`flex h-7 w-7 lg:h-8 lg:w-8 shrink-0 items-center justify-center rounded-lg text-xs lg:text-sm ${
                      active ? 'bg-myth-accent/20' : 'bg-myth-surface'
                    }`}>
                      {FOLLOWUP_TYPES.find((t) => t.key === opt.activityType)?.icon || '📝'}
                    </span>
                    <span className="text-xs lg:text-sm font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* Deal stage actions */}
      {isDealWorkflow && form.deal && (
        <Section
          icon={Layers}
          title="Action by deal stage"
          subtitle="Pick the deal stage, then choose the follow-up action"
          accent
        >
          <div className="flex flex-wrap gap-2">
            {DEAL_STAGE_FOLLOWUP_GROUPS.map((g) => {
              const active = form.dealStage === g.key;
              const style = getDealStageStyle(g.key);
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => handleDealStageChange(g.key)}
                  className={`inline-flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-full text-[10px] lg:text-xs font-medium border transition-all ${
                    active
                      ? `${style.color} border-myth-accent/50 ring-1 ring-myth-accent/30`
                      : 'border-myth-border bg-myth-surface/40 text-gray-400 hover:border-myth-accent/40 hover:text-gray-200'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          <div>
            <FieldLabel>{dealStageGroup.label} — follow-up action</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dealStageGroup.options.map((opt) => {
                const active = form.followUpOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleDealFollowUpOptionChange(opt.key)}
                    className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-myth-accent bg-myth-accent/10 text-white'
                        : 'border-myth-border bg-myth-surface/30 text-gray-400 hover:border-myth-accent/30 hover:text-gray-200'
                    }`}
                  >
                    <span className={`flex h-7 w-7 lg:h-8 lg:w-8 shrink-0 items-center justify-center rounded-lg text-xs lg:text-sm ${
                      active ? 'bg-myth-accent/20' : 'bg-myth-surface'
                    }`}>
                      {FOLLOWUP_TYPES.find((t) => t.key === opt.activityType)?.icon || '📝'}
                    </span>
                    <span className="text-xs lg:text-sm font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* Details */}
      <Section icon={FileText} title="Follow-up details" subtitle="Title, notes, and schedule">
        <div>
          <FieldLabel required>Title</FieldLabel>
          <input
            className="input-field"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={selectedType ? `e.g. ${selectedType.label} with ${form.contactName || 'contact'}` : 'e.g. Discovery call'}
            required
          />
        </div>

        <div>
          <FieldLabel>Notes</FieldLabel>
          <textarea
            className="input-field min-h-[110px] resize-y"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Add context, talking points, or details for this follow-up…"
          />
        </div>

        {isDealWorkflow && (
          <div>
            <FieldLabel>Follow-up outcome</FieldLabel>
            <select
              className="input-field"
              value={form.followUpOutcome}
              onChange={(e) => set('followUpOutcome', e.target.value)}
            >
              <option value="">Select outcome (optional)</option>
              {DEAL_FOLLOWUP_OUTCOMES.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          <div>
            <FieldLabel>Scheduled at</FieldLabel>
            <div className="relative">
              <Calendar size={14} lg:size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="datetime-local"
                className="input-field pl-10"
                value={form.scheduledAt}
                onChange={(e) => set('scheduledAt', e.target.value)}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Assigned to</FieldLabel>
            <div className="relative">
              <User size={14} lg:size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select
                className="input-field pl-10"
                value={form.assignedTo}
                onChange={(e) => set('assignedTo', e.target.value)}
              >
                <option value="">Current user</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Section>

      {/* Meeting fields */}
      {isMeeting && (
        <Section icon={Video} title="Meeting details" subtitle="Link, location, and duration">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <FieldLabel>Meeting link / location</FieldLabel>
              <input
                className="input-field"
                value={form.meetingLink}
                onChange={(e) => set('meetingLink', e.target.value)}
                placeholder="Zoom, Teams, or office address"
              />
            </div>
            <div>
              <FieldLabel>Duration (minutes)</FieldLabel>
              <div className="relative">
                <Clock size={14} lg:size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="number"
                  className="input-field pl-10"
                  min={15}
                  step={15}
                  value={form.duration}
                  onChange={(e) => set('duration', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Optional contact edit */}
      <div className="rounded-xl border border-myth-border bg-myth-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowContactEdit((v) => !v)}
          className="w-full flex items-center justify-between px-3 lg:px-5 py-3 lg:py-4 text-left hover:bg-myth-surface/30 transition-colors"
        >
          <div className="flex items-center gap-2 lg:gap-3">
            <span className="flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-lg bg-myth-surface border border-myth-border text-myth-accent">
              <Briefcase size={14} lg:size={16} />
            </span>
            <div>
              <p className="text-xs lg:text-sm font-medium text-white">Edit contact for this follow-up</p>
              <p className="text-[10px] lg:text-xs text-gray-500">Optional — override auto-filled lead contact</p>
            </div>
          </div>
          <ChevronDown
            size={14} lg:size={18}
            className={`text-gray-500 transition-transform duration-200 ${showContactEdit ? 'rotate-180' : ''}`}
          />
        </button>
        {showContactEdit && (
          <div className="px-3 lg:px-5 pb-3 lg:pb-5 pt-1 border-t border-myth-border animate-slide-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
              <input className="input-field" placeholder="Contact name" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
              <input className="input-field" placeholder="Job title" value={form.contactTitle} onChange={(e) => set('contactTitle', e.target.value)} />
              <input className="input-field" placeholder="Company" value={form.company} onChange={(e) => set('company', e.target.value)} />
              <input className="input-field" placeholder="Industry" value={form.contactIndustry} onChange={(e) => set('contactIndustry', e.target.value)} />
              <input className="input-field" type="email" placeholder="Email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
              <input className="input-field" placeholder="Phone" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
              <input className="input-field" placeholder="Alternate phone" value={form.contactAlternatePhone} onChange={(e) => set('contactAlternatePhone', e.target.value)} />
              <input className="input-field" placeholder="Website" value={form.contactWebsite} onChange={(e) => set('contactWebsite', e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 lg:gap-3 pt-2 pb-1">
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary min-w-[80px] lg:min-w-[100px]">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary min-w-[140px] lg:min-w-[160px]">
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
