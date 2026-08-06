import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { feedbackAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const emptyForm = { projectRating: 5, supportRating: 5, overallExperience: 5, suggestions: '', testimonial: '' };

export default function CustomerFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetch = () => {
    feedbackAPI.getAll().then(({ data }) => setFeedbacks(data)).catch(() => toast.error('Failed to load feedback')).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await feedbackAPI.create(form);
    toast.success('Feedback submitted');
    setModal(false);
    fetch();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Customer Feedback</h1><p className="text-gray-400 mt-1">Project ratings, support ratings, and testimonials</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">Submit Feedback</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {feedbacks.length === 0 ? <p className="text-gray-500 col-span-2 text-center py-8">No feedback yet</p>
          : feedbacks.map((f) => (
            <div key={f._id} className="card">
              <div className="flex gap-1 mb-2">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} className={s <= (f.overallExperience || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />)}</div>
              <p className="text-white text-sm mb-2">{f.testimonial || f.suggestions || 'No comment'}</p>
              <p className="text-xs text-gray-500">Project: {f.projectRating}/5 · Support: {f.supportRating}/5 {f.published && '· Published'}</p>
              {!f.published && <button onClick={() => feedbackAPI.publish(f._id).then(fetch)} className="text-myth-accent text-xs mt-2 hover:underline">Publish Testimonial</button>}
            </div>
          ))}
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Submit Feedback">
        <form onSubmit={handleSubmit} className="space-y-4">
          {['projectRating', 'supportRating', 'overallExperience'].map((field) => (
            <div key={field}><label className="block text-sm text-gray-400 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
              <input type="number" min="1" max="5" className="input-field w-full" value={form[field]} onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })} /></div>
          ))}
          <div><label className="block text-sm text-gray-400 mb-1">Suggestions</label><textarea className="input-field w-full h-20" value={form.suggestions} onChange={(e) => setForm({ ...form, suggestions: e.target.value })} /></div>
          <div><label className="block text-sm text-gray-400 mb-1">Testimonial</label><textarea className="input-field w-full h-20" value={form.testimonial} onChange={(e) => setForm({ ...form, testimonial: e.target.value })} /></div>
          <button type="submit" className="btn-primary w-full">Submit</button>
        </form>
      </Modal>
    </div>
  );
}
