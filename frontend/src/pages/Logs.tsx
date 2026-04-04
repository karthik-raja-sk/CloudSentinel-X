import { useEffect, useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { getLogEvents } from '../api/client';
import { Loader2 } from 'lucide-react';

export default function Logs() {
  const { selectedProjectId: projectId } = useProjectContext();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const data = await getLogEvents(Number(projectId));
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    if (projectId) fetchLogs();
    else {
      setLogs([]);
      setLoading(false);
    }
  }, [projectId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>;

  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Security Log Events</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source IP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeLogs.map((L: any) => {
              if (!L) return null;
              
              const eventNameSafe = String(L.event_name || 'Unknown');
              const responseStatusSafe = String(L.response_status || 'Unknown');
              
              const isSuspicious = responseStatusSafe === 'failure' || 
                                 eventNameSafe.includes('Delete') || 
                                 eventNameSafe.includes('Policy') || 
                                 eventNameSafe.includes('Secret');
              
              return (
                <tr key={L.id} className={`${isSuspicious ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{L.event_time ? new Date(L.event_time).toLocaleString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{eventNameSafe}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(L.source_ip || 'Unknown')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={String(L.principal_id || '')}>
                     {String(L.principal_id || 'Unknown')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {responseStatusSafe === 'failure' ? 
                      <span className="text-red-600 font-medium font-bold">Failed</span> : 
                      <span className="text-green-600 font-medium">Success</span>}
                  </td>
                </tr>
              )
            })}
            {safeLogs.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No log events found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
