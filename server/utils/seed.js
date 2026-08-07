import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Customer from '../models/Customer.js';
import Company from '../models/Company.js';
import Contact from '../models/Contact.js';
import Deal from '../models/Deal.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import Settings from '../models/Settings.js';
import Team from '../models/Team.js';
import Department from '../models/Department.js';
import Quotation from '../models/Quotation.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import SupportTicket from '../models/SupportTicket.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Meeting from '../models/Meeting.js';
import Expense from '../models/Expense.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Subscription from '../models/Subscription.js';
import Document from '../models/Document.js';
import WhatsAppMessage from '../models/WhatsAppMessage.js';
import ProjectCategory from '../models/ProjectCategory.js';
import StaffRole from '../models/StaffRole.js';

dotenv.config();
await connectDB();

await Promise.all([
  User.deleteMany(),
  Lead.deleteMany(),
  Customer.deleteMany(),
  Company.deleteMany(),
  Contact.deleteMany(),
  Deal.deleteMany(),
  Task.deleteMany(),
  Activity.deleteMany(),
  Settings.deleteMany(),
  Team.deleteMany(),
  Department.deleteMany(),
  Quotation.deleteMany(),
  Project.deleteMany(),
  Milestone.deleteMany(),
  SupportTicket.deleteMany(),
  Invoice.deleteMany(),
  Payment.deleteMany(),
  Meeting.deleteMany(),
  Expense.deleteMany(),
  Attendance.deleteMany(),
  Leave.deleteMany(),
  Subscription.deleteMany(),
  Document.deleteMany(),
  WhatsAppMessage.deleteMany(),
  ProjectCategory.deleteMany(),
  StaffRole.deleteMany(),
]);

// ─── 1. Admin ───────────────────────────────────────────────────────────────
const admin = await User.create({
  firstName: 'Admin',
  lastName: 'Mythisoft',
  email: 'admin@mythisoft.com',
  password: 'admin123',
  phone: '+91 9000000001',
  role: 'admin',
  employeeId: 'EMP-001',
  departmentName: 'Management',
});

// ─── 2. Teams (Settings → Teams / StaffRole) ────────────────────────────────
const staffRoles = await StaffRole.insertMany([
  { code: 'Msale', name: 'Sales Managers', teamGroup: 'manager', department: 'sales', description: 'Sales department heads (Msale)', status: 'active', createdBy: admin._id },
  { code: 'MT', name: 'Technical Managers', teamGroup: 'manager', department: 'technical', description: 'Technical department heads (MT)', status: 'active', createdBy: admin._id },
  { code: 'SM', name: 'Support Managers', teamGroup: 'manager', department: 'support', description: 'Support department heads (SM)', status: 'active', createdBy: admin._id },
  { code: 'sale100', name: 'Sales Team Alpha', teamGroup: 'sales', description: 'Primary sales work team', status: 'active', createdBy: admin._id },
  { code: 'sale101', name: 'Sales Team Beta', teamGroup: 'sales', description: 'Secondary sales work team', status: 'active', createdBy: admin._id },
  { code: 'tech1000', name: 'Dev Team Alpha', teamGroup: 'technical', description: 'Primary development team', status: 'active', createdBy: admin._id },
  { code: 'tech1001', name: 'Dev Team Beta', teamGroup: 'technical', description: 'Secondary development team', status: 'active', createdBy: admin._id },
  { code: 'support500', name: 'Support Executives', teamGroup: 'support', description: 'Customer-facing support executives', status: 'active', createdBy: admin._id },
  { code: 'support501', name: 'Technical Support Engineers', teamGroup: 'support', description: 'Deployment and technical handoff', status: 'active', createdBy: admin._id },
]);
const team = Object.fromEntries(staffRoles.map((r) => [r.code, r]));

// ─── 3. Employees ───────────────────────────────────────────────────────────
const salesManager = await User.create({
  firstName: 'Priya',
  lastName: 'Sharma',
  email: 'manager@mythisoft.com',
  password: 'manager123',
  phone: '+91 9000000100',
  role: 'manager',
  employeeId: 'EMP-100',
  departmentName: 'Sales',
  staffRole: team.Msale._id,
});

const techManager = await User.create({
  firstName: 'Vikram',
  lastName: 'Nair',
  email: 'tech.manager@mythisoft.com',
  password: 'manager123',
  phone: '+91 9000000101',
  role: 'manager',
  employeeId: 'EMP-101',
  departmentName: 'Technical',
  staffRole: team.MT._id,
});

const supportManager = await User.create({
  firstName: 'Sunita',
  lastName: 'Patel',
  email: 'support.manager@mythisoft.com',
  password: 'manager123',
  phone: '+91 9000000102',
  role: 'manager',
  employeeId: 'EMP-102',
  departmentName: 'Support',
  staffRole: team.SM._id,
});

const meeraSales = await User.create({
  firstName: 'Meera',
  lastName: 'Das',
  email: 'meera.sales@mythisoft.com',
  password: 'sales123',
  phone: '+91 9000000201',
  role: 'sales',
  employeeId: 'EMP-201',
  departmentName: 'Sales',
  staffRole: team.sale100._id,
  reportsTo: salesManager._id,
});

const salesUser = await User.create({
  firstName: 'Rajesh',
  lastName: 'Kumar',
  email: 'rajesh@mythisoft.com',
  password: 'sales123',
  phone: '+91 9000000200',
  role: 'sales',
  employeeId: 'EMP-200',
  departmentName: 'Sales',
  staffRole: team.sale100._id,
  reportsTo: salesManager._id,
});

const arunSales = await User.create({
  firstName: 'Arun',
  lastName: 'Singh',
  email: 'arun.sales@mythisoft.com',
  password: 'sales123',
  phone: '+91 9000000202',
  role: 'sales',
  employeeId: 'EMP-202',
  departmentName: 'Sales',
  staffRole: team.sale101._id,
  reportsTo: salesManager._id,
});

const technicalUser = await User.create({
  firstName: 'Kiran',
  lastName: 'Rao',
  email: 'technical@mythisoft.com',
  password: 'tech123',
  phone: '+91 9000001000',
  role: 'technical',
  employeeId: 'EMP-1000',
  departmentName: 'Technical',
  staffRole: team.tech1000._id,
  reportsTo: techManager._id,
});

