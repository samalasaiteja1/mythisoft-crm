import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Deal from '../models/Deal.js';
import Followup from '../models/Followup.js';

dotenv.config();
await connectDB();

const EXAMPLE_TAG = 'example-seed';

const salesUser = await User.findOne({ email: 'rajesh@mythisoft.com' })
  || await User.findOne({ role: 'sales' })
  || await User.findOne({ role: 'admin' });

if (!salesUser) {
  console.error('No user found. Run npm run seed first or create a sales/admin user.');
  process.exit(1);
}

const admin = await User.findOne({ email: 'admin@mythisoft.com' }) || salesUser;
const salesManager = await User.findOne({ email: 'manager@mythisoft.com' });
const meeraSales = await User.findOne({ email: 'meera.sales@mythisoft.com' });

// Remove previous example data only (safe re-run)
const oldLeads = await Lead.find({ tags: EXAMPLE_TAG }).select('_id');
const oldLeadIds = oldLeads.map((l) => l._id);
await Followup.deleteMany({ $or: [{ lead: { $in: oldLeadIds } }, { notes: { $regex: EXAMPLE_TAG } }] });
await Deal.deleteMany({ tags: EXAMPLE_TAG });
await Lead.deleteMany({ tags: EXAMPLE_TAG });

const daysFromNow = (n, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const daysAgo = (n, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const leads = await Lead.insertMany([
  {
    leadNumber: 'EX-LD-00001',
    firstName: 'Ravi',
    lastName: 'Krishnan',
    email: 'ravi.krishnan@example.mythisoft.com',
    phone: '+91 9000010001',
    company: 'FinEdge Solutions',
    title: 'IT Head',
    industry: 'FinTech',
    source: 'website',
    status: 'new',
    workflowStage: 'new',
    score: 70,
    value: 450000,
    priority: 'high',
    interestedService: 'CRM for loan processing',
    createdBy: admin._id,
    tags: [EXAMPLE_TAG],
    nextFollowUp: daysFromNow(0, 15),
  },
  {
    leadNumber: 'EX-LD-00002',
    firstName: 'Sneha',
    lastName: 'Desai',
    email: 'sneha.desai@example.mythisoft.com',
    phone: '+91 9000010002',
    company: 'MediCare Labs',
    title: 'Operations Manager',
    source: 'referral',
    status: 'contacted',
    workflowStage: 'contacted',
    score: 65,
    value: 320000,
    priority: 'medium',
    assignedManager: salesManager?._id,
    createdBy: admin._id,
    tags: [EXAMPLE_TAG],
    lastContacted: daysAgo(2),
    nextFollowUp: daysFromNow(1, 11),
  },
  {
    leadNumber: 'EX-LD-00003',
    firstName: 'Karthik',
    lastName: 'Menon',
    email: 'karthik.menon@example.mythisoft.com',
    phone: '+91 9000010003',
    company: 'LogiTrack India',
    title: 'VP Sales',
    source: 'event',
    status: 'interested',
    workflowStage: 'interested',
    score: 88,
    value: 890000,
    priority: 'urgent',
    assignedManager: salesManager?._id,
    assignedTo: salesUser._id,
    createdBy: admin._id,
    tags: [EXAMPLE_TAG],
    isQualified: true,
    lastContacted: daysAgo(1),
    nextFollowUp: daysFromNow(2, 14),
  },
  {
    leadNumber: 'EX-LD-00004',
    firstName: 'Divya',
    lastName: 'Nambiar',
    email: 'divya.nambiar@example.mythisoft.com',
    phone: '+91 9000010004',
    company: 'EduNext Academy',
    title: 'Director',
    source: 'social',
    status: 'qualified',
    workflowStage: 'qualified',
    score: 92,
    value: 560000,
    priority: 'high',
    assignedManager: salesManager?._id,
    assignedTo: (meeraSales || salesUser)._id,
    createdBy: admin._id,
    tags: [EXAMPLE_TAG],
    isQualified: true,
    lastContacted: daysAgo(3),
    nextFollowUp: daysFromNow(0, 16),
  },
]);

const deals = await Deal.insertMany([
  {
    title: 'CRM Rollout - LogiTrack India',
    value: 890000,
    stage: 'discovery',
    probability: 35,
    expectedCloseDate: daysFromNow(45),
    lead: leads[2]._id,
    assignedTo: salesUser._id,
    createdBy: admin._id,
    tags: [EXAMPLE_TAG],
    description: 'Converted from interested lead — discovery phase',
  },
  {
    title: 'LMS Platform - EduNext Academy',
    value: 560000,
    stage: 'proposal_sent',
    probability: 55,
    expectedCloseDate: daysFromNow(30),
    lead: leads[3]._id,
    assignedTo: salesUser._id,
    createdBy: admin._id,
    tags: [EXAMPLE_TAG],
    description: 'Qualified lead — proposal under review',
  },
  {
    title: 'ERP Module - MediCare Labs',
    value: 320000,
    stage: 'negotiation',
    probability: 70,
    expectedCloseDate: daysFromNow(14),
    assignedTo: salesUser._id,
    createdBy: admin._id,
    tags: [EXAMPLE_TAG],
    description: 'Standalone deal in negotiation',
  },
]);

await Lead.findByIdAndUpdate(leads[2]._id, {
  convertedToDeal: deals[0]._id,
  status: 'converted_to_deal',
  workflowStage: 'converted_to_deal',
});
await Lead.findByIdAndUpdate(leads[3]._id, {
  convertedToDeal: deals[1]._id,
  status: 'converted_to_deal',
  workflowStage: 'converted_to_deal',
});

await Followup.insertMany([
  // Lead follow-ups
  {
    lead: leads[0]._id,
    workflowStage: 'lead',
    activityType: 'phone_call',
    leadStatus: 'new',
    followUpOption: 'first_call',
    title: 'First call — FinEdge Solutions',
    notes: `${EXAMPLE_TAG}: Intro call to understand CRM needs`,
    scheduledAt: daysFromNow(0, 15),
    status: 'scheduled',
    priority: 'high',
    contactName: 'Ravi Krishnan',
    contactEmail: leads[0].email,
    contactPhone: leads[0].phone,
    company: leads[0].company,
    assignedTo: salesUser._id,
    createdBy: salesUser._id,
  },
  {
    lead: leads[1]._id,
    workflowStage: 'lead',
    activityType: 'meeting',
    leadStatus: 'contacted',
    followUpOption: 'meeting_scheduled',
    title: 'Requirement discussion — MediCare Labs',
    notes: `${EXAMPLE_TAG}: Discuss lab workflow automation`,
    scheduledAt: daysFromNow(1, 11),
    status: 'scheduled',
    priority: 'medium',
    contactName: 'Sneha Desai',
    contactEmail: leads[1].email,
    contactPhone: leads[1].phone,
    company: leads[1].company,
    duration: 45,
    assignedTo: salesUser._id,
    createdBy: salesUser._id,
  },
  {
    lead: leads[1]._id,
    workflowStage: 'lead',
    activityType: 'phone_call',
    leadStatus: 'contacted',
    followUpOption: 'followup_call',
    title: 'Follow-up call — MediCare Labs',
    notes: `${EXAMPLE_TAG}: Completed initial outreach`,
    scheduledAt: daysAgo(2),
    completedAt: daysAgo(2, 12),
    status: 'completed',
    priority: 'medium',
    outcome: 'Meeting scheduled for next week',
    contactName: 'Sneha Desai',
    contactEmail: leads[1].email,
    contactPhone: leads[1].phone,
    company: leads[1].company,
    assignedTo: salesUser._id,
    createdBy: salesUser._id,
  },
  {
    lead: leads[2]._id,
    workflowStage: 'lead',
    activityType: 'product_demo',
    leadStatus: 'interested',
    followUpOption: 'product_demo',
    title: 'Product demo — LogiTrack',
    notes: `${EXAMPLE_TAG}: Demo logistics tracking module`,
    scheduledAt: daysAgo(1),
    completedAt: daysAgo(1, 15),
    status: 'completed',
    priority: 'urgent',
    outcome: 'Customer interested — deal created',
    contactName: 'Karthik Menon',
    contactEmail: leads[2].email,
    contactPhone: leads[2].phone,
    company: leads[2].company,
    assignedTo: salesUser._id,
    createdBy: salesUser._id,
  },
  // Deal follow-ups
  {
    lead: leads[2]._id,
    deal: deals[0]._id,
    workflowStage: 'deal',
    activityType: 'phone_call',
    dealStage: 'discovery',
    followUpOption: 'discovery_call',
    title: 'Discovery call — LogiTrack CRM deal',
    notes: `${EXAMPLE_TAG}: Map departments and integrations`,
    scheduledAt: daysFromNow(2, 14),
    status: 'scheduled',
    priority: 'high',
    contactName: 'Karthik Menon',
    contactEmail: leads[2].email,
    contactPhone: leads[2].phone,
    company: leads[2].company,
    assignedTo: salesUser._id,
    createdBy: salesUser._id,
  },
  {
    lead: leads[3]._id,
    deal: deals[1]._id,
    workflowStage: 'deal',
    activityType: 'email',
    dealStage: 'proposal_sent',
    followUpOption: 'proposal_followup',
    title: 'Proposal follow-up — EduNext LMS',
    notes: `${EXAMPLE_TAG}: Check if proposal was reviewed`,
    scheduledAt: daysFromNow(0, 16),
    status: 'awaiting_customer_response',
    priority: 'high',
    contactName: 'Divya Nambiar',
    contactEmail: leads[3].email,
    contactPhone: leads[3].phone,
    company: leads[3].company,
    assignedTo: salesUser._id,
    createdBy: salesUser._id,
  },
  {
    deal: deals[2]._id,
    workflowStage: 'deal',
    activityType: 'quotation_discussion',
    dealStage: 'negotiation',
    followUpOption: 'price_negotiation',
    title: 'Price negotiation — MediCare ERP',
    notes: `${EXAMPLE_TAG}: Discuss discount and payment terms`,
    scheduledAt: daysAgo(1),
    status: 'overdue',
    priority: 'urgent',
    contactName: 'Sneha Desai',
    contactEmail: 'sneha.desai@example.mythisoft.com',
    contactPhone: '+91 9000010002',
    company: 'MediCare Labs',
    assignedTo: salesUser._id,
    createdBy: salesUser._id,
  },
  {
    deal: deals[2]._id,
    workflowStage: 'deal',
    activityType: 'meeting',
    dealStage: 'negotiation',
    followUpOption: 'final_negotiation_meeting',
    title: 'Final negotiation meeting',
    notes: `${EXAMPLE_TAG}: Contract terms review`,
    scheduledAt: daysFromNow(3, 10),
    status: 'scheduled',
    priority: 'high',
    company: 'MediCare Labs',
    assignedTo: salesUser._id,
    createdBy: salesUser._id,
  },
]);

console.log('Example data created successfully!');
console.log(`  Leads:     ${leads.length} (tag: ${EXAMPLE_TAG})`);
console.log(`  Deals:     ${deals.length}`);
console.log(`  Follow-ups: 8 (lead + deal workflows)`);
console.log('');
console.log('View in CRM:');
console.log('  Leads      → /leads');
console.log('  Deals      → /deals');
console.log('  Follow-ups → /followups');
console.log('');
console.log(`Assigned to: ${salesUser.firstName} ${salesUser.lastName} (${salesUser.email})`);
process.exit(0);
