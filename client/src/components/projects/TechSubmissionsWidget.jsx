import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { projectsAPI } from '../../services/api';
import RequirementsDocLinks from './RequirementsDocLinks';

export default function TechSubmissionsWidget({ limit = 5 }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsAPI.listDeliveryDocuments()
      .then(({ data }) => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, []);

  const recent = submissions.slice(0, limit);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Send size={18} className="text-green-400" /> Tech Submissions
        </h3>
        <Link to="/projects/tech-submissions" className="text-sm text-myth-accent hover:underline">
          View all →
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading submissions…</p>
      ) : recent.length === 0 ? (
        <p className="text-sm text-gray-500">No technical documents submitted yet</p>
      ) : (
        <div className="space-y-3">
          {recent.map((doc) => (
            <div key={doc._id}>
              <Link
                to={`/projects/${doc.relatedTo?.id || ''}`}
                className="text-xs text-myth-accent hover:underline mb-1 inline-block"
              >
                {doc.projectName || 'Project'}
              </Link>
              <RequirementsDocLinks documents={[doc]} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
