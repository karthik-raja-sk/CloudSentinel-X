import { useEffect, useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { getFindings } from '../api/client';
import { Loader2, Search, Filter, Shield, AlertTriangle, AlertCircle, Info, ArrowUpDown } from 'lucide-react';

const SEVERITY_INFO: Record<string, { color: string, icon: any }> = {
  CRITICAL: { color: 'bg-red-100 text-red-800 border-red-200', icon: Shield },
  HIGH: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
  MEDIUM: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
  LOW: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Info },
};

export default function Findings() {
  const { selectedProjectId: projectId } = useProjectContext();
  const [loading, setLoading] = useState(true);
  const [findings, setFindings] = useState<any[]>([]);
  
  // Filters & State
  const [filterType, setFilterType] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function fetchFindings() {
      try {
        setLoading(true);
        const data = await getFindings(Number(projectId));
        setFindings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (projectId) fetchFindings();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Filter and Sort Logic
  const [previewFinding, setPreviewFinding] = useState<any>(null);

  const safeFindings = Array.isArray(findings) ? findings : [];

  const filteredFindings = safeFindings
    .filter(f => filterType === 'ALL' || f.finding_type === filterType)
    .filter(f => filterSeverity === 'ALL' || f.severity === filterSeverity)
    .filter(f => {
      const titleSafe = (f.title || '').toLowerCase();
      const descSafe = (f.description || '').toLowerCase();
      const querySafe = (searchQuery || '').toLowerCase();
      return titleSafe.includes(querySafe) || descSafe.includes(querySafe);
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') return (a.risk_score || 0) - (b.risk_score || 0);
      return (b.risk_score || 0) - (a.risk_score || 0);
    });

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vulnerabilities & Findings</h1>
        <p className="text-gray-500 mt-2 font-medium">Detailed breakdown of security risks detected across the infrastructure.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search findings by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex w-full md:w-auto space-x-4">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-500 hidden md:block" />
            <select 
              value={filterSeverity} 
              onChange={e => setFilterSeverity(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
             <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
            >
              <option value="ALL">All Types</option>
              <option value="misconfiguration">Misconfiguration</option>
              <option value="iam_risk">IAM Risk</option>
              <option value="secret">Secret</option>
              <option value="pii_exposure">PII Exposure</option>
              <option value="log_threat">Log Threat</option>
            </select>
          </div>

          <button 
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <ArrowUpDown className="w-4 h-4 mr-2 text-gray-500" />
            Sort Score
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Severity / Type</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Finding & Sample Preview</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Recommendation</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFindings.map((f: any) => {
              const sevInfo = SEVERITY_INFO[f.severity] || SEVERITY_INFO['LOW'];
              const Icon = sevInfo.icon;
              return (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1.5 inline-flex items-center text-xs font-bold rounded-md border mb-2 block w-max ${sevInfo.color}`}>
                      <Icon className="w-3.5 h-3.5 mr-1.5" />
                      {f.severity}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {f.finding_type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 max-w-md">
                    <div className="text-sm font-bold text-gray-900 truncate">{f.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-2 mt-1">{f.description || 'No detailed description provided.'}</div>
                    {f.sample_masked_value && (
                       <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded text-indigo-700 border border-gray-200 inline-block">
                         Masked Preview: <span className="font-bold">{f.sample_masked_value}</span>
                       </div>
                    )}
                  </td>
                  <td className="px-6 py-5 min-w-[250px]">
                    {f.recommendation_type ? (
                      <div className="bg-green-50 rounded p-3 border border-green-100">
                        <span className="text-xs font-bold text-green-800 uppercase tracking-wider bg-green-200 px-2 py-1 rounded inline-block mb-1">
                          ↳ Action: {f.recommendation_type.replace('_', ' ')}
                        </span>
                        <p className="text-xs text-green-700 mt-1 leading-snug">{f.remediation_text || f.remediation}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No specific action modeled natively.</div>
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                     <button 
                       onClick={() => setPreviewFinding(f)}
                       className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 font-medium text-xs rounded hover:bg-indigo-100 transition"
                     >
                       Redaction Studio
                     </button>
                  </td>
                </tr>
              )
            })}
            
            {filteredFindings.length === 0 && (
               <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No findings match your current criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Redaction Studio Modal */}
      {previewFinding && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setPreviewFinding(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Shield className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Redaction Studio Preview
                    </h3>
                    <div className="mt-2">
                       <p className="text-sm text-gray-500 mb-4">
                         Simulate how structured findings resolve safely when applying automated masks.
                         Destructive overrides are intentionally disabled here to preserve local context.
                       </p>
                       
                       <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Original Exposed Node</h4>
                          <code className="text-sm text-red-600 bg-red-50 p-2 rounded block break-all">
                             {previewFinding.evidence || 'N/A'}
                          </code>
                       </div>
                       
                       <div className="bg-indigo-50 border border-indigo-200 rounded p-4 mb-4">
                          <h4 className="text-xs font-bold text-indigo-500 uppercase mb-2">Safe Masked Implementation Result</h4>
                          <code className="text-sm text-indigo-800 bg-indigo-100 p-2 rounded block font-bold">
                             {previewFinding.sample_masked_value || 'No masked output generated internally.'}
                          </code>
                       </div>
                       
                       {previewFinding.recommendation_type && (
                          <div className="bg-green-50 border border-green-200 rounded p-4">
                              <h4 className="text-xs font-bold text-green-700 uppercase mb-2">Policy: {previewFinding.recommendation_type.replace('_', ' ')}</h4>
                              <p className="text-sm text-green-800">{previewFinding.remediation_text}</p>
                          </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={() => setPreviewFinding(null)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
