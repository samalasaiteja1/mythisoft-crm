import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FolderKanban, Inbox, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import RequirementsDocLinks from './RequirementsDocLinks';
import { groupDocsByProject } from '../../utils/projectHubHelpers';
import { TechManagerPageHeader } from '../techManager/techManagerUi';

export default function TechManagerDocumentsView() {
  const [requirements, setRequirements] = useState([]);
  const [deliveryDocs, setDeliveryDocs] = useState([]);
  const [customerReqs, setCustomerReqs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectsAPI.listRequirementsDocuments(),
      projectsAPI.listDeliveryDocuments(),
      projectsAPI.listCustomerRequirementsDocuments(),
      projectsAPI.getAll({ limit: 200 }),
    ])
      .then(([reqRes, delRes, custRes, projRes]) => {
        setRequirements(Array.isArray(reqRes.data) ? reqRes.data : []);
        setDeliveryDocs(Array.isArray(delRes.data) ? delRes.data : []);
        setCustomerReqs(Array.isArray(custRes.data) ? custRes.data : []);
        setProjects(projRes.data?.items || projRes.data || []);
      })
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  }, []);

  const reqByProject = useMemo(() => groupDocsByProject(requirements), [requirements]);
  const delByProject = useMemo(() => groupDocsByProject(deliveryDocs), [deliveryDocs]);
  const custByProject = useMemo(() => groupDocsByProject(customerReqs), [customerReqs]);

  const projectIds = useMemo(() => {
    const ids = new Set([
      ...Object.keys(reqByProject),
      ...Object.keys(delByProject),
      ...Object.keys(custByProject),
      ...projects.map((p) => String(p._id)),
    ]);
    return [...ids];
  }, [reqByProject, delByProject, custByProject, projects]);

  const visibleProjects = useMemo(() => {
    const list = projectIds.map((pid) => {
      const fromApi = projects.find((p) => String(p._id) === pid);
      return fromApi || {
        _id: pid,
        name: reqByProject[pid]?.projectName
          || delByProject[pid]?.projectName
          || custByProject[pid]?.projectName
          || 'Project',
      };
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (projectFilter === 'all') {
      return list.filter((p) => {
        const pid = String(p._id);
        return reqByProject[pid] || delByProject[pid] || custByProject[pid];
      });
    }
    return list.filter((p) => String(p._id) === projectFilter);
  }, [projectIds, projects, projectFilter, reqByProject, delByProject, custByProject]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechManagerPageHeader
        icon={FileText}
        title="Project Documents"
        subtitle="Requirements, customer uploads, and delivery files — grouped by project"
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm text-gray-400 shrink-0">Filter by project</label>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="input-field w-full sm:max-w-md"
        >
          <option value="all">All projects with documents</option>
          {projects.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No documents yet for your projects</p>
          <Link to="/projects" className="text-sm text-myth-accent hover:underline mt-2 inline-block">View my projects</Link>
        </div>
      ) : (
        visibleProjects.map((project) => {
          const pid = String(project._id);
          const reqs = reqByProject[pid]?.docs || [];
          const delivery = delByProject[pid]?.docs || [];
          const customer = custByProject[pid]?.docs || [];
          return (
            <div key={pid} className="card space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FolderKanban size={18} className="text-myth-accent" />
                  <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                </div>
                <Link to={`/projects/${project._id}`} className="btn-secondary text-sm">Open project</Link>
              </div>

              {customer.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                    <Inbox size={14} className="text-orange-400" /> Customer requirements
                  </h3>
                  <RequirementsDocLinks documents={customer} compact />
                </section>
              )}

              {reqs.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-cyan-400" /> Admin / manager requirements
                  </h3>
                  <RequirementsDocLinks documents={reqs} compact />
                </section>
              )}

              {delivery.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                    <Send size={14} className="text-green-400" /> Delivery submissions
                  </h3>
                  <RequirementsDocLinks documents={delivery} />
                </section>
              )}

              {!customer.length && !reqs.length && !delivery.length && (
                <p className="text-sm text-gray-500">No documents for this project</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
