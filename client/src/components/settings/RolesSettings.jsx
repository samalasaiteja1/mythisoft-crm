import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { rolesAPI, departmentsAPI } from '../../services/api';
import { PLACEHOLDERS } from '../../constants/projectSamples';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';

const PERMISSIONS = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
  { id: 'assign', label: 'Assign' },
];

const DEPT_PRESETS = {
  sales: { view: true, create: true, edit: true, delete: false, assign: true },
  technical: { view: true, create: true, edit: true, delete: false, assign: false },
  support: { view: true, create: true, edit: true, delete: false, assign: true },
  hr: { view: true, create: true, edit: true, delete: false, assign: false },
  default: { view: true, create: false, edit: false, delete: false, assign: false },
};

const emptyForm = {
  name: '',
  department: '',
  description: '',
  permissions: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    assign: false,
  },
  status: 'active',
};

function inferDeptKey(department, departments) {
  const dept = departments.find((d) => String(d._id) === String(department));
  const name = (dept?.name || department || '').toLowerCase();
  if (name.includes('sales')) return 'sales';
  if (name.includes('tech')) return 'technical';
  if (name.includes('support')) return 'support';
  if (name.includes('hr')) return 'hr';
  return 'default';
}

function PermissionBadges({ permissions }) {
  const active = PERMISSIONS.filter((p) => permissions?.[p.id]);
  if (!active.length) return <span className="text-gray-500 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {active.map((p) => (
        <span key={p.id} className="badge bg-myth-accent/10 text-myth-accent text-xs">{p.label}</span>
      ))}
    </div>
  );
}

export default function RolesSettings() {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    rolesAPI.getAll()
      .then(({ data }) => setItems(Array.isArray(data) ? data : (data.items || [])))
      .catch(() => toast.error('Failed to load roles'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    departmentsAPI.getAll()
      .then(({ data }) => setDepartments(Array.isArray(data) ? data : (data.items || [])))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.status === 'active').length,
    departments: new Set(items.map((i) => i.department?._id || i.department).filter(Boolean)).size,
  }), [items]);

  const filteredItems = useMemo(() => {
    if (deptFilter === 'all') return items;
    return items.filter((i) => String(i.department?._id || i.department) === String(deptFilter));
  }, [items, deptFilter]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal('form');
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '',
      department: item.department?._id || item.department || '',
      description: item.description || '',
      permissions: {
        view: item.permissions?.view || false,
        create: item.permissions?.create || false,
        edit: item.permissions?.edit || false,
        delete: item.permissions?.delete || false,
        assign: item.permissions?.assign || false,
      },
      status: item.status || 'active',
    });
    setEditId(item._id);
    setModal('form');
  };

  const applyDeptPreset = (departmentId) => {
    const key = inferDeptKey(departmentId, departments);
    const preset = DEPT_PRESETS[key] || DEPT_PRESETS.default;
    setForm((prev) => ({ ...prev, department: departmentId, permissions: { ...preset } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Job title is required');
    if (!form.department) return toast.error('Department is required');

    setSubmitting(true);
    try {
      if (editId) {
        await rolesAPI.update(editId, form);
        toast.success('Job role updated');
      } else {
        await rolesAPI.create(form);
        toast.success('Job role created');
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
    if (!confirm(`Delete job role "${item.name}"?`)) return;
    try {
      await rolesAPI.delete(item._id);
      toast.success('Job role deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handlePermissionChange = (permId) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permId]: !prev.permissions[permId],
      },
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield size={18} className="text-myth-accent" /> Job Roles
          </h3>
          <p className="text-sm text-gray-400 mt-1 max-w-xl">
            Department job titles for hiring (e.g. Senior Sales Executive). System access comes from the user&apos;s system role inferred from department — not these checkboxes.
          </p>
          <Link to="/permissions" className="text-sm text-myth-accent hover:underline mt-2 inline-flex items-center gap-1">
            View system role matrix <ArrowRight size={14} />
          </Link>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <Plus size={18} /> Create Job Role
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400">Total roles</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400">Departments</p>
          <p className="text-2xl font-bold text-blue-400">{stats.departments}</p>
        </div>
      </div>

      {departments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDeptFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm ${deptFilter === 'all' ? 'bg-myth-accent text-myth-navy' : 'bg-myth-surface text-gray-400'}`}
          >
            All
          </button>
          {departments.map((d) => (
            <button
              key={d._id}
              type="button"
              onClick={() => setDeptFilter(d._id)}
              className={`px-3 py-1.5 rounded-lg text-sm ${deptFilter === d._id ? 'bg-myth-accent text-myth-navy' : 'bg-myth-surface text-gray-400'}`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-myth-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-myth-border bg-myth-surface/50">
                <th className="table-header text-left">Job Title</th>
                <th className="table-header text-left">Department</th>
                <th className="table-header text-left">Permissions</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id} className="border-b border-myth-border/60 hover:bg-myth-surface/30">
                  <td className="table-cell font-medium text-white">{item.name}</td>
                  <td className="table-cell text-gray-400">
                    {item.department?.name || departments.find((d) => d._id === item.department)?.name || '—'}
                  </td>
                  <td className="table-cell"><PermissionBadges permissions={item.permissions} /></td>
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
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-myth-border rounded-xl">
          <p className="text-gray-400 mb-4">No job roles yet. Create titles per department before hiring employees.</p>
          <button type="button" onClick={openCreate} className="btn-primary">
            Create first job role
          </button>
        </div>
      )}

      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Job Role' : 'Create Job Role'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Job Title *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field w-full"
              placeholder={PLACEHOLDERS.jobRole}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Department *</label>
            <select
              value={form.department}
              onChange={(e) => {
                const val = e.target.value;
                if (!editId && val) applyDeptPreset(val);
                else setForm({ ...form, department: val });
              }}
              className="input-field w-full"
              required
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Department determines system role when hiring (Sales → sales, Technical → technical, etc.)</p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field w-full"
              placeholder="Brief description of responsibilities"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Default Permission Flags</label>
            <p className="text-xs text-gray-500 mb-2">Informational for this job title — does not override system role access.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PERMISSIONS.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.permissions[perm.id]}
                    onChange={() => handlePermissionChange(perm.id)}
                    className="h-4 w-4 rounded border-myth-border bg-myth-surface text-myth-accent"
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Status</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="roleStatus"
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
                  name="roleStatus"
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
              {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
