import { Navigate, useSearchParams } from 'react-router-dom';

/** /projects/create → open add modal on All Projects */
export default function ProjectCreate() {
  return <Navigate to="/projects?add=1" replace />;
}
