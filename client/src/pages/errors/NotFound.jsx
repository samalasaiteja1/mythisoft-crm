import { Link } from 'react-router-dom';
import { Home, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-myth-accent">404</h1>
      <p className="text-xl text-white mt-4">Page not found</p>
      <p className="text-gray-400 mt-2 mb-6">The page you are looking for does not exist.</p>
      <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
        <Home size={18} /> Back to Dashboard
      </Link>
    </div>
  );
}
