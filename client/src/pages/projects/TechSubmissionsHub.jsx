import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Send, FolderKanban, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import RequirementsDocLinks from '../../components/projects/RequirementsDocLinks';
import { groupDocsByProject } from '../../utils/projectHubHelpers';

export default function TechSubmissionsHub() {
  const [submissions, setSubmissions] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectsAPI.listDeliveryDocuments(),
      projectsAPI.listRequirementsDocuments(),
      projectsAPI.getAll({ limit: 200 }),
    ])
      .then(([delRes, reqRes, projRes]) => {
        setSubmissions(Array.isArray(delRes.data) ? delRes.data : []);
        setRequirements(Array.isArray(reqRes.data) ? reqRes.data : []);
        setProjects(projRes.data?.items || projRes.data || []);
      })
      .catch(() => toast.error('Failed to load project documents'))
      .finally(() => setLoading(false));
  }, []);

  const deliveryByProject = useMemo(() => groupDocsByProject(submissions), [submissions]);
  const reqByProject = useMemo(() => groupDocsByProject(requirements), [requirements]);

  const projectIds = useMemo(() => {
    const ids = new Set([...Object.keys(deliveryByProject), ...Object.keys(reqByProject)]);
    return [...ids];
  }, [deliveryByProject, reqByProject]);

  const visibleProjects = useMemo(() => {
    const list = projectIds.map((pid) => {
      const fromApi = projects.find((p) => String(p._id) === pid);
      return fromApi || {
        _id: pid,
        name: deliveryByProject[pid]?.projectName || reqByProject[pid]?.projectName || 'Project',
      };
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (projectFilter === 'all') return list;
    return list.filter((p) => String(p._id) === projectFilter);
  }, [projectIds, projects, projectFilter, deliveryByProject, reqByProject]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Send size={24} className="text-green-400" /> Change Requests & Submissions
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Delivery files and scope/requirements documents — grouped by project
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm text-gray-400 shrink-0">Filter by project</label>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="input-field w-full sm:max-w-md"
        >
          <option value="all">All projects ({visibleProjects.length})</option>
          {visibleProjects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No change requests or submissions yet</p>
        </div>
      ) : (
        visibleProjects.map((project) => {
          const pid = String(project._id);
          const delivery = deliveryByProject[pid]?.docs || [];
          const reqs = reqByProject[pid]?.docs || [];
          return (
            <div key={pid} className="card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FolderKanban size={18} className="text-myth-accent" />
                  <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                </div>
                <Link to={`/projects/${project._id}`} className="btn-secondary text-sm">Open project</Link>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Send size={14} className="text-green-400" /> Delivery submissions
                </h3>
                {delivery.length === 0 ? (
                  <p className="text-sm text-gray-500">No delivery documents for this project</p>
                ) : (
                  <RequirementsDocLinks documents={delivery} />
                )}
              </section>

              <section className="space-y-3 pt-4 border-t border-myth-border">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Inbox size={14} className="text-cyan-400" /> Requirements & scope
                </h3>
                {reqs.length === 0 ? (
                  <p className="text-sm text-gray-500">No requirements documents for this project</p>
                ) : (
                  <RequirementsDocLinks documents={reqs} compact />
                )}
              </section>
            </div>
          );
        })
      )}
    </div>
  );
}
