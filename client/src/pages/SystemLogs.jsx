import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { auditAPI, formatDateTime } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditAPI.getSystemLogs()
      .then(({ data }) => setLogs(data.logs || []))
      .catch(() => auditAPI.getAll().then(({ data }) => setLogs(data.logs || [])).catch(() => {}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ScrollText className="text-myth-accent" size={24} /> System Logs
        </h1>
        <p className="text-gray-400 mt-1">Application and server activity logs</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">User</th>
              <th className="table-header">Action</th>
              <th className="table-header">Module</th>
              <th className="table-header">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4} className="table-cell text-center text-gray-500 py-8">No logs found</td></tr>
            ) : logs.map((log) => (
              <tr key={log._id} className="border-t border-myth-border">
                <td className="table-cell">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</td>
                <td className="table-cell">{log.action}</td>
                <td className="table-cell capitalize">{log.module}</td>
                <td className="table-cell">{formatDateTime(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
