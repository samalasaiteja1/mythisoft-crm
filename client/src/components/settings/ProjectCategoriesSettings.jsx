import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectCategoriesAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import SearchBar from '../SearchBar';

const emptyForm = { name: '', code: '', description: '', status: 'active' };

export default function ProjectCategoriesSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    projectCategoriesAPI.getAll({ search, limit: 100 })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => toast.error('Failed to load project categories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal('form');
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '',
      code: item.code || '',
      description: item.description || '',
      status: item.status || 'active',
    });
    setEditId(item._id);
    setModal('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await projectCategoriesAPI.update(editId, form);
        toast.success('Category updated');
      } else {
        await projectCategoriesAPI.create(form);
        toast.success('Category created');
      }
      setModal(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (item) => {
    const next = item.status === 'active' ? 'inactive' : 'active';
    try {
      await projectCategoriesAPI.update(item._id, { status: next });
      toast.success(next === 'active' ? 'Category activated' : 'Category deactivated');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await projectCategoriesAPI.delete(item._id);
      toast.success('Category deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Project Categories</h3>
          <p className="text-sm text-gray-400 mt-1">
            Manage categories used when creating projects and capturing customer project details.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add Category
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search categories..." />

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-x-auto rounded-xl border border-myth-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-myth-border bg-myth-surface/50">
                <th className="table-header text-left">Name</th>
                <th className="table-header text-left">Code</th>
                <th className="table-header text-left">Description</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-myth-border/60 hover:bg-myth-surface/30">
                  <td className="table-cell font-medium text-white">{item.name}</td>
                  <td className="table-cell text-gray-400">{item.code || '—'}</td>
                  <td className="table-cell text-gray-400 max-w-xs truncate">{item.description || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${item.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {item.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => toggleStatus(item)} className="p-1.5 rounded hover:bg-myth-surface text-gray-400 hover:text-white" title={item.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {item.status === 'active' ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} />}
                      </button>
                      <button type="button" onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-myth-surface text-gray-400 hover:text-myth-accent" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => handleDelete(item)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-gray-500 py-10">
                    No project categories yet. Add your first category to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modal === 'form'}
        onClose={() => setModal(null)}
        title={editId ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Category Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field w-full"
              placeholder="e.g. Website Development"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Category Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="input-field w-full"
              placeholder="e.g. WEB, CRM, APP"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field w-full h-20"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="input-field w-full"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : editId ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
