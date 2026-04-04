import { useEffect, useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { getFindings, getAnalyticsSummary } from '../api/client';
import { Loader2, ShieldCheck, Printer } from 'lucide-react';

export default function Report() {
  const { projects, selectedProjectId } = useProjectContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  useEffect(() => {
    async function loadData() {
      if (!selectedProjectId) return;
      try {
        setLoading(true);
        const [statsData, findingsData] = await Promise.all([
           getAnalyticsSummary(Number(selectedProjectId)),
           getFindings(Number(selectedProjectId))
        ]);
        setStats(statsData);
        setFindings(findingsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedProjectId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!stats) return <div className="p-10">No report data available. run a scan first.</div>;

  const { 
    total_scans = 0, 
    severity_distribution = {}, 
    cloud_misconfig_count = 0,
    pii_exposure_count = 0,
    findings_needing_remediation = 0
  } = stats;

  const criticalHigh = (severity_distribution.CRITICAL || 0) + (severity_distribution.HIGH || 0);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white border border-gray-300 shadow-lg print:shadow-none print:border-none p-10 relative">
        
        {/* Print button (hidden during actual print) */}
        <button 
           onClick={() => window.print()}
           className="absolute top-8 right-8 flex items-center px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 font-bold text-sm print:hidden"
        >
          <Printer className="w-4 h-4 mr-2" /> Print PDF
        </button>

        <div className="border-b-4 border-indigo-600 pb-6 mb-8 text-center sm:text-left flex items-center justify-between">
           <div>
             <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center">
               <ShieldCheck className="w-10 h-10 text-indigo-600 mr-3" />
               CloudSentinel X Report
             </h1>
             <p className="text-gray-500 mt-2 font-bold uppercase tracking-wider text-sm">Automated Security & Governance Audit</p>
           </div>
           <div className="text-right hidden sm:block">
             <div className="text-sm text-gray-500 font-bold uppercase">Date Generated</div>
             <div className="text-lg font-medium text-gray-900">{new Date().toLocaleDateString()}</div>
           </div>
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-bold bg-gray-100 p-3 border-l-4 border-indigo-500 text-gray-800 mb-6">Subject Area Overview</h2>
          <div className="grid grid-cols-2 gap-6 bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
             <div>
                <span className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Project Workspace</span>
                <span className="block text-2xl font-extrabold text-gray-900">{activeProject?.name || 'Unknown Project'}</span>
             </div>
             <div>
                <span className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Total Scans Performed</span>
                <span className="block text-2xl font-extrabold text-gray-900">{total_scans}</span>
             </div>
          </div>
        </section>

        <section className="mb-10 page-break-inside-avoid">
          <h2 className="text-xl font-bold bg-gray-100 p-3 border-l-4 border-red-500 text-gray-800 mb-6">Risk Profile Summary</h2>
          <div className="grid grid-cols-4 gap-4">
             <div className="p-4 bg-red-50 rounded-lg text-center border border-red-100">
               <span className="block text-3xl font-black text-red-600">{criticalHigh}</span>
               <span className="block text-xs uppercase tracking-wider font-bold text-red-800 mt-2">Critical/High Risks</span>
             </div>
             <div className="p-4 bg-orange-50 rounded-lg text-center border border-orange-100">
               <span className="block text-3xl font-black text-orange-600">{findings_needing_remediation}</span>
               <span className="block text-xs uppercase tracking-wider font-bold text-orange-800 mt-2">Needs Remediation</span>
             </div>
             <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-100">
               <span className="block text-3xl font-black text-blue-600">{cloud_misconfig_count}</span>
               <span className="block text-xs uppercase tracking-wider font-bold text-blue-800 mt-2">Cloud Misconfigs</span>
             </div>
             <div className="p-4 bg-purple-50 rounded-lg text-center border border-purple-100">
               <span className="block text-3xl font-black text-purple-600">{pii_exposure_count}</span>
               <span className="block text-xs uppercase tracking-wider font-bold text-purple-800 mt-2">PII Exposures</span>
             </div>
          </div>
        </section>

        <section className="page-break-before">
          <h2 className="text-xl font-bold bg-gray-100 p-3 border-l-4 border-gray-800 text-gray-800 mb-6">Actionable Findings Registry</h2>
          {findings.slice(0, 30).map((f) => (
            <div key={f.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-gray-900 text-lg flex items-center">
                    <span className={`text-[10px] uppercase font-black px-2 py-1 mr-3 rounded text-white ${
                      f.severity === 'CRITICAL' ? 'bg-red-600' :
                      f.severity === 'HIGH' ? 'bg-orange-500' :
                      f.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}>
                      {f.severity}
                    </span>
                    {f.title || 'Unknown Risk'}
                 </h3>
                 <span className={`text-xs font-bold px-2 py-1 rounded border uppercase tracking-wider ${
                     f.remediation_status === 'RESOLVED' ? 'bg-green-100 text-green-800 border-green-200' : 
                     f.remediation_status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                     'bg-red-100 text-red-800 border-red-200'
                 }`}>
                    {f.remediation_status || 'OPEN'}
                 </span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{f.description || 'No description provided.'}</p>
              
              {f.remediation_text && (
                 <div className="bg-gray-50 border border-gray-200 p-3 rounded-md text-sm">
                    <span className="font-bold text-gray-800">Remediation Recommendation: </span>
                    <span className="text-gray-600">{f.remediation_text}</span>
                 </div>
              )}
            </div>
          ))}
          {findings.length > 30 && (
             <div className="text-center text-sm font-bold text-gray-500 mt-6 pt-6 border-t border-gray-200">
               + {findings.length - 30} additional lower-priority findings omitted for brevity.
             </div>
          )}
        </section>

      </div>
    </div>
  );
}
