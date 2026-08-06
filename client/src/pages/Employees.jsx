import { useState, useEffect } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { usersAPI } from '../services/api';
import { ROLE_LABELS } from '../constants/permissions';
import LoadingSpinner from '../components/LoadingSpinner';

const roleColors = {
  manager: 'bg-purple-500/20 text-purple-400',
  sales: 'bg-blue-500/20 text-blue-400',
  support: 'bg-green-500/20 text-green-400',
  technical: 'bg-cyan-500/20 text-cyan-400',
};

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersAPI.getAll()
      .then(({ data }) => setUsers((Array.isArray(data) ? data : data.users || []).filter((u) => u.role !== 'admin')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UsersIcon className="text-myth-accent" size={24} /> Employees
        </h1>
        <p className="text-gray-400 mt-1">Monitor employees across all departments</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Department</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5} className="table-cell text-center text-gray-500 py-8">No employees found</td></tr>
            ) : users.map((u) => (
              <tr key={u._id} className="border-t border-myth-border">
                <td className="table-cell font-medium">{u.firstName} {u.lastName}</td>
                <td className="table-cell">{u.email}</td>
                <td className="table-cell">
                  <span className={`badge ${roleColors[u.role] || 'bg-gray-500/20 text-gray-400'}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>
                <td className="table-cell">{u.departmentName || u.department?.name || '-'}</td>
                <td className="table-cell">
                  <span className={`badge ${u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
