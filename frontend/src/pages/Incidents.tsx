import { useEffect, useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { getIncidents, triggerCorrelation } from '../api/client';
import { Zap, Play, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';

function IncidentsContent() {
  const { selectedProjectId } = useProjectContext();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!selectedProjectId) return;
    try {
      setLoading(true);
      const data = await getIncidents(Number(selectedProjectId));
      setIncidents(data);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.detail || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);

  const handleScan = async () => {
    if (!selectedProjectId) return;
    try {
      setScanning(true);
      await triggerCorrelation(Number(selectedProjectId));
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500 fill-current" />
            Risk Correlation Engine
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Correlate multiple findings into actionable security incidents.</p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          {scanning ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
          Run Correlation Engine
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded flex pl-3 gap-2">
           <AlertTriangle className="w-5 h-5"/> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
            <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Correlated Incidents</h2>
            <p className="text-gray-500 max-w-md mx-auto">No complex attack paths or overlapping risks found in your environment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {incidents.map((incident) => (
            <div key={incident.id} className={`bg-white p-6 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-shadow ${incident.severity === 'CRITICAL' ? 'border-red-500' : 'border-orange-500'}`}>
               <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{incident.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                    {incident.severity}
                  </span>
               </div>
               
               <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Attack Path</h4>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-100 font-medium">
                    {incident.attack_path}
                  </p>
               </div>

               <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Affected Resources</h4>
                  <div className="flex gap-2 flex-wrap">
                    {(incident.affected_resources || []).map((res: string, idx: number) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded text-xs font-mono">
                            {res}
                        </span>
                    ))}
                  </div>
               </div>

               <div>
                  <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Recommendation</h4>
                  <p className="text-sm text-green-900 bg-green-50 p-3 rounded border border-green-100 font-medium">
                    {incident.recommendation}
                  </p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Incidents() {
  return (
    <ErrorBoundary>
      <IncidentsContent />
    </ErrorBoundary>
  );
}
