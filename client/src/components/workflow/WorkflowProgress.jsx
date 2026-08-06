import { getStageIndex } from '../../constants/workflow';

export default function WorkflowProgress({ stages, currentStage, className = '' }) {
  const currentIdx = getStageIndex(stages, currentStage || stages[0]?.key);

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="flex items-center gap-1 min-w-max py-2">
        {stages.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={stage.key} className="flex items-center">
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  active ? 'bg-myth-accent text-myth-navy'
                    : done ? 'bg-green-500/20 text-green-400'
                      : 'bg-myth-surface text-gray-500'
                }`}
              >
                {stage.label}
              </div>
              {i < stages.length - 1 && (
                <span className={`mx-1 text-xs ${i < currentIdx ? 'text-green-500' : 'text-gray-600'}`}>→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
