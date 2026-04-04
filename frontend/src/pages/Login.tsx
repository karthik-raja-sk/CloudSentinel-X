import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Role } from '../context/AuthContext';
import { Shield, User, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>('Analyst');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">CloudSentinel X</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium tracking-wide">ENTERPRISE SECURITY PLATFORM</p>
          <div className="mt-6 inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded border border-yellow-200">
             Local Demo Environment
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">Select Demo Access Role</h3>
            
            {/* Analyst Role */}
            <div 
               onClick={() => setSelectedRole('Analyst')}
               className={`p-4 border-2 rounded-lg cursor-pointer flex items-center transition-all ${
                 selectedRole === 'Analyst' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
               }`}
            >
               <div className={`p-2 rounded-full mr-4 ${selectedRole === 'Analyst' ? 'bg-blue-200' : 'bg-gray-100'}`}>
                 <User className={`w-6 h-6 ${selectedRole === 'Analyst' ? 'text-blue-700' : 'text-gray-500'}`} />
               </div>
               <div>
                  <div className="font-bold text-gray-900">Security Analyst</div>
                  <div className="text-xs text-gray-500 mt-1">Read-only view of dashboards and findings. Cannot trigger remediations.</div>
               </div>
            </div>

            {/* Admin Role */}
            <div 
               onClick={() => setSelectedRole('Admin')}
               className={`p-4 border-2 rounded-lg cursor-pointer flex items-center transition-all ${
                 selectedRole === 'Admin' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
               }`}
            >
               <div className={`p-2 rounded-full mr-4 ${selectedRole === 'Admin' ? 'bg-indigo-200' : 'bg-gray-100'}`}>
                 <Lock className={`w-6 h-6 ${selectedRole === 'Admin' ? 'text-indigo-700' : 'text-gray-500'}`} />
               </div>
               <div>
                  <div className="font-bold text-gray-900">Platform Admin</div>
                  <div className="text-xs text-gray-500 mt-1">Full access. Can run scans, mutate remediations, and manage configurations.</div>
               </div>
            </div>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-sm">
              Sign In to Demo Sandbox
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
