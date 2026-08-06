/** Admin Leads menu — titles, subtitles, and assignment helpers */

export const ADMIN_LEAD_NAV = {
  all: {
    title: 'All Leads',
    subtitle: 'Full pipeline — create leads, assign Sales Manager, then Sales Executive. Monitor every stage.',
  },
  assigned: {
    title: 'Assigned Leads',
    subtitle: 'Has a Sales Manager and/or Sales Executive — manager only, sales only, or both.',
  },
  unsigned: {
    title: 'Unsigned Leads',
    subtitle: 'Fully unassigned — no Sales Manager and no Sales Executive.',
  },
  qualified: {
    title: 'Qualified Leads',
    subtitle: 'Sales-ready leads — review manager & executive, then convert to deal.',
  },
  followups: {
    title: 'Lead Follow-ups',
    subtitle: 'Calls and meetings on admin → manager → sales assigned leads.',
  },
  analytics: {
    title: 'Lead Analytics',
    subtitle: 'Assignment funnel, conversion by stage, and pipeline value for admin oversight.',
  },
};

/** Shared pipeline card assignment dropdown labels (leads + deals) */
export const ASSIGN_DROPDOWN_COPY = {
  managerDisplay: 'Manager',
  salesDisplay: 'Sales',
  assignManager: 'Assign manager',
  changeManager: 'Change manager',
  assignSales: 'Assign sales',
  changeSales: 'Change sales',
  changePerson: 'Change person',
  selectManager: 'Select manager',
  selectSales: 'Select sales executive',
  assignMgr: 'Assign mgr',
  changeMgr: 'Change mgr',
};

export function getAssignManagerFieldLabel(assignedOnly) {
  return assignedOnly ? ASSIGN_DROPDOWN_COPY.changeManager : ASSIGN_DROPDOWN_COPY.assignManager;
}

export function getAssignSalesFieldLabel(assignedOnly) {
  return assignedOnly ? ASSIGN_DROPDOWN_COPY.changeSales : ASSIGN_DROPDOWN_COPY.assignSales;
}

/** Bound values for assignment dropdowns — same fields as leads */
export function getAssignManagerSelectValue(record) {
  return String(record?.assignedManager?._id || record?.assignedManager || '');
}

export function getAssignSalesSelectValue(record) {
  return String(record?.assignedTo?._id || record?.assignedTo || '');
}

export function filterActiveSalesUsers(allUsers = []) {
  return (Array.isArray(allUsers) ? allUsers : []).filter(
    (u) => u.role === 'sales' && u.isActive !== false,
  );
}

export function salesOptionsForAssignee(record, salesUsers = []) {
  const managerId = record?.assignedManager?._id || record?.assignedManager;
  if (!managerId) return salesUsers;
  const filtered = salesUsers.filter(
    (u) => String(u.reportsTo?._id || u.reportsTo) === String(managerId),
  );
  return filtered.length ? filtered : salesUsers;
}

export function enrichAssignedRecord(merged, { managers = [], salesUsers = [] } = {}) {
  const result = { ...merged };
  if (leadHasManager(result) && !formatAssigneeName(result.assignedManager)) {
    const managerId = result.assignedManager._id || result.assignedManager;
    const mgr = managers.find((m) => String(m._id) === String(managerId));
    if (mgr) result.assignedManager = mgr;
  }
  if (leadHasExecutive(result) && !formatAssigneeName(result.assignedTo)) {
    const salesId = result.assignedTo._id || result.assignedTo;
    const exec = salesUsers.find((u) => String(u._id) === String(salesId));
    if (exec) result.assignedTo = exec;
  }
  return result;
}

export function formatAssigneeName(user) {
  if (!user || typeof user === 'string') return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
}

export function leadHasManager(lead) {
  return Boolean(lead?.assignedManager?._id || lead?.assignedManager);
}
export function leadHasExecutive(lead) {
  return Boolean(lead?.assignedTo?._id || lead?.assignedTo);
}

/** Admin “Assigned Leads” — manager assigned and/or sales executive assigned */
export function leadIsAssignedForAdmin(lead) {
  return leadHasManager(lead) || leadHasExecutive(lead);
}

/** Admin “Unsigned Leads” — no manager and no sales executive */
export function leadIsUnassignedForAdmin(lead) {
  return !leadHasManager(lead) && !leadHasExecutive(lead);
}

export function leadAssignmentState(lead) {
  const m = leadHasManager(lead);
  const s = leadHasExecutive(lead);
  if (!m && !s) return 'unassigned';
  if (m && s) return 'both';
  if (m) return 'manager_only';
  return 'sales_only';
}

export const ASSIGNMENT_STATE_LABELS = {
  unassigned: 'Unassigned',
  manager_only: 'Manager only',
  sales_only: 'Sales only',
  both: 'Manager + sales',
};

export function countLeadsByAssignment(leads = []) {
  const counts = {
    total: leads.length,
    unassigned: 0,
    manager_only: 0,
    sales_only: 0,
    both: 0,
    assigned: 0,
  };
  leads.forEach((l) => {
    const state = leadAssignmentState(l);
    counts[state] += 1;
    if (state !== 'unassigned') counts.assigned += 1;
  });
  return counts;
}
