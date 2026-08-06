import { useEffect, useState } from 'react';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomerRequirementsPanel from '../../components/projects/CustomerRequirementsPanel';

export default function CustomerRequirementsSubmit() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsAPI.getAll({ limit: 100 })
      .then(({ data }) => setProjects(data.items || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Submit Requirements</h1>
        <p className="text-gray-400 mt-1">Send project requirement documents to your manager</p>
      </div>
      <div className="card">
        <CustomerRequirementsPanel projects={projects} />
      </div>
    </div>
  );
}
