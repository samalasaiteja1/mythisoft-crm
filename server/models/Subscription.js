import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    plan: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'professional' },
    status: { type: String, enum: ['active', 'trial', 'suspended', 'cancelled'], default: 'active' },
    seats: { type: Number, default: 10 },
    monthlyPrice: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Subscription', subscriptionSchema);
