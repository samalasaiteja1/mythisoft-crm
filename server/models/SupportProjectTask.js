import mongoose from 'mongoose';
import {
  ALL_SUPPORT_TASK_TYPE_KEYS,
  SUPPORT_TASK_TYPE_META,
} from '../constants/supportProjectTasks.js';

export const SUPPORT_TASK_KEYS = ALL_SUPPORT_TASK_TYPE_KEYS.filter((k) => k !== 'custom');

export const SUPPORT_TASK_LABELS = Object.fromEntries(
  Object.entries(SUPPORT_TASK_TYPE_META).map(([k, v]) => [k, v.label]),
);

const supportProjectTaskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    taskKey: {
      type: String,
      required: true,
    },
    taskType: {
      type: String,
      enum: ALL_SUPPORT_TASK_TYPE_KEYS,
      default: 'custom',
    },
    assigneeCategory: {
      type: String,
      enum: ['support_executive', 'technical_support_engineer'],
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: Date,
    estimatedHours: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['assigned', 'pending', 'accepted', 'in_progress', 'waiting_customer', 'completed'],
      default: 'assigned',
    },
    completedAt: Date,
    completionNotes: String,
    /** Groups multi-member tasks created in one Create Task action */
    mainTaskBatchId: { type: String, index: true },
    smApprovedAt: Date,
    smApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progressUpdates: [{
      text: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      attachments: [{
        name: String,
        url: String,
        mimeType: String,
      }],
      createdAt: { type: Date, default: Date.now },
    }],
    attachments: [{
      name: String,
      url: String,
      mimeType: String,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

supportProjectTaskSchema.index({ project: 1, taskKey: 1 }, { unique: true });

export default mongoose.model('SupportProjectTask', supportProjectTaskSchema);
