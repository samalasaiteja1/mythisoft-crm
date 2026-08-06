/** Quick links for Admin vs Sales Manager lead/deal follow-up guide panels */

export const LEAD_DEAL_GUIDE_ADMIN_LINKS = [
  { label: 'Unsigned leads', path: '/leads/unsigned', track: 'lead' },
  { label: 'Assigned leads', path: '/leads/assigned', track: 'lead' },
  { label: 'Lead follow-ups', path: '/leads/follow-ups', track: 'lead' },
  { label: 'Unassigned lead follow-ups', path: '/leads/follow-ups?assigned=false', track: 'lead' },
  { label: 'Unassigned deals', path: '/deals/unassigned', track: 'deal' },
  { label: 'Assigned deals', path: '/deals/assigned', track: 'deal' },
  { label: 'Deal follow-ups', path: '/deals/follow-ups', track: 'deal' },
  { label: "Today's follow-ups", path: '/follow-ups/today', track: 'all' },
];

export const LEAD_DEAL_GUIDE_MANAGER_LINKS = [
  { label: 'Unsigned leads', path: '/leads/unsigned', track: 'lead' },
  { label: 'Assign to sales', path: '/leads/assign', track: 'lead' },
  { label: 'Lead follow-ups', path: '/leads/follow-ups', track: 'lead' },
  { label: 'Team deals', path: '/teams/sales/deals', track: 'deal' },
  { label: 'Deal follow-ups', path: '/deals/follow-ups', track: 'deal' },
  { label: "Today's follow-ups", path: '/follow-ups/today', track: 'all' },
];

export const LEAD_DEAL_GUIDE_SALES_LINKS = [
  { label: 'My leads', path: '/leads', track: 'lead' },
  { label: 'Lead follow-ups', path: '/leads/follow-ups', track: 'lead' },
  { label: 'Add lead follow-up', path: '/leads/follow-ups/add', track: 'lead' },
  { label: 'My deals', path: '/deals', track: 'deal' },
  { label: 'Deal follow-ups', path: '/deals/follow-ups', track: 'deal' },
  { label: "Today's follow-ups", path: '/follow-ups/today', track: 'all' },
];

export const LEAD_DEAL_GUIDE_TIMELINE = [
  'Create lead',
  'Assign manager',
  'Assign sales',
  'Lead follow-ups',
  'Qualified',
  'Convert to deal',
  'Deal follow-ups',
  'Won',
  'Customer',
];
