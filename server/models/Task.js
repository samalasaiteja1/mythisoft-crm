import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  fileUrl: { type: String, trim: true },
  fileType: String,
  fileSize: Number,
}, { _id: true });

const workUploadSchema = new mongoose.Schema({
  workType: { type: String, trim: true },
  name: { type: String, trim: true },
  fileUrl: { type: String, trim: true },
  fileType: String,
  fileSize: Number,
  comments: String,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const statusCommentSchema = new mongoose.Schema({
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    taskType: { type: String, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: {
      type: String,
      enum: ['new', 'pending', 'in_progress', 'completed', 'cancelled', 'on_hold'],
      default: 'new',
    },
    workStatus: {
      type: String,
      enum: [
        'new', 'planning', 'development', 'in_progress', 'code_review', 'testing',
        'bug_fixing', 'on_hold', 'deployment', 'completed', 'cancelled',
      ],
      default: 'new',
    },
    startDate: Date,
    dueDate: Date,
    estimatedHours: { type: Number, min: 0 },
    reminderDate: Date,
    devStage: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'code_review', 'testing', 'completed'],
      default: 'todo',
    },
    milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
    staffRole: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffRole' },
    technicalManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedTo: {
      type: { type: String, enum: ['lead', 'customer', 'deal', 'contact', 'company', 'project'] },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    remarks: String,
    attachments: [attachmentSchema],
    workUploads: [workUploadSchema],
    statusComments: [statusCommentSchema],
    codeReview: {
      reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'approved', 'changes_required'], default: 'pending' },
      comments: String,
      reviewDate: Date,
      reply: String,
      resubmitNotes: String,
      resubmitDate: Date,
    },
    testResult: {
      status: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
      comments: String,
      bugCreated: { type: Boolean, default: false },
      testedAt: Date,
    },
    isReminder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
