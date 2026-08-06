import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CRM_WORKFLOW_PHASES } from '../../constants/workflow';

export default function WorkflowBanner() {
  const { user } = useAuth();
  const role = user?.role;

  const phases = CRM_WORKFLOW_PHASES.filter((p) => p.roles.includes(role) || role === 'admin');

  if (!phases.length) return null;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-3">Your CRM Workflow</h3>
      <div className="flex flex-wrap gap-2">
        {phases.map((phase, i) => (
          <div key={phase.phase} className="flex items-center gap-2">
            <Link
              to={phase.path}
              className="badge bg-myth-accent/10 text-myth-accent text-xs hover:bg-myth-accent/20 transition-colors"
              title={phase.label}
            >
              {phase.phase}
            </Link>
            {i < phases.length - 1 && <span className="text-gray-600">→</span>}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Lead → Qualify → Deal → Customer → Project → Development → Support → Closed
      </p>
    </div>
  );
}
