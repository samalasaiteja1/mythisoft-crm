import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    industry: String,
    website: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    logo: String,
    employeeCount: String,
    annualRevenue: Number,
    description: String,
    tags: [String],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'inactive', 'prospect'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Company', companySchema);
