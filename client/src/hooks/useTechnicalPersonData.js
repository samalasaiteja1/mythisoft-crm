import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, milestonesAPI, projectsAPI, ticketsAPI } from '../services/api';

export function useTechnicalPersonData() {
  const { user } = useAuth();
  const userId = user?._id;
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    if (!userId) return Promise.resolve();
    setLoading(true);
    return Promise.all([
      tasksAPI.getAll({ assignedTo: userId }),
      projectsAPI.getAll({ limit: 100 }),
      milestonesAPI.getAll(),
      ticketsAPI.getAll(),
    ])
      .then(([tasksRes, projectsRes, milestonesRes, ticketsRes]) => {
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
        setProjects(projectsRes.data?.items || projectsRes.data || []);
        const allMilestones = Array.isArray(milestonesRes.data) ? milestonesRes.data : milestonesRes.data?.items || [];
        const projectIds = new Set((projectsRes.data?.items || projectsRes.data || []).map((p) => String(p._id)));
        setMilestones(allMilestones.filter((m) => projectIds.has(String(m.project?._id || m.project))));
        const items = ticketsRes.data?.items || ticketsRes.data || [];
        setBugs(items.filter((t) =>
          (t.category === 'bug' || t.technicalStatus)
          && String(t.technicalAssignee?._id || t.technicalAssignee) === String(userId)
        ));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [userId]);

  return { user, tasks, projects, milestones, bugs, loading, refresh };
}
