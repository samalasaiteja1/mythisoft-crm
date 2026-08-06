import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload, FileText, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsAPI, projectsAPI, formatDateTime } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import RequirementsDocLinks from '../components/projects/RequirementsDocLinks';
import TechManagerDocumentsView from '../components/projects/TechManagerDocumentsView';
import CustomerDocuments from './customer/CustomerDocuments';
import ProjectsSidebar from '../components/projects/ProjectsSidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';

const emptyForm = { name: '', folder: 'General', notes: '', tags: '' };

export default function Documents() {
  const { canWrite, isTechnical, isAdmin, isManager, isTechManager, isCustomer } = usePermissions();
  if (isCustomer) return <CustomerDocuments />;
  const canViewTechSubmissions = isAdmin || isManager;

  if (isTechManager) {
    return (
      <div className="space-y-5">
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <TechManagerDocumentsView />
          </div>
          <aside className="w-56 shrink-0 hidden lg:block">
            <ProjectsSidebar />
          </aside>
        </div>
        <div className="lg:hidden">
          <ProjectsSidebar />
        </div>
      </div>
    );
  }
  const [requirements, setRequirements] = useState([]);
  const [deliveryDocs, setDeliveryDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  const fetch = () => {
    setLoading(true);
    if (isTechnical || canViewTechSubmissions) {
      Promise.all([
        canViewTechSubmissions && !isTechnical
          ? documentsAPI.getAll({ search })
          : projectsAPI.listRequirementsDocuments(),
        projectsAPI.listDeliveryDocuments(),
      ])
        .then(([reqRes, delRes]) => {
          setRequirements(Array.isArray(reqRes.data) ? reqRes.data : (reqRes.data?.items ? reqRes.data.items : []));
          setDeliveryDocs(Array.isArray(delRes.data) ? delRes.data : []);
        })
        .catch(() => toast.error('Failed to load documents'))
        .finally(() => setLoading(false));
      return;
    }
    documentsAPI.getAll({ search })
      .then(({ data }) => setRequirements(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [search, isTechnical, canViewTechSubmissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    try {
      await documentsAPI.create(fd);
      toast.success('Document uploaded');
      setModal(false);
      setForm(emptyForm);
      setFile(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    await documentsAPI.delete(id);
    toast.success('Document removed');
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isTechnical ? 'Project Documents' : canViewTechSubmissions ? 'Documents & Tech Submissions' : 'Documents'}
          </h1>
          <p className="text-gray-400 mt-1">
            {isTechnical
              ? 'View requirements from manager and your submitted completion documents'
              : canViewTechSubmissions
                ? 'Manage files and view completion documents submitted by the technical team'
                : 'Upload and manage files — proposals, contracts, and attachments'}
          </p>
        </div>
        {!isTechnical && canWrite('documents') && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Upload Document
          </button>
        )}
      </div>
      {!isTechnical && <SearchBar value={search} onChange={setSearch} placeholder="Search documents..." />}
      {canViewTechSubmissions && !isTechnical && deliveryDocs.length > 0 && (
        <div className="card border-green-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Technical team submissions</h2>
              <p className="text-xs text-gray-500 mt-1">Completion documents submitted by technical staff</p>
            </div>
            <Link to="/projects/tech-submissions" className="btn-secondary text-sm">View all submissions</Link>
          </div>
          <div className="space-y-3">
            {deliveryDocs.slice(0, 8).map((doc) => (
              <div key={doc._id}>
                <p className="text-xs text-gray-500 mb-1">{doc.projectName}</p>
                <RequirementsDocLinks documents={[doc]} compact />
              </div>
            ))}
          </div>
        </div>
      )}
      {loading ? <LoadingSpinner /> : isTechnical ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-2">Requirements received</h2>
            <p className="text-xs text-gray-500 mb-4">From admin or manager when project was assigned</p>
            {requirements.length === 0 ? (
              <p className="text-sm text-gray-500">No requirements documents yet</p>
            ) : (
              <div className="space-y-3">
                {requirements.map((doc) => (
                  <div key={doc._id}>
                    <p className="text-xs text-gray-500 mb-1">{doc.projectName}</p>
                    <RequirementsDocLinks documents={[doc]} compact />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-2">Submitted by you</h2>
            <p className="text-xs text-gray-500 mb-4">Upload completion docs from the project page after finishing work</p>
            {deliveryDocs.length === 0 ? (
              <p className="text-sm text-gray-500">No submitted documents yet. Open a project → Submit project documents.</p>
            ) : (
              <div className="space-y-3">
                {deliveryDocs.map((doc) => (
                  <div key={doc._id}>
                    <p className="text-xs text-gray-500 mb-1">{doc.projectName}</p>
                    <RequirementsDocLinks documents={[doc]} compact />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : canViewTechSubmissions ? (
        <div className="card overflow-x-auto">
          <h2 className="text-lg font-semibold text-white mb-4">All documents</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Folder</th>
                <th className="table-header">Uploaded By</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requirements.length === 0 ? (
                <tr><td colSpan={5} className="table-cell text-center text-gray-500 py-8">No documents found</td></tr>
              ) : requirements.map((d) => (
                <tr key={d._id} className="border-t border-myth-border">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-myth-accent" />
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-gray-400">{d.folder}</td>
                  <td className="table-cell text-gray-400">{d.uploadedBy ? `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}` : '-'}</td>
                  <td className="table-cell text-gray-400">{formatDateTime(d.createdAt)}</td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-myth-accent hover:bg-myth-accent/10 rounded-lg"><ExternalLink size={16} /></a>
                      {canWrite('documents') && (
                        <button onClick={() => handleDelete(d._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Folder</th>
                <th className="table-header">Uploaded By</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requirements.length === 0 ? (
                <tr><td colSpan={5} className="table-cell text-center text-gray-500 py-8">No documents found</td></tr>
              ) : requirements.map((d) => (
                <tr key={d._id} className="border-t border-myth-border">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-myth-accent" />
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-gray-400">{d.folder}</td>
                  <td className="table-cell text-gray-400">{d.uploadedBy ? `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}` : '-'}</td>
                  <td className="table-cell text-gray-400">{formatDateTime(d.createdAt)}</td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-myth-accent hover:bg-myth-accent/10 rounded-lg"><ExternalLink size={16} /></a>
                      {canWrite('documents') && (
                        <button onClick={() => handleDelete(d._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!isTechnical && (
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Upload Document">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">File *</label>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Upload size={16} /> {file ? file.name : 'Choose file'}
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div><label className="block text-sm text-gray-400 mb-1">Name</label><input className="input-field w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Optional display name" /></div>
          <div><label className="block text-sm text-gray-400 mb-1">Folder</label><input className="input-field w-full" value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })} /></div>
          <div><label className="block text-sm text-gray-400 mb-1">Tags</label><input className="input-field w-full" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="comma separated" /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Upload</button></div>
        </form>
      </Modal>
      )}
    </div>
  );
}
