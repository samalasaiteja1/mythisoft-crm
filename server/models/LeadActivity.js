import mongoose from 'mongoose';

const leadActivitySchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    type: { type: String, enum: ['call', 'email', 'meeting', 'note', 'status_change', 'assignment'], default: 'note' },
    title: { type: String, required: true },
    description: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model('LeadActivity', leadActivitySchema);
