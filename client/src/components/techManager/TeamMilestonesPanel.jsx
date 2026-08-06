import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { tasksAPI } from '../../services/api';
import MilestonesProjectHub from '../milestones/MilestonesProjectHub';

/** Milestones list for team hub — same grouped view as /projects/milestones */
export default function TeamMilestonesPanel({
  milestones = [],
  projects = [],
  teams = [],
  employees = [],
  onRefresh,
}) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    tasksAPI.getAll()
      .then(({ data }) => setTasks(Array.isArray(data) ? data : data?.items || []))
      .catch(() => {});
  }, [milestones.length]);

  return (
    <MilestonesProjectHub
      milestones={milestones}
      projects={projects}
      teams={teams}
      employees={employees}
      tasks={tasks}
      onRefresh={() => {
        onRefresh?.();
        tasksAPI.getAll()
          .then(({ data }) => setTasks(Array.isArray(data) ? data : data?.items || []))
          .catch(() => toast.error('Failed to refresh tasks'));
      }}
      title="Milestones by Project"
      subtitle="Same view as Projects → Milestones — filter by project to avoid confusion"
    />
  );
}
