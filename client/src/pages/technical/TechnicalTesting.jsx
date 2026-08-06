import { Link } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTechnicalPersonData } from '../../hooks/useTechnicalPersonData';
import { normalizeWorkStatus, TECH_WORK_STATUS_LABELS } from '../../constants/technicalPersonForm';
import { TechPersonPageHeader, TechPersonContentCard, TechPersonEmptyState } from '../../components/technical/technicalPersonUi';

export default function TechnicalTesting() {
  const { tasks, loading } = useTechnicalPersonData();

  const testingTasks = tasks.filter((t) => {
    const ws = normalizeWorkStatus(t);
    return ws === 'testing' || t.devStage === 'testing' || (t.testResult && t.testResult.status !== 'pending');
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechPersonPageHeader
        icon={FlaskConical}
        title="Testing"
        subtitle="Test results for your tasks"
      />
      <div className="space-y-4">
        {testingTasks.length === 0 ? (
          <TechPersonEmptyState icon={FlaskConical} message="No testing tasks" />
        ) : testingTasks.map((task) => (
          <TechPersonContentCard key={task._id}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-white font-medium">{task.title}</h2>
              <p className="text-xs text-gray-500 mt-1">{TECH_WORK_STATUS_LABELS[normalizeWorkStatus(task)]}</p>
              {task.testResult?.status && task.testResult.status !== 'pending' && (
                <p className="text-sm text-gray-400 mt-2">
                  Result: <span className="capitalize">{task.testResult.status}</span>
                  {task.testResult.bugCreated && ' · Bug created'}
                  {task.testResult.comments && ` — ${task.testResult.comments}`}
                </p>
              )}
            </div>
            <Link to={`/technical/tasks/${task._id}?tab=testing`} className="btn-primary text-sm shrink-0">Test Results</Link>
            </div>
          </TechPersonContentCard>
        ))}
      </div>
    </div>
  );
}
