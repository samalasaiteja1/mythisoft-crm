import CustomerProjectSetupSteps from './CustomerProjectSetupSteps';
import { hasProjectRequirementsData } from '../../utils/customerForm';
import { PROJECT_STATUS_KEYS, PROJECT_STATUSES } from '../../constants/projectStatuses';

const projectStatusOptions = PROJECT_STATUS_KEYS.map((value) => ({
  value,
  label: PROJECT_STATUSES[value]?.label || value.replace(/_/g, ' '),
}));

const fieldLabel = 'block text-xs lg:text-sm font-medium text-gray-300 mb-1.5';
const sectionTitle = 'text-xs lg:text-sm font-semibold text-white';
const sectionHint = 'text-[10px] lg:text-xs text-gray-500';

const ContactReadOnly = ({ form }) => (
  <div className="rounded-lg border border-myth-accent/30 bg-myth-accent/5 p-3 lg:p-4 space-y-2 lg:space-y-3">
    <div>
      <h3 className={sectionTitle}>Contact from deal</h3>
      <p className={`${sectionHint} mt-1`}>Pulled from the linked lead — review and confirm below</p>
    </div>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 lg:gap-x-6 gap-y-2 lg:gap-y-3 text-xs lg:text-sm">
      <div>
        <dt className="text-gray-500 text-[10px] lg:text-xs uppercase tracking-wide mb-0.5">Name</dt>
        <dd className="text-white">{[form.firstName, form.lastName].filter(Boolean).join(' ') || '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500 text-[10px] lg:text-xs uppercase tracking-wide mb-0.5">Email</dt>
        <dd className="text-white break-all">{form.email || '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500 text-[10px] lg:text-xs uppercase tracking-wide mb-0.5">Phone</dt>
        <dd className="text-white">{form.phone || '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500 text-[10px] lg:text-xs uppercase tracking-wide mb-0.5">Company</dt>
        <dd className="text-white">{form.companyName || '—'}</dd>
      </div>
      {form.title && (
        <div>
          <dt className="text-gray-500 text-[10px] lg:text-xs uppercase tracking-wide mb-0.5">Job title</dt>
          <dd className="text-white">{form.title}</dd>
        </div>
      )}
    </dl>
  </div>
);

export default function CustomerForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitting = false,
  contactLocked = false,
  fromDealConversion = false,
  dealTitle = '',
  projectCategories = [],
  requirementsDocument,
  setRequirementsDocument,
  showProjectSetup = false,
  canAssignTeam = false,
  userExistsForEmail = false,
  onEmailChange = null,
}) {
  const setAddress = (key, value) => {
    setForm({ ...form, address: { ...form.address, [key]: value } });
  };

  const setProjectReq = (key, value) => {
    setForm({ ...form, projectRequirements: { ...form.projectRequirements, [key]: value } });
  };

  const projectStatusField = (
    <div>
      <label className={fieldLabel}>Project status</label>
      <select
        value={form.projectRequirements?.status || 'planning'}
        onChange={(e) => setProjectReq('status', e.target.value)}
        className="input-field"
      >
        {projectStatusOptions.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4 lg:space-y-6">
      {fromDealConversion && contactLocked && (
        <ContactReadOnly form={form} />
      )}

      {fromDealConversion && !contactLocked && dealTitle && (
        <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 lg:p-4">
          <h3 className={sectionTitle}>Deal</h3>
          <p className="text-white text-xs lg:text-sm mt-1">{dealTitle}</p>
          <p className={`${sectionHint} mt-1`}>No lead contact on file — set account details below</p>
        </div>
      )}

      {!fromDealConversion && (
        <>
          {contactLocked ? (
            <ContactReadOnly form={form} />
          ) : (
            <>
              <div>
                <h3 className={sectionTitle}>Customer name</h3>
                <p className={`${sectionHint} mt-1 mb-2 lg:mb-3`}>Primary contact person for this account</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className={fieldLabel}>First name *</label>
                    <input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="input-field"
                      required
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>Last name *</label>
                    <input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="input-field"
                      required
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 lg:p-4 space-y-3 lg:space-y-4">
                <div>
                  <h3 className={sectionTitle}>Contact information</h3>
                  <p className={`${sectionHint} mt-1`}>Email, phone, and job details</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className={fieldLabel}>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => onEmailChange ? onEmailChange(e.target.value) : setForm({ ...form, email: e.target.value })}
                      className="input-field"
                      required
                      placeholder="customer@company.com"
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>Phone</label>
                    <input
                      type="tel"
                      value={form.phone || ''}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input-field"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>Company</label>
                    <input
                      value={form.companyName || ''}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="input-field"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>Job title</label>
                    <input
                      value={form.title || ''}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="input-field"
                      placeholder="e.g. Director, Procurement Manager"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!fromDealConversion && !contactLocked && (
      <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 lg:p-4 space-y-3 lg:space-y-4">
        <div>
          <h3 className={sectionTitle}>Address</h3>
          <p className={`${sectionHint} mt-1`}>Billing or office location (optional)</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Street</label>
            <input
              value={form.address?.street || ''}
              onChange={(e) => setAddress('street', e.target.value)}
              className="input-field"
              placeholder="Street address"
            />
          </div>
          <div>
            <label className={fieldLabel}>City</label>
            <input
              value={form.address?.city || ''}
              onChange={(e) => setAddress('city', e.target.value)}
              className="input-field"
              placeholder="City"
            />
          </div>
          <div>
            <label className={fieldLabel}>State</label>
            <input
              value={form.address?.state || ''}
              onChange={(e) => setAddress('state', e.target.value)}
              className="input-field"
              placeholder="State"
            />
          </div>
          <div>
            <label className={fieldLabel}>Country</label>
            <input
              value={form.address?.country || ''}
              onChange={(e) => setAddress('country', e.target.value)}
              className="input-field"
              placeholder="Country"
            />
          </div>
          <div>
            <label className={fieldLabel}>ZIP / PIN</label>
            <input
              value={form.address?.zipCode || ''}
              onChange={(e) => setAddress('zipCode', e.target.value)}
              className="input-field"
              placeholder="Postal code"
            />
          </div>
        </div>
      </div>
      )}

      {!userExistsForEmail && !contactLocked && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 lg:p-4 space-y-3 lg:space-y-4">
          <div>
            <h3 className={sectionTitle}>Customer Portal Access (Optional)</h3>
            <p className={`${sectionHint} mt-1`}>Provide a password to create a customer portal account for this customer. They can login to track their progress.</p>
          </div>
          <div>
            <label className={fieldLabel}>Customer Password</label>
            <input
              type="password"
              value={form.customerPassword || ''}
              onChange={(e) => setForm({ ...form, customerPassword: e.target.value })}
              className="input-field"
              placeholder="Leave empty to skip portal account creation"
              minLength={6}
            />
            <p className={`${sectionHint} mt-1`}>Minimum 6 characters. Leave empty to not create a portal account.</p>
          </div>
        </div>
      )}
      {userExistsForEmail && !contactLocked && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 lg:p-4 space-y-3 lg:space-y-4">
          <div>
            <h3 className={sectionTitle}>Customer Portal Access</h3>
            <p className={`${sectionHint} mt-1`}>A portal account already exists for this email. The customer can login with their existing credentials.</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 lg:p-4 space-y-3 lg:space-y-4">
        <div>
          <h3 className={sectionTitle}>Account settings</h3>
          <p className={`${sectionHint} mt-1`}>Status and internal notes</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          <div>
            <label className={fieldLabel}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="input-field"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field min-h-[88px] resize-y"
              placeholder="Internal notes about this customer..."
            />
          </div>
        </div>
      </div>

      {/* Project requirements section */}
      {!(fromDealConversion && hasProjectRequirementsData(form)) && (
      <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 lg:p-4 space-y-3 lg:space-y-4">
        <div>
          <h3 className={sectionTitle}>Project requirements</h3>
          <p className={`${sectionHint} mt-1`}>Capture initial delivery requirements for this customer (optional)</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          <div>
            <label className={fieldLabel}>Project category</label>
            <select
              value={form.projectRequirements?.category || ''}
              onChange={(e) => setProjectReq('category', e.target.value)}
              className="input-field"
            >
              <option value="">Select project category</option>
              {projectCategories.map((c) => (
                <option key={c._id || c} value={c._id || c}>{c.name || c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={fieldLabel}>Project name</label>
            <input
              value={form.projectRequirements?.name || ''}
              onChange={(e) => setProjectReq('name', e.target.value)}
              className="input-field"
              placeholder="Project name"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Project description</label>
            <textarea
              value={form.projectRequirements?.description || ''}
              onChange={(e) => setProjectReq('description', e.target.value)}
              className="input-field min-h-[88px] resize-y"
              placeholder="Brief description"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Scope / requirements</label>
            <textarea
              value={form.projectRequirements?.scope || ''}
              onChange={(e) => setProjectReq('scope', e.target.value)}
              className="input-field min-h-[88px] resize-y"
              placeholder="Scope / requirements"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Deliverables</label>
            <textarea
              value={form.projectRequirements?.deliverables || ''}
              onChange={(e) => setProjectReq('deliverables', e.target.value)}
              className="input-field min-h-[88px] resize-y"
              placeholder="Deliverables"
            />
          </div>
          <div>
            <label className={fieldLabel}>Technology stack</label>
            <input
              value={form.projectRequirements?.technologyStack || ''}
              onChange={(e) => setProjectReq('technologyStack', e.target.value)}
              className="input-field"
              placeholder="Comma separated technologies"
            />
          </div>
          <div>
            <label className={fieldLabel}>Priority</label>
            <select
              value={form.projectRequirements?.priority || 'medium'}
              onChange={(e) => setProjectReq('priority', e.target.value)}
              className="input-field"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          {projectStatusField}
          <div>
            <label className={fieldLabel}>Estimated budget (INR)</label>
            <input
              type="number"
              value={form.projectRequirements?.estimatedBudget || ''}
              onChange={(e) => setProjectReq('estimatedBudget', e.target.value)}
              className="input-field"
              placeholder="Estimated budget"
            />
          </div>
          <div>
            <label className={fieldLabel}>Planned start</label>
            <input
              type="date"
              value={form.projectRequirements?.startDate || ''}
              onChange={(e) => setProjectReq('startDate', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className={fieldLabel}>Target end</label>
            <input
              type="date"
              value={form.projectRequirements?.endDate || ''}
              onChange={(e) => setProjectReq('endDate', e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {showProjectSetup && (
          <CustomerProjectSetupSteps
            form={form}
            setForm={setForm}
            requirementsDocument={requirementsDocument}
            setRequirementsDocument={setRequirementsDocument}
            canAssign={canAssignTeam}
          />
        )}
      </div>
      )}

      {showProjectSetup && fromDealConversion && hasProjectRequirementsData(form) && (
        <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 lg:p-4 space-y-3 lg:space-y-4">
          {projectStatusField}
          <CustomerProjectSetupSteps
            form={form}
            setForm={setForm}
            requirementsDocument={requirementsDocument}
            setRequirementsDocument={setRequirementsDocument}
            canAssign={canAssignTeam}
          />
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 lg:gap-3 pt-2 border-t border-myth-border">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary w-full sm:w-auto" disabled={submitting}>
            {cancelLabel}
          </button>
        )}
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
