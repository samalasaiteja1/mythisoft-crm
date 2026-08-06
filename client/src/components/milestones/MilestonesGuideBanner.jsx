import { Flag, ListTodo } from 'lucide-react';

export default function MilestonesGuideBanner() {
  return (
    <div className="card border-cyan-500/20 bg-cyan-500/5 text-sm">
      <p className="text-white font-medium mb-2">Milestones vs tasks — pick a project first</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-400">
        <div className="flex gap-2">
          <Flag size={16} className="text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-gray-300">Milestone</strong> = big phase for one project
            (e.g. Frontend Development). Few per project (3–5).
          </span>
        </div>
        <div className="flex gap-2">
          <ListTodo size={16} className="text-violet-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-gray-300">Task</strong> = small daily job under a milestone
            (e.g. Build login page). Create tasks after saving a milestone.
          </span>
        </div>
      </div>
    </div>
  );
}
