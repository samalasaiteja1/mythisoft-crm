import mongoose from 'mongoose';

const workTeamSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: String,
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sales: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    technical: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    support: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

workTeamSchema.virtual('isComplete').get(function () {
  return Boolean(this.manager && this.sales && this.technical && this.support);
});

workTeamSchema.set('toJSON', { virtuals: true });
workTeamSchema.set('toObject', { virtuals: true });

export const WORK_TEAM_SLOTS = ['manager', 'sales', 'technical', 'support'];

export const SLOT_ROLE = {
  manager: 'manager',
  sales: 'sales',
  technical: 'technical',
  support: 'support',
};

export default mongoose.model('WorkTeam', workTeamSchema);
