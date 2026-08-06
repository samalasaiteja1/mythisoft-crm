import CustomerProjectSetupSteps from '../customers/CustomerProjectSetupSteps';
import { PROJECT_STATUS_KEYS, PROJECT_STATUSES } from '../../constants/projectStatuses';

const fieldLabel = 'block text-sm font-medium text-gray-300 mb-1.5';
const sectionTitle = 'text-sm font-semibold text-white';
const sectionHint = 'text-xs text-gray-500';

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const statusOptions = PROJECT_STATUS_KEYS.map((value) => ({
  value,
  label: PROJECT_STATUSES[value]?.label || value.replace(/_/g, ' '),
}));

export default function ProjectSetupForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitLabel = 'Create Project',
  cancelLabel = 'Cancel',
  submitting = false,
  customerOptions = [],
  projectCategories = [],
  requirementsDocument,
  setRequirementsDocument,
  canAssignTeam = true,
  customerRequired = true,
}) {
  const setField = (key, value) => setForm({ ...form, [key]: value });

  const customerForm = {
    projectTeam: form.projectTeam,
    projectRequirements: {
      status: form.status,
    },
  };

  const setCustomerForm = (next) => {
    if (next.projectTeam) {
      setForm((prev) => ({ ...prev, projectTeam: next.projectTeam }));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-4 space-y-4">
        <div>
          <h3 className={sectionTitle}>Customer</h3>
          <p className={`${sectionHint} mt-1`}>Link this project to a customer account</p>
        </div>
        <div>
          <label className={fieldLabel}>Customer {customerRequired && '*'}</label>
          <select
            value={form.customer || ''}
            onChange={(e) => setField('customer', e.target.value)}
            className="input-field"
            required={customerRequired}
          >
            <option value="">Select customer</option>
            {customerOptions.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-4 space-y-4">
        <div>
          <h3 className={sectionTitle}>Project requirements</h3>
          <p className={`${sectionHint} mt-1`}>Capture delivery requirements for this project</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>Project category</label>
            <select
              value={form.category || ''}
              onChange={(e) => setField('category', e.target.value)}
              className="input-field"
            >
              <option value="">Select project category</option>
              {projectCategories.map((c) => (
                <option key={c._id || c} value={c._id || c}>{c.name || c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={fieldLabel}>Project name *</label>
            <input
              value={form.name || ''}
              onChange={(e) => setField('name', e.target.value)}
              className="input-field"
              required
              placeholder="Project name"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Project description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setField('description', e.target.value)}
              className="input-field min-h-[88px] resize-y"
              placeholder="Brief description"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Scope / requirements</label>
            <textarea
              value={form.scope || ''}
              onChange={(e) => setField('scope', e.target.value)}
              className="input-field min-h-[88px] resize-y"
              placeholder="Scope / requirements"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Deliverables</label>
            <textarea
              value={form.deliverables || ''}
              onChange={(e) => setField('deliverables', e.target.value)}
              className="input-field min-h-[88px] resize-y"
              placeholder="Deliverables"
            />
          </div>
          <div>
            <label className={fieldLabel}>Technology stack</label>
            <input
              value={form.technologyStack || ''}
              onChange={(e) => setField('technologyStack', e.target.value)}
              className="input-field"
              placeholder="Comma separated technologies"
            />
          </div>
          <div>
            <label className={fieldLabel}>Priority</label>
            <select
              value={form.priority || 'medium'}
              onChange={(e) => setField('priority', e.target.value)}
              className="input-field"
            >
              {priorityOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={fieldLabel}>Project status</label>
            <select
              value={form.status || 'planning'}
              onChange={(e) => setField('status', e.target.value)}
              className="input-field"
            >
              {statusOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={fieldLabel}>Estimated budget (INR)</label>
            <input
              type="number"
              min="0"
              value={form.budget || ''}
              onChange={(e) => setField('budget', e.target.value)}
              className="input-field"
              placeholder="Estimated budget"
            />
          </div>
          <div>
            <label className={fieldLabel}>Planned start</label>
            <input
              type="date"
              value={form.startDate || ''}
              onChange={(e) => setField('startDate', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className={fieldLabel}>Target end</label>
            <input
              type="date"
              value={form.endDate || ''}
              onChange={(e) => setField('endDate', e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <CustomerProjectSetupSteps
          form={customerForm}
          setForm={setCustomerForm}
          requirementsDocument={requirementsDocument}
          setRequirementsDocument={setRequirementsDocument}
          canAssign={canAssignTeam}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-myth-border">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary w-full sm:w-auto" disabled={submitting}>
            {cancelLabel}
          </button>
        )}
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>
          {submitting ? 'Creating…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