const deepakTech = await User.create({
  firstName: 'Deepak',
  lastName: 'Verma',
  email: 'deepak.tech@mythisoft.com',
  password: 'tech123',
  phone: '+91 9000001001',
  role: 'technical',
  employeeId: 'EMP-1001',
  departmentName: 'Technical',
  staffRole: team.tech1000._id,
  reportsTo: techManager._id,
});

const rohitTech = await User.create({
  firstName: 'Rohit',
  lastName: 'Menon',
  email: 'rohit.tech@mythisoft.com',
  password: 'tech123',
  phone: '+91 9000001002',
  role: 'technical',
  employeeId: 'EMP-1002',
  departmentName: 'Technical',
  staffRole: team.tech1001._id,
  reportsTo: techManager._id,
});

const supportUser = await User.create({
  firstName: 'Anil',
  lastName: 'Reddy',
  email: 'support@mythisoft.com',
  password: 'support123',
  phone: '+91 9000000500',
  role: 'support',
  employeeId: 'EMP-500',
  departmentName: 'Support',
  staffRole: team.support500._id,
  reportsTo: supportManager._id,
});

const kavitaSupport = await User.create({
  firstName: 'Kavita',
  lastName: 'Rao',
  email: 'kavita.support@mythisoft.com',
  password: 'support123',
  phone: '+91 9000000501',
  role: 'support',
  employeeId: 'EMP-501',
  departmentName: 'Support',
  staffRole: team.support500._id,
  reportsTo: supportManager._id,
});

const rahulTechSupport = await User.create({
  firstName: 'Rahul',
  lastName: 'Menon',
  email: 'tech.support@mythisoft.com',
  password: 'support123',
  phone: '+91 9000000502',
  role: 'support',
  employeeId: 'EMP-502',
  departmentName: 'Support',
  staffRole: team.support501._id,
  reportsTo: supportManager._id,
  hrProfile: { designation: 'Technical Support Engineer' },
});

// Team leads on role teams
await StaffRole.findByIdAndUpdate(team.sale100._id, { teamLeader: meeraSales._id });
await StaffRole.findByIdAndUpdate(team.tech1000._id, { teamLeader: technicalUser._id });
await StaffRole.findByIdAndUpdate(team.support500._id, { teamLeader: supportUser._id });

const managerUser = salesManager;

await ProjectCategory.insertMany([
  { name: 'Website Development', code: 'WEB', status: 'active', createdBy: admin._id },
  { name: 'CRM Development', code: 'CRM', status: 'active', createdBy: admin._id },
  { name: 'ERP System', code: 'ERP', status: 'active', createdBy: admin._id },
  { name: 'Mobile App', code: 'APP', status: 'active', createdBy: admin._id },
  { name: 'E-commerce', code: 'ECOM', status: 'active', createdBy: admin._id },
  { name: 'UI/UX Design', code: 'UIUX', status: 'active', createdBy: admin._id },
  { name: 'API Development', code: 'API', status: 'active', createdBy: admin._id },
  { name: 'Maintenance', code: 'MAINT', status: 'active', createdBy: admin._id },
]);

const departments = await Department.insertMany([
  { name: 'Sales', description: 'Sales and business development', manager: salesManager._id, createdBy: admin._id },
  { name: 'Technical', description: 'Engineering and technical operations', manager: techManager._id, createdBy: admin._id },
  { name: 'Support', description: 'Customer support team', manager: supportManager._id, createdBy: admin._id },
  { name: 'Finance', description: 'Accounting and finance', manager: admin._id, createdBy: admin._id },
]);

const salesTeamLegacy = await Team.create({
  name: 'Sales Team',
  department: departments[0]._id,
  description: 'Sales managers and executives',
  leader: salesManager._id,
  members: [salesManager._id, meeraSales._id, salesUser._id, arunSales._id],
  status: 'active',
});

const technicalTeamLegacy = await Team.create({
  name: 'Technical Team',
  department: departments[1]._id,
  description: 'Developers and technical staff',
  leader: technicalUser._id,
  members: [technicalUser._id, deepakTech._id, rohitTech._id],
  status: 'active',
});

const supportTeamLegacy = await Team.create({
  name: 'Support Team',
  department: departments[2]._id,
  description: 'Customer support agents',
  leader: supportUser._id,
  members: [supportUser._id, kavitaSupport._id],
  status: 'active',
});

for (const u of [salesManager, meeraSales, salesUser, arunSales]) {
  u.team = salesTeamLegacy._id;
  await u.save();
}
for (const u of [technicalUser, deepakTech, rohitTech]) {
  u.team = technicalTeamLegacy._id;
  await u.save();
}
for (const u of [supportUser, kavitaSupport]) {
  u.team = supportTeamLegacy._id;
  await u.save();
}

const companies = await Company.insertMany([
  { name: 'TechNova Solutions', industry: 'Manufacturing', website: 'https://technova.com', email: 'contact@technova.com', phone: '+91 9876543210', employeeCount: '500-1000', annualRevenue: 50000000, createdBy: admin._id, assignedTo: salesUser._id },
  { name: 'HealthCare Plus', industry: 'Healthcare', website: 'https://healthcareplus.in', email: 'info@healthcareplus.in', phone: '+91 9876543211', employeeCount: '100-500', annualRevenue: 25000000, createdBy: admin._id, assignedTo: meeraSales._id },
  { name: 'EduSmart Academy', industry: 'Education', website: 'https://edusmart.edu', email: 'hello@edusmart.edu', phone: '+91 9876543212', employeeCount: '50-100', annualRevenue: 10000000, createdBy: admin._id, assignedTo: arunSales._id },
  { name: 'RetailMax Corp', industry: 'Retail & E-commerce', website: 'https://retailmax.com', email: 'sales@retailmax.com', phone: '+91 9876543213', employeeCount: '1000+', annualRevenue: 100000000, createdBy: admin._id, assignedTo: salesUser._id },
]);

await Subscription.insertMany([
  { company: companies[0]._id, plan: 'enterprise', status: 'active', seats: 50, monthlyPrice: 75000, createdBy: admin._id },
  { company: companies[1]._id, plan: 'professional', status: 'active', seats: 25, monthlyPrice: 35000, createdBy: admin._id },
  { company: companies[2]._id, plan: 'starter', status: 'trial', seats: 10, monthlyPrice: 15000, createdBy: admin._id },
  { company: companies[3]._id, plan: 'enterprise', status: 'active', seats: 100, monthlyPrice: 120000, createdBy: admin._id },
]);

