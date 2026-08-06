/** Follow-up URL paths — leads/deals/customers under their modules; all types unified at /follow-ups */

const ALL = '/follow-ups';
const LEAD = '/leads/follow-ups';
const DEAL = '/deals/follow-ups';
const CUSTOMER = '/customers/follow-ups';

export const FOLLOW_UP_PATHS = {
  all: {
    root: ALL,
    today: `${ALL}/today`,
    upcoming: `${ALL}/upcoming`,
    overdue: `${ALL}/overdue`,
    completed: `${ALL}/completed`,
    calendar: `${ALL}/calendar`,
    reports: `${ALL}/reports`,
  },
  lead: {
    list: LEAD,
    assigned: `${LEAD}?assigned=true`,
    unassigned: `${LEAD}?assigned=false`,
    add: `${LEAD}/add`,
    history: `${LEAD}/history`,
    detail: (id, { virtual } = {}) => `${LEAD}/${id}${virtual ? '?virtual=1' : ''}`,
    edit: (id) => `${LEAD}/${id}/edit`,
    addWithLead: (leadId) => `${LEAD}/add?leadId=${leadId}`,
  },
  deal: {
    list: DEAL,
    assigned: `${DEAL}?assigned=true`,
    unassigned: `${DEAL}?assigned=false`,
    overdue: `${DEAL}/overdue`,
    add: `${DEAL}/add`,
    history: `${DEAL}/history`,
    detail: (id, { virtual } = {}) => `${DEAL}/${id}${virtual ? '?virtual=1' : ''}`,
    edit: (id) => `${DEAL}/${id}/edit`,
    addWithDeal: (dealId) => `${DEAL}/add?dealId=${dealId}`,
  },
  customer: {
    list: CUSTOMER,
    add: `${CUSTOMER}/add`,
    history: `${CUSTOMER}/history`,
    detail: (id, { virtual } = {}) => `${CUSTOMER}/${id}${virtual ? '?virtual=1' : ''}`,
    edit: (id) => `${CUSTOMER}/${id}/edit`,
    addWithCustomer: (customerId) => `${CUSTOMER}/add?customerId=${customerId}`,
  },
  support: {
    list: '/support/follow-ups',
    today: '/support/follow-ups/today',
    upcoming: '/support/follow-ups/upcoming',
    overdue: '/support/follow-ups/overdue',
    completed: '/support/follow-ups/completed',
    history: '/support/follow-ups/history',
    add: '/support/follow-ups/add',
    detail: (id, { virtual } = {}) => `/support/follow-ups/${id}${virtual ? '?virtual=1' : ''}`,
    edit: (id) => `/support/follow-ups/${id}/edit`,
    addWithCustomer: (customerId) => `/support/follow-ups/add?customerId=${customerId}`,
  },
};

export const LEGACY_FOLLOW_UP_PREFIX = {
  lead: '/follow-ups/lead',
  deal: '/follow-ups/deal',
  customer: '/follow-ups/customer',
};
