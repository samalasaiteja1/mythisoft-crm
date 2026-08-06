import { FileText, ExternalLink, UserCog } from 'lucide-react';
import { formatDateTime } from '../../services/api';

export function groupRequirementsByProject(documents = []) {
  return documents.reduce((acc, doc) => {
    const pid = String(doc.relatedTo?.id || doc.projectId || '');
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(doc);
    return acc;
  }, {});
}

export default function RequirementsDocLinks({
  documents = [],
  emptyMessage = 'No requirements document uploaded by manager yet',
  compact = false,
}) {
  if (!documents.length) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const uploader = doc.uploadedBy;
        const uploaderName = uploader
          ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || uploader.email
          : null;

        return (
          <a
            key={doc._id}
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center justify-between gap-3 rounded-lg border border-myth-border bg-myth-surface/30 hover:border-myth-accent/40 transition-colors ${
              compact ? 'p-2' : 'p-3'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={compact ? 16 : 18} className="text-myth-accent shrink-0" />
              <div className="min-w-0">
                <p className={`text-white font-medium truncate ${compact ? 'text-sm' : 'text-sm'}`}>{doc.name}</p>
                {!compact && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDateTime(doc.createdAt)}
                    {uploaderName && (
                      <>
                        {' · '}
                        <span className="inline-flex items-center gap-1">
                          <UserCog size={10} />
                          {uploaderName}
                          {uploader?.role ? ` (${uploader.role})` : ''}
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
            <ExternalLink size={compact ? 14 : 16} className="text-myth-accent shrink-0" />
          </a>
        );
      })}
    </div>
  );
}
