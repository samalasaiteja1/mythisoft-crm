import { Link } from 'react-router-dom';
import { Play, CheckCircle, MessageSquare, Eye } from 'lucide-react';
import { actionsForTaskStatus } from '../../constants/supportTaskStatusFlows';
import { supportTaskDetailPath } from '../../utils/supportTaskPaths';

const ICONS = {
  start: Play,
  complete: CheckCircle,
  wait: MessageSquare,
};

export default function SupportTaskActions({
  task,
  busy = false,
  onUpdate,
  showView = true,
  size = 'xs',
  align = 'start',
}) {
  const projectId = task.project?._id || task.project;
  const taskType = task.taskType || task.taskKey;
  const actions = actionsForTaskStatus(taskType, task.status);
  const pad = size === 'xs' ? 'text-xs py-1 px-2' : 'text-sm py-1.5 px-3';
  const alignClass = align === 'end' ? 'justify-end' : 'justify-start';

  const handleAction = (status) => {
    onUpdate(task, status);
  };

  return (
    <div className={`flex flex-wrap gap-1 ${alignClass}`}>
      {showView && projectId && task._id && (
        <Link
          to={supportTaskDetailPath(projectId, task._id, task)}
          className={`btn-secondary ${pad} inline-flex items-center gap-1`}
        >
          <Eye size={size === 'xs' ? 12 : 14} /> View
        </Link>
      )}
      {actions.map((action) => {
        const Icon = ICONS[action.icon];
        const btnClass = action.primary ? 'btn-primary' : 'btn-secondary';
        return (
          <button
            key={`${action.status}-${action.label}`}
            type="button"
            disabled={busy}
            onClick={() => handleAction(action.status)}
            className={`${btnClass} ${pad} inline-flex items-center gap-1`}
          >
            {Icon && <Icon size={size === 'xs' ? 12 : 14} />}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
