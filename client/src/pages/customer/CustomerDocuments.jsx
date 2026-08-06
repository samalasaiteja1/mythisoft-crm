import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import { documentsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const DOC_TYPE_LABELS = {
  'user-manual': 'User Manual',
  'release-notes': 'Release Notes',
  'deployment-guide': 'Deployment Guide',
  'api-documentation': 'API Documentation',
  delivery: 'Delivery Document',
};

const docTypeLabel = (doc) => {
  const tag = (doc.tags || []).find((t) => DOC_TYPE_LABELS[t]);
  if (tag) return DOC_TYPE_LABELS[tag];
  if (doc.folder === 'Delivery') return 'Delivery Document';
  return doc.folder || 'Document';
};

export default function CustomerDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    documentsAPI.getAll()
      .then(({ data }) => setDocuments(Array.isArray(data) ? data : data.items || []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, []);

  const types = [...new Set(documents.map(docTypeLabel))];
  const filtered = documents.filter((d) => !typeFilter || docTypeLabel(d) === typeFilter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-myth-accent" size={24} /> Documents
        </h1>
        <p className="text-gray-400 mt-1">Download project documentation and delivery files.</p>
      </div>

      <div className="card">
        <div className="mb-4">
          <select className="input-field sm:max-w-[220px]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All document types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">Document Name</th>
                <th className="table-header">Document Type</th>
                <th className="table-header">Version</th>
                <th className="table-header">Uploaded Date</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="table-cell text-center text-gray-500 py-8">No documents available</td></tr>
              ) : filtered.map((doc) => (
                <tr key={doc._id} className="border-t border-myth-border">
                  <td className="table-cell text-white">{doc.name}</td>
                  <td className="table-cell text-gray-300">{docTypeLabel(doc)}</td>
                  <td className="table-cell text-gray-400">{doc.version || 'v1.0'}</td>
                  <td className="table-cell text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="table-cell">
                    {doc.fileUrl ? (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-myth-accent hover:underline text-sm">
                        <Download size={14} /> Download
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
