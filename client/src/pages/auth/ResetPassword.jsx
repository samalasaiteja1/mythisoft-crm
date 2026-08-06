import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword(token, password);
      localStorage.setItem('token', data.token);
      toast.success('Password reset successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-myth-navy-dark">
      <div className="w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="MYTHISOFT" className="w-40 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" minLength={6} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" minLength={6} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <Link to="/login" className="block text-center text-sm text-myth-accent hover:underline">Back to Login</Link>
        </form>
      </div>
    </div>
  );
}
