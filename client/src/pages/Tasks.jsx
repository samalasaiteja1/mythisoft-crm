import { useState, useEffect, useMemo } from 'react';

import { useSearchParams, useParams, Link } from 'react-router-dom';

import { Plus, Calendar, List, CheckCircle2, Clock, Users, Flag, Layers, Pencil, Trash2 } from 'lucide-react';

import toast from 'react-hot-toast';

import { tasksAPI, TASK_PRIORITIES, TASK_STATUSES, formatDate } from '../services/api';
import { TASK_STATUS_OPTIONS, normalizeTaskStatus } from '../constants/taskForm';

import LoadingSpinner from '../components/LoadingSpinner';

import StatusBadge from '../components/StatusBadge';

import Modal from '../components/Modal';

import TechManagerCreateTaskForm from '../components/techManager/TechManagerCreateTaskForm';

import { useTechManagerFormData } from '../components/techManager/TechManagerForms';



const projectIdFromTask = (task) => {

  if (!task?.relatedTo || task.relatedTo.type !== 'project') return '';

  return String(task.relatedTo.id?._id || task.relatedTo.id || '');

};



export default function Tasks({ overdueOnly = false }) {

  const { id: routeTaskId } = useParams();

  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('list');

  const [modal, setModal] = useState(null);

  const [editTask, setEditTask] = useState(null);

  const [taskPrefill, setTaskPrefill] = useState(null);

  const [detailTask, setDetailTask] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const urlStatus = searchParams.get('status') || '';

  const [statusFilter, setStatusFilter] = useState(urlStatus === 'pending' ? 'new' : urlStatus);

  const { employees, projects, teams, milestones, loading: formDataLoading } = useTechManagerFormData();



  const projectNameById = useMemo(() => {

    const map = {};

    projects.forEach((p) => { map[String(p._id)] = p.name; });

    return map;

  }, [projects]);



  useEffect(() => {

    setStatusFilter(urlStatus === 'pending' ? 'new' : urlStatus);

  }, [urlStatus]);



  const fetch = () => {

    setLoading(true);

    const params = overdueOnly ? { overdue: 'true' } : {};

    if (!overdueOnly && statusFilter) params.status = statusFilter;

    tasksAPI.getAll(params).then(({ data }) => setTasks(data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));

  };

  useEffect(() => { fetch(); }, [statusFilter, overdueOnly]);



  useEffect(() => {

    const raw = sessionStorage.getItem('taskPrefill');

    if (!raw) return;

    try {

      const prefill = JSON.parse(raw);

      sessionStorage.removeItem('taskPrefill');

      setTaskPrefill({

        title: prefill.title ? (prefill.title.startsWith('Task:') ? prefill.title : `Task: ${prefill.title}`) : '',

        description: prefill.description || '',

        projectId: prefill.projectId || '',

        milestoneId: prefill.milestoneId || '',

        staffRoleId: prefill.staffRoleId || '',

      });

      setEditTask(null);

      setModal('form');

    } catch {

      sessionStorage.removeItem('taskPrefill');

    }

  }, []);



  useEffect(() => {

    if (!routeTaskId) {

      setDetailTask(null);

      return;

    }

    tasksAPI.getOne(routeTaskId)

      .then(({ data }) => setDetailTask(data))

      .catch(() => toast.error('Task not found'));

  }, [routeTaskId]);



  const openCreate = () => {

    setEditTask(null);

    setTaskPrefill(null);

    setModal('form');

  };



  useEffect(() => {

    if (searchParams.get('create') === '1') {

      openCreate();

    }

  }, [searchParams]);



  const openEdit = (task) => {

    setEditTask(task);

    setTaskPrefill(null);

    setModal('form');

  };



  const handleSaved = () => {

    setModal(null);

    setEditTask(null);

    setTaskPrefill(null);

    fetch();

    if (routeTaskId) {

      tasksAPI.getOne(routeTaskId).then(({ data }) => setDetailTask(data));

    }

  };



  const handleDelete = async (task) => {

    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;

    setDeletingId(task._id);

    try {

      await tasksAPI.delete(task._id);

      toast.success('Task deleted');

      if (routeTaskId === task._id) {

        setDetailTask(null);

      }

      fetch();

    } catch (err) {

      toast.error(err.response?.data?.message || 'Delete failed');

    } finally {

      setDeletingId(null);

    }

  };



  const toggleComplete = async (task) => {

    const isDone = task.status === 'completed';

    await tasksAPI.update(task._id, { status: isDone ? 'new' : 'completed' });

    fetch();

  };



  const displayStatus = (status) => normalizeTaskStatus(status);



  const calendarDays = Array.from({ length: 30 }, (_, i) => {

    const d = new Date(); d.setDate(d.getDate() - 15 + i);

    return d;

  });



  const renderProjectLabel = (task) => {

    const pid = projectIdFromTask(task);

    return projectNameById[pid] || task.milestone?.project?.name || '—';

  };



  return (

    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        <div>

          <h1 className="text-2xl font-bold text-white">{overdueOnly ? 'Overdue Tasks' : 'Tasks & Reminders'}</h1>

          <p className="text-gray-400 mt-1">

            {overdueOnly ? 'Tasks past their due date' : 'Create, assign, and track tasks across projects, milestones, and teams'}

          </p>

        </div>

        <div className="flex items-center gap-3">

          <div className="flex bg-myth-surface rounded-lg p-1">

            <button onClick={() => setView('list')} className={`p-2 rounded ${view === 'list' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400'}`}><List size={18} /></button>

            <button onClick={() => setView('calendar')} className={`p-2 rounded ${view === 'calendar' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400'}`}><Calendar size={18} /></button>

          </div>

          <Link to="/dev-board" className="btn-secondary text-sm">Kanban Board</Link>

          <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={18} /> Create Task</button>

        </div>

      </div>



      {detailTask && (

        <div className="card border-myth-accent/30 space-y-3">

          <div className="flex justify-between items-start gap-4">

            <div>

              <h2 className="text-lg font-semibold text-white">{detailTask.title}</h2>

              {detailTask.taskType && (

                <span className="text-xs text-gray-500 mt-1 inline-block">{detailTask.taskType}</span>

              )}

              <p className="text-sm text-gray-400 mt-2">{detailTask.description || 'No description'}</p>

              <div className="flex flex-wrap gap-2 mt-3">

                <StatusBadge status={detailTask.priority} config={TASK_PRIORITIES} />

                <StatusBadge status={displayStatus(detailTask.status)} config={TASK_STATUSES} />

              </div>

            </div>

            <div className="flex items-center gap-2 shrink-0">

              <button type="button" onClick={() => openEdit(detailTask)} className="btn-secondary text-sm inline-flex items-center gap-1">

                <Pencil size={14} /> Edit

              </button>

              <button

                type="button"

                onClick={() => handleDelete(detailTask)}

                disabled={deletingId === detailTask._id}

                className="btn-secondary text-sm text-red-400 hover:text-red-300 inline-flex items-center gap-1 disabled:opacity-50"

              >

                <Trash2 size={14} /> Delete

              </button>

            </div>

          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">

            <div>

              <p className="text-gray-500 text-xs">Project</p>

              <p className="text-gray-200">{renderProjectLabel(detailTask)}</p>

            </div>

            <div>

              <p className="text-gray-500 text-xs">Milestone</p>

              <p className="text-gray-200">{detailTask.milestone?.name || '—'}</p>

            </div>

            <div>

              <p className="text-gray-500 text-xs">Team</p>

              <p className="text-gray-200">{detailTask.staffRole?.name || '—'}</p>

            </div>

            <div>

              <p className="text-gray-500 text-xs">Assignee</p>

              <p className="text-gray-200">

                {detailTask.assignedTo ? `${detailTask.assignedTo.firstName} ${detailTask.assignedTo.lastName}` : '—'}

              </p>

            </div>

            <div>

              <p className="text-gray-500 text-xs">Start</p>

              <p className="text-gray-200">{detailTask.startDate ? formatDate(detailTask.startDate) : '—'}</p>

            </div>

            <div>

              <p className="text-gray-500 text-xs">Due</p>

              <p className="text-gray-200">{detailTask.dueDate ? formatDate(detailTask.dueDate) : '—'}</p>

            </div>

            <div>

              <p className="text-gray-500 text-xs">Est. Hours</p>

              <p className="text-gray-200">{detailTask.estimatedHours ?? '—'}</p>

            </div>

          </div>

          {detailTask.remarks && (

            <p className="text-sm text-gray-400 border-t border-myth-border pt-3">{detailTask.remarks}</p>

          )}

        </div>

      )}



      {view === 'list' ? (

        <>

          {!overdueOnly && (

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-48">

              <option value="">All Statuses</option>

              {TASK_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}

            </select>

          )}

          {loading ? <LoadingSpinner /> : (

            <div className="space-y-3">

              {tasks.map((task) => (

                <div key={task._id} className="card hover:border-myth-accent/30 transition-all">

                  <div className="flex items-start gap-4">

                    <button

                      onClick={() => toggleComplete(task)}

                      className={`shrink-0 mt-1 ${task.status === 'completed' ? 'text-green-400' : 'text-gray-500 hover:text-myth-accent'}`}

                    >

                      <CheckCircle2 size={22} />

                    </button>

                    <div className="flex-1 min-w-0 space-y-2">

                      <div className="flex flex-wrap items-center gap-2">

                        <Link

                          to={`/tasks/${task._id}`}

                          className={`font-medium hover:text-myth-accent ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}

                        >

                          {task.title}

                        </Link>

                        {task.taskType && (

                          <span className="text-[10px] px-2 py-0.5 rounded bg-myth-surface text-gray-400">{task.taskType}</span>

                        )}

                        <StatusBadge status={displayStatus(task.status)} config={TASK_STATUSES} />

                        <StatusBadge status={task.priority} config={TASK_PRIORITIES} />

                      </div>

                      {task.description && <p className="text-sm text-gray-400 line-clamp-2">{task.description}</p>}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">

                        <span className="flex items-center gap-1">

                          <Layers size={12} /> {renderProjectLabel(task)}

                        </span>

                        {task.milestone?.name && (

                          <span className="flex items-center gap-1">

                            <Flag size={12} /> {task.milestone.name}

                          </span>

                        )}

                        {task.staffRole?.name && (

                          <span className="flex items-center gap-1">

                            <Users size={12} /> {task.staffRole.name}

                          </span>

                        )}

                        {task.assignedTo && (

                          <span>

                            {task.assignedTo.firstName} {task.assignedTo.lastName}

                          </span>

                        )}

                        {task.startDate && (

                          <span>Start {formatDate(task.startDate)}</span>

                        )}

                        {task.dueDate && (

                          <span className="flex items-center gap-1">

                            <Clock size={12} /> Due {formatDate(task.dueDate)}

                          </span>

                        )}

                        {task.estimatedHours != null && task.estimatedHours !== '' && (

                          <span>{task.estimatedHours}h est.</span>

                        )}

                      </div>

                    </div>

                    <div className="flex items-center gap-2 shrink-0">

                      <button

                        type="button"

                        onClick={() => openEdit(task)}

                        className="p-1.5 rounded hover:bg-myth-accent/10 text-gray-400 hover:text-myth-accent"

                        title="Edit task"

                      >

                        <Pencil size={16} />

                      </button>

                      <button

                        type="button"

                        onClick={() => handleDelete(task)}

                        disabled={deletingId === task._id}

                        className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 disabled:opacity-50"

                        title="Delete task"

                      >

                        <Trash2 size={16} />

                      </button>

                    </div>

                  </div>

                </div>

              ))}

              {tasks.length === 0 && <div className="text-center py-12 text-gray-500">No tasks found</div>}

            </div>

          )}

        </>

      ) : (

        <div className="card overflow-x-auto">

          <div className="grid grid-cols-7 gap-2 min-w-[700px]">

            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (

              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>

            ))}

            {calendarDays.map((day) => {

              const dayTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === day.toDateString());

              const isToday = day.toDateString() === new Date().toDateString();

              return (

                <div key={day.toISOString()} className={`min-h-[80px] p-2 rounded-lg border ${isToday ? 'border-myth-accent bg-myth-accent/5' : 'border-myth-border bg-myth-surface/30'}`}>

                  <p className={`text-xs font-medium mb-1 ${isToday ? 'text-myth-accent' : 'text-gray-400'}`}>{day.getDate()}</p>

                  {dayTasks.map((t) => (

                    <button

                      key={t._id}

                      type="button"

                      onClick={() => openEdit(t)}

                      className="text-[10px] bg-myth-accent/20 text-myth-accent rounded px-1 py-0.5 mb-0.5 truncate w-full text-left"

                    >

                      {t.title}

                    </button>

                  ))}

                </div>

              );

            })}

          </div>

        </div>

      )}



      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editTask ? 'Edit Task' : 'Create Task'} size="xl">

        {formDataLoading ? <LoadingSpinner /> : (

          <TechManagerCreateTaskForm

            task={editTask}

            initialPrefill={taskPrefill}

            projects={projects}

            teams={teams}

            milestones={milestones}

            employees={employees}

            onCancel={() => setModal(null)}

            onSaved={handleSaved}

            onDeleted={handleSaved}

          />

        )}

      </Modal>

    </div>

  );

}

