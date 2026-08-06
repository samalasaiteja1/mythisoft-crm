import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI, departmentsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';

const emptyForm = {
  name: '',
  department: '',
  leader: '',
  description: '',
  status: 'active',
};

export default function TeamsSettings() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    Promise.all([usersAPI.getTeams(), usersAPI.getAll(), departmentsAPI.getAll()])
      .then(([teamsRes, empRes, deptRes]) => {
        setItems(Array.isArray(teamsRes.data) ? teamsRes.data : (teamsRes.data?.items || []));
        setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data?.items || []));
      })
      .catch(() => toast.error('Failed to load teams data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal('form');
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '',
      department: item.department?._id || item.department || '',
      leader: item.leader?._id || item.leader || '',
      description: item.description || '',
      status: item.status || 'active',
    });
    setEditId(item._id);
    setModal('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.department) return toast.error('Department is required');
    if (!form.name.trim()) return toast.error('Team Name is required');
    
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.leader) delete payload.leader;
      
      if (editId) {
        await usersAPI.updateTeam(editId, payload);
        toast.success('Team updated');
      } else {
        await usersAPI.createTeam(payload);
        toast.success('Team created');
      }
      setModal(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete team "${item.name}"?`)) return;
    try {
      await usersAPI.deleteTeam(item._id);
      toast.success('Team deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users size={18} className="text-myth-accent" /> Teams
          </h3>
          <p className="text-sm text-gray-400 mt-1">Manage functional teams across departments.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Create Team
        </button>
      </div>

      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-myth-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-myth-border bg-myth-surface/50">
                <th className="table-header text-left">Team Name</th>
                <th className="table-header text-left">Department</th>
                <th className="table-header text-left">Manager</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const deptLabel = departments.find(d => d._id === (item.department?._id || item.department))?.name || item.department?.name || 'Unknown';
                return (
                  <tr key={item._id} className="border-b border-myth-border/60 hover:bg-myth-surface/30">
                    <td className="table-cell font-medium text-white">{item.name}</td>
                    <td className="table-cell text-gray-400">{deptLabel}</td>
                    <td className="table-cell text-gray-400">
                      {item.leader ? `${item.leader.firstName} ${item.leader.lastName}` : '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${item.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {item.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-myth-surface text-gray-400 hover:text-myth-accent">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(item)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-myth-border rounded-xl">
          <p className="text-gray-400 mb-4">No teams created yet.</p>
          <button type="button" onClick={openCreate} className="btn-primary">
            Create your first team
          </button>
        </div>
      )}

      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Team' : 'Create Team'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Department *</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="input-field w-full"
              required
            >
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Team Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Team Manager</label>
            <select
              value={form.leader}
              onChange={(e) => setForm({ ...form, leader: e.target.value })}
              className="input-field w-full"
            >
              <option value="">Select Manager</option>
              {employees.filter(e => e.isActive !== false).map(e => (
                <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Status</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="teamStatus"
                  value="active"
                  checked={form.status === 'active'}
                  onChange={() => setForm({ ...form, status: 'active' })}
                  className="text-myth-accent"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="teamStatus"
                  value="inactive"
                  checked={form.status === 'inactive'}
                  onChange={() => setForm({ ...form, status: 'inactive' })}
                  className="text-myth-accent"
                />
                Inactive
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-myth-border">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editId ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
