import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useProjectContext } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Loader2, PlusCircle, AlertCircle, Shield } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';

export default function DashboardLayout() {
  const { 
    projects, 
    selectedProjectId, 
    setSelectedProjectId, 
    loading, 
    error,
    handleCreateProject
  } = useProjectContext();
  const { role, logout } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const createNewProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      await handleCreateProject(newProjectName);
      setNewProjectName('');
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  // 1. Handle Global Loading
  if (loading && projects.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // 2. Handle Global Error
  if (error && projects.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
         <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-red-200">
           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <h3 className="text-lg font-bold text-red-900 mb-2">Failed to load Configuration</h3>
           <p className="text-red-600 text-sm mb-4">{error}</p>
         </div>
      </div>
    );
  }

  // 3. Handle Empty State (No Projects)
  if (projects.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <h1 className="text-2xl font-bold text-blue-600 tracking-tight">CloudSentinel X</h1>
          <button onClick={handleLogout} className="text-sm bg-gray-200 hover:bg-gray-300 transition text-gray-800 px-4 py-1.5 rounded-md shadow-sm font-medium">Logout</button>
        </header>
        <div className="flex-1 flex items-center justify-center">
            <div className="w-[450px] bg-white p-10 rounded-2xl shadow-lg border border-gray-100 text-center">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Welcome to CloudSentinel</h2>
              <p className="text-gray-500 mb-8 font-medium">Get started by creating your first organizational project workspace.</p>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="e.g. AWS Production Setup"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button 
                  onClick={createNewProject}
                  disabled={isCreating || !newProjectName.trim()}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 transition duration-150 font-bold"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlusCircle className="w-5 h-5 mr-2" /> Create Project workspace</>}
                </button>
              </div>
            </div>
        </div>
      </div>
    );
  }

  // 4. Standard Dashboard Structure
  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-dark text-white p-4 hidden md:block border-r border-gray-800 shrink-0">
        <h1 className="text-2xl font-bold text-blue-500 mb-8 px-2 tracking-tight">CloudSentinel X</h1>
        <nav className="space-y-2 flex flex-col h-[calc(100vh-100px)]">
           <div className="flex-1">
             {['dashboard', 'upload', 'findings', 'malware', 'data-leaks', 'incidents', 'iam', 'logs', 'attack-paths'].map(route => (
                <Link 
                   key={route}
                   to={`/${route}`} 
                   className={`block px-3 py-2.5 rounded-lg transition font-medium capitalize mb-1 ${location.pathname === `/${route}` ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-gray-800 text-gray-300 hover:text-white'}`}
                 >
                   {route.replace('-', ' ')}
               </Link>
             ))}
             <div className="pt-4 mt-4 border-t border-gray-800">
                <Link to="/scans" className={`block px-3 py-2 rounded transition text-sm ${location.pathname === `/scans` ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}>Scan History</Link>
             </div>
           </div>

           <div className="mt-auto">
              <Link to="/report" target="_blank" className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition text-sm">
                 <Shield className="w-4 h-4 mr-2" /> Export PDF Report
              </Link>
           </div>
        </nav>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center space-x-4">
            <span className="text-gray-500 text-sm font-bold uppercase tracking-wider hidden md:block">Workspace</span>
            <select 
              value={activeProject?.id || ''} 
              onChange={e => setSelectedProjectId(Number(e.target.value))}
              className="block w-64 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border font-bold text-gray-800 shadow-sm"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`text-xs font-bold px-2 py-1 rounded border uppercase tracking-wider ${role === 'Admin' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
              Role: {role}
            </span>
            <button onClick={handleLogout} className="text-sm bg-gray-100 hover:bg-gray-200 transition text-gray-700 px-4 py-1.5 rounded-md shadow-sm font-bold border border-gray-200">Logout</button>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 scroll-smooth">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
