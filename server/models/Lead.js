import mongoose from 'mongoose';

const qualificationSchema = new mongoose.Schema({
  budgetConfirmed: { type: Boolean, default: false },
  decisionMaker: String,
  timeline: String,
  requirements: String,
  competitors: String,
  probability: { type: Number, min: 0, max: 100, default: 0 },
  score: { type: Number, min: 0, max: 100, default: 0 },
}, { _id: false });

const leadSchema = new mongoose.Schema(
  {
    leadNumber: { type: String, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    alternatePhone: String,
    website: String,
    company: String,
    companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    industry: String,
    title: String,
    source: {
      type: String,
      enum: ['website', 'referral', 'social', 'email', 'cold_call', 'event', 'other'],
      default: 'website',
    },
    status: {
      type: String,
      enum: [
        'new', 'contacted', 'follow_up', 'interested', 'not_interested', 'qualified', 'converted_to_deal',
        'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost',
      ],
      default: 'new',
    },
    workflowStage: {
      type: String,
      enum: [
        'new', 'contacted', 'follow_up', 'interested', 'not_interested', 'qualified', 'converted_to_deal',
        'lead_created', 'assigned', 'quotation_sent', 'deal_won', 'customer_created', 'project_started',
        'support', 'technical', 'invoiced', 'payment_received', 'completed',
      ],
      default: 'new',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    budget: { type: Number, default: 0 },
    interestedService: String,
    description: String,
    score: { type: Number, min: 0, max: 100, default: 0 },
    value: { type: Number, default: 0 },
    notes: String,
    tags: [String],
    assignedManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignmentDueDate: Date,
    assignmentRemarks: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastContacted: Date,
    nextFollowUp: Date,
    isQualified: { type: Boolean, default: false },
    qualification: qualificationSchema,
    convertedToCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    convertedToDeal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    portalUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

leadSchema.pre('save', async function (next) {
  if (!this.leadNumber) {
    const count = await mongoose.model('Lead').countDocuments();
    this.leadNumber = `LD-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Lead', leadSchema);
