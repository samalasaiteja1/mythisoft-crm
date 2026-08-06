import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    companyName: String,
    gstNumber: String,
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    title: String,
    designation: String,
    alternatePhone: String,
    website: String,
    companyLogo: String,
    avatar: String,
    address: {
      street: String,
      street2: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    status: { type: String, enum: ['active', 'inactive', 'vip'], default: 'active' },
    lifetimeValue: { type: Number, default: 0 },
    tags: [String],
    notes: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supportAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leadRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    portalUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Customer', customerSchema);
