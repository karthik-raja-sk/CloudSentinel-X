import { useEffect, useMemo, useState } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import {
  inviteProjectMember,
  listProjectMembers,
  removeProjectMember,
  updateProjectMemberRole,
  type ProjectMember,
} from '../api/client';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';

export default function ProjectMembers() {
  const { selectedProjectId, selectedProjectRole } = useProjectContext();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'analyst' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProjectAdmin = useMemo(() => (selectedProjectRole || '').toLowerCase() === 'admin', [selectedProjectRole]);

  const loadMembers = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listProjectMembers(Number(selectedProjectId));
      setMembers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [selectedProjectId]);

  const onInvite = async () => {
    if (!selectedProjectId || !email.trim()) return;
    try {
      await inviteProjectMember(Number(selectedProjectId), email.trim(), role);
      setEmail('');
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Invite failed');
    }
  };

  const onRoleChange = async (member: ProjectMember, nextRole: string) => {
    if (!selectedProjectId) return;
    try {
      await updateProjectMemberRole(Number(selectedProjectId), member.user_id, nextRole);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Role update failed');
    }
  };

  const onRemove = async (member: ProjectMember) => {
    if (!selectedProjectId) return;
    try {
      await removeProjectMember(Number(selectedProjectId), member.user_id);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Remove failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Members</h1>
        <p className="text-sm text-gray-500 mt-1">Manage project collaboration roles securely.</p>
      </div>

      {error && <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}

      {isProjectAdmin && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-600">User Email</label>
            <input
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Role</label>
            <select className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as any)}>
              <option value="viewer">Viewer</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={onInvite} className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2 text-sm font-semibold">
            <UserPlus className="w-4 h-4 mr-2" /> Invite
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(members) ? members : []).map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="p-3">{m.full_name || `User #${m.user_id}`}</td>
                  <td className="p-3 text-gray-600">{m.email || 'N/A'}</td>
                  <td className="p-3">
                    {isProjectAdmin ? (
                      <select
                        className="border border-gray-300 rounded px-2 py-1"
                        value={m.role}
                        onChange={(e) => onRoleChange(m, e.target.value)}
                      >
                        <option value="viewer">viewer</option>
                        <option value="analyst">analyst</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className="capitalize">{m.role}</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {isProjectAdmin && (
                      <button onClick={() => onRemove(m)} className="inline-flex items-center text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">No members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
