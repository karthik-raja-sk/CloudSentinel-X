import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { API_V1 } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await fetch(`${API_V1}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setError('Failed to send reset link.');
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
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">Enter your email to receive a reset link.</p>
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <div className="mb-4 text-green-600 bg-green-50 p-4 rounded-md border border-green-200 font-medium">
              If an account exists, a link was sent to your email.
            </div>
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500">Back to Sign In</Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
            >
              {status === 'loading' ? <Loader2 className="animate-spin text-white w-5 h-5"/> : 'Send Link'}
            </button>
            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:underline">Cancel</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
