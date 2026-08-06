import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    folder: { type: String, default: 'General' },
    fileUrl: { type: String, required: true },
    fileType: String,
    fileSize: Number,
    version: { type: Number, default: 1 },
    relatedTo: {
      type: { type: String, enum: ['lead', 'customer', 'deal', 'company', 'ticket', 'project', 'milestone', 'task', 'general'], default: 'general' },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    tags: [String],
    notes: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
