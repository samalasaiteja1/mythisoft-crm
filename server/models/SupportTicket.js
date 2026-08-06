import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isInternal: { type: Boolean, default: false },
}, { timestamps: true });

const attachmentSchema = new mongoose.Schema({
  name: String,
  url: String,
  fileType: String,
  fileSize: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true },
    subject: { type: String, required: true },
    description: String,
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: [
        'open',
        'reopened',
        'assigned',
        'accepted',
        'working',
        'completed',
        'reviewed',
        'resolved',
        'waiting_customer',
        'closed',
      ],
      default: 'open',
    },
    technicalStatus: {
      type: String,
      enum: ['unassigned', 'assigned', 'in_progress', 'testing', 'need_information', 'resolved', 'closed'],
      default: 'unassigned',
    },
    category: String,
    issueCategoryGroup: String,
    module: String,
    stepsToReproduce: String,
    preferredContact: {
      type: String,
      enum: ['email', 'phone'],
      default: 'email',
    },
    requestKind: {
      type: String,
      enum: ['customer_ticket', 'update_request', 'change_request'],
      default: 'customer_ticket',
    },
    updateRequestType: {
      type: String,
      enum: ['bug', 'enhancement'],
    },
    changeType: String,
    changeScope: {
      type: String,
      enum: ['minor', 'development_required'],
    },
    businessReason: String,
    expectedCompletion: Date,
    supportReviewPhase: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'code_review', 'testing', 'resubmitted', 'approved', 'reopened', 'closed'],
    },
    supportAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    technicalAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    slaDeadline: Date,
    completionNotes: String,
    rating: { type: Number, min: 1, max: 5 },
    escalated: { type: Boolean, default: false },
    attachments: [attachmentSchema],
    comments: [commentSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);

supportTicketSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketNumber = `TK-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('SupportTicket', supportTicketSchema);
