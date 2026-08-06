import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { MILESTONE_STATUSES } from '../../constants/milestoneForm';
import StatusBadge from '../../components/StatusBadge';
import { useTechnicalPersonData } from '../../hooks/useTechnicalPersonData';
import { TechPersonPageHeader, TechPersonContentCard, TechPersonEmptyState } from '../../components/technical/technicalPersonUi';

export default function TechnicalMilestones() {
  const { projects, milestones, loading } = useTechnicalPersonData();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechPersonPageHeader
        icon={Flag}
        title="Project Milestones"
        subtitle="Milestone progress for your assigned projects"
      />
      {projects.length === 0 ? (
        <TechPersonEmptyState icon={Flag} message="No assigned projects" />
      ) : projects.map((project) => {
        const projectMilestones = milestones.filter((m) => String(m.project?._id || m.project) === String(project._id));
        return (
          <TechPersonContentCard key={project._id}>
            <div className="flex justify-between items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold text-white">{project.name}</h2>
              <Link to="/technical/tasks" className="btn-secondary text-sm">View Tasks</Link>
            </div>
            {projectMilestones.length === 0 ? (
              <p className="text-gray-500 text-sm">No milestones defined</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Milestone Name</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {projectMilestones.map((m) => (
                    <tr key={m._id} className="border-t border-myth-border">
                      <td className="table-cell text-white">{m.name}</td>
                      <td className="table-cell text-gray-400">{m.milestoneType || '—'}</td>
                      <td className="table-cell"><StatusBadge status={m.status} config={MILESTONE_STATUSES} /></td>
                      <td className="table-cell text-gray-400">{m.progress ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TechPersonContentCard>
        );
      })}
    </div>
  );
}
