import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { DOCUMENT_CATEGORIES } from '../../constants/supportExecutive';

function guessCategory(name = '', tags = []) {
  const tagList = Array.isArray(tags) ? tags.join(' ') : '';
  const n = `${name} ${tagList}`.toLowerCase();
  if (/manual|guide|user/.test(n)) return 'user_manual';
  if (/release|changelog|notes/.test(n)) return 'release_notes';
  if (/deploy|installation/.test(n)) return 'deployment_guide';
  if (/api|swagger|openapi/.test(n)) return 'api_documentation';
  return 'other';
}

export default function SupportPersonDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    projectsAPI.listAssignedDeliveryDocuments()
      .then(({ data }) => {
        if (cancelled) return;
        setDocs(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.response?.data?.message || 'Failed to load documents');
          setDocs([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  const enriched = docs.map((d) => ({
    ...d,
    docCategory: guessCategory(d.name || d.title, d.tags),
  }));
  const filtered = category === 'all' ? enriched : enriched.filter((d) => d.docCategory === category);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText size={24} className="text-green-400" /> Documents
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Delivery and handoff documents for your assigned projects.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setCategory('all')} className={`text-sm px-3 py-1.5 rounded-lg border ${category === 'all' ? 'border-myth-accent text-white bg-myth-accent/10' : 'border-myth-border text-gray-400'}`}>
          All ({enriched.length})
        </button>
        {DOCUMENT_CATEGORIES.map((c) => {
          const count = enriched.filter((d) => d.docCategory === c.key).length;
          return (
            <button key={c.key} type="button" onClick={() => setCategory(c.key)} className={`text-sm px-3 py-1.5 rounded-lg border ${category === c.key ? 'border-myth-accent text-white bg-myth-accent/10' : 'border-myth-border text-gray-400'}`}>
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="card border border-myth-border/80 text-sm text-gray-400 flex items-start gap-2">
        <Upload size={16} className="text-myth-accent shrink-0 mt-0.5" />
        <p>Upload support files from an assigned project&apos;s detail page when permitted.</p>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          {docs.length === 0
            ? 'No documents yet for your assigned projects.'
            : 'No documents in this category.'}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-myth-border">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Project</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Uploaded</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const cat = DOCUMENT_CATEGORIES.find((c) => c.key === doc.docCategory);
                const url = doc.url || doc.fileUrl;
                return (
                  <tr key={doc._id || url} className="border-b border-myth-border/50 hover:bg-myth-surface/30">
                    <td className="py-3 pr-4 text-white">{doc.name || doc.title || 'Document'}</td>
                    <td className="py-3 pr-4 text-gray-400">{doc.projectName || '—'}</td>
                    <td className="py-3 pr-4 text-gray-400">{cat?.label || 'Other'}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">
                      {doc.createdAt ? formatDateTime(doc.createdAt) : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {url ? (
                          <>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-myth-accent hover:underline">
                              View
                            </a>
                            <a href={url} download className="text-xs text-gray-400 hover:text-myth-accent inline-flex items-center gap-1">
                              <Download size={12} /> Download
                            </a>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">No file URL</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Link to="/support/my-projects" className="text-sm text-myth-accent hover:underline">View projects →</Link>
    </div>
  );
}
