import { Outlet } from 'react-router-dom';
import ProjectsSidebar from '../../components/projects/ProjectsSidebar';
import { usePermissions } from '../../hooks/usePermissions';

export default function ProjectsLayout() {
  const { isCustomer } = usePermissions();
  if (isCustomer) {
    return (
      <div className="space-y-5">
        <Outlet />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
        <aside className="w-56 shrink-0 hidden lg:block">
          <ProjectsSidebar />
        </aside>
      </div>

      <div className="lg:hidden">
        <ProjectsSidebar />
      </div>
    </div>
  );
}
