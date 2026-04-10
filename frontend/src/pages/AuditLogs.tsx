import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Search, Filter, X, ChevronLeft, ChevronRight, Activity, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface AuditLog {
  id: number;
  event_type: string;
  status: string;
  user_id: number | null;
  email: string | null;
  role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  message: string | null;
  details: string | null;
  created_at: string;
}

interface AuditResponse {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
}

function safeParseDetails(details: string | null): unknown {
  if (!details) return {};
  try {
    return JSON.parse(details);
  } catch {
    return details;
  }
}

export default function AuditLogs() {
  const { apiFetch, role } = useAuth();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  
  // Detail Panel
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, eventTypeFilter, statusFilter, emailFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      });
      if (eventTypeFilter) params.append('event_type', eventTypeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (emailFilter) params.append('email', emailFilter);

      const res = await apiFetch(`/api/v1/auth/audit?${params.toString()}`);
      if (res.ok) {
        const data: AuditResponse = await res.json();
        setLogs(data.items);
        setTotal(data.total);
        setError(null);
      } else {
        setError('Failed to fetch audit logs or unauthorized access.');
      }
    } catch (err) {
      setError('Network error preventing audit log retrieval.');
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setEventTypeFilter('');
    setStatusFilter('');
    setEmailFilter('');
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-800 border border-green-200 flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1"/> Success</span>;
      case 'failure':
        return <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800 border border-red-200 flex items-center w-fit"><XCircle className="w-3 h-3 mr-1"/> Failure</span>;
      case 'warning':
        return <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center w-fit"><AlertTriangle className="w-3 h-3 mr-1"/> Warning</span>;
      default:
        return <span className="px-2 py-1 text-xs font-bold rounded bg-gray-100 text-gray-800 border border-gray-200 capitalize w-fit">{status}</span>;
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (error && logs.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-red-200 max-w-md">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Access Denied</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center tracking-tight">
            <Activity className="w-6 h-6 mr-3 text-indigo-600" />
            Security Operations Console
          </h2>
          <p className="text-gray-500 text-sm font-medium mt-1">Review system authorization bounds, configuration states, and RBAC actions.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-2">
           <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Events</span>
           <span className="text-indigo-700 font-black">{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center text-sm font-bold text-gray-700 mr-2 uppercase tracking-wide">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </div>
        <input 
          type="text" 
          placeholder="Filter by Email..."
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          value={emailFilter}
          onChange={(e) => { setEmailFilter(e.target.value); setPage(1); }}
        />
        <select 
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          value={eventTypeFilter}
          onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Events</option>
          <option value="login_success">Login Success</option>
          <option value="login_failed">Login Failed</option>
          <option value="refresh_issued">Refresh Issued</option>
          <option value="unauthorized_access_attempt">Unauthorized Admin Access</option>
          <option value="registration">Registration</option>
          <option value="logout">Logout</option>
        </select>
        <select 
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="warning">Warning</option>
        </select>
        {(emailFilter || eventTypeFilter || statusFilter) && (
          <button onClick={clearFilters} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition">
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 uppercase text-xs tracking-wider text-gray-500 font-black">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Identity</th>
                <th className="p-4">Role</th>
                <th className="p-4">Message Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan={6} className="p-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
              ) : logs.length === 0 ? (
                 <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No audit logs matched filters.</td></tr>
              ) : logs.map(log => (
                <tr 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-indigo-50/50 transition cursor-pointer group"
                >
                  <td className="p-4 text-xs font-medium text-gray-600 whitespace-nowrap">
                     {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                     <span className="font-bold text-gray-800 text-sm tracking-tight">{log.event_type}</span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{log.email || 'N/A'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{log.ip_address || 'Internal/Unknown IP'}</div>
                  </td>
                  <td className="p-4">
                     <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded max-w-fit capitalize">{log.role?.replace('_', ' ') || 'none'}</span>
                  </td>
                  <td className="p-4">
                     <div className="text-sm text-gray-600 truncate max-w-md group-hover:text-indigo-800 transition">
                       {log.message || 'Standard execution footprint.'}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination bar */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center shrink-0">
           <span className="text-sm font-medium text-gray-600">
             Showing page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages || 1}</span>
           </span>
           <div className="flex space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
              >
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-1 rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
              >
                <ChevronRight className="w-5 h-5"/>
              </button>
           </div>
        </div>
      </div>

      {/* Slide-over Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLog(null)} />
          <div className="fixed inset-y-0 right-0 max-w-lg w-full flex">
            <div className="w-full h-full bg-white shadow-2xl flex flex-col overflow-y-scroll border-l border-gray-200">
              
              <div className="px-6 py-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-black text-gray-900 flex items-center tracking-tight" id="slide-over-title">
                    Trace Record #{selectedLog.id}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">{new Date(selectedLog.created_at).toISOString()}</p>
                </div>
                <button
                  type="button"
                  className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() => setSelectedLog(null)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6 flex-1">
                {/* Status Header Block */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Event Type</h3>
                    <div className="text-lg font-black text-gray-800">{selectedLog.event_type}</div>
                  </div>
                  <div>
                    {getStatusBadge(selectedLog.status)}
                  </div>
                </div>

                {/* Main Payload metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                     <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Identity Binding</span>
                     <span className="block text-sm font-bold text-gray-900 truncate" title={selectedLog.email || 'N/A'}>{selectedLog.email || 'Unknown Client'}</span>
                     <span className="block text-xs font-semibold text-gray-500 capitalize">{selectedLog.role?.replace('_', ' ') || 'No Role'} • UID: {selectedLog.user_id || 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                     <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Network Profile</span>
                     <span className="block text-sm font-bold text-gray-900 truncate" title={selectedLog.ip_address || 'N/A'}>{selectedLog.ip_address || 'Unresolved Proxy'}</span>
                  </div>
                </div>

                {/* Message block */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Architectural Message</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed shadow-sm">
                    {selectedLog.message || 'No explicit metric payload generated by the dispatch service for this generalized event signature.'}
                  </div>
                </div>

                {/* Metadata JSON */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Raw JSON Metadata</h3>
                  <div className="bg-slate-900 rounded-lg p-4 shadow-inner overflow-x-auto">
                     <pre className="text-xs text-green-400 font-mono">
{JSON.stringify({
  trace_id: selectedLog.id,
  timestamp: selectedLog.created_at,
  user_agent: selectedLog.user_agent || "FastAPI/Starlette Standard Router",
  internal_details: safeParseDetails(selectedLog.details)
}, null, 2)}
                     </pre>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
