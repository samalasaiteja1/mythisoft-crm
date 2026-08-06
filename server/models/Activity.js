import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'call', 'email', 'meeting', 'note', 'task', 'deal', 'lead', 'customer', 'followup', 'system',
        'project', 'department', 'product', 'quotation', 'ticket', 'invoice', 'payment', 'expense',
        'document',
      ],
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedTo: {
      type: { type: String, enum: ['lead', 'customer', 'deal', 'contact', 'company', 'task', 'meeting', 'followup', 'project', 'department', 'product', 'quotation', 'ticket', 'invoice', 'payment', 'expense', 'document'] },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model('Activity', activitySchema);
