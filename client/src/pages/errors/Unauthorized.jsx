import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <ShieldAlert size={64} className="text-red-400 mb-4" />
      <h1 className="text-2xl font-bold text-white">Access Denied</h1>
      <p className="text-gray-400 mt-2 mb-6">You do not have permission to view this page.</p>
      <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
        <Home size={18} /> Back to Dashboard
      </Link>
    </div>
  );
}
