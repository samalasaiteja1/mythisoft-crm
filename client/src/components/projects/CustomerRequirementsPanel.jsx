import { useEffect, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import { uploadCustomerRequirementsDocument } from '../../utils/projectDocument';
import RequirementsDocLinks from './RequirementsDocLinks';
import RequirementsDocumentField from './RequirementsDocumentField';

export default function CustomerRequirementsPanel({
  projects = [],
  projectId: fixedProjectId = '',
  compact = false,
  showProjectSelect = true,
}) {
  const [selectedProjectId, setSelectedProjectId] = useState(fixedProjectId || projects[0]?._id || '');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const activeProjectId = fixedProjectId || selectedProjectId;

  const loadSubmissions = () => {
    if (fixedProjectId) {
      return projectsAPI.getCustomerRequirementsDocuments(fixedProjectId)
        .then(({ data }) => setSubmissions(Array.isArray(data) ? data : []));
    }
    return projectsAPI.listCustomerRequirementsDocuments()
      .then(({ data }) => setSubmissions(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    setLoading(true);
    loadSubmissions()
      .catch(() => toast.error('Failed to load submitted requirements'))
      .finally(() => setLoading(false));
  }, [fixedProjectId, selectedProjectId]);

  const handleSubmit = async () => {
    if (!activeProjectId) {
      toast.error('Select a project first');
      return;
    }
    if (!uploadFile) {
      toast.error('Select a requirements file to upload');
      return;
    }
    setUploading(true);
    try {
      const doc = await uploadCustomerRequirementsDocument(activeProjectId, uploadFile);
      if (doc) {
        setSubmissions((prev) => [{ ...doc, projectName: projects.find((p) => p._id === activeProjectId)?.name }, ...prev]);
        setUploadFile(null);
        toast.success('Requirements submitted — manager will be notified');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit requirements');
    } finally {
      setUploading(false);
    }
  };

  const projectSubmissions = fixedProjectId
    ? submissions
    : submissions.filter((doc) => String(doc.relatedTo?.id) === String(activeProjectId));

  if (loading) {
    return <p className="text-sm text-gray-500">Loading requirements…</p>;
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div>
        <h3 className={`font-semibold text-white flex items-center gap-2 ${compact ? 'text-sm mb-2' : 'text-lg mb-4'}`}>
          <FileText size={compact ? 16 : 18} className="text-myth-accent" /> Submit requirements to manager
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Upload your project requirements, scope documents, or briefs. Your manager will review and assign the technical team.
        </p>

        {showProjectSelect && !fixedProjectId && projects.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Project</label>
            <select
              className="input-field w-full"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {projects.length === 0 && !fixedProjectId ? (
          <p className="text-sm text-gray-500">No projects assigned yet. Contact your manager.</p>
        ) : (
          <div className="space-y-3">
            <RequirementsDocumentField
              label="Requirements document"
              file={uploadFile}
              onChange={setUploadFile}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading || !uploadFile || !activeProjectId}
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              <Upload size={14} />
              {uploading ? 'Submitting…' : 'Submit to manager'}
            </button>
          </div>
        )}
      </div>

      <div className={compact ? 'pt-3 border-t border-myth-border' : ''}>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Your submitted requirements</p>
        {projectSubmissions.length > 0 ? (
          <RequirementsDocLinks documents={projectSubmissions} compact={compact} emptyMessage="" />
        ) : (
          <p className="text-sm text-gray-500">No requirements submitted yet</p>
        )}
      </div>
    </div>
  );
}
