import RequirementsDocumentField from '../projects/RequirementsDocumentField';
import { formatAssigneeName, leadHasManager } from '../../constants/adminLeadViews';

export default function DealDeliveryFields({
  form,
  setDeal,
  setProject,
  requirementsDocument,
  setRequirementsDocument,
  canAssign = false,
  salesUsers = [],
  managers = [],
  projectCategories = [],
  fromLead = false,
  isAdmin = false,
  isManager = false,
  lead = null,
  userExistsForEmail = false,
  onEmailChange = null,
}) {
  const leadManagerLocked = fromLead && leadHasManager(lead);
  const managerId = form.assignedManager || lead?.assignedManager?._id || lead?.assignedManager || '';
  const salesPool = managerId
    ? salesUsers.filter((u) => String(u.reportsTo?._id || u.reportsTo) === String(managerId))
    : salesUsers;

  const managerLabel = formatAssigneeName(lead?.assignedManager)
    || formatAssigneeName(managers.find((m) => String(m._id) === String(managerId)))
    || '';

  const handleManagerChange = (managerIdValue) => {
    const pool = managerIdValue
      ? salesUsers.filter((u) => String(u.reportsTo?._id || u.reportsTo) === String(managerIdValue))
      : salesUsers;
    const stillValid = !form.assignedTo || pool.some((u) => String(u._id) === String(form.assignedTo));
    setDeal({
      assignedManager: managerIdValue,
      assignedTo: managerIdValue && stillValid ? form.assignedTo : '',
    });
  };

  return (
    <>
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-myth-border pb-2">Deal details</h2>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Deal title *</label>
          <input value={form.title} onChange={(e) => setDeal({ title: e.target.value })} className="input-field w-full" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Deal value (INR)</label>
            <input type="number" min="0" value={form.value} onChange={(e) => setDeal({ value: Number(e.target.value) })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Win probability %</label>
            <input type="number" min="0" max="100" value={form.probability} onChange={(e) => setDeal({ probability: Number(e.target.value) })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Expected close date</label>
            <input type="date" value={form.expectedCloseDate} onChange={(e) => setDeal({ expectedCloseDate: e.target.value })} className="input-field w-full" />
          </div>
        </div>
        {canAssign && (
          <div className="p-4 rounded-lg bg-myth-navy-light/40 border border-myth-border space-y-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              {fromLead ? 'Lead assignment' : 'Deal assignment'}
            </p>
            <p className="text-xs text-gray-500">
              {fromLead
                ? 'Updates the lead record. Deal stays unassigned unless you pick a salesperson below.'
                : 'Manager or sales executive — either one is fine, or leave both unassigned.'}
            </p>
            {isAdmin && (
              <div>
                <label className="block text-sm text-gray-300 mb-1">Assign to manager</label>
                {fromLead && leadManagerLocked ? (
                  <p className="text-sm text-white py-2 px-3 rounded-lg bg-myth-surface/50 border border-myth-border">
                    {managerLabel || 'Manager assigned'}
                  </p>
                ) : (
                  <select
                    value={form.assignedManager || ''}
                    onChange={(e) => handleManagerChange(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Unassigned (no manager)</option>
                    {managers.map((u) => (
                      <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
            {!isAdmin && isManager && fromLead && leadManagerLocked && (
              <div>
                <label className="block text-sm text-gray-300 mb-1">Sales manager</label>
                <p className="text-sm text-white py-2 px-3 rounded-lg bg-myth-surface/50 border border-myth-border">
                  {managerLabel || '—'}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Assign to sales</label>
              <select
                value={form.assignedTo || ''}
                onChange={(e) => setDeal({ assignedTo: e.target.value })}
                className="input-field w-full"
                disabled={salesPool.length === 0}
              >
                <option value="">Unassigned</option>
                {salesPool.map((u) => (
                  <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
              {salesPool.length === 0 && (
                <p className="text-xs text-amber-400/80 mt-1">No sales executives available.</p>
              )}
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Deal notes / description</label>
          <textarea value={form.description} onChange={(e) => setDeal({ description: e.target.value })} className="input-field w-full h-24" />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-myth-border pb-2">Contact information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">First Name *</label>
            <input placeholder="First Name" value={form.firstName} onChange={(e) => setDeal({ firstName: e.target.value })} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Last Name *</label>
            <input placeholder="Last Name" value={form.lastName} onChange={(e) => setDeal({ lastName: e.target.value })} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email *</label>
            <input 
              type="email" 
              placeholder="Email" 
              value={form.email} 
              onChange={(e) => onEmailChange ? onEmailChange(e.target.value) : setDeal({ email: e.target.value })} 
              className="input-field w-full" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Phone</label>
            <input placeholder="Phone" value={form.phone} onChange={(e) => setDeal({ phone: e.target.value })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Alternate phone</label>
            <input placeholder="Alternate phone" value={form.alternatePhone} onChange={(e) => setDeal({ alternatePhone: e.target.value })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Website</label>
            <input placeholder="Website" value={form.website} onChange={(e) => setDeal({ website: e.target.value })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Company</label>
            <input placeholder="Company" value={form.companyName} onChange={(e) => setDeal({ companyName: e.target.value })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Job title</label>
            <input placeholder="Job title" value={form.contactTitle} onChange={(e) => setDeal({ contactTitle: e.target.value })} className="input-field w-full" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Industry</label>
            <input placeholder="Industry" value={form.industry} onChange={(e) => setDeal({ industry: e.target.value })} className="input-field w-full" />
          </div>
        </div>
      </section>

      {!userExistsForEmail && (
        <section className="card space-y-4 border border-blue-500/20 bg-blue-500/5">
          <h2 className="text-lg font-semibold text-white border-b border-myth-border pb-2">Customer Portal Access (Optional)</h2>
          <p className="text-xs text-gray-500 -mt-2">Provide a password to create a customer portal account for this deal. They can login to track their progress.</p>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Customer Password</label>
            <input 
              type="password" 
              value={form.customerPassword || ''} 
              onChange={(e) => setDeal({ customerPassword: e.target.value })} 
              className="input-field w-full" 
              placeholder="Leave empty to skip portal account creation"
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters. Leave empty to not create a portal account.</p>
          </div>
        </section>
      )}
      {userExistsForEmail && (
        <section className="card space-y-4 border border-green-500/20 bg-green-500/5">
          <h2 className="text-lg font-semibold text-white border-b border-myth-border pb-2">Customer Portal Access</h2>
          <p className="text-xs text-gray-500 -mt-2">A portal account already exists for this email. The customer can login with their existing credentials.</p>
        </section>
      )}

      {!(form.projectRequirements && form.projectRequirements.name && form.projectRequirements.category) && (
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-myth-border pb-2">Project requirements</h2>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Project category *</label>
          <select
            value={form.projectRequirements.category || ''}
            onChange={(e) => setProject({ category: e.target.value })}
            className="input-field w-full"
            required
          >
            <option value="">Select project category</option>
            {projectCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code ? `${c.name} (${c.code})` : c.name}
              </option>
            ))}
          </select>
          {projectCategories.length === 0 && (
            <p className="text-xs text-amber-400 mt-1">No active categories — add them under Settings → Project Categories.</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Project name *</label>
          <input value={form.projectRequirements.name} onChange={(e) => setProject({ name: e.target.value })} className="input-field w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Project description</label>
          <textarea value={form.projectRequirements.description} onChange={(e) => setProject({ description: e.target.value })} className="input-field w-full h-20" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Scope / requirements</label>
          <textarea value={form.projectRequirements.scope} onChange={(e) => setProject({ scope: e.target.value })} className="input-field w-full h-20" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Deliverables</label>
          <textarea value={form.projectRequirements.deliverables} onChange={(e) => setProject({ deliverables: e.target.value })} className="input-field w-full h-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Technology stack</label>
            <input value={form.projectRequirements.technologyStack} onChange={(e) => setProject({ technologyStack: e.target.value })} className="input-field w-full" placeholder="React, Node.js (comma-separated)" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Priority</label>
            <select value={form.projectRequirements.priority} onChange={(e) => setProject({ priority: e.target.value })} className="input-field w-full">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Estimated budget (INR)</label>
            <input type="number" min="0" value={form.projectRequirements.estimatedBudget} onChange={(e) => setProject({ estimatedBudget: Number(e.target.value) })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Planned start</label>
            <input type="date" value={form.projectRequirements.startDate} onChange={(e) => setProject({ startDate: e.target.value })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Target end</label>
            <input type="date" value={form.projectRequirements.endDate} onChange={(e) => setProject({ endDate: e.target.value })} className="input-field w-full" />
          </div>
        </div>

        {typeof setRequirementsDocument === 'function' && (
          <div>
            <RequirementsDocumentField
              label="Project requirements document"
              file={requirementsDocument}
              onChange={setRequirementsDocument}
            />
          </div>
        )}
      </section>
      )}
    </>
  );
}
