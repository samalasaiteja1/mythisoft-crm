import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, trim: true, unique: true, sparse: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: String,
    employeeId: { type: String, trim: true, unique: true, sparse: true },
    employmentType: { type: String, enum: ['full_time', 'part_time', 'contract'], default: 'full_time' },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: ['admin', 'manager', 'sales', 'support', 'technical', 'customer'],
      default: 'sales',
    },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    customerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    staffRole: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffRole' },
    workTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkTeam' },
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    departmentName: String,
    isActive: { type: Boolean, default: true },
    joiningDate: { type: Date },
    hrProfile: {
      gender: { type: String, enum: ['male', 'female', 'other'] },
      dateOfBirth: Date,
      personalEmail: String,
      address: String,
      city: String,
      state: String,
      country: String,
      pinCode: String,
      designation: String,
      workLocation: String,
      shift: { type: String, enum: ['general', 'morning', 'evening', 'night'], default: 'general' },
      salary: Number,
      salaryType: { type: String, enum: ['monthly', 'annual', 'hourly'], default: 'monthly' },
      bankName: String,
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      highestQualification: String,
      experienceYears: Number,
      primarySkill: String,
      secondarySkill: String,
      certifications: String,
      emergencyContactName: String,
      emergencyContactRelationship: String,
      emergencyContactPhone: String,
      remarks: String,
      documents: {
        resume: String,
        aadhaar: String,
        pan: String,
        educationalCertificates: String,
        passportPhoto: String,
      },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      theme: { type: String, default: 'dark' },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('User', userSchema);
