import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: String,
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    items: [lineItemSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    dueDate: Date,
    sentAt: Date,
    paidAt: Date,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
