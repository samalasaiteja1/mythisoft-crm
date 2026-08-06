import { Navigate } from 'react-router-dom';

/** Legacy route — task create uses the Tasks page button, not an auto-open modal */
export default function TaskCreate() {
  return <Navigate to="/tasks" replace />;
}
