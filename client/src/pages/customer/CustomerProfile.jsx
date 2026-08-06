import { useState, useEffect } from 'react';
import { Building2, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const emptyAddress = { street: '', street2: '', city: '', state: '', country: '', zipCode: '' };

export default function CustomerProfile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', companyName: '', gstNumber: '',
    title: '', designation: '', alternatePhone: '', website: '', address: { ...emptyAddress },
  });
  const [logoFile, setLogoFile] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  useEffect(() => {
    authAPI.getCustomerProfile()
      .then(({ data }) => {
        const c = data.customer || {};
        setCustomer(c);
        setForm({
          firstName: c.firstName || user?.firstName || '',
          lastName: c.lastName || user?.lastName || '',
          phone: c.phone || user?.phone || '',
          companyName: c.companyName || c.company?.name || '',
          gstNumber: c.gstNumber || '',
          title: c.title || '',
          designation: c.designation || '',
          alternatePhone: c.alternatePhone || '',
          website: c.website || c.company?.website || '',
          address: { ...emptyAddress, ...(c.address || {}) },
        });
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false));
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload = form;
      if (logoFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([key, value]) => {
          if (key === 'address') fd.append('address', JSON.stringify(value));
          else if (value !== undefined && value !== null) fd.append(key, value);
        });
        fd.append('companyLogo', logoFile);
        payload = fd;
      }
      const { data } = await authAPI.updateCustomerProfile(payload);
      setCustomer(data.customer);
      if (data.user) updateUser(data.user);
      setLogoFile(null);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) return toast.error('Passwords do not match');
    try {
      await authAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password updated');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 mt-1">Manage your company information and account security.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 space-y-1">
          <button type="button" onClick={() => setTab('company')} className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'company' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white hover:bg-myth-surface'}`}>
            <Building2 size={16} /> Company Information
          </button>
          <button type="button" onClick={() => setTab('contact')} className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'contact' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white hover:bg-myth-surface'}`}>
            <User size={16} /> Contact Person
          </button>
          <button type="button" onClick={() => setTab('password')} className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'password' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white hover:bg-myth-surface'}`}>
            <Lock size={16} /> Change Password
          </button>
        </div>

        <div className="flex-1 card">
          {(tab === 'company' || tab === 'contact') && (
            <form onSubmit={saveProfile} className="space-y-6 max-w-2xl">
              {tab === 'company' && (
                <>
                  <h3 className="text-lg font-semibold text-white">Company Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Company Name *</label>
                      <input className="input-field w-full" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">GST Number</label>
                      <input className="input-field w-full" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Website</label>
                      <input type="url" className="input-field w-full" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Company Logo</label>
                      <input type="file" accept="image/*" className="input-field w-full" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                      {customer?.companyLogo && <img src={customer.companyLogo} alt="Logo" className="mt-2 h-12 object-contain" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Address</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Address Line 1</label>
                        <input className="input-field w-full" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Address Line 2</label>
                        <input className="input-field w-full" value={form.address.street2} onChange={(e) => setForm({ ...form, address: { ...form.address, street2: e.target.value } })} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">City</label>
                        <input className="input-field w-full" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">State</label>
                        <input className="input-field w-full" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Country</label>
                        <input className="input-field w-full" value={form.address.country} onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Postal Code</label>
                        <input className="input-field w-full" value={form.address.zipCode} onChange={(e) => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === 'contact' && (
                <>
                  <h3 className="text-lg font-semibold text-white">Contact Person</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Name *</label>
                      <input className="input-field w-full" value={`${form.firstName} ${form.lastName}`.trim()} onChange={(e) => {
                        const parts = e.target.value.split(' ');
                        setForm({ ...form, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') });
                      }} required />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Designation</label>
                      <input className="input-field w-full" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Email *</label>
                      <input type="email" className="input-field w-full bg-myth-surface/50" value={user?.email || ''} readOnly />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Mobile Number *</label>
                      <input className="input-field w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Alternate Phone</label>
                      <input className="input-field w-full" value={form.alternatePhone} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={changePassword} className="space-y-4 max-w-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Change Password</h3>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Current Password</label>
                <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">New Password</label>
                <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="input-field" minLength={6} required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Confirm Password</label>
                <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="input-field" required />
              </div>
              <button type="submit" className="btn-primary">Update Password</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
