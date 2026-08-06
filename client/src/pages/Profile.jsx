import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { User, Lock, Settings, Bell, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { isTechManagerUser } from '../utils/roleContext';
import { AnnouncementForm } from '../components/techManager/TechManagerForms';
import CustomerProfile from './customer/CustomerProfile';

export default function Profile() {
  const { user, updateUser } = useAuth();
  if (user?.role === 'customer') return <CustomerProfile />;
  const [searchParams] = useSearchParams();
  const role = user?.role;
  const canOpenSettings = role === 'admin' || role === 'manager';
  const isTechManager = isTechManagerUser(user);

  const [tab, setTab] = useState(searchParams.get('tab') === 'password' ? 'password' : 'profile');
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '', departmentName: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [prefs, setPrefs] = useState({ emailNotifications: true, taskAlerts: true, projectUpdates: true });

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        departmentName: user.departmentName || '',
      });
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await authAPI.updateProfile(profile);
      updateUser(data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
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
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-gray-400 mt-1">Your personal account — name, contact, and password.</p>
        </div>
        {canOpenSettings && (
          <Link to="/settings" className="btn-secondary text-sm inline-flex items-center gap-2 shrink-0">
            <Settings size={16} /> Company Settings
          </Link>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 space-y-1">
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'profile' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white hover:bg-myth-surface'
            }`}
          >
            <User size={16} /> Profile
          </button>
          <button
            type="button"
            onClick={() => setTab('password')}
            className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'password' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white hover:bg-myth-surface'
            }`}
          >
            <Lock size={16} /> Change Password
          </button>
          {isTechManager && (
            <>
              <button type="button" onClick={() => setTab('notifications')} className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'notifications' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white hover:bg-myth-surface'}`}>
                <Bell size={16} /> Notifications
              </button>
              <button type="button" onClick={() => setTab('preferences')} className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'preferences' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white hover:bg-myth-surface'}`}>
                <Settings size={16} /> Preferences
              </button>
              <button type="button" onClick={() => setTab('security')} className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'security' ? 'bg-myth-accent/20 text-myth-accent' : 'text-gray-400 hover:text-white hover:bg-myth-surface'}`}>
                <Shield size={16} /> Security
              </button>
              <Link to="/notifications" className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-myth-surface">
                <Bell size={16} /> All Notifications
              </Link>
            </>
          )}
        </div>

        <div className="flex-1 card">
          {tab === 'profile' && (
            <form onSubmit={saveProfile} className="space-y-4 max-w-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Profile Information</h3>
              <p className="text-sm text-gray-400 mb-4">Update your personal details.</p>
              {user?.employeeId && (
                <p className="text-sm text-gray-500 mb-3">Employee ID: <span className="text-gray-300">{user.employeeId}</span></p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">First Name</label>
                  <input
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Last Name</label>
                  <input
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Phone</label>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Department</label>
                  <input
                    value={profile.departmentName}
                    onChange={(e) => setProfile({ ...profile, departmentName: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Role: <span className="text-myth-accent capitalize">{role === 'technical' ? 'Technical Person' : role}</span>
                {user?.email && <> · Email: {user.email}</>}
              </div>
              <button type="submit" className="btn-primary">Save Profile</button>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={changePassword} className="space-y-4 max-w-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Change Password</h3>
              <p className="text-sm text-gray-400 mb-4">Use a strong password you do not use elsewhere.</p>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="input-field"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Update Password</button>
            </form>
          )}

          {tab === 'notifications' && isTechManager && (
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Notification preferences saved'); }} className="space-y-4 max-w-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Notification Settings</h3>
              {[
                { key: 'emailNotifications', label: 'Email notifications' },
                { key: 'taskAlerts', label: 'Task assignment alerts' },
                { key: 'projectUpdates', label: 'Project status updates' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 text-sm text-gray-300">
                  <input type="checkbox" checked={prefs[key]} onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })} className="rounded border-myth-border" />
                  {label}
                </label>
              ))}
              <button type="submit" className="btn-primary">Save Notifications</button>
            </form>
          )}

          {tab === 'preferences' && isTechManager && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Preferences</h3>
              <p className="text-sm text-gray-400">Default views and team communication.</p>
              <AnnouncementForm />
            </div>
          )}

          {tab === 'security' && isTechManager && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Security</h3>
              <p className="text-sm text-gray-400 mb-4">Account security and login history.</p>
              <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-4 text-sm text-gray-400">
                <p>Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Current session'}</p>
                <p className="mt-2">Use Change Password to rotate credentials regularly.</p>
              </div>
              <button type="button" onClick={() => setTab('password')} className="btn-secondary text-sm">Change Password</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
