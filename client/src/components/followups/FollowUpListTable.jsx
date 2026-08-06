import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Mail, Video, CheckCircle2, Pencil, Trash2, Eye, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { followupsAPI, formatDate, formatDateTime } from '../../services/api';
import { ACTIVITY_TYPE_LABELS, WORKFLOW_STAGE_LABELS, FOLLOWUP_STATUS_LABELS_MAP, FOLLOWUP_OPTION_LABELS_MAP } from '../../constants/followups';
import {
  ACTIVITY_ICONS, STAGE_COLORS, contactName, contactEmail, contactPhone,
  companyName, contactTitle, contactAlternatePhone, contactWebsite,
  detailPath, editPath, activityEmoji,
} from './followUpHelpers';
import { FOLLOWUP_STATUS_COLORS } from '../../constants/leadFollowups';
import { DEAL_FOLLOWUP_STATUS_COLORS, DEAL_STAGE_LABELS } from '../../constants/dealFollowups';

export default function FollowUpListTable({
  items,
  stage,
  showStageColumn = false,
  showCreatedBy = false,
  pathSet,
  onRefresh,
  emptyMessage = 'No follow-ups found.',
}) {
  const [expanded, setExpanded] = useState(null);

  const completeItem = async (item) => {
    if (item.virtual) {
      window.location.href = editPath(item, stage);
      return;
    }
    try {
      await followupsAPI.complete(item._id, {});
      toast.success('Marked complete');
      onRefresh?.();
    } catch {
      toast.error('Failed to complete');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this follow-up?')) return;
    try {
      await followupsAPI.delete(id);
      toast.success('Deleted');
      onRefresh?.();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-header">Activity</th>
            <th className="table-header">Contact</th>
            {(stage === 'lead' || stage === 'deal' || stage === 'customer') && <th className="table-header">Status</th>}
            {showStageColumn && <th className="table-header">Stage</th>}
            <th className="table-header">Scheduled</th>
            <th className="table-header">Assigned</th>
            {showCreatedBy && <th className="table-header">Created By</th>}
            <th className="table-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={(showStageColumn ? 6 : 5) + ((stage === 'lead' || stage === 'deal' || stage === 'customer') ? 1 : 0) + (showCreatedBy ? 1 : 0)} className="table-cell text-center text-gray-500 py-10">
                {emptyMessage}
              </td>
            </tr>
          ) : items.map((item) => {
            const Icon = ACTIVITY_ICONS[item.activityType];
            const isExpanded = expanded === item._id;
            const href = detailPath(item, stage || item.workflowStage, pathSet);
            const deal = item.deal;
            const pr = deal?.projectRequirements;
            const statusKey = item.status === 'pending' ? 'scheduled' : item.status;
            const isDealItem = stage === 'deal' || item.workflowStage === 'deal';
            const isCustomerItem = stage === 'customer' || item.workflowStage === 'customer';
            const statusColor = isDealItem
              ? (DEAL_FOLLOWUP_STATUS_COLORS[statusKey] || 'bg-gray-500/20 text-gray-400')
              : (FOLLOWUP_STATUS_COLORS[statusKey] || 'bg-gray-500/20 text-gray-400');

            return (
              <Fragment key={item._id}>
                <tr className="border-t border-myth-border hover:bg-myth-surface/30">
                  <td className="table-cell">
                    <div className="flex items-start gap-2">
                      <span className="p-1.5 rounded-lg bg-myth-surface text-myth-accent">
                        {Icon ? <Icon size={14} /> : <span>{activityEmoji(item.activityType)}</span>}
                      </span>
                      <div>
                        <p className="font-medium text-white text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {ACTIVITY_TYPE_LABELS[item.activityType] || item.activityType}
                          {item.followUpOption && ` · ${FOLLOWUP_OPTION_LABELS_MAP[item.followUpOption] || ''}`}
                          {item.dealStage && isDealItem && ` · ${DEAL_STAGE_LABELS[item.dealStage] || ''}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm text-white">{contactName(item)}</p>
                    {contactTitle(item) && (
                      <p className="text-xs text-gray-500">{contactTitle(item)}</p>
                    )}
                    {companyName(item) && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Building2 size={10} /> {companyName(item)}
                      </p>
                    )}
                    <div className="flex flex-col gap-0.5 mt-1 text-xs text-gray-500">
                      {contactEmail(item) && <span>{contactEmail(item)}</span>}
                      {contactPhone(item) && <span>{contactPhone(item)}</span>}
                      {contactAlternatePhone(item) && contactAlternatePhone(item) !== contactPhone(item) && (
                        <span>Alt: {contactAlternatePhone(item)}</span>
                      )}
                      {contactWebsite(item) && <span>{contactWebsite(item)}</span>}
                    </div>
                    {item.lead?._id && (
                      <Link to={`/leads/${item.lead._id}`} className="text-xs text-myth-accent hover:underline mt-1 inline-block">
                        View lead profile
                      </Link>
                    )}
                    {item.deal?._id && (stage === 'deal' || item.workflowStage === 'deal') && (
                      <Link to={`/deals/${item.deal._id}`} className="text-xs text-myth-accent hover:underline mt-1 inline-block">
                        View deal · {item.deal.title}
                      </Link>
                    )}
                    {item.customer?._id && isCustomerItem && (
                      <Link to={`/customers/${item.customer._id}`} className="text-xs text-myth-accent hover:underline mt-1 inline-block">
                        View customer · {item.customer.firstName} {item.customer.lastName}
                      </Link>
                    )}
                    {item.virtual && (
                      <span className="text-xs text-amber-400/80 mt-1 inline-block">Awaiting first follow-up</span>
                    )}
                  </td>
                  {(stage === 'lead' || stage === 'deal' || stage === 'customer') && (
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                        {FOLLOWUP_STATUS_LABELS_MAP[statusKey] || statusKey}
                      </span>
                    </td>
                  )}
                  {showStageColumn && (
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full ${STAGE_COLORS[item.workflowStage]}`}>
                        {WORKFLOW_STAGE_LABELS[item.workflowStage]}
                      </span>
                    </td>
                  )}
                  <td className="table-cell text-sm">{formatDateTime(item.scheduledAt)}</td>
                  <td className="table-cell text-sm">
                    {item.assignedTo
                      ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}`
                      : <span className="text-gray-500">—</span>}
                  </td>
                  {showCreatedBy && (
                    <td className="table-cell text-sm">
                      {item.createdBy
                        ? `${item.createdBy.firstName} ${item.createdBy.lastName}`
                        : <span className="text-gray-500">—</span>}
                    </td>
                  )}
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      {href && (
                        <Link to={href} className="p-2 text-gray-400 hover:bg-myth-surface rounded-lg" title="Details">
                          <Eye size={14} />
                        </Link>
                      )}
                      {contactPhone(item) && (
                        <a href={`tel:${contactPhone(item)}`} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg"><Phone size={14} /></a>
                      )}
                      {contactEmail(item) && (
                        <a href={`mailto:${contactEmail(item)}`} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"><Mail size={14} /></a>
                      )}
                      {item.meetingLink && (
                        <a href={item.meetingLink} target="_blank" rel="noreferrer" className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-lg"><Video size={14} /></a>
                      )}
                      {!item.virtual && (
                        <Link to={editPath(item, stage || item.workflowStage, pathSet)} className="p-2 text-gray-400 hover:bg-myth-surface rounded-lg"><Pencil size={14} /></Link>
                      )}
                      {item.status !== 'completed' && item.status !== 'cancelled' && (
                        <button type="button" onClick={() => completeItem(item)} className="p-2 text-teal-400 hover:bg-teal-400/10 rounded-lg"><CheckCircle2 size={14} /></button>
                      )}
                      {!item.virtual && (
                        <button type="button" onClick={() => deleteItem(item._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-t border-myth-border bg-myth-surface/20">
                    <td colSpan={(showStageColumn ? 6 : 5) + ((stage === 'lead' || stage === 'deal') ? 1 : 0)} className="table-cell py-4">
                      <p className="text-gray-300 text-sm">{item.notes || 'No notes'}</p>
                      {deal && pr && (
                        <div className="mt-2 text-xs text-gray-400">
                          {pr.scope && <p>Scope: {pr.scope}</p>}
                          {(pr.startDate || pr.endDate) && <p>Timeline: {formatDate(pr.startDate)} – {formatDate(pr.endDate)}</p>}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
