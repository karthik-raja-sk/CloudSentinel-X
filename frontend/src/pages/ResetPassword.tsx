import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { API_V1 } from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-lg border border-gray-200 text-center">
           <h2 className="text-xl font-bold text-red-600 mb-4">Invalid Link</h2>
           <p className="text-gray-600 mb-6">No reset token provided. Please use the link from your email.</p>
           <Link to="/login" className="text-blue-600 font-bold hover:underline">Back to Login</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setStatus('loading');
    setError('');

    try {
      const res = await fetch(`${API_V1}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
      } else {
        setError(data.detail || 'Failed to reset password.');
        setStatus('idle');
      }
    } catch {
      setError('Network error');
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Set New Password</h2>
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <div className="mb-4 text-green-600 bg-green-50 p-4 rounded-md border border-green-200 font-medium">
              Your password has been successfully reset!
            </div>
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500">Sign in with your new password</Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
            <div className="space-y-4">
              <input
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
            >
              {status === 'loading' ? <Loader2 className="animate-spin text-white w-5 h-5"/> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
