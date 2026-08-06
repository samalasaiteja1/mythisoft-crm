import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedTo: {
      type: { type: String, enum: ['lead', 'customer', 'deal', 'contact', 'company'], required: true },
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Note', noteSchema);