const leads = await Lead.insertMany([
  {
    leadNumber: 'LD-00001',
    firstName: 'Amit',
    lastName: 'Sharma',
    email: 'amit@techcorp.in',
    phone: '+91 9988776655',
    company: 'TechCorp India',
    title: 'CTO',
    industry: 'IT Services',
    source: 'website',
    status: 'new',
    interestedService: 'Custom CRM Development',
    score: 75,
    value: 500000,
    createdBy: admin._id,
  },
  {
    leadNumber: 'LD-00002',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya@medlife.com',
    phone: '+91 9988776656',
    company: 'MedLife Systems',
    title: 'Director',
    source: 'referral',
    status: 'contacted',
    score: 60,
    value: 350000,
    assignedManager: salesManager._id,
    createdBy: admin._id,
  },
  {
    leadNumber: 'LD-00003',
    firstName: 'Vikram',
    lastName: 'Singh',
    email: 'vikram@logistics.co',
    phone: '+91 9988776657',
    company: 'Swift Logistics',
    title: 'VP Operations',
    source: 'event',
    status: 'interested',
    workflowStage: 'interested',
    score: 85,
    value: 750000,
    assignedManager: salesManager._id,
    assignedTo: salesUser._id,
    createdBy: admin._id,
  },
  {
    leadNumber: 'LD-00004',
    firstName: 'Ananya',
    lastName: 'Reddy',
    email: 'ananya@banktech.com',
    phone: '+91 9988776658',
    company: 'BankTech Solutions',
    title: 'Head of IT',
    source: 'cold_call',
    status: 'contacted',
    score: 45,
    value: 200000,
    assignedManager: salesManager._id,
    createdBy: admin._id,
  },
  {
    leadNumber: 'LD-00005',
    firstName: 'Rahul',
    lastName: 'Mehta',
    email: 'rahul@startup.io',
    phone: '+91 9988776659',
    company: 'StartupIO',
    title: 'CEO',
    source: 'social',
    status: 'contacted',
    score: 90,
    value: 1000000,
    assignedManager: salesManager._id,
    assignedTo: meeraSales._id,
    createdBy: admin._id,
  },
  {
    leadNumber: 'LD-00006',
    firstName: 'Lakshmi',
    lastName: 'Iyer',
    email: 'lakshmi@fintech.in',
    phone: '+91 9988776660',
    company: 'FinTech Hub',
    title: 'CFO',
    source: 'website',
    status: 'contacted',
    score: 55,
    value: 420000,
    assignedManager: salesManager._id,
    assignedTo: arunSales._id,
    createdBy: salesManager._id,
  },
]);

const customers = await Customer.insertMany([
  { firstName: 'Sanjay', lastName: 'Gupta', email: 'sanjay@technova.com', phone: '+91 9876500001', company: companies[0]._id, title: 'CEO', status: 'vip', lifetimeValue: 2500000, assignedTo: salesUser._id, createdBy: admin._id },
  { firstName: 'Meera', lastName: 'Iyer', email: 'meera@healthcareplus.in', phone: '+91 9876500002', company: companies[1]._id, title: 'COO', status: 'active', lifetimeValue: 1200000, assignedTo: meeraSales._id, createdBy: admin._id },
  { firstName: 'Arjun', lastName: 'Nair', email: 'arjun@edusmart.edu', phone: '+91 9876500003', company: companies[2]._id, title: 'Principal', status: 'active', lifetimeValue: 800000, assignedTo: arunSales._id, createdBy: admin._id },
]);

const customerPortalUsers = await Promise.all([
  User.create({
    firstName: 'Sanjay',
    lastName: 'Gupta',
    email: 'customer@mythisoft.com',
    password: 'customer123',
    phone: '+91 9876500001',
    role: 'customer',
    customerRef: customers[0]._id,
  }),
  User.create({
    firstName: 'Meera',
    lastName: 'Iyer',
    email: 'meera.customer@mythisoft.com',
    password: 'customer123',
    phone: '+91 9876500002',
    role: 'customer',
    customerRef: customers[1]._id,
  }),
  User.create({
    firstName: 'Arjun',
    lastName: 'Nair',
    email: 'arjun.customer@mythisoft.com',
    password: 'customer123',
    phone: '+91 9876500003',
    role: 'customer',
    customerRef: customers[2]._id,
  }),
]);
await Customer.findByIdAndUpdate(customers[0]._id, { portalUser: customerPortalUsers[0]._id, supportAssignee: supportUser._id });
await Customer.findByIdAndUpdate(customers[1]._id, { portalUser: customerPortalUsers[1]._id, supportAssignee: supportUser._id });
await Customer.findByIdAndUpdate(customers[2]._id, { portalUser: customerPortalUsers[2]._id, supportAssignee: supportUser._id });

await Lead.insertMany([
  {
    leadNumber: 'LD-00007',
    firstName: 'Sanjay',
    lastName: 'Gupta',
    email: 'sanjay@technova.com',
    phone: '+91 9876500001',
    company: 'TechNova Solutions',
    title: 'CEO',
    source: 'website',
    status: 'contacted',
    workflowStage: 'qualified',
    score: 78,
    value: 300000,
    assignedManager: salesManager._id,
    assignedTo: salesUser._id,
    createdBy: admin._id,
    portalUser: customerPortalUsers[0]._id,
  },
  {
    leadNumber: 'LD-00008',
    firstName: 'Meera',
    lastName: 'Iyer',
    email: 'meera@healthcareplus.in',
    phone: '+91 9876500002',
    company: 'HealthCare Plus',
    title: 'COO',
    source: 'email',
    status: 'proposal_sent',
    workflowStage: 'quotation_sent',
    score: 82,
    value: 450000,
    assignedManager: salesManager._id,
    assignedTo: meeraSales._id,
    createdBy: salesManager._id,
    portalUser: customerPortalUsers[1]._id,
  },
  {
    leadNumber: 'LD-00009',
    firstName: 'Arjun',
    lastName: 'Nair',
    email: 'arjun@edusmart.edu',
    phone: '+91 9876500003',
    company: 'EduSmart Academy',
    title: 'Principal',
    source: 'referral',
    status: 'interested',
    workflowStage: 'qualified',
    score: 70,
    value: 250000,
    assignedManager: salesManager._id,
    assignedTo: arunSales._id,
    createdBy: admin._id,
    portalUser: customerPortalUsers[2]._id,
  },
]);

