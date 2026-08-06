import mongoose from 'mongoose';

const customerFeedbackSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket' },
    projectRating: { type: Number, min: 1, max: 5 },
    supportRating: { type: Number, min: 1, max: 5 },
    overallExperience: { type: Number, min: 1, max: 5 },
    suggestions: String,
    testimonial: String,
    published: { type: Boolean, default: false },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('CustomerFeedback', customerFeedbackSchema);
