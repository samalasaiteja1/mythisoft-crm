import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { normalizeTaskStatus } from '../../constants/supportExecutive';
import {
  allStatusDropdownOptions,
  taskStatusMeta,
} from '../../constants/supportTaskStatusFlows';

export default function SupportTaskStatusUpdate({
  task,
  busy = false,
  onUpdate,
  notes = '',
  showNotesOnComplete = false,
  compact = false,
  className = '',
}) {
  const taskType = task.taskType || task.taskKey;
  const current = normalizeTaskStatus(task.status);
  const options = allStatusDropdownOptions(taskType, current);
  const [selected, setSelected] = useState(current);
  const [localNotes, setLocalNotes] = useState(notes);

  useEffect(() => {
    setSelected(current);
  }, [current, task._id]);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes, task._id]);

  const isCompleted = current === 'completed';
  const changed = selected !== current;
  const completing = selected === 'completed' && changed;

  const handleUpdate = () => {
    if (!changed || options.find((o) => o.value === selected)?.disabled) return;
    onUpdate(selected, completing ? localNotes.trim() : notes);
  };

  if (isCompleted) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-400 ${className}`}>
        <CheckCircle size={16} />
        {taskStatusMeta(taskType, 'completed').label}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className={`flex flex-wrap items-end gap-2 ${compact ? '' : 'sm:gap-3'}`}>
        <div className={compact ? 'min-w-[140px] flex-1' : 'flex-1 min-w-[180px]'}>
          <label className="block text-xs text-gray-500 mb-1">Task status</label>
          <select
            className="input-field w-full text-sm"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={busy}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}{opt.disabled && opt.value !== current ? ' (not available)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={`btn-primary ${compact ? 'text-xs py-1.5 px-3' : 'text-sm'} shrink-0`}
          disabled={busy || !changed || options.find((o) => o.value === selected)?.disabled}
          onClick={handleUpdate}
        >
          {busy ? 'Updating…' : 'Update status'}
        </button>
      </div>
      {(showNotesOnComplete && completing) && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Completion notes (optional)</label>
          <textarea
            className="input-field w-full min-h-[72px] text-sm"
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="Add notes when completing this task…"
            disabled={busy}
          />
        </div>
      )}
    </div>
  );
}
