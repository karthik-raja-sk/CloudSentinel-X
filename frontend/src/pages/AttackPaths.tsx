import { useEffect, useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { getAttackPaths } from '../api/client';
import { ShieldAlert, GitMerge, Loader2, ArrowRightCircle } from 'lucide-react';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-blue-500'
};

const SEVERITY_BG: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-blue-100 text-blue-800 border-blue-200'
};

export default function AttackPaths() {
  const { selectedProjectId: projectId } = useProjectContext();
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPaths() {
      try {
        setLoading(true);
        const data = await getAttackPaths(Number(projectId));
        setPaths(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (projectId) fetchPaths();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-red-100 p-3 rounded-xl border border-red-200 shadow-sm">
           <GitMerge className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Correlated Attack Paths</h1>
          <p className="text-gray-500 mt-1 font-medium">Visualized exploit chains linking discovered vulnerabilities.</p>
        </div>
      </div>

      <div className="space-y-8">
        {(Array.isArray(paths) ? paths : []).map((path: any) => {
           const colorLine = SEVERITY_COLORS[path.severity] || 'bg-gray-500';
           const bgBadge = SEVERITY_BG[path.severity] || SEVERITY_BG['LOW'];

           return (
            <div key={path.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md relative pl-1.5">
              {/* Left Color Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorLine}`}></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-5">
                  <div className="max-w-2xl">
                    <h3 className="text-xl font-extrabold text-gray-900 flex items-center">
                      {path.severity === 'CRITICAL' && <ShieldAlert className="w-5 h-5 text-red-500 mr-2" />}
                      {path.title}
                    </h3>
                    <p className="text-gray-600 mt-2 text-sm leading-relaxed">{path.description}</p>
                  </div>
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-md border ${bgBadge}`}>
                        {path.severity} RISK
                    </span>
                    <div className="text-center rounded-lg border border-gray-200 px-4 py-2 bg-gray-50 flex flex-col justify-center min-w-[80px]">
                        <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Score</span>
                        <span className="block text-2xl font-black text-gray-900 leading-none">{path.risk_score}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline UI */}
                <div className="mt-8">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Exploitation Flow Path</h4>
                  
                  <div className="relative">
                    {/* Background connector line */}
                    {path.path_nodes && path.path_nodes.length > 1 && (
                       <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 -translate-y-1/2 z-0 hidden md:block"></div>
                    )}
                    
                    <div className="flex flex-col md:flex-row items-center md:justify-between space-y-6 md:space-y-0 relative z-10 w-full overflow-x-auto pb-4">
                      {path.path_nodes && path.path_nodes.map((node: any, idx: number) => (
                        <div key={idx} className="flex flex-col md:flex-row items-center flex-shrink-0">
                          
                          {/* Node Card */}
                          <div className="bg-white border-2 border-indigo-100 rounded-lg p-4 shadow-sm w-48 hover:border-indigo-300 transition-colors relative z-10">
                            <span className="inline-block text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-sm mb-3">
                              Step {idx + 1}: {node.type}
                            </span>
                            <span className="block text-sm font-bold text-gray-800 break-words">{node.label}</span>
                          </div>

                          {/* Arrow Connector (Mobile vs Desktop) */}
                          {idx < path.path_nodes.length - 1 && (
                            <>
                              <div className="md:hidden h-8 w-0.5 bg-gray-300 my-2"></div>
                              <ArrowRightCircle className="hidden md:block w-8 h-8 text-indigo-300 mx-4 z-10 bg-white rounded-full" />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
           );
        })}
        
        {(Array.isArray(paths) ? paths : []).length === 0 && (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm text-gray-500">
            <GitMerge className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Attack Paths Discovered</h3>
            <p className="max-w-md mx-auto">No correlated attack chains were identified in the current environment scans.</p>
          </div>
        )}
      </div>
    </div>
  );
}
