import { FileText } from 'lucide-react';

export default function RequirementsDocumentField({ file, onChange, label = 'Requirements Document' }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-myth-border rounded-lg cursor-pointer hover:border-myth-accent/50 hover:bg-myth-surface/30 transition-colors">
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <FileText size={22} className="text-myth-accent" />
          {file ? (
            <span className="text-sm text-white truncate max-w-full">{file.name}</span>
          ) : (
            <span className="text-sm text-gray-500">Click to upload PDF, DOC, or image</span>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
      {file && (
        <button type="button" onClick={() => onChange(null)} className="text-xs text-gray-500 hover:text-red-400 mt-2">
          Remove file
        </button>
      )}
    </div>
  );
}
