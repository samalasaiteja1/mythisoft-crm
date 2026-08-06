import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, enum: ['admin', 'manager', 'sales', 'support', 'technical', 'customer'] },
    module: { type: String, required: true },
    access: { type: String, required: true },
  },
  { timestamps: true }
);

permissionSchema.index({ role: 1, module: 1 }, { unique: true });

export default mongoose.model('Permission', permissionSchema);
