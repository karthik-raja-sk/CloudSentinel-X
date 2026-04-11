import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { API_V1 } from '../api/client';


export default function Login() {
  const { loginState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showDemo, setShowDemo] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<'Admin' | 'Analyst'>('Analyst');

  useEffect(() => {
     if (location.search.includes('expired=true')) {
        setError('Your session has securely expired. Please sign in again.');
     }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${API_V1}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      const data = await res.json();

      if (res.ok) {
        // Fetch user data
        const userRes = await fetch(`${API_V1}/auth/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          loginState(data.access_token, userData);
          navigate('/dashboard');
        } else {
          setError('Failed to fetch user data after login.');
        }
      } else {
        setError(data.detail || 'Login failed.');
        if (data.detail === "Email not verified") {
           // Optionally redirect or show a button to resend
        }
      }
    } catch (err) {
      setError('A network error occurred. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_V1}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedDemoRole })
      });
      const data = await res.json();
      if (res.ok) {
         // for demo, the backend gives an access token. we fetch /auth/me to get the mock user
         const userRes = await fetch(`${API_V1}/auth/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` }
         });
         const userData = await userRes.json();
         loginState(data.access_token, userData);
         navigate('/dashboard');
      } else {
         setError(data.detail || 'Demo login failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-200">
        
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">CloudSentinel X</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium tracking-wide">ENTERPRISE SECURITY PLATFORM</p>
        </div>

        {!showDemo ? (
          <>
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                  {error}
                </div>
              )}
              <div className="space-y-4 rounded-md shadow-sm">
                <div>
                  <label className="sr-only">Email address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="sr-only">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                >
                  {loading ? <Loader2 className="animate-spin text-white w-5 h-5" /> : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New around here?</span>
                </div>
              </div>

              <div className="mt-6 text-center text-sm font-medium">
                 <Link to="/register" className="text-blue-600 hover:text-blue-500 hover:underline">
                    Create an account
                 </Link>
              </div>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => setShowDemo(true)}
                  className="inline-flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline"
                >
                  Or explore the demo sandbox <ArrowRight className="ml-1 w-4 h-4"/>
                </button>
              </div>
            </div>
          </>
        ) : (
           <form className="mt-8 space-y-6" onSubmit={handleDemoLogin}>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">Demo Sandbox Mode</h3>
              
              <div 
                 onClick={() => setSelectedDemoRole('Analyst')}
                 className={`p-4 border-2 rounded-lg cursor-pointer flex items-center transition-all ${
                   selectedDemoRole === 'Analyst' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                 }`}
              >
                 <div className={`p-2 rounded-full mr-4 ${selectedDemoRole === 'Analyst' ? 'bg-blue-200' : 'bg-gray-100'}`}>
                   <User className={`w-6 h-6 ${selectedDemoRole === 'Analyst' ? 'text-blue-700' : 'text-gray-500'}`} />
                 </div>
                 <div>
                    <div className="font-bold text-gray-900">Security Analyst</div>
                    <div className="text-xs text-gray-500 mt-1">Read-only demo access.</div>
                 </div>
              </div>

              <div 
                 onClick={() => setSelectedDemoRole('Admin')}
                 className={`p-4 border-2 rounded-lg cursor-pointer flex items-center transition-all ${
                   selectedDemoRole === 'Admin' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                 }`}
              >
                 <div className={`p-2 rounded-full mr-4 ${selectedDemoRole === 'Admin' ? 'bg-indigo-200' : 'bg-gray-100'}`}>
                   <Lock className={`w-6 h-6 ${selectedDemoRole === 'Admin' ? 'text-indigo-700' : 'text-gray-500'}`} />
                 </div>
                 <div>
                    <div className="font-bold text-gray-900">Platform Admin</div>
                    <div className="text-xs text-gray-500 mt-1">Full demo access.</div>
                 </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button disabled={loading} type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-gray-800 hover:bg-gray-900 shadow-sm">
                {loading ? <Loader2 className="animate-spin text-white w-5 h-5" /> : 'Enter Demo'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowDemo(false)}
                className="w-full flex justify-center py-2 text-sm text-gray-600 hover:underline"
              >
                Back to real sign-in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
