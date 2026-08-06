import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 30 },
    type: { type: String, enum: ['call', 'video', 'in_person'], default: 'call' },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
    location: String,
    notes: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Meeting', meetingSchema);
