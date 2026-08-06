import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['email', 'sms', 'call', 'chat'], required: true },
    subject: String,
    body: { type: String, required: true },
    from: String,
    to: String,
    status: { type: String, enum: ['sent', 'delivered', 'failed', 'pending'], default: 'pending' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedTo: {
      type: { type: String, enum: ['lead', 'customer', 'deal', 'contact'] },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Communication', communicationSchema);
