import {
  Phone, Mail, MessageCircle, Video, FileText, CheckSquare, Building2, DollarSign,
} from 'lucide-react';
import { FOLLOWUP_TYPE_ICONS } from '../../constants/leadFollowups';
import { FOLLOW_UP_PATHS } from '../../constants/followUpPaths';

export const ACTIVITY_ICONS = {
  phone_call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: Video,
  video_call: Video,
  product_demo: Video,
  site_visit: Building2,
  send_brochure: FileText,
  quotation_discussion: DollarSign,
  general: CheckSquare,
  call: Phone,
  chat: MessageCircle,
  note: FileText,
  task: CheckSquare,
};

export const activityIcon = (type) => ACTIVITY_ICONS[type] || CheckSquare;
export const activityEmoji = (type) => FOLLOWUP_TYPE_ICONS[type] || '📝';

export const STAGE_COLORS = {
  lead: 'bg-blue-500/20 text-blue-400',
  deal: 'bg-purple-500/20 text-purple-400',
  customer: 'bg-teal-500/20 text-teal-400',
};

export const contactName = (item) => item.contactName
  || (item.lead ? `${item.lead.firstName} ${item.lead.lastName}` : '')
  || (item.customer ? `${item.customer.firstName} ${item.customer.lastName}` : '')
  || item.deal?.title
  || '—';

export const contactEmail = (item) => item.contactEmail || item.lead?.email || item.customer?.email || '';
export const contactPhone = (item) => item.contactPhone || item.contactAlternatePhone || item.lead?.phone || item.lead?.alternatePhone || item.customer?.phone || '';
export const contactAlternatePhone = (item) => item.contactAlternatePhone || item.lead?.alternatePhone || '';
export const contactWebsite = (item) => item.contactWebsite || item.lead?.website || '';
export const contactTitle = (item) => item.contactTitle || item.lead?.title || '';
export const companyName = (item) => item.company || item.lead?.company || item.customer?.companyName || item.customer?.company?.name || '';

const { lead: L, deal: D, customer: C, support: S } = FOLLOW_UP_PATHS;

function stagePaths(stage, pathSet) {
  if (pathSet === 'support') return S;
  if (stage === 'deal') return D;
  if (stage === 'customer') return C;
  return L;
}

export const recordLink = (item, stage, pathSet) => {
  const P = stagePaths(stage || item.workflowStage, pathSet);
  if (stage === 'lead' || item.workflowStage === 'lead') {
    if (item.lead?._id) return L.detail(item.virtual ? item.lead._id : item._id, { virtual: item.virtual });
    if (!item.virtual) return L.detail(item._id);
  }
  if (stage === 'deal' || item.workflowStage === 'deal') {
    if (item.deal?._id) return D.detail(item.virtual ? item.deal._id : item._id, { virtual: item.virtual });
    if (!item.virtual) return D.detail(item._id);
  }
  if (stage === 'customer' || item.workflowStage === 'customer') {
    if (item.customer?._id) return P.detail(item.virtual ? item.customer._id : item._id, { virtual: item.virtual });
    if (!item.virtual) return P.detail(item._id);
  }
  if (item.deal?._id) return `/deals/${item.deal._id}`;
  if (item.lead?._id) return `/leads/${item.lead._id}`;
  if (item.customer?._id) return `/customers/${item.customer._id}`;
  return null;
};

export const detailPath = (item, stage, pathSet) => {
  const s = stage || item.workflowStage;
  const P = stagePaths(s, pathSet);
  if (item.virtual && item.deal?._id && s === 'deal') {
    return D.detail(item.deal._id, { virtual: true });
  }
  if (item.virtual && item.customer?._id && s === 'customer') {
    return P.detail(item.customer._id, { virtual: true });
  }
  if (item.virtual && item.lead?._id) {
    return L.detail(item.lead._id, { virtual: true });
  }
  if (!item.virtual && item._id && !String(item._id).startsWith('deal-') && !String(item._id).startsWith('customer-') && !String(item._id).startsWith('lead-')) {
    if (s === 'lead') return L.detail(item._id);
    if (s === 'deal') return D.detail(item._id);
    if (s === 'customer') return P.detail(item._id);
  }
  return null;
};

export const editPath = (item, stage, pathSet) => {
  const P = stagePaths(stage || item.workflowStage, pathSet);
  if (item.virtual) {
    if (stage === 'deal' || item.workflowStage === 'deal') {
      return D.addWithDeal(item.deal?._id);
    }
    if (stage === 'customer' || item.workflowStage === 'customer') {
      return P.addWithCustomer(item.customer?._id);
    }
    return L.addWithLead(item.lead?._id);
  }
  const s = stage || item.workflowStage;
  if (s === 'lead') return L.edit(item._id);
  if (s === 'deal') return D.edit(item._id);
  if (s === 'customer') return P.edit(item._id);
  return L.edit(item._id);
};
