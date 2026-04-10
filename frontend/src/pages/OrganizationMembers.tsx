import { useEffect, useMemo, useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { inviteOrganizationMember, listOrganizationMembers, type OrganizationMember } from '../api/client';
import { Loader2, UserPlus } from 'lucide-react';

export default function OrganizationMembers() {
  const { selectedOrganizationId, selectedOrganizationRole } = useProjectContext();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'org_admin' | 'org_member'>('org_member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOrgAdmin = useMemo(() => (selectedOrganizationRole || '').toLowerCase() === 'org_admin', [selectedOrganizationRole]);

  const fetchMembers = async () => {
    if (!selectedOrganizationId) return;
    setLoading(true);
    setError(null);
    try {
      setMembers(await listOrganizationMembers(selectedOrganizationId));
    } catch (err: any) {
      setError(err.message || 'Failed to load organization members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedOrganizationId]);

  const invite = async () => {
    if (!selectedOrganizationId || !email.trim()) return;
    try {
      await inviteOrganizationMember(selectedOrganizationId, email.trim(), role);
      setEmail('');
      await fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to invite member');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Members</h1>
        <p className="text-sm text-gray-500 mt-1">Manage users and roles across the organization.</p>
      </div>
      {error && <div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-700">{error}</div>}
      {isOrgAdmin && (
        <div className="bg-white border border-gray-200 rounded p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600 font-semibold">Invite Email</label>
            <input className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-semibold">Role</label>
            <select className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as any)}>
              <option value="org_member">org_member</option>
              <option value="org_admin">org_admin</option>
            </select>
          </div>
          <button onClick={invite} className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2 text-sm font-semibold">
            <UserPlus className="w-4 h-4 mr-2" /> Invite
          </button>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="p-3">{m.full_name || `User #${m.user_id}`}</td>
                  <td className="p-3">{m.email || 'N/A'}</td>
                  <td className="p-3">{m.role}</td>
                </tr>
              ))}
              {members.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-500">No organization members.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
