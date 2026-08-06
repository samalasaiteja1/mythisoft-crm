import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.code === 'ERR_NETWORK' || !err.response ? 'Cannot reach server. Start the backend: cd server && npm run dev' : 'Login failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-myth-navy via-myth-navy-dark to-myth-navy relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-myth-accent/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-myth-accent to-transparent" />
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-myth-accent/20 blur-3xl rounded-full" />
            <img src="/logo.png" alt="MYTHISOFT" className="w-72 mx-auto relative" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Enterprise CRM Platform</h2>
          <p className="text-gray-400 leading-relaxed text-lg">
            Manage leads, customers, deals, and communications — all in one powerful platform built by MYTHISOFT INNOVATION PRIVATE LIMITED.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-myth-accent/30" />
            <p className="text-myth-accent text-sm tracking-widest uppercase font-medium">Innovating Today, Empowering Tomorrow</p>
            <div className="h-px w-12 bg-myth-accent/30" />
          </div>
        </div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-myth-accent/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-myth-navy-dark relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-myth-accent/5 via-transparent to-transparent" />
        <div className="w-full max-w-md relative z-10 animate-slide-in">
          <div className="lg:hidden mb-8 text-center">
            <img src="/logo.png" alt="MYTHISOFT" className="w-48 mx-auto" />
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome back</h1>
            <p className="text-gray-400">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-myth-accent transition-colors" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="input-field pl-10 transition-all duration-200 focus:ring-2 focus:ring-myth-accent/20" 
                  placeholder="admin@mythisoft.com" 
                  required 
                />
              </div>
            </div>
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-myth-accent transition-colors" />
                <input 
                  type={showPass ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="input-field pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-myth-accent/20" 
                  placeholder="Enter password" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-myth-border bg-myth-surface text-myth-accent focus:ring-myth-accent/20"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-myth-accent hover:underline transition-colors">Forgot password?</Link>
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-myth-accent/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
