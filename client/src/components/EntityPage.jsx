import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import SearchBar from './SearchBar';
import StatusBadge from './StatusBadge';
import Modal from './Modal';
import RequirementsDocumentField from './projects/RequirementsDocumentField';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminContentCard,
  AdminEmptyState,
} from './admin/adminUi';

export default function EntityPage({
  title,
  subtitle,
  icon: HeaderIcon,
  headerActions,
  stats,
  api,
  columns,
  formFields,
  emptyForm,
  statusOptions,
  statusKey = 'status',
  canCreate = true,
  canEdit = true,
  canDelete = true,
  getRowLabel = (item) => item.name || item.title || item._id,
  detailPath,
  onSubmitSuccess,
  createHref,
  createLabel = 'Add New',
  onCreateClick,
  editHref,
  initialStatusFilter = '',
  lockStatusFilter = false,
  extraQueryParams = {},
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    api.getAll({ search, [statusKey]: statusFilter, ...extraQueryParams })
      .then(({ data }) => setItems(data.items || data.logs || []))
      .catch(() => toast.error(`Failed to load ${title.toLowerCase()}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [search, statusFilter]);

  const openCreate = () => { setForm({ ...emptyForm }); setEditId(null); setModal('form'); };

  const normalizeForm = (item) => {
    const data = { ...emptyForm, ...item };
    ['customer', 'lead', 'manager', 'quotation', 'category'].forEach((key) => {
      if (data[key]?._id) data[key] = data[key]._id;
    });
    formFields?.forEach((field) => {
      if (field.valueAsArray && Array.isArray(data[field.name])) {
        const first = data[field.name][0];
        data[field.name] = typeof first === 'object' ? (first?._id || '') : (first || '');
      }
    });
    if (data.startDate) {
      data.startDate = new Date(data.startDate).toISOString().slice(0, 10);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate).toISOString().slice(0, 10);
    }
    if (data.scheduledAt) {
      data.scheduledAt = new Date(data.scheduledAt).toISOString().slice(0, 16);
    }
    return data;
  };

  const openEdit = (item) => { setForm(normalizeForm(item)); setEditId(item._id); setModal('form'); };

  const preparePayload = (data) => {
    const payload = { ...data };
    formFields?.forEach((field) => {
      if (field.type === 'file') {
        delete payload[field.name];
        return;
      }
      if (field.valueAsArray) {
        const value = payload[field.name];
        if (typeof value === 'string') {
          payload[field.name] = value ? [value] : [];
        } else if (Array.isArray(value)) {
          payload[field.name] = value.map((u) => (typeof u === 'object' ? u._id : u)).filter(Boolean);
        } else {
          payload[field.name] = [];
        }
      }
    });
    if (typeof payload.technologyStack === 'string') {
      payload.technologyStack = payload.technologyStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = preparePayload(form);
    try {
      let record;
      if (editId) {
        const { data } = await api.update(editId, payload);
        record = data;
        toast.success('Updated successfully');
      } else {
        const { data } = await api.create(payload);
        record = data;
        toast.success('Created successfully');
      }
      if (onSubmitSuccess) {
        await onSubmitSuccess(record, form, { editId });
      }
      setModal(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try {
      await api.delete(id);
      toast.success('Deleted');
      fetchItems();
    } catch { toast.error('Delete failed'); }
  };

  const renderField = (field) => {
    const { name, label, type = 'text', options, required, visible, emptyLabel, readOnly, placeholder } = field;
    if (visible && !visible(form)) return null;
    if (type === 'select') {
      return (
        <div key={name}>
          <label className="block text-sm text-gray-400 mb-1">{label}{required && <span className="text-red-400"> *</span>}</label>
          <select className="input-field w-full" value={form[name] || ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required={required} disabled={readOnly}>
            <option value="">{emptyLabel || (options?.length ? 'Select...' : 'No options available')}</option>
            {(options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }
    if (type === 'textarea') {
      return (
        <div key={name}>
          <label className="block text-sm text-gray-400 mb-1">{label}</label>
          <textarea className="input-field w-full" rows={3} value={form[name] || ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })} readOnly={readOnly} disabled={readOnly} />
        </div>
      );
    }
    if (type === 'file') {
      return (
        <div key={name}>
          <RequirementsDocumentField
            label={label}
            file={form[name] || null}
            onChange={(file) => setForm({ ...form, [name]: file })}
          />
        </div>
      );
    }
    if (type === 'date') {
      return (
        <div key={name}>
          <label className="block text-sm text-gray-400 mb-1">{label}</label>
          <input
            type="date"
            className="input-field w-full"
            value={form[name] || ''}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
      );
    }
    return (
      <div key={name}>
        <label className="block text-sm text-gray-400 mb-1">{label}</label>
        <input
          type={type}
          className="input-field w-full"
          value={form[name] ?? ''}
          placeholder={placeholder}
          onChange={(e) => setForm({ ...form, [name]: type === 'number' ? Number(e.target.value) : e.target.value })}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </div>
    );
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={HeaderIcon}
        title={title}
        subtitle={subtitle}
        actions={headerActions ?? (
          <>
            {canCreate && onCreateClick && (
              <button type="button" onClick={onCreateClick} className="btn-primary text-sm flex items-center gap-2">
                <Plus size={18} /> {createLabel}
              </button>
            )}
            {canCreate && !onCreateClick && createHref && (
              <Link to={createHref} className="btn-primary text-sm flex items-center gap-2">
                <Plus size={18} /> {createLabel}
              </Link>
            )}
            {canCreate && !onCreateClick && !createHref && formFields && (
              <button type="button" onClick={openCreate} className="btn-primary text-sm flex items-center gap-2">
                <Plus size={18} /> {createLabel}
              </button>
            )}
          </>
        )}
      />

      {stats}

      <AdminContentCard
        toolbar={(
          <>
            <div className="flex-1 min-w-[200px]">
              <SearchBar value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}...`} />
            </div>
            {statusOptions && !lockStatusFilter && (
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-500" />
                <select className="input-field sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
          </>
        )}
      >
      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <AdminEmptyState message={`No ${title.toLowerCase()} found`} />
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full">
            <thead>
              <tr>
                {columns.map((col) => <th key={col.key} className="table-header">{col.label}</th>)}
                {(canEdit || canDelete) && <th className="table-header text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t border-myth-border hover:bg-myth-surface/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="table-cell">
                      {col.render ? col.render(item) : (col.statusMap
                        ? <StatusBadge status={item[col.key]} config={col.statusMap} />
                        : item[col.key] ?? '-')}
                    </td>
                  ))}
                  {(canEdit || canDelete) && (
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && editHref && (
                          <Link to={editHref(item)} className="p-2 text-gray-400 hover:text-myth-accent rounded-lg hover:bg-myth-surface/50"><Pencil size={16} /></Link>
                        )}
                        {canEdit && !editHref && formFields && (
                          <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-myth-accent rounded-lg hover:bg-myth-surface/50"><Pencil size={16} /></button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </AdminContentCard>

      {modal === 'form' && formFields && !createHref && (
        <Modal isOpen={modal === 'form'} title={editId ? `Edit ${title}` : `Add ${title}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map(renderField)}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">{editId ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </AdminPageShell>
  );
}
