/** Sales Customers menu — segments & hub views */

export const CUSTOMER_SEGMENTS = [
  { key: 'all', label: 'All Customers', path: '/customers/all' },
  { key: 'active', label: 'Active Customers', path: '/customers/active' },
  { key: 'inactive', label: 'Inactive Customers', path: '/customers/inactive' },
  { key: 'project', label: 'Project Customers', path: '/customers/project' },
  { key: 'vip', label: 'VIP Customers', path: '/customers/vip' },
];

export const CUSTOMER_ASSIGNMENT_SEGMENTS = [
  { key: 'tech-assigned', label: 'Tech Assigned', path: '/customers/tech-assigned' },
  { key: 'tech-unassigned', label: 'Tech Unassigned', path: '/customers/tech-unassigned' },
  { key: 'support-assigned', label: 'Support Assigned', path: '/customers/support-assigned' },
  { key: 'support-unassigned', label: 'Support Unassigned', path: '/customers/support-unassigned' },
];

/** Sidebar order: All → team assignment → status segments */
export const CUSTOMER_SIDEBAR_NAV = [
  CUSTOMER_SEGMENTS[0],
  ...CUSTOMER_ASSIGNMENT_SEGMENTS,
  ...CUSTOMER_SEGMENTS.slice(1),
];

export const CUSTOMER_HUB_VIEWS = [];

export const CUSTOMER_DETAIL_TABS = [
  'Overview',
  'Contact Details',
  'Projects',
  'Deals',
  'Orders',
  'Quotations',
  'Support Tickets',
  'Documents',
  'Notes',
  'Timeline',
  'Activity Log',
];

export const SEGMENT_TAB_MAP = {
  project: 'Projects',
  quotations: 'Quotations',
};

export const SEGMENT_LABELS = Object.fromEntries(
  [...CUSTOMER_SEGMENTS, ...CUSTOMER_ASSIGNMENT_SEGMENTS, ...CUSTOMER_HUB_VIEWS].map((s) => [s.key, s.label]),
);