await Deal.create({
  title: 'HealthCare Plus Support Plan',
  value: 1200000,
  currency: 'INR',
  stage: 'proposal_sent',
  probability: 55,
  expectedCloseDate: new Date('2026-10-01'),
  customer: customers[1]._id,
  company: companies[1]._id,
  assignedManager: salesManager._id,
  assignedTo: meeraSales._id,
  createdBy: salesManager._id,
  portalUser: customerPortalUsers[1]._id,
});

await Deal.create({
  title: 'EduSmart Support Renewal',
  value: 800000,
  currency: 'INR',
  stage: 'requirement_gathering',
  probability: 40,
  expectedCloseDate: new Date('2026-11-15'),
  customer: customers[2]._id,
  company: companies[2]._id,
  assignedManager: salesManager._id,
  assignedTo: arunSales._id,
  createdBy: admin._id,
  portalUser: customerPortalUsers[2]._id,
});

await Contact.insertMany([
  { firstName: 'Deepak', lastName: 'Contact', email: 'deepak@technova.com', phone: '+91 9876510001', title: 'IT Manager', company: companies[0]._id, customer: customers[0]._id, isPrimary: true, assignedTo: salesUser._id, createdBy: admin._id },
  { firstName: 'Kavita', lastName: 'Desai', email: 'kavita@healthcareplus.in', phone: '+91 9876510002', title: 'Procurement Head', company: companies[1]._id, customer: customers[1]._id, isPrimary: true, assignedTo: meeraSales._id, createdBy: admin._id },
]);

await Deal.insertMany([
  { title: 'ERP Implementation - TechNova', value: 2500000, stage: 'negotiation', probability: 65, expectedCloseDate: new Date('2026-08-15'), customer: customers[0]._id, company: companies[0]._id, assignedTo: salesUser._id, createdBy: admin._id },
  { title: 'CRM Suite - HealthCare Plus', value: 1200000, stage: 'proposal_sent', probability: 40, expectedCloseDate: new Date('2026-07-30'), customer: customers[1]._id, company: companies[1]._id, assignedTo: meeraSales._id, createdBy: admin._id },
  { title: 'LMS Platform - EduSmart', value: 800000, stage: 'requirement_gathering', probability: 25, expectedCloseDate: new Date('2026-09-01'), customer: customers[2]._id, company: companies[2]._id, assignedTo: arunSales._id, createdBy: admin._id },
  { title: 'IoT Solution - RetailMax', value: 3500000, stage: 'discovery', probability: 15, expectedCloseDate: new Date('2026-10-15'), company: companies[3]._id, assignedTo: salesUser._id, createdBy: admin._id },
  { title: 'AI Analytics - BankTech', value: 1800000, stage: 'converted_to_customer', probability: 100, expectedCloseDate: new Date('2026-06-01'), actualCloseDate: new Date('2026-06-15'), assignedTo: meeraSales._id, createdBy: admin._id },
]);

await Task.insertMany([
  { title: 'Follow up with Amit Sharma', description: 'Discuss CRM requirements', priority: 'high', status: 'pending', dueDate: new Date('2026-08-28'), assignedTo: salesUser._id, createdBy: salesManager._id, relatedTo: { type: 'lead', id: leads[0]._id } },
  { title: 'Prepare proposal for HealthCare Plus', priority: 'urgent', status: 'in_progress', dueDate: new Date('2026-08-29'), assignedTo: meeraSales._id, createdBy: salesManager._id },
  { title: 'Demo call with Vikram Singh', priority: 'medium', status: 'pending', dueDate: new Date('2026-09-01'), assignedTo: salesUser._id, createdBy: salesManager._id, relatedTo: { type: 'lead', id: leads[2]._id } },
  { title: 'Cold outreach - BankTech', priority: 'medium', status: 'pending', dueDate: new Date('2026-08-30'), assignedTo: arunSales._id, createdBy: salesManager._id, relatedTo: { type: 'lead', id: leads[3]._id } },
  { title: 'Respond to TK-00002 ticket', priority: 'high', status: 'pending', dueDate: new Date('2026-08-19'), assignedTo: kavitaSupport._id, createdBy: supportManager._id },
  { title: 'Update knowledge base - login FAQ', priority: 'low', status: 'completed', dueDate: new Date('2026-08-10'), assignedTo: supportUser._id, createdBy: supportManager._id },
  { title: 'Quarterly business review', priority: 'low', status: 'completed', dueDate: new Date('2026-08-05'), assignedTo: admin._id, createdBy: admin._id },
]);

await Activity.insertMany([
  { type: 'lead', title: 'New lead from website', user: salesUser._id, relatedTo: { type: 'lead', id: leads[0]._id } },
  { type: 'deal', title: 'Deal moved to negotiation', user: salesUser._id, relatedTo: { type: 'deal', id: (await Deal.findOne({ title: 'ERP Implementation - TechNova' }))._id } },
  { type: 'customer', title: 'Customer profile updated', user: admin._id, relatedTo: { type: 'customer', id: customers[0]._id } },
  { type: 'call', title: 'Discovery call completed', description: 'Discussed requirements and timeline', user: meeraSales._id },
  { type: 'email', title: 'Proposal sent to HealthCare Plus', user: meeraSales._id },
  { type: 'task', title: 'Bug fix deployed to staging', user: deepakTech._id },
  { type: 'ticket', title: 'Ticket TK-00001 escalated to technical', user: supportUser._id },
]);

await Settings.create({
  companyName: 'MYTHISOFT INNOVATION PRIVATE LIMITED',
  companyTagline: 'Innovating Today, Empowering Tomorrow.',
  companyEmail: 'info@mythisoft.com',
  companyPhone: '+91 40 1234 5678',
  companyWebsite: 'https://mythisoft.com',
  companyAddress: 'Hyderabad, Telangana, India',
});

const quotations = await Quotation.insertMany([
  { quotationNumber: 'QT-00001', title: 'CRM Suite Proposal', customer: customers[0]._id, items: [{ description: 'CRM Enterprise Suite', quantity: 1, unitPrice: 500000, total: 500000 }], subtotal: 500000, tax: 90000, total: 590000, status: 'sent', createdBy: salesUser._id },
  { quotationNumber: 'QT-00002', title: 'ERP Implementation Quote', customer: customers[1]._id, items: [{ description: 'ERP Implementation', quantity: 1, unitPrice: 1200000, total: 1200000 }], subtotal: 1200000, tax: 216000, total: 1416000, status: 'approved', createdBy: meeraSales._id, approvedBy: salesManager._id, approvedAt: new Date() },
]);

