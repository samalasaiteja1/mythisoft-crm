import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword(email);
      setResult(data);
      toast.success(data.emailSent ? 'Check your email inbox!' : 'Reset link ready — click the button below');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-myth-navy-dark">
      <div className="w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="MYTHISOFT" className="w-40 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-gray-400 mt-2">Enter your email to receive a reset link</p>
        </div>

        {result ? (
          <div className="card space-y-5 text-center">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-green-400" />
              </div>
            </div>

            {result.emailSent ? (
              <>
                <h2 className="text-lg font-semibold text-white">Email Sent!</h2>
                <p className="text-gray-300 text-sm">
                  We sent a password reset link to <strong className="text-white">{email}</strong>.
                  Check your inbox and spam folder. Link expires in 1 hour.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-white">Reset Link Ready</h2>
                <p className="text-gray-300 text-sm">
                  Your account was found. Since email is not set up yet on this server,
                  use the button below to reset your password now.
                </p>
                {result.resetUrl && (
                  <Link
                    to={new URL(result.resetUrl).pathname}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    <KeyRound size={18} /> Reset Password Now
                  </Link>
                )}
                <p className="text-xs text-gray-500">
                  Link expires in 1 hour · Local development mode
                </p>
              </>
            )}

            <Link to="/login" className="block text-sm text-myth-accent hover:underline">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="admin@mythisoft.com" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <Link to="/login" className="block text-center text-sm text-myth-accent hover:underline">Back to Login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
