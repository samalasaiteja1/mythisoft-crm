import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    description: String,
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

teamSchema.pre('save', function syncTeamFields(next) {
  this.isActive = this.status !== 'inactive';
  next();
});

export default mongoose.model('Team', teamSchema);
