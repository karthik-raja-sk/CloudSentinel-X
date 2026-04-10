import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    fetch('http://localhost:8000/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, body: data })))
    .then(({ ok, body }) => {
      if (ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setMessage(body.detail || 'Verification failed');
      }
    })
    .catch(() => {
      setStatus('error');
      setMessage('Network error during verification.');
    });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-200 text-center">
        <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Email Verification</h2>

        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin text-blue-600 w-12 h-12 mb-4" />
            <p className="text-gray-500 font-medium">Verifying your secure token...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
            <p className="text-gray-700 font-medium mb-6">Your email was successfully verified. You can now access CloudSentinel X.</p>
            <Link to="/login" className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full">
              Proceed to Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="text-red-500 w-16 h-16 mb-4" />
            <p className="text-red-600 font-medium mb-6">{message}</p>
            <Link to="/login" className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
