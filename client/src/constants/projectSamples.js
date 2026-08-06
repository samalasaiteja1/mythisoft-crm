/** MythiSoft CRM — sample values for placeholders, demos, and help text */

export const MYTHISOFT = {
  name: 'MYTHISOFT INNOVATION PRIVATE LIMITED',
  shortName: 'MythiSoft',
  tagline: 'Innovating Today, Empowering Tomorrow',
  email: 'info@mythisoft.com',
  supportEmail: 'support@mythisoft.com',
  phone: '+91 40 4567 8900',
  website: 'https://mythisoft.com',
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
  currency: 'INR',
};

export const DEMO_LOGINS = {
  admin: { email: 'admin@mythisoft.com', password: 'admin123', label: 'Admin Mythisoft' },
  salesManager: { email: 'manager@mythisoft.com', password: 'manager123', label: 'Priya Sharma (Sales Manager)' },
  salesExecutive: { email: 'rajesh@mythisoft.com', password: 'sales123', label: 'Rajesh Kumar (Sales Executive)' },
  techManager: { email: 'tech.manager@mythisoft.com', password: 'manager123', label: 'Vikram Nair (Tech Manager)' },
  support: { email: 'support@mythisoft.com', password: 'support123', label: 'Anil Reddy (Support)' },
  customer: { email: 'customer@mythisoft.com', password: 'customer123', label: 'Customer Portal' },
};

export const PLACEHOLDERS = {
  phone: '+91 98765 43210',
  employeeId: 'EMP-203',
  lead: {
    firstName: 'Amit',
    lastName: 'Sharma',
    email: 'amit.sharma@techcorp.in',
    phone: '+91 98765 43210',
    company: 'TechCorp India',
    title: 'CTO',
    industry: 'IT Services & Software',
    website: 'https://techcorp.in',
    interestedService: 'Custom CRM Development',
    description: 'Needs CRM for sales pipeline, lead tracking, and customer portal.',
  },
  customer: {
    firstName: 'Sanjay',
    lastName: 'Gupta',
    email: 'sanjay@technova.com',
    phone: '+91 98765 00101',
    company: 'TechNova Solutions',
    title: 'CEO',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    zipCode: '500032',
  },
  hireManager: {
    employeeId: 'EMP-100',
    fullName: 'Priya Sharma',
    email: 'manager@mythisoft.com',
    phone: '+91 90000 00100',
  },
  hireEmployee: {
    firstName: 'Rajesh',
    lastName: 'Kumar',
    personalEmail: 'rajesh.kumar@personal.com',
    phone: '+91 98765 43210',
    employeeId: 'EMP-200',
    primarySkill: 'B2B Sales',
    workLocation: 'Hyderabad Office',
  },
  jobRole: 'Senior Sales Executive',
  teamName: 'Sales Team Alpha',
  projectTech: 'React, Node.js, MongoDB',
};

/** Lead assignment workflow — matches seed data LD-00001–LD-00006 */
export const LEAD_ASSIGNMENT_EXAMPLES = [
  {
    id: 'unassigned',
    label: 'Unassigned',
    lead: 'LD-00001 — Amit Sharma (TechCorp India)',
    salesManager: '—',
    salesExecutive: '—',
    note: 'Admin creates lead → assign Sales Manager later',
  },
  {
    id: 'manager_only',
    label: 'With Sales Manager',
    lead: 'LD-00004 — Ananya Reddy (BankTech Solutions)',
    salesManager: 'Priya Sharma',
    salesExecutive: '—',
    note: 'Admin assigned manager → manager assigns executive',
  },
  {
    id: 'fully_assigned',
    label: 'Manager + Executive',
    lead: 'LD-00003 — Vikram Singh (Swift Logistics)',
    salesManager: 'Priya Sharma',
    salesExecutive: 'Rajesh Kumar',
    note: 'Sales executive works the lead (calls, follow-ups, deals)',
  },
];

export const LEAD_WORKFLOW_STEPS = [
  'Admin creates lead',
  'Assign to Sales Manager (Priya Sharma)',
  'Manager assigns to Sales Executive (Rajesh / Meera / Arun)',
  'Executive: follow-up → qualify → deal → customer',
];