const projects = await Project.insertMany([
  {
    name: 'TechNova CRM Rollout',
    customer: customers[0]._id,
    quotation: quotations[0]._id,
    status: 'code_review',
    workflowStage: 'development',
    budget: 590000,
    manager: techManager._id,
    assignedTo: [technicalUser._id, deepakTech._id],
    createdBy: admin._id,
    description: 'CRM rollout — dashboard module submitted for code review.',
  },
  { name: 'HealthCare ERP Setup', customer: customers[1]._id, quotation: quotations[1]._id, status: 'development', workflowStage: 'development', budget: 1416000, manager: techManager._id, assignedTo: [rohitTech._id], createdBy: admin._id },
  { name: 'EduSmart LMS Build', customer: customers[2]._id, status: 'testing', workflowStage: 'testing', budget: 800000, manager: techManager._id, assignedTo: [technicalUser._id, rohitTech._id], createdBy: admin._id },
  {
    name: 'FinTech Payment Gateway',
    customer: customers[0]._id,
    status: 'code_review',
    workflowStage: 'development',
    budget: 620000,
    manager: techManager._id,
    assignedTo: [deepakTech._id, rohitTech._id],
    createdBy: admin._id,
    description: 'Payment API and webhook handlers — pending admin/manager code review.',
  },
]);

const dayOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

await StaffRole.findByIdAndUpdate(team.tech1000._id, {
  projectRef: projects[0]._id,
  teamManager: techManager._id,
});
await StaffRole.findByIdAndUpdate(team.tech1001._id, {
  projectRef: projects[1]._id,
  teamManager: techManager._id,
});

const milestones = await Milestone.insertMany([
  {
    name: 'Requirement Analysis',
    milestoneType: 'Requirement Analysis',
    description: 'Gather CRM rollout requirements and sign-off scope.',
    project: projects[0]._id,
    staffRole: team.tech1000._id,
    technicalManager: techManager._id,
    assignedMembers: [technicalUser._id],
    priority: 'high',
    status: 'completed',
    progress: 100,
    startDate: dayOffset(-45),
    endDate: dayOffset(-30),
    createdBy: techManager._id,
  },
  {
    name: 'UI/UX Design',
    milestoneType: 'UI/UX Design',
    description: 'Dashboard wireframes and design system for TechNova CRM.',
    project: projects[0]._id,
    staffRole: team.tech1000._id,
    technicalManager: techManager._id,
    assignedMembers: [deepakTech._id],
    priority: 'medium',
    status: 'completed',
    progress: 100,
    startDate: dayOffset(-28),
    endDate: dayOffset(-14),
    createdBy: techManager._id,
  },
  {
    name: 'Backend Development',
    milestoneType: 'Backend Development',
    description: 'REST APIs, auth, and reporting services.',
    project: projects[0]._id,
    staffRole: team.tech1000._id,
    technicalManager: techManager._id,
    assignedMembers: [technicalUser._id, deepakTech._id],
    priority: 'high',
    status: 'in_progress',
    progress: 65,
    startDate: dayOffset(-14),
    endDate: dayOffset(14),
    createdBy: techManager._id,
  },
  {
    name: 'Frontend Development',
    milestoneType: 'Frontend Development',
    description: 'React dashboard, charts, and export flows.',
    project: projects[0]._id,
    staffRole: team.tech1000._id,
    technicalManager: techManager._id,
    assignedMembers: [rohitTech._id],
    priority: 'high',
    status: 'in_progress',
    progress: 40,
    startDate: dayOffset(-10),
    endDate: dayOffset(20),
    createdBy: techManager._id,
  },
  {
    name: 'Testing',
    milestoneType: 'Testing',
    description: 'QA pass for CRM rollout before UAT.',
    project: projects[0]._id,
    staffRole: team.tech1000._id,
    technicalManager: techManager._id,
    priority: 'medium',
    status: 'not_started',
    progress: 0,
    startDate: dayOffset(15),
    endDate: dayOffset(30),
    createdBy: techManager._id,
  },
  {
    name: 'Requirement Analysis',
    milestoneType: 'Requirement Analysis',
    project: projects[1]._id,
    staffRole: team.tech1001._id,
    technicalManager: techManager._id,
    assignedMembers: [rohitTech._id],
    priority: 'high',
    status: 'completed',
    progress: 100,
    startDate: dayOffset(-40),
    endDate: dayOffset(-25),
    createdBy: techManager._id,
  },
  {
    name: 'Database Design',
    milestoneType: 'Database Design',
    description: 'ERP schema and migration plan for HealthCare.',
    project: projects[1]._id,
    staffRole: team.tech1001._id,
    technicalManager: techManager._id,
    assignedMembers: [rohitTech._id],
    priority: 'high',
    status: 'in_progress',
    progress: 35,
    startDate: dayOffset(-20),
    endDate: dayOffset(25),
    createdBy: techManager._id,
  },
  {
    name: 'Backend Development',
    milestoneType: 'Backend Development',
    project: projects[2]._id,
    staffRole: team.tech1000._id,
    technicalManager: techManager._id,
    assignedMembers: [technicalUser._id, rohitTech._id],
    priority: 'medium',
    status: 'completed',
    progress: 100,
    startDate: dayOffset(-60),
    endDate: dayOffset(-20),
    createdBy: techManager._id,
  },
  {
    name: 'UAT',
    milestoneType: 'UAT',
    description: 'Client UAT for EduSmart LMS modules.',
    project: projects[2]._id,
    staffRole: team.tech1000._id,
    technicalManager: techManager._id,
    assignedMembers: [rohitTech._id],
    priority: 'high',
    status: 'in_progress',
    progress: 55,
    startDate: dayOffset(-7),
    endDate: dayOffset(10),
    createdBy: techManager._id,
  },
  {
    name: 'API Integration',
    milestoneType: 'API Integration',
    description: 'Payment gateway hooks and webhook handlers.',
    project: projects[3]._id,
    staffRole: team.tech1000._id,
    technicalManager: techManager._id,
    assignedMembers: [deepakTech._id],
    priority: 'critical',
    status: 'in_progress',
    progress: 75,
    startDate: dayOffset(-12),
    endDate: dayOffset(8),
    createdBy: techManager._id,
  },
  {
    name: 'Deployment',
    milestoneType: 'Deployment',
    project: projects[2]._id,
    staffRole: team.tech1000._id,
    technicalManager: techManager._id,
    assignedMembers: [technicalUser._id],
    priority: 'medium',
    status: 'not_started',
    progress: 0,
    startDate: dayOffset(12),
    endDate: dayOffset(28),
    createdBy: techManager._id,
  },
]);

