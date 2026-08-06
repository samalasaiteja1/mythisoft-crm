import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { DEV_BOARD_STAGES } from '../constants/crmLifecycle';
import toast from 'react-hot-toast';
import { tasksAPI, formatDate, TASK_PRIORITIES, TASK_STATUSES } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import TechManagerCreateTaskForm from '../components/techManager/TechManagerCreateTaskForm';
import { useTechManagerFormData } from '../components/techManager/TechManagerForms';
import { normalizeTaskStatus } from '../constants/taskForm';

const STAGE_LABELS = {
  backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress',
  code_review: 'Code Review', testing: 'Testing', completed: 'Completed',
};

export default function DevTaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { employees, projects, teams, milestones, loading: formDataLoading } = useTechManagerFormData();

  const fetch = () => {
    setLoading(true);
    tasksAPI.getAll().then(({ data }) => setTasks(Array.isArray(data) ? data : data.tasks || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const getStage = (t) => t.devStage || 'todo';

  const moveStage = async (task, stage) => {
    await tasksAPI.update(task._id, {
      devStage: stage,
      status: stage === 'completed' ? 'completed' : 'in_progress',
    });
    fetch();
  };

  const openEdit = (task) => {
    setEditTask(task);
    setModal('form');
  };

  const openCreate = () => {
    setEditTask(null);
    setModal('form');
  };

  const handleSaved = () => {
    setModal(null);
    setEditTask(null);
    fetch();
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
    setDeletingId(task._id);
    try {
      await tasksAPI.delete(task._id);
      toast.success('Task deleted');
      if (editTask?._id === task._id) {
        setModal(null);
        setEditTask(null);
      }
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board (Kanban)</h1>
          <p className="text-gray-400 mt-1">Drag tasks through development stages — click a card to edit</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary text-sm">
          Create Task
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEV_BOARD_STAGES.map((stage) => (
          <div key={stage} className="min-w-[260px] flex-1">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">{STAGE_LABELS[stage]}</h3>
            <div className="space-y-3 min-h-[200px]">
              {tasks.filter((t) => getStage(t) === stage).map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => openEdit(t)}
                  className="card p-4 w-full text-left hover:border-myth-accent/40 transition-colors"
                >
                  <p className="text-white font-medium text-sm">{t.title}</p>
                  {t.taskType && <p className="text-[10px] text-gray-500 mt-0.5">{t.taskType}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned'}
                  </p>
                  {t.milestone?.name && (
                    <p className="text-[10px] text-gray-500 truncate">{t.milestone.name}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <StatusBadge status={t.priority} config={TASK_PRIORITIES} />
                    <StatusBadge status={normalizeTaskStatus(t.status)} config={TASK_STATUSES} />
                  </div>
                  {t.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">{formatDate(t.dueDate)}</p>
                  )}
                  <div className="flex gap-1 mt-2 items-center justify-between">
                    <div className="flex gap-1">
                    {DEV_BOARD_STAGES.filter((s) => s !== stage).slice(0, 2).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveStage(t, s); }}
                        className="text-[10px] px-2 py-0.5 rounded bg-myth-surface text-gray-400 hover:text-myth-accent"
                      >
                        → {STAGE_LABELS[s]}
                      </button>
                    ))}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(t); }}
                      disabled={deletingId === t._id}
                      className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 disabled:opacity-50"
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editTask ? 'Edit Task' : 'Create Task'} size="xl">
        {formDataLoading ? <LoadingSpinner /> : (
          <TechManagerCreateTaskForm
            task={editTask}
            projects={projects}
            teams={teams}
            milestones={milestones}
            employees={employees}
            onCancel={() => setModal(null)}
            onSaved={handleSaved}
            onDeleted={handleSaved}
            showSaveAndNew={!editTask}
          />
        )}
      </Modal>
    </div>
  );
}
