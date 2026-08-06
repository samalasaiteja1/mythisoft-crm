import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { projectsAPI } from '../../services/api';
import { useTechnicalPersonData } from '../../hooks/useTechnicalPersonData';
import { TechPersonPageHeader, TechPersonContentCard, TechPersonEmptyState } from '../../components/technical/technicalPersonUi';

export default function TechnicalRequirements() {
  const { projects, loading } = useTechnicalPersonData();
  const [docsMap, setDocsMap] = useState({});
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    if (!projects.length) {
      setLoadingDocs(false);
      return;
    }
    Promise.all(
      projects.map((p) =>
        Promise.all([
          projectsAPI.getRequirementsDocuments(p._id),
          projectsAPI.getCustomerRequirementsDocuments(p._id).catch(() => ({ data: [] })),
        ]).then(([req, cust]) => ({
          id: p._id,
          requirements: Array.isArray(req.data) ? req.data : [],
          customer: Array.isArray(cust.data) ? cust.data : [],
        }))
      )
    )
      .then((rows) => {
        const map = {};
        rows.forEach((r) => { map[r.id] = r; });
        setDocsMap(map);
      })
      .catch(() => toast.error('Failed to load requirements'))
      .finally(() => setLoadingDocs(false));
  }, [projects]);

  if (loading || loadingDocs) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <TechPersonPageHeader
        icon={FileText}
        title="Project Requirements"
        subtitle="Functional and non-functional requirements for your assigned projects"
      />
      {projects.length === 0 ? (
        <TechPersonEmptyState icon={FileText} message="No assigned projects" />
      ) : projects.map((project) => {
        const docs = docsMap[project._id] || { requirements: [], customer: [] };
        const allDocs = [...docs.requirements, ...docs.customer];
        return (
          <TechPersonContentCard key={project._id} className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                <p className="text-sm text-gray-400 mt-1">{project.description || 'No description'}</p>
              </div>
              <Link to={`/technical/projects/${project._id}`} className="btn-secondary text-sm">View Project</Link>
            </div>
            {project.scope && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Scope</p>
                <p className="text-sm text-gray-300">{project.scope}</p>
              </div>
            )}
            {project.deliverables && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Deliverables</p>
                <p className="text-sm text-gray-300">{project.deliverables}</p>
              </div>
            )}
            {(project.technologyStack || []).length > 0 && (
              <p className="text-xs text-gray-500">Tech stack: {project.technologyStack.join(', ')}</p>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Documents</p>
              {allDocs.length === 0 ? (
                <p className="text-sm text-gray-500">No requirement documents</p>
              ) : (
                <ul className="space-y-2">
                  {allDocs.map((d) => (
                    <li key={d._id || d.fileUrl} className="flex items-center gap-2 text-sm">
                      <FileText size={14} className="text-myth-accent shrink-0" />
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-myth-accent hover:underline">{d.name}</a>
                      <ExternalLink size={12} className="text-gray-500" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TechPersonContentCard>
        );
      })}
    </div>
  );
}
