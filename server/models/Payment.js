import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, unique: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ['bank_transfer', 'upi', 'card', 'cash', 'cheque', 'other'],
      default: 'bank_transfer',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: String,
    paidAt: Date,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

paymentSchema.pre('save', async function (next) {
  if (!this.paymentNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    this.paymentNumber = `PAY-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Payment', paymentSchema);
