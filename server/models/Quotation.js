import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  description: String,
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, unique: true },
    title: { type: String, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    items: [lineItemSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'approved', 'rejected', 'expired'],
      default: 'draft',
    },
    validUntil: Date,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
  },
  { timestamps: true }
);

quotationSchema.pre('save', async function (next) {
  if (!this.quotationNumber) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationNumber = `QT-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Quotation', quotationSchema);
