import mongoose from 'mongoose';

const followupSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    workflowStage: { type: String, enum: ['lead', 'deal', 'customer'], default: 'lead' },
    activityType: {
      type: String,
      enum: [
        'phone_call', 'email', 'whatsapp', 'meeting', 'video_call', 'product_demo',
        'site_visit', 'send_brochure', 'quotation_discussion', 'general',
        'call', 'chat', 'note', 'task',
      ],
      default: 'general',
    },
    leadStatus: {
      type: String,
      enum: ['new', 'contacted', 'interested', 'not_interested', 'qualified'],
    },
    followUpOption: String,
    dealStage: {
      type: String,
      enum: [
        'deal_created', 'discovery', 'requirement_gathering', 'proposal_sent', 'quotation_sent',
        'negotiation', 'customer_approval', 'contract_signed', 'advance_payment_received',
        'won', 'converted_to_customer',
      ],
    },
    title: { type: String, required: true },
    notes: String,
    outcome: String,
    scheduledAt: { type: Date, required: true },
    completedAt: Date,
    status: {
      type: String,
      enum: [
        'scheduled', 'completed', 'missed', 'cancelled', 'rescheduled', 'pending',
        'awaiting_customer_response', 'in_progress', 'overdue',
      ],
      default: 'scheduled',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    contactName: String,
    contactEmail: String,
    contactPhone: String,
    contactAlternatePhone: String,
    contactWebsite: String,
    contactTitle: String,
    contactIndustry: String,
    company: String,
    meetingLink: String,
    duration: { type: Number, default: 30 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

followupSchema.index({ workflowStage: 1, status: 1, scheduledAt: 1 });
followupSchema.index({ lead: 1 });
followupSchema.index({ deal: 1 });
followupSchema.index({ customer: 1 });

export default mongoose.model('Followup', followupSchema);
