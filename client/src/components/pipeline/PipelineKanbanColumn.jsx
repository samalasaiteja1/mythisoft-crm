/** Shared kanban column shell for leads & deals pipelines */
export default function PipelineKanbanColumn({
  stage,
  count,
  footer,
  children,
  onDragOver,
  onDrop,
  widthClass = 'w-72',
}) {
  return (
    <div
      className={`flex-shrink-0 ${widthClass} rounded-xl border ${stage.border} bg-myth-surface/10`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className={`px-3 py-2.5 border-b border-myth-border/50 rounded-t-xl ${stage.color}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate">{stage.label}</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20 shrink-0">{count}</span>
        </div>
        {footer && <p className="text-[10px] mt-1 opacity-75 truncate">{footer}</p>}
      </div>
      <div className="p-2 space-y-2 min-h-[140px] max-h-[calc(100vh-320px)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export function PipelineEmptyColumn({ message = 'Nothing here yet' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-myth-border/50 mx-0.5">
      <p className="text-xs text-gray-500">{message}</p>
    </div>
  );
}
