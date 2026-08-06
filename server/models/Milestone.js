import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  fileUrl: { type: String, trim: true },
  fileType: String,
  fileSize: Number,
}, { _id: true });

const milestoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    milestoneType: { type: String, trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    staffRole: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffRole' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'critical'],
      default: 'medium',
    },
    startDate: Date,
    endDate: Date,
    dueDate: Date,
    estimatedDurationDays: { type: Number, min: 0 },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    status: {
      type: String,
      enum: ['not_started', 'pending', 'in_progress', 'completed', 'delayed', 'on_hold', 'cancelled'],
      default: 'not_started',
    },
    parentMilestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
    dependsOn: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    technicalManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    memberRoleLabels: {
      type: Map,
      of: String,
      default: undefined,
    },
    remarks: String,
    attachments: [attachmentSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

milestoneSchema.index({ project: 1, endDate: 1 });
milestoneSchema.index({ staffRole: 1 });

export default mongoose.model('Milestone', milestoneSchema);
