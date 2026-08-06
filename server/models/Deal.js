import mongoose from 'mongoose';

const projectRequirementsSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectCategory' },
  description: String,
  scope: String,
  deliverables: String,
  technologyStack: [String],
  startDate: Date,
  endDate: Date,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  estimatedBudget: { type: Number, default: 0 },
}, { _id: false });

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    value: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'INR' },
    stage: {
      type: String,
      enum: [
        'qualified_lead', 'deal_created', 'discovery', 'requirement_gathering',
        'proposal_sent', 'quotation_sent', 'negotiation', 'customer_approval',
        'contract_signed', 'advance_payment_received', 'won', 'converted_to_customer',
        'new', 'contacted', 'meeting', 'demo', 'proposal', 'lost',
        'prospecting', 'qualification', 'closed_won', 'closed_lost',
      ],
      default: 'deal_created',
    },
    probability: { type: Number, min: 0, max: 100, default: 10 },
    expectedCloseDate: Date,
    actualCloseDate: Date,
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    description: String,
    dealType: { type: String, enum: ['project'], default: 'project' },
    projectRequirements: projectRequirementsSchema,
    tags: [String],
    assignedManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lostReason: String,
    portalUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Deal', dealSchema);
