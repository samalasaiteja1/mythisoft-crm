import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CRM_WORKFLOW_STEPS } from '../../constants/crmWorkflow';

export default function CrmWorkflowGuide({ title = 'CRM Workflow', compact = false, highlightFrom = 3 }) {
  const steps = CRM_WORKFLOW_STEPS.filter((s) => s.step >= highlightFrom);

  return (
    <div className="card border-myth-accent/20 bg-gradient-to-br from-myth-accent/5 to-transparent">
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-xs text-gray-400 mb-4">Follow this order — each step unlocks the next.</p>
      <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {steps.map((item, i) => (
          <Link
            key={item.step}
            to={item.href}
            className="group flex items-start gap-2 p-3 rounded-lg border border-myth-border/80 bg-myth-surface/30 hover:border-myth-accent/40 transition-colors"
          >
            <span className="shrink-0 w-6 h-6 rounded-full bg-myth-accent/15 text-myth-accent text-xs font-bold flex items-center justify-center">
              {item.step}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-white group-hover:text-myth-accent">{item.label}</span>
              {!compact && <span className="block text-[10px] text-gray-500 mt-0.5 line-clamp-2">{item.desc}</span>}
            </span>
            {i < steps.length - 1 && !compact && (
              <ArrowRight size={14} className="hidden lg:block text-gray-600 shrink-0 mt-1" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
