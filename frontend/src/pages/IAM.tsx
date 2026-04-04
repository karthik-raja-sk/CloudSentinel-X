import { useEffect, useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { getIAMEntities } from '../api/client';
import { Loader2 } from 'lucide-react';

export default function IAM() {
  const { selectedProjectId: projectId } = useProjectContext();
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEntities() {
      try {
        const data = await getIAMEntities(Number(projectId));
        setEntities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (projectId) fetchEntities();
  }, [projectId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">IAM Entities</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal ID / Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Alerts</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(Array.isArray(entities) ? entities : []).map((e: any) => {
              const isAdmin = JSON.stringify(e.attached_policies || []).includes('*');
              const noMFA = e.is_human && !e.mfa_enabled;

              return (
                <tr key={e.id} className={`${isAdmin || noMFA ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.principal_type || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {e.principal_name || e.principal_id || 'Unknown Principal'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                    {noMFA && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">MFA DISABLED</span>}
                    {isAdmin && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">ADMIN PERMISSIONS</span>}
                    {!noMFA && !isAdmin && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">OK</span>}
                  </td>
                </tr>
              )
            })}
            {(!Array.isArray(entities) || entities.length === 0) && (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No IAM entities found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