await Task.insertMany([
  {
    title: 'CRM dashboard widgets — code review',
    description: 'Analytics charts, KPI cards, and export actions for TechNova CRM.',
    taskType: 'Development',
    priority: 'high',
    status: 'in_progress',
    workStatus: 'code_review',
    devStage: 'code_review',
    startDate: dayOffset(-14),
    dueDate: dayOffset(10),
    assignedTo: technicalUser._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[3]._id,
    relatedTo: { type: 'project', id: projects[0]._id },
    codeReview: { status: 'pending' },
  },
  {
    title: 'Payment gateway API module',
    description: 'REST endpoints for payment capture and refunds.',
    taskType: 'Feature',
    priority: 'high',
    status: 'in_progress',
    workStatus: 'code_review',
    devStage: 'code_review',
    startDate: dayOffset(-10),
    dueDate: dayOffset(12),
    assignedTo: deepakTech._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[9]._id,
    relatedTo: { type: 'project', id: projects[3]._id },
    codeReview: { status: 'pending' },
  },
  {
    title: 'OAuth login refactor',
    description: 'Token refresh bug fix — resubmitted after changes.',
    taskType: 'Bug Fix',
    priority: 'urgent',
    status: 'in_progress',
    workStatus: 'code_review',
    devStage: 'code_review',
    startDate: dayOffset(-8),
    dueDate: dayOffset(5),
    assignedTo: deepakTech._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[2]._id,
    relatedTo: { type: 'project', id: projects[0]._id },
    codeReview: {
      status: 'changes_required',
      comments: 'Add unit tests for token refresh and document error codes in README.',
      reviewer: techManager._id,
      reviewDate: dayOffset(-2),
    },
  },
  {
    title: 'Build customer API endpoints',
    description: 'REST CRUD for customers, contacts, and account sync.',
    taskType: 'Development',
    priority: 'high',
    status: 'in_progress',
    workStatus: 'development',
    devStage: 'in_progress',
    startDate: dayOffset(-12),
    dueDate: dayOffset(8),
    assignedTo: technicalUser._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[2]._id,
    relatedTo: { type: 'project', id: projects[0]._id },
  },
  {
    title: 'Implement dashboard charts',
    description: 'Revenue, pipeline, and activity charts on CRM home.',
    taskType: 'Feature',
    priority: 'medium',
    status: 'new',
    workStatus: 'planning',
    devStage: 'todo',
    startDate: dayOffset(-3),
    dueDate: dayOffset(18),
    assignedTo: technicalUser._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[3]._id,
    relatedTo: { type: 'project', id: projects[0]._id },
  },
  {
    title: 'Write API integration tests',
    description: 'Jest + supertest coverage for customer and deal APIs.',
    taskType: 'Testing',
    priority: 'medium',
    status: 'completed',
    workStatus: 'completed',
    devStage: 'completed',
    startDate: dayOffset(-20),
    dueDate: dayOffset(-5),
    assignedTo: technicalUser._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[2]._id,
    relatedTo: { type: 'project', id: projects[0]._id },
  },
  {
    title: 'CRM API integration module',
    description: 'Build REST API for customer sync with external CRM.',
    taskType: 'Development',
    priority: 'high',
    status: 'in_progress',
    workStatus: 'in_progress',
    devStage: 'in_progress',
    startDate: dayOffset(-7),
    dueDate: dayOffset(14),
    assignedTo: deepakTech._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[2]._id,
    relatedTo: { type: 'project', id: projects[0]._id },
  },
  {
    title: 'Design system color tokens',
    description: 'Finalize palette and spacing for TechNova UI kit.',
    taskType: 'Design',
    priority: 'low',
    status: 'completed',
    workStatus: 'completed',
    devStage: 'completed',
    startDate: dayOffset(-25),
    dueDate: dayOffset(-15),
    assignedTo: deepakTech._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[1]._id,
    relatedTo: { type: 'project', id: projects[0]._id },
  },
  {
    title: 'Mobile app UI screens',
    description: 'Login, dashboard, and ticket list screens for React Native app.',
    taskType: 'Development',
    priority: 'medium',
    status: 'in_progress',
    workStatus: 'development',
    devStage: 'in_progress',
    startDate: dayOffset(-5),
    dueDate: dayOffset(20),
    assignedTo: rohitTech._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[3]._id,
    relatedTo: { type: 'project', id: projects[0]._id },
  },
  {
    title: 'ERP patient records schema',
    description: 'Mongo collections and indexes for HealthCare patient module.',
    taskType: 'Development',
    priority: 'high',
    status: 'in_progress',
    workStatus: 'development',
    devStage: 'in_progress',
    startDate: dayOffset(-15),
    dueDate: dayOffset(20),
    assignedTo: rohitTech._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1001._id,
    milestone: milestones[6]._id,
    relatedTo: { type: 'project', id: projects[1]._id },
  },
  {
    title: 'UAT feedback fixes — EduSmart',
    description: 'Address client notes on course enrollment flow.',
    taskType: 'Bug Fix',
    priority: 'high',
    status: 'in_progress',
    workStatus: 'testing',
    devStage: 'testing',
    startDate: dayOffset(-4),
    dueDate: dayOffset(6),
    assignedTo: rohitTech._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[8]._id,
    relatedTo: { type: 'project', id: projects[2]._id },
  },
  {
    title: 'LMS quiz module regression',
    description: 'Verify quiz scoring after backend upgrade.',
    taskType: 'Testing',
    priority: 'medium',
    status: 'completed',
    workStatus: 'completed',
    devStage: 'completed',
    startDate: dayOffset(-30),
    dueDate: dayOffset(-18),
    assignedTo: rohitTech._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[7]._id,
    relatedTo: { type: 'project', id: projects[2]._id },
  },
  {
    title: 'Payment webhook handlers',
    description: 'Stripe/Razorpay webhook validation and ledger updates.',
    taskType: 'Development',
    priority: 'urgent',
    status: 'in_progress',
    workStatus: 'development',
    devStage: 'in_progress',
    startDate: dayOffset(-9),
    dueDate: dayOffset(7),
    assignedTo: deepakTech._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[9]._id,
    relatedTo: { type: 'project', id: projects[3]._id },
  },
  {
    title: 'Prepare production deploy checklist',
    description: 'Env vars, migrations, and rollback plan for EduSmart go-live.',
    taskType: 'Deployment',
    priority: 'medium',
    status: 'new',
    workStatus: 'new',
    devStage: 'backlog',
    startDate: dayOffset(10),
    dueDate: dayOffset(25),
    assignedTo: technicalUser._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[10]._id,
    relatedTo: { type: 'project', id: projects[2]._id },
  },
  {
    title: 'Review sprint backlog — TechNova',
    description: 'Tech manager task: groom backlog and assign next sprint items.',
    taskType: 'Planning',
    priority: 'medium',
    status: 'pending',
    workStatus: 'planning',
    devStage: 'todo',
    startDate: dayOffset(0),
    dueDate: dayOffset(3),
    assignedTo: techManager._id,
    createdBy: techManager._id,
    technicalManager: techManager._id,
    staffRole: team.tech1000._id,
    milestone: milestones[2]._id,
    relatedTo: { type: 'project', id: projects[0]._id },
  },
]);

