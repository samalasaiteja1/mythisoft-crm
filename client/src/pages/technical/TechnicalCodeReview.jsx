import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../services/api';
import { useTechnicalPersonData } from '../../hooks/useTechnicalPersonData';
import { normalizeWorkStatus, TECH_WORK_STATUS_LABELS } from '../../constants/technicalPersonForm';
import { TechPersonPageHeader, TechPersonContentCard, TechPersonEmptyState } from '../../components/technical/technicalPersonUi';

export default function TechnicalCodeReview() {
  const { tasks, loading } = useTechnicalPersonData();

  const reviewTasks = tasks.filter((t) => {
    const ws = normalizeWorkStatus(t);
    return ws === 'code_review' || t.codeReview?.comments || t.codeReview?.status === 'changes_required';
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechPersonPageHeader
        icon={GitBranch}
        title="Code Review"
        subtitle="Review comments and resubmit tasks"
      />
      <div className="space-y-4">
        {reviewTasks.length === 0 ? (
          <TechPersonEmptyState icon={GitBranch} message="No code review items" />
        ) : reviewTasks.map((task) => (
          <TechPersonContentCard key={task._id}>
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-white font-medium">{task.title}</h2>
                <p className="text-xs text-gray-500 mt-1">Status: {TECH_WORK_STATUS_LABELS[normalizeWorkStatus(task)]}</p>
              </div>
              <Link to={`/technical/tasks/${task._id}?tab=review`} className="btn-primary text-sm shrink-0">Open</Link>
            </div>
            {task.codeReview?.comments && (
              <div className="rounded-lg bg-myth-surface/50 p-3 text-sm">
                <p className="text-gray-500 text-xs mb-1">
                  Reviewer: {task.codeReview.reviewer ? `${task.codeReview.reviewer.firstName} ${task.codeReview.reviewer.lastName}` : 'Manager'}
                  · {task.codeReview.status?.replace(/_/g, ' ')}
                  {task.codeReview.reviewDate && ` · ${formatDate(task.codeReview.reviewDate)}`}
                </p>
                <p className="text-gray-300">{task.codeReview.comments}</p>
              </div>
            )}
          </TechPersonContentCard>
        ))}
      </div>
    </div>
  );
}
