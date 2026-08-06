import { useState } from 'react';
import { MessageSquare, Paperclip, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';

function personName(user) {
  if (!user) return 'Unknown';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
}

export default function SupportTaskProgressPanel({
  projectId,
  taskId,
  progressUpdates = [],
  readOnly = false,
  onUpdated,
}) {
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!comment.trim() && !file) {
      toast.error('Add a comment or choose a file');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (comment.trim()) formData.append('comment', comment.trim());
      if (file) formData.append('file', file);

      const { data } = await projectsAPI.addSupportTaskProgress(projectId, taskId, formData);
      setComment('');
      setFile(null);
      toast.success('Progress updated');
      onUpdated?.(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update progress');
    } finally {
      setSubmitting(false);
    }
  };

  const updates = [...(progressUpdates || [])].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );

  return (
    <div className="card space-y-4">
      <p className="text-sm font-medium text-white flex items-center gap-2">
        <MessageSquare size={16} className="text-orange-400" />
        Progress updates
      </p>

      {!readOnly && (
        <form onSubmit={submit} className="space-y-3 border border-myth-border rounded-lg p-3 bg-myth-surface/30">
          <textarea
            className="input-field w-full min-h-[72px] text-sm"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment about your progress…"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn-secondary text-sm inline-flex items-center gap-2 cursor-pointer">
              <Upload size={14} />
              {file ? file.name : 'Upload file'}
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? 'Saving…' : 'Update progress'}
            </button>
          </div>
        </form>
      )}

      {updates.length === 0 ? (
        <p className="text-sm text-gray-500">No progress updates yet.</p>
      ) : (
        <ul className="space-y-3">
          {updates.map((entry, i) => (
            <li key={entry._id || i} className="border border-myth-border/60 rounded-lg p-3 bg-myth-surface/20">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                <p className="text-sm text-white font-medium">{personName(entry.author)}</p>
                <p className="text-xs text-gray-500">{entry.createdAt ? formatDateTime(entry.createdAt) : ''}</p>
              </div>
              {entry.text && (
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{entry.text}</p>
              )}
              {entry.attachments?.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {entry.attachments.map((att, j) => (
                    <li key={j}>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-myth-accent hover:underline inline-flex items-center gap-1"
                      >
                        <Paperclip size={12} /> {att.name || 'Attachment'}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