await SupportTicket.insertMany([
  { ticketNumber: 'TK-00001', subject: 'Login issue on CRM portal', description: 'Customer unable to login after password reset', customer: customers[0]._id, project: projects[0]._id, priority: 'high', status: 'working', technicalStatus: 'in_progress', supportAssignee: supportUser._id, technicalAssignee: technicalUser._id, createdBy: supportUser._id },
  { ticketNumber: 'TK-00002', subject: 'Report export failing', description: 'Excel export returns empty file', customer: customers[1]._id, priority: 'medium', status: 'open', supportAssignee: kavitaSupport._id, createdBy: kavitaSupport._id },
  { ticketNumber: 'TK-00003', subject: 'Slow page loading on dashboard', description: 'Dashboard takes 30+ seconds to load', customer: customers[0]._id, project: projects[0]._id, priority: 'high', status: 'working', technicalStatus: 'in_progress', supportAssignee: supportUser._id, technicalAssignee: deepakTech._id, createdBy: supportUser._id },
  { ticketNumber: 'TK-00004', subject: 'Need training on new LMS', description: 'EduSmart team needs user training session', customer: customers[2]._id, priority: 'low', status: 'resolved', supportAssignee: kavitaSupport._id, createdBy: supportManager._id },
  { ticketNumber: 'TK-00005', subject: 'Database connection timeout', description: 'ERP system experiencing intermittent database timeouts', customer: customers[1]._id, project: projects[1]._id, priority: 'urgent', status: 'assigned', technicalStatus: 'need_information', supportAssignee: supportUser._id, technicalAssignee: rohitTech._id, createdBy: supportManager._id },
  { ticketNumber: 'TK-00006', subject: 'User permission error', description: 'Sales team cannot access customer reports', customer: customers[0]._id, project: projects[0]._id, priority: 'medium', status: 'open', supportAssignee: kavitaSupport._id, createdBy: supportUser._id },
  { ticketNumber: 'TK-00007', subject: 'Mobile app crash on login', description: 'Android app crashes immediately after login', customer: customers[2]._id, project: projects[2]._id, priority: 'high', status: 'working', technicalStatus: 'in_progress', supportAssignee: supportUser._id, technicalAssignee: technicalUser._id, createdBy: kavitaSupport._id },
  { ticketNumber: 'TK-00008', subject: 'Email notification not sending', description: 'Automated email notifications not being delivered', customer: customers[0]._id, priority: 'medium', status: 'waiting_customer', supportAssignee: supportUser._id, createdBy: supportUser._id },
  { ticketNumber: 'TK-00009', subject: 'API rate limiting issue', description: 'Third-party API calls getting rate limited', customer: customers[1]._id, project: projects[3]._id, priority: 'high', status: 'assigned', technicalStatus: 'testing', supportAssignee: kavitaSupport._id, technicalAssignee: deepakTech._id, createdBy: supportManager._id },
  { ticketNumber: 'TK-00010', subject: 'File upload size limit', description: 'Need to increase file upload size limit for documents', customer: customers[2]._id, priority: 'low', status: 'closed', supportAssignee: supportUser._id, createdBy: supportUser._id },
  { ticketNumber: 'TK-00011', subject: 'Dashboard widget alignment', description: 'Charts not aligning properly on smaller screens', customer: customers[0]._id, project: projects[0]._id, priority: 'medium', status: 'resolved', technicalStatus: 'resolved', supportAssignee: kavitaSupport._id, technicalAssignee: rohitTech._id, createdBy: supportUser._id },
  { ticketNumber: 'TK-00012', subject: 'Backup schedule configuration', description: 'Need to configure automated database backups', customer: customers[1]._id, project: projects[1]._id, priority: 'high', status: 'open', supportAssignee: supportUser._id, createdBy: supportManager._id },
]);

const invoices = await Invoice.insertMany([
  { invoiceNumber: 'INV-00001', customer: customers[0]._id, project: projects[0]._id, items: [{ description: 'CRM Enterprise Suite - Phase 1', quantity: 1, unitPrice: 295000, total: 295000 }], subtotal: 295000, tax: 53100, gst: 53100, total: 348100, status: 'sent', dueDate: new Date('2026-08-15'), createdBy: admin._id },
  { invoiceNumber: 'INV-00002', customer: customers[1]._id, items: [{ description: 'ERP Setup - Advance', quantity: 1, unitPrice: 500000, total: 500000 }], subtotal: 500000, tax: 90000, gst: 90000, total: 590000, status: 'paid', amountPaid: 590000, paidAt: new Date(), createdBy: admin._id },
]);

