import mongoose from 'mongoose';

const TEAM_GROUPS = ['manager', 'sales', 'technical', 'support'];

export const inferTeamDepartment = (team) => {
  if (!team) return null;
  if (team.department && TEAM_GROUPS.includes(team.department)) return team.department;
  if (team.teamGroup !== 'manager') return team.teamGroup;

  const name = (team.name || '').trim().toLowerCase();
  const code = (team.code || '').trim().toLowerCase();
  const hay = `${name} ${code} ${team.description || ''}`.toLowerCase();

  if (/^(sm|msale|sales?\d*)/.test(name) || /\bsale/.test(hay)) return 'sales';
  if (/^(tm|mt|tech\d*)/.test(name) || /\btech/.test(hay)) return 'technical';
  if (/^support/.test(name) || /\bsupport/.test(hay)) return 'support';
  return 'manager';
};

const staffRoleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    teamGroup: { type: String, required: true, enum: TEAM_GROUPS },
    department: { type: String, enum: TEAM_GROUPS },
    description: String,
    teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teamManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    departmentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    projectRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    roleRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    teamType: { type: String, trim: true },
    maxMembers: { type: Number, min: 1 },
    startDate: { type: Date },
    endDate: { type: Date },
    remarks: String,
    memberRoleLabels: {
      type: Map,
      of: String,
      default: undefined,
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

staffRoleSchema.index({ teamGroup: 1, code: 1 });

export { TEAM_GROUPS };
export default mongoose.model('StaffRole', staffRoleSchema);
