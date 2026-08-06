import mongoose from 'mongoose';
import { PROJECT_STATUS_KEYS } from '../constants/projectStatuses.js';

const deliveryChecklistSchema = new mongoose.Schema({
  sourceCode: { type: Boolean, default: false },
  adminCredentials: { type: Boolean, default: false },
  userManual: { type: Boolean, default: false },
  trainingCompleted: { type: Boolean, default: false },
  clientAcceptance: { type: Boolean, default: false },
  clientAcceptanceAt: Date,
  clientAcceptanceNotes: String,
  clientAcceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  warrantyPeriod: String,
  releaseNotes: { type: Boolean, default: false },
  deploymentGuide: { type: Boolean, default: false },
}, { _id: false });

const customerSubmissionSchema = new mongoose.Schema({
  deliveryVersion: { type: String, default: 'v1.0.0' },
  deliveryDate: Date,
  deliveryNotes: String,
  documentsIncluded: {
    userManual: { type: Boolean, default: true },
    releaseNotes: { type: Boolean, default: true },
    deploymentGuide: { type: Boolean, default: true },
  },
  notifyEmail: { type: Boolean, default: true },
  notifyPortal: { type: Boolean, default: true },
}, { _id: false });

const tmHandoffChecklistSchema = new mongoose.Schema({
  developmentCompleted: { type: Boolean, default: false },
  testingCompleted: { type: Boolean, default: false },
  documentationUploaded: { type: Boolean, default: false },
  completedAt: Date,
}, { _id: false });

const smReviewChecklistSchema = new mongoose.Schema({
  buildVerified: { type: Boolean, default: false },
  documentsVerified: { type: Boolean, default: false },
  tasksVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectCategory' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    status: {
      type: String,
      enum: PROJECT_STATUS_KEYS,
      default: 'new',
    },
    workflowStage: {
      type: String,
      enum: ['project_started', 'development', 'testing', 'deployment', 'delivered', 'support', 'technical', 'invoiced', 'payment_received', 'completed'],
      default: 'project_started',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    technologyStack: [String],
    startDate: Date,
    endDate: Date,
    budget: { type: Number, default: 0 },
    scope: String,
    deliverables: String,
    dealRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    memberRoleLabels: {
      type: Map,
      of: String,
      default: undefined,
    },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supportAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supportHandoffAt: Date,
    supportHandoffNotes: String,
    supportHandoffBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supportReviewStatus: {
      type: String,
      enum: [
        'pending_review',
        'support_tasks_assigned',
        'support_tasks_in_progress',
        'support_tasks_complete',
        'submitted_to_customer',
        'support_active',
        'in_support',
        'changes_required',
        'fix_in_progress',
        'resubmitted',
        'verified',
        'closed',
      ],
    },
    supportReviewedAt: Date,
    supportReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supportReviewNotes: String,
    supportExecutiveAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    technicalSupportAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supportTeamAssignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    supportStaffRole: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffRole' },
    supportTeamStartDate: Date,
    supportTeamAssignmentNotes: String,
    activeUpdateRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket' },
    supportClosedAt: Date,
    tmHandoffChecklist: tmHandoffChecklistSchema,
    smReviewChecklist: smReviewChecklistSchema,
    submittedToCustomerAt: Date,
    submittedToCustomerBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerSubmission: customerSubmissionSchema,
    deliveryChecklist: deliveryChecklistSchema,
    deliveredAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
