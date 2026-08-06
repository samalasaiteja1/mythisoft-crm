import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: String,
    type: { type: String, enum: ['info', 'success', 'warning', 'error', 'task', 'deal', 'lead', 'project', 'ticket'], default: 'info' },
    link: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
