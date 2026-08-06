import mongoose from 'mongoose';

const whatsAppMessageSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    direction: { type: String, enum: ['outbound', 'inbound'], default: 'outbound' },
    template: String,
    status: { type: String, enum: ['queued', 'sent', 'delivered', 'read', 'failed'], default: 'sent' },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('WhatsAppMessage', whatsAppMessageSchema);
