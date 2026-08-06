import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    mobile: String,
    title: String,
    department: String,
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    avatar: String,
    isPrimary: { type: Boolean, default: false },
    socialLinks: {
      linkedin: String,
      twitter: String,
    },
    notes: String,
    tags: [String],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Contact', contactSchema);
