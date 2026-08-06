import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ListTodo, User, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  tasksAPI,
  projectsAPI,
  milestonesAPI,
  staffRolesAPI,
  usersAPI,
  formatDate,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import TechManagerCreateTaskForm from '../../components/techManager/TechManagerCreateTaskForm';
import { normalizeTaskStatus } from '../../constants/taskForm';

const projectIdFromTask = (task) => {
  if (task?.relatedTo?.type === 'project') {
    return String(task.relatedTo.id?._id || task.relatedTo.id || '');
  }
  const mProj = task.milestone?.project;
  if (mProj) return String(mProj._id || mProj);
  return '';
};

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'manager', label: 'Task Manager' },
  { key: 'tech', label: 'Tech Person' },
  { key: 'unassigned', label: 'Unassigned' },
];

export default function AdminTechTasksView() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    return Promise.all([
      tasksAPI.getAll(),
      projectsAPI.getAll({ limit: 200 }),
      staffRolesAPI.getAll(),
      milestonesAPI.getAll(),
      usersAPI.getAll(),
    ])
      .then(([tasksRes, projectsRes, teamsRes, milestonesRes, usersRes]) => {
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data?.items || []);
        setProjects(projectsRes.data?.items || projectsRes.data || []);
        const teamList = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.items || [];
        setTeams(teamList.filter((t) => t.teamGroup === 'technical' || String(t.department || '').includes('tech')));
        setMilestones(milestonesRes.data?.items || milestonesRes.data || []);
        const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
        setEmployees(allUsers.filter((u) => u.isActive !== false && (u.role === 'technical' || u.role === 'manager')));
      })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const projectNameById = useMemo(() => {
    const map = {};
    projects.forEach((p) => { map[String(p._id)] = p.name; });
    return map;
  }, [projects]);

  const filteredTasks = useMemo(() => {
    let list = tasks.filter((t) => !t.isAnnouncement);
    if (filter === 'manager') {
      list = list.filter((t) => t.technicalManager || t.createdBy?.role === 'manager');
    } else if (filter === 'tech') {
      list = list.filter((t) => t.assignedTo?.role === 'technical');
    } else if (filter === 'unassigned') {
      list = list.filter((t) => !t.assignedTo);
    }
    return list;
  }, [tasks, filter]);

  const projectsWithTasks = useMemo(() => {
    const ids = new Set(filteredTasks.map((t) => projectIdFromTask(t)).filter(Boolean));
    const withTasks = projects.filter((p) => ids.has(String(p._id)));
    const orphan = filteredTasks.filter((t) => !projectIdFromTask(t));
    return { withTasks, orphan };
  }, [filteredTasks, projects]);

  const openCreate = () => {
    setEditTask(null);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditTask(null);
    tasksAPI.getAll()
      .then(({ data }) => setTasks(Array.isArray(data) ? data : data?.items || []))
      .catch(() => toast.error('Failed to refresh tasks'));
  };

  if (loading) return <LoadingSpinner />;

  const renderTaskRow = (task) => (
    <tr key={task._id} className="border-t border-myth-border">
      <td className="table-cell">
        <Link to={`/tasks/${task._id}`} className="text-white font-medium hover:text-myth-accent">
          {task.title}
        </Link>
        {task.taskType && (
          <span className="block text-[10px] text-gray-500 mt-0.5">{task.taskType}</span>
        )}
      </td>
      <td className="table-cell text-gray-400">{task.milestone?.name || '—'}</td>
      <td className="table-cell">
        <StatusBadge status={normalizeTaskStatus(task.status)} config={TASK_STATUSES} />
      </td>
      <td className="table-cell">
        <StatusBadge status={task.priority} config={TASK_PRIORITIES} />
      </td>
      <td className="table-cell text-gray-400 text-xs">
        {task.technicalManager ? (
          <span className="flex items-center gap-1">
            <User size={12} className="shrink-0" />
            {task.technicalManager.firstName} {task.technicalManager.lastName}
          </span>
        ) : '—'}
      </td>
      <td className="table-cell text-gray-400 text-xs">
        {task.assignedTo ? (
          `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
        ) : (
          <span className="text-gray-500">Unassigned</span>
        )}
      </td>
      <td className="table-cell text-gray-500 text-xs">
        {task.dueDate ? formatDate(task.dueDate) : '—'}
      </td>
      <td className="table-cell text-right">
        <button type="button" onClick={() => openEdit(task)} className="text-sm text-myth-accent hover:underline">
          Edit
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo className="text-cyan-400" size={24} />
            Tasks
          </h1>
          <p className="text-gray-400 mt-1">
            Create tasks and view work from technical managers and tech team members
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <Plus size={18} />
          Create Task
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilter(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === opt.key
                ? 'bg-myth-accent/20 text-myth-accent font-medium'
                : 'bg-myth-surface text-gray-400 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="text-xs text-gray-500 self-center ml-2">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="card text-center py-14">
          <ListTodo size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No tasks yet</p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} />
            Create Task
          </button>
        </div>
      ) : (
        <>
          {projectsWithTasks.withTasks.map((project) => {
            const projectTasks = filteredTasks.filter(
              (t) => projectIdFromTask(t) === String(project._id)
            );
            return (
              <div key={project._id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                    <Link to={`/projects/${project._id}`} className="text-sm text-myth-accent hover:underline">
                      Open project
                    </Link>
                  </div>
                  <span className="text-xs text-gray-500">
                    {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="table-header">Task</th>
                        <th className="table-header">Milestone</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">Priority</th>
                        <th className="table-header">Tech Manager</th>
                        <th className="table-header">Assignee</th>
                        <th className="table-header">Due</th>
                        <th className="table-header" />
                      </tr>
                    </thead>
                    <tbody>
                      {projectTasks.map(renderTaskRow)}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {projectsWithTasks.orphan.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Other Tasks</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header">Task</th>
                      <th className="table-header">Milestone</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Priority</th>
                      <th className="table-header">Tech Manager</th>
                      <th className="table-header">Assignee</th>
                      <th className="table-header">Due</th>
                      <th className="table-header" />
                    </tr>
                  </thead>
                  <tbody>
                    {projectsWithTasks.orphan.map(renderTaskRow)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        title={editTask ? 'Edit Task' : 'Create Task'}
        size="xl"
      >
        <TechManagerCreateTaskForm
          key={editTask?._id || 'create'}
          variant="admin"
          task={editTask}
          projects={projects}
          teams={teams}
          milestones={milestones}
          employees={employees}
          onCancel={() => { setModalOpen(false); setEditTask(null); }}
          onSaved={handleSaved}
        />
      </Modal>
    </div>
  );
}