await Payment.insertMany([
  { paymentNumber: 'PAY-00001', invoice: invoices[1]._id, customer: customers[1]._id, amount: 590000, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-001', paidAt: new Date(), createdBy: admin._id },
]);

await Meeting.insertMany([
  { title: 'Discovery call - Amit Sharma', lead: leads[0]._id, scheduledAt: new Date('2026-08-29T10:00:00'), type: 'video', assignedTo: salesUser._id, createdBy: salesUser._id },
  { title: 'Demo - TechNova CRM', customer: customers[0]._id, scheduledAt: new Date('2026-08-30T14:00:00'), type: 'in_person', assignedTo: meeraSales._id, createdBy: meeraSales._id },
  { title: 'Sprint planning - TechNova', customer: customers[0]._id, scheduledAt: new Date('2026-08-28T11:00:00'), type: 'video', assignedTo: technicalUser._id, createdBy: techManager._id },
]);

await Expense.insertMany([
  { title: 'Office supplies Q2', amount: 25000, category: 'office', status: 'approved', createdBy: admin._id, approvedBy: salesManager._id },
  { title: 'Cloud hosting - July', amount: 45000, category: 'software', status: 'paid', createdBy: admin._id },
  { title: 'Sales team travel - client visit', amount: 12000, category: 'travel', status: 'approved', createdBy: meeraSales._id, approvedBy: salesManager._id },
]);

const today = new Date();
today.setHours(0, 0, 0, 0);

await Attendance.insertMany([
  { user: salesUser._id, date: today, status: 'present', checkIn: '09:00', checkOut: '18:00', markedBy: salesManager._id },
  { user: meeraSales._id, date: today, status: 'present', checkIn: '08:55', checkOut: '18:10', markedBy: salesManager._id },
  { user: arunSales._id, date: today, status: 'present', checkIn: '09:10', checkOut: '18:00', markedBy: salesManager._id },
  { user: technicalUser._id, date: today, status: 'present', checkIn: '09:30', checkOut: '18:30', markedBy: techManager._id },
  { user: deepakTech._id, date: today, status: 'present', checkIn: '09:00', checkOut: '18:00', markedBy: techManager._id },
  { user: rohitTech._id, date: today, status: 'late', checkIn: '10:30', checkOut: '18:00', markedBy: techManager._id },
  { user: supportUser._id, date: today, status: 'present', checkIn: '09:15', checkOut: '18:00', markedBy: supportManager._id },
  { user: kavitaSupport._id, date: today, status: 'present', checkIn: '09:00', checkOut: '18:00', markedBy: supportManager._id },
]);

await Leave.insertMany([
  { user: salesUser._id, type: 'casual', startDate: new Date('2026-09-01'), endDate: new Date('2026-09-02'), reason: 'Personal work', status: 'pending', createdBy: salesUser._id },
  { user: deepakTech._id, type: 'sick', startDate: new Date('2026-08-20'), endDate: new Date('2026-08-21'), reason: 'Fever', status: 'approved', createdBy: deepakTech._id, approvedBy: techManager._id, approvedAt: new Date() },
  { user: kavitaSupport._id, type: 'casual', startDate: new Date('2026-09-10'), endDate: new Date('2026-09-10'), reason: 'Family function', status: 'pending', createdBy: kavitaSupport._id },
]);

await Document.insertMany([
  { name: 'TechNova Proposal.pdf', folder: 'Quotations', fileUrl: 'https://res.cloudinary.com/demo/sample.pdf', fileType: 'application/pdf', uploadedBy: salesUser._id, relatedTo: { type: 'customer', id: customers[0]._id } },
  { name: 'HealthCare Contract.docx', folder: 'Contracts', fileUrl: 'https://res.cloudinary.com/demo/sample.docx', fileType: 'application/docx', uploadedBy: admin._id, relatedTo: { type: 'customer', id: customers[1]._id } },
  { name: 'TechNova API Spec.pdf', folder: 'Technical', fileUrl: 'https://res.cloudinary.com/demo/sample.pdf', fileType: 'application/pdf', uploadedBy: technicalUser._id, relatedTo: { type: 'customer', id: customers[0]._id } },
]);

await WhatsAppMessage.insertMany([
  { phone: '+91 9876500001', message: 'Hi Sanjay, following up on our CRM proposal. Please let us know your feedback.', customer: customers[0]._id, direction: 'outbound', status: 'delivered', sentBy: salesUser._id, template: 'follow_up' },
  { phone: '+91 9988776655', message: 'Hi Amit, your demo is scheduled for tomorrow at 10 AM.', lead: leads[0]._id, direction: 'outbound', status: 'sent', sentBy: salesUser._id, template: 'meeting' },
  { phone: '+91 9876500002', message: 'Hi Meera, your ERP quote has been approved. Next steps attached.', customer: customers[1]._id, direction: 'outbound', status: 'delivered', sentBy: meeraSales._id, template: 'follow_up' },
]);

console.log('Database seeded successfully!');
console.log('  Milestones:         /projects/milestones          (11 milestones, mixed statuses)');
console.log('  Complete milestones: /projects/milestones/completed');
console.log('  Admin tasks:        /projects/tasks               (15 tech tasks)');
console.log('  Tech manager tasks: /tasks');
console.log('  Tech person tasks:  /technical/tasks');
console.log('  Code review test:   /projects/status/code_review  (2 projects ready)');
console.log('  Testing form:       /projects/status/testing      (1 project ready)');
console.log('');
console.log('See DEMO_DATA.md for full sample details.');
console.log('');
console.log('Quick logins (password in parentheses):');
console.log('  Admin:            admin@mythisoft.com           (admin123)');
console.log('  Sales Manager:    manager@mythisoft.com         (manager123)');
console.log('  Tech Manager:     tech.manager@mythisoft.com    (manager123)');
console.log('  Support Manager:  support.manager@mythisoft.com (manager123)');
console.log('  Sales (Lead):     meera.sales@mythisoft.com     (sales123)');
console.log('  Sales:            rajesh@mythisoft.com          (sales123)');
console.log('  Sales:            arun.sales@mythisoft.com      (sales123)');
console.log('  Tech (Lead):      technical@mythisoft.com       (tech123)');
console.log('  Tech:             deepak.tech@mythisoft.com     (tech123)');
console.log('  Tech:             rohit.tech@mythisoft.com      (tech123)');
console.log('  Support (Lead):   support@mythisoft.com         (support123)');
console.log('  Support:          kavita.support@mythisoft.com  (support123)');
console.log('  Tech Support:     tech.support@mythisoft.com     (support123)');
console.log('  Customer Portal:  customer@mythisoft.com        (customer123)');
process.exit(0);
