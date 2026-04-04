import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectContext } from '../context/ProjectContext';
import { getProjectScans } from '../api/client';
import { Loader2 } from 'lucide-react';

export default function Scans() {
  const { selectedProjectId: projectId } = useProjectContext();
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<any[]>([]);

  useEffect(() => {
    async function fetchScans() {
      try {
        setLoading(true);
        const data = await getProjectScans(Number(projectId));
        setScans(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setScans([]);
      } finally {
        setLoading(false);
      }
    }
    if (projectId) fetchScans();
    else {
      setScans([]);
      setLoading(false);
    }
  }, [projectId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>;

  const safeScans = Array.isArray(scans) ? scans : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Scan History</h1>
        <Link to={`/upload`} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-medium">
          New Scan
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scan ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scan Type</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeScans.map((s: any) => {
              if (!s) return null;
              const statusStr = String(s.status || 'UNKNOWN').toUpperCase();
              return (
                <tr key={s.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{s.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${statusStr === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                        statusStr === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {statusStr}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {s.created_at ? new Date(s.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(s.scan_type || 'CONFIG_UPLOAD')}</td>
                </tr>
              )
            })}
            {safeScans.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No scans found in this project.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
