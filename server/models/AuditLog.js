import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    module: String,
    resourceId: String,
    details: mongoose.Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
