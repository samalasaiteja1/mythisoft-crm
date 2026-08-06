/** Admin Deals menu — titles, subtitles, and assignment helpers */

export const ADMIN_DEAL_NAV = {
  all: {
    title: 'All Deals',
    subtitle: 'Full pipeline — create deals, assign Sales Executive, move stages to won or lost.',
  },
  assigned: {
    title: 'Assigned Deals',
    subtitle: 'Deals with a Sales Manager or Sales Executive — change assignment from the card dropdowns.',
  },
  unassigned: {
    title: 'Unassigned Deals',
    subtitle: 'No Sales Manager or Sales Executive — assign from the dropdowns on each card.',
  },
  won: {
    title: 'Won Deals',
    subtitle: 'Closed-won and converted-to-customer deals — revenue outcomes.',
  },
  lost: {
    title: 'Lost Deals',
    subtitle: 'Lost opportunities — review value, stage, and close dates.',
  },
  followups: {
    title: 'Deal Follow-ups',
    subtitle: 'Calls and meetings on assigned and pipeline deals.',
  },
};

export function formatDealOwnerName(user) {
  if (!user || typeof user === 'string') return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
}

export function getDealManagerName(deal) {
  if (deal?.assignedManager) return formatDealOwnerName(deal.assignedManager);
  if (deal?.lead?.assignedManager) return formatDealOwnerName(deal.lead.assignedManager);
  if (deal?.assignedTo?.reportsTo) return formatDealOwnerName(deal.assignedTo.reportsTo);
  return '';
}

export function dealHasManager(deal) {
  return Boolean(deal?.assignedManager?._id || deal?.assignedManager || getDealManagerName(deal));
}

export function dealHasOwner(deal) {
  return Boolean(deal?.assignedTo?._id || deal?.assignedTo);
}

export function getDealManagerId(deal) {
  return deal?.assignedManager?._id || deal?.assignedManager || '';
}

export function dealIsUnassigned(deal) {
  return !dealHasOwner(deal);
}

export function dealIsAssigned(deal) {
  return dealHasOwner(deal);
}

export function countDealsByAssignment(deals = []) {
  const counts = { total: deals.length, unassigned: 0, assigned: 0 };
  deals.forEach((d) => {
    if (dealIsUnassigned(d)) counts.unassigned += 1;
    else counts.assigned += 1;
  });
  return counts;
}
