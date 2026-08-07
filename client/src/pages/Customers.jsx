import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Phone, Building2, Users, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersAPI, usersAPI, leadsAPI, formatCurrency } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerTechAssignmentBadge from '../components/customers/CustomerTechAssignmentBadge';
import CustomerSupportAssignmentBadge from '../components/customers/CustomerSupportAssignmentBadge';
import { emptyCustomerForm, formFromCustomer, buildCustomerPayload } from '../utils/customerForm';
import { usePermissions } from '../hooks/usePermissions';
import { SEGMENT_TAB_MAP, SEGMENT_LABELS } from '../constants/customerNav';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminEmptyState,
} from '../components/admin/adminUi';

const statusColors = {
  active: 'bg-green-500/20 text-green-400',
  inactive: 'bg-gray-500/20 text-gray-400',
  vip: 'bg-yellow-500/20 text-yellow-400',
};

export default function Customers({ segment = 'all', title = 'Customers' }) {
  const { isAdmin, isSales, canWrite } = usePermissions();

  const [customers, setCustomers] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyCustomerForm);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showManagerAssignId, setShowManagerAssignId] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [selectedManager, setSelectedManager] = useState('');
  const [assigningManager, setAssigningManager] = useState(false);
  const [passwordChangeCustomer, setPasswordChangeCustomer] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Leads UI state: load on demand per-customer
  const [leadsByCustomer, setLeadsByCustomer] = useState({}); // { customerId: [leads] }
  const [leadsOpenId, setLeadsOpenId] = useState(null);
  const [loadingLeadsMap, setLoadingLeadsMap] = useState({}); // { customerId: bool }


  const fetch = () => {
    setLoading(true);
    customersAPI.getAll({ search, segment })
      .then(({ data }) => setCustomers(data.customers || []))
      .catch((err) => {
        console.error('Failed to load customers:', err);
        toast.error(err.response?.data?.message || 'Failed to load customers');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [search, segment]);

  useEffect(() => {
    usersAPI.getSalesTeam()
      .then(({ data }) => setSalesUsers(data.members || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!showManagerAssignId) return;
    let mounted = true;
    (async () => {
      setLoadingManagers(true);
      try {
        let managerUsers = [];
        try {
          const { data } = await usersAPI.getManagers();
          managerUsers = data || [];
        } catch {
          const { data: allUsers } = await usersAPI.getAll();
          managerUsers = (allUsers || []).filter((u) => u?.role === 'manager' && u.isActive !== false);
        }
        if (mounted) setManagers(managerUsers);
      } catch {
        if (mounted) setManagers([]);
      } finally {
        if (mounted) setLoadingManagers(false);
      }
    })();
    return () => { mounted = false; };
  }, [showManagerAssignId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editId) return;
    setSubmitting(true);
    try {
      await customersAPI.update(editId, buildCustomerPayload(form));
      toast.success('Customer updated');
      setModal(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const openPasswordChange = (customer) => {
    if (!customer.portalUser) {
      toast.error('This customer does not have a portal account');
      return;
    }
    setPasswordChangeCustomer(customer);
    setNewPassword('');
    setModal('password');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await usersAPI.changePassword(passwordChangeCustomer.portalUser._id || passwordChangeCustomer.portalUser, { password: newPassword });
      toast.success('Password changed successfully');
      setPasswordChangeCustomer(null);
      setNewPassword('');
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getAssignedManagerLabel = (customer) => {
    const assignedUser = customer?.assignedTo;
    if (assignedUser && typeof assignedUser === 'object') {
      return `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim();
    }
    if (typeof assignedUser === 'string') return assignedUser;
    return '';
  };

  const isAssignedToManager = (customer) => Boolean(getAssignedManagerLabel(customer));

  // Load leads for a customer (on demand)
  const loadLeadsForCustomer = async (customerId) => {
    if (!customerId) return;
    if (leadsByCustomer[customerId] && leadsByCustomer[customerId].length) return;
    setLoadingLeadsMap((m) => ({ ...m, [customerId]: true }));
    try {
      const { data } = await leadsAPI.getAll({ customer: customerId, limit: 50 });
      // leadsAPI returns { leads: [...] } or an array — normalize
      const leads = (data.leads || data.items || data || []).map((l) => l).filter(Boolean);
      setLeadsByCustomer((map) => ({ ...map, [customerId]: leads }));
    } catch (err) {
      console.error('Failed to load leads for customer', customerId, err);
      setLeadsByCustomer((map) => ({ ...map, [customerId]: [] }));
    } finally {
      setLoadingLeadsMap((m) => ({ ...m, [customerId]: false }));
    }
  };

  const toggleLeadsForCustomer = (customerId) => {
    if (leadsOpenId === customerId) {
      setLeadsOpenId(null);
      return;
    }
    setLeadsOpenId(customerId);
    loadLeadsForCustomer(customerId);
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={Building2}
        title={SEGMENT_LABELS[segment] || title}
        subtitle="Customer accounts — contact details, assignments, lifetime value, and project history"
        meta={!loading ? `${customers.length} customer${customers.length !== 1 ? 's' : ''} in this view` : undefined}
        actions={canWrite('customers') && (
          <Link to="/customers/create" className="btn-primary text-sm inline-flex items-center gap-2">
            <Plus size={18} /> Add Customer
          </Link>
        )}
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />

      {loading ? <LoadingSpinner /> : customers.length === 0 ? (
        <AdminEmptyState message="No customers found in this segment." icon={Users} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {customers.map((c) => {
            const company = c.companyName || c.company?.name;
            const statusCls = statusColors[c.status] || statusColors.active;
            return (
              <article key={c._id} className="card border border-myth-border/80 border-l-[3px] border-l-myth-accent/60 hover:border-myth-accent/35 transition-all flex flex-col relative overflow-hidden group">
                <div className="flex items-start justify-between gap-2 lg:gap-3 mb-3 lg:mb-4">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 lg:w-11 lg:h-11 shrink-0 rounded-xl flex items-center justify-center font-semibold text-xs lg:text-sm ${statusCls}`}>
                      {c.firstName[0]}{c.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate leading-tight text-sm lg:text-base">
                        {c.firstName} {c.lastName}
                      </h3>
                      <p className="text-xs lg:text-sm text-gray-400 truncate mt-0.5">{c.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] lg:text-xs px-2 py-0.5 rounded-full shrink-0 capitalize ${statusCls}`}>
                    {c.status}
                  </span>
                </div>

                <div className="space-y-1.5 lg:space-y-2 text-xs lg:text-sm flex-1">
                  <p className="flex items-center gap-2 text-gray-400 min-w-0">
                    <Building2 size={12} lg:size={14} className="text-myth-accent shrink-0" />
                    <span className="truncate">{company || c.title || 'No company'}</span>
                  </p>
                  {c.phone && (
                    <p className="flex items-center gap-2 text-gray-400">
                      <Phone size={12} lg:size={14} className="text-myth-accent shrink-0" />
                      <span>{c.phone}</span>
                    </p>
                  )}
                  <div className="pt-1 space-y-1 lg:space-y-1.5">
                    {!isSales && <CustomerTechAssignmentBadge customer={c} />}
                    {!isSales && <CustomerSupportAssignmentBadge customer={c} />}
                  </div>
                  <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-2 lg:px-3 py-1.5 lg:py-2 mt-2">
                    <p className="text-[10px] lg:text-xs text-gray-500">Lifetime value</p>
                    <p className="text-xs lg:text-sm font-semibold text-emerald-300">{formatCurrency(c.lifetimeValue)}</p>
                  </div>

                  {/* Leads toggle and status badges (loaded on demand) */}
                  <div className="mt-2">
                    <button type="button" onClick={() => toggleLeadsForCustomer(c._id)} className="text-[10px] lg:text-xs text-gray-400 hover:text-myth-accent mr-3">
                      Leads{(leadsByCustomer[c._id] && leadsByCustomer[c._id].length) ? ` (${leadsByCustomer[c._id].length})` : (loadingLeadsMap[c._id] ? ' (…) ' : '')}
                    </button>
                    {leadsOpenId === c._id && (
                      <div className="mt-2 space-y-1">
                        {loadingLeadsMap[c._id] ? (
                          <p className="text-xs lg:text-sm text-gray-400">Loading leads…</p>
                        ) : (leadsByCustomer[c._id] || []).length === 0 ? (
                          <p className="text-xs lg:text-sm text-gray-400">No leads found.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(leadsByCustomer[c._id] || []).map((lead) => (
                              <span key={lead._id} className="text-[10px] lg:text-xs px-2 py-0.5 rounded bg-myth-surface/20 text-gray-300">
                                {lead.title || lead.name || 'Lead'} — <span className="font-semibold">{lead.status}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-myth-border/60">
                  <Link
                    to={`/customers/${c._id}`}
                    state={SEGMENT_TAB_MAP[segment] ? { tab: SEGMENT_TAB_MAP[segment] } : undefined}
                    className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-myth-accent"
                    title="View"
                  >
                    <Eye size={14} lg:size={16} />
                  </Link>
                  {canWrite('customers') && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm(formFromCustomer(c));
                        setEditId(c._id);
                        setModal('form');
                      }}
                      className="p-1.5 rounded hover:bg-myth-navy-light text-gray-400 hover:text-white"
                      title="Edit"
                    >
                      <Pencil size={14} lg:size={16} />
                    </button>
                  )}
                  {isAdmin && c.portalUser && (
                    <button
                      type="button"
                      onClick={() => openPasswordChange(c)}
                      className="p-1.5 rounded hover:bg-blue-500/10 text-gray-400 hover:text-blue-400"
                      title="Change portal password"
                    >
                      <Key size={14} lg:size={16} />
                    </button>
                  )}

                  {isSales && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowManagerAssignId((s) => (s === c._id ? null : c._id));
                          setSelectedManager('');
                        }}
                        className={`inline-flex items-center gap-1 lg:gap-1.5 rounded-lg border px-2 lg:px-2.5 py-1.5 text-[10px] lg:text-xs font-medium transition-colors ${isAssignedToManager(c)
                          ? 'border-emerald-500/40 bg-emerald-600/15 text-emerald-300 hover:bg-emerald-600/25'
                          : 'border-red-500/40 bg-red-600/90 text-white hover:bg-red-500'}`}
                        title="Assign to manager"
                      >
                        {isAssignedToManager(c) ? `Assigned To Manager: ${getAssignedManagerLabel(c)}` : 'Manager Assigning'}
                      </button>
                      {showManagerAssignId === c._id && (
                        <div className="absolute right-0 mt-2 w-56 lg:w-64 bg-myth-surface border border-myth-border rounded-lg p-2 lg:p-3 z-50">
                          {loadingManagers ? (
                            <p className="text-xs lg:text-sm text-gray-400">Loading managers…</p>
                          ) : managers.length === 0 ? (
                            <p className="text-xs lg:text-sm text-gray-400">No managers found.</p>
                          ) : (
                            <>
                              <label className="block text-[10px] lg:text-xs text-gray-400 mb-2">Select manager</label>
                              <select value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)} className="input-field w-full mb-2 lg:mb-3 text-xs lg:text-sm">
                                <option value="">Select manager</option>
                                {managers.map((m) => (
                                  <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
                                ))}
                              </select>
                              <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => { setShowManagerAssignId(null); setSelectedManager(''); }} className="btn-secondary text-xs lg:text-sm">Cancel</button>
                                <button type="button" disabled={!selectedManager || assigningManager} onClick={async () => {
                                  if (!selectedManager) return;
                                  setAssigningManager(true);
                                  try {
                                    const selectedManagerUser = managers.find((m) => String(m._id) === String(selectedManager));
                                    await customersAPI.update(c._id, { assignedTo: selectedManager });
                                    setCustomers((current) => current.map((item) => item._id === c._id ? { ...item, assignedTo: selectedManagerUser || selectedManager } : item));
                                    toast.success('Assigned to manager');
                                    setShowManagerAssignId(null);
                                    setSelectedManager('');
                                    fetch();
                                  } catch (err) {
                                    toast.error(err.response?.data?.message || 'Assignment failed');
                                  } finally {
                                    setAssigningManager(false);
                                  }
                                }} className="btn-primary text-xs lg:text-sm">{assigningManager ? 'Assigning…' : 'Assign'}</button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Delete this customer?')) {
                          await customersAPI.delete(c._id);
                          fetch();
                        }
                      }}
                      className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 ml-auto"
                      title="Delete"
                    >
                      <Trash2 size={14} lg:size={16} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modal === 'form'}
        onClose={() => setModal(null)}
        title="Edit Customer"
        size="xl"
      >
        <CustomerForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onCancel={() => setModal(null)}
          submitLabel="Update customer"
          canAssign={false}
          assigneeUsers={salesUsers}
          submitting={submitting}
        />
      </Modal>

      {modal === 'password' && passwordChangeCustomer && (
        <Modal isOpen onClose={() => setModal(null)} title="Change Customer Portal Password" size="md">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-4">
              <p className="text-sm text-white font-medium">{passwordChangeCustomer.firstName} {passwordChangeCustomer.lastName}</p>
              <p className="text-xs text-gray-400 mt-1">{passwordChangeCustomer.email}</p>
              <p className="text-xs text-gray-500 mt-1">Company: {passwordChangeCustomer.companyName || '—'}</p>
              <p className="text-xs text-emerald-400 mt-1">Portal Account: Active</p>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field w-full"
                minLength={6}
                required
                placeholder="Enter new password (minimum 6 characters)"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters required</p>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-myth-border">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={changingPassword}>
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminPageShell>
  );
}
