import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import RequirementsDocLinks from '../../components/projects/RequirementsDocLinks';
import { groupDocsByProject } from '../../utils/projectHubHelpers';

export default function CustomerRequirementsHub() {
  const [submissions, setSubmissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectsAPI.listCustomerRequirementsDocuments(),
      projectsAPI.getAll({ limit: 200 }),
    ])
      .then(([docRes, projRes]) => {
        setSubmissions(Array.isArray(docRes.data) ? docRes.data : []);
        setProjects(projRes.data?.items || projRes.data || []);
      })
      .catch(() => toast.error('Failed to load customer requirements'))
      .finally(() => setLoading(false));
  }, []);

  const byProject = useMemo(() => groupDocsByProject(submissions), [submissions]);

  const visibleProjects = useMemo(() => {
    const ids = new Set(Object.keys(byProject));
    const fromApi = projects.filter((p) => ids.has(String(p._id)));
    Object.entries(byProject).forEach(([pid, group]) => {
      if (!fromApi.some((p) => String(p._id) === pid)) {
        fromApi.push({ _id: pid, name: group.projectName });
      }
    });
    const sorted = fromApi.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (projectFilter === 'all') return sorted.filter((p) => ids.has(String(p._id)));
    return sorted.filter((p) => String(p._id) === projectFilter);
  }, [byProject, projects, projectFilter]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Inbox size={24} className="text-orange-400" /> Customer Requirements
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Specs uploaded by customers from their portal — grouped by project
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm text-gray-400 shrink-0">Filter by project</label>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="input-field w-full sm:max-w-md"
        >
          <option value="all">All projects</option>
          {visibleProjects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({(byProject[String(p._id)]?.docs || []).length} file(s))
            </option>
          ))}
        </select>
      </div>

      {submissions.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No customer requirements submitted yet</p>
          <p className="text-sm text-gray-500 mt-1">Documents appear when customers upload from their portal</p>
        </div>
      ) : (
        visibleProjects.map((project) => {
          const group = byProject[String(project._id)];
          if (!group) return null;
          return (
            <div key={project._id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-white">{project.name || group.projectName}</h2>
                <Link to={`/projects/${project._id}`} className="btn-secondary text-sm">Open project</Link>
              </div>
              <RequirementsDocLinks documents={group.docs} />
            </div>
          );
        })
      )}
    </div>
  );
}
