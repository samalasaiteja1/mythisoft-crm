import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { milestonesAPI, projectsAPI, staffRolesAPI, usersAPI, tasksAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import MilestonesProjectHub from '../../components/milestones/MilestonesProjectHub';

export default function AdminTechMilestonesView({ completedOnly = false }) {
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const refreshMilestones = () =>
    milestonesAPI.getAll()
      .then(({ data }) => setMilestones(data?.items || []))
      .catch(() => toast.error('Failed to refresh milestones'));

  const load = () => {
    setLoading(true);
    return Promise.all([
      milestonesAPI.getAll(),
      projectsAPI.getAll({ limit: 200 }),
      staffRolesAPI.getAll(),
      usersAPI.getAll(),
      tasksAPI.getAll(),
    ])
      .then(([milestonesRes, projectsRes, teamsRes, usersRes, tasksRes]) => {
        setMilestones(milestonesRes.data?.items || []);
        setProjects(projectsRes.data?.items || projectsRes.data || []);
        const teamList = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.items || [];
        setTeams(teamList.filter((t) => t.teamGroup === 'technical' || String(t.department || '').includes('tech')));
        setEmployees((usersRes.data || []).filter((u) => u.isActive !== false));
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data?.items || []);
      })
      .catch(() => toast.error('Failed to load milestones'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (milestone) => {
    if (!window.confirm(`Delete milestone "${milestone.name}"? This cannot be undone.`)) return;
    setDeletingId(milestone._id);
    try {
      await milestonesAPI.delete(milestone._id);
      toast.success('Milestone deleted');
      refreshMilestones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <MilestonesProjectHub
      milestones={milestones}
      projects={projects}
      teams={teams}
      employees={employees}
      tasks={tasks}
      completedOnly={completedOnly}
      onRefresh={() => {
        refreshMilestones();
        tasksAPI.getAll().then(({ data }) => {
          setTasks(Array.isArray(data) ? data : data?.items || []);
        }).catch(() => {});
      }}
      onDelete={handleDelete}
      deletingId={deletingId}
      title={completedOnly ? 'Completed Milestones' : 'Milestones'}
      subtitle={
        completedOnly
          ? 'Finished phases grouped by project'
          : 'One project at a time — milestones are phases; tasks are daily work under each milestone'
      }
    />
  );
}
