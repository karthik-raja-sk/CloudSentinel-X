import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '../context/ProjectContext';
import { getAnalyticsSummary } from '../api/client';
import { Loader2, ShieldAlert, ShieldCheck, Shield, AlertTriangle, AlertCircle, Activity, UploadCloud } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area, LineChart, Line
} from 'recharts';

const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6'
};

export default function Dashboard() {
  const { selectedProjectId: projectId } = useProjectContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await getAnalyticsSummary(Number(projectId));
      setStats(data);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.detail || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aggregating threat intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200 shadow-sm max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 mb-2">Failed to load data</h3>
          <p className="text-red-600 text-sm mb-6">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition"
          >
            Retry Fetch
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { 
    total_scans = 0, 
    total_findings = 0, 
    severity_distribution = {}, 
    findings_by_type = {}, 
    scan_trend = [],
    cloud_misconfig_count = 0,
    pii_exposure_count = 0,
    findings_needing_remediation = 0,
    malware_count = 0,
    data_leaks_count = 0,
    critical_incidents_count = 0
  } = stats;

  const pieData = Object.keys(severity_distribution)
    .filter(k => severity_distribution[k] > 0)
    .map(key => ({
      name: key,
      value: severity_distribution[key],
      color: RISK_COLORS[key as keyof typeof RISK_COLORS] || '#gray-500'
    }));

  const barData = Object.keys(findings_by_type).map(key => ({
    name: key.replace('_', ' ').toUpperCase(),
    Count: findings_by_type[key]
  }));

  const hasData = total_scans > 0;

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Security Posture Dashboard</h1>
        <p className="text-gray-500 mt-2 font-medium">Real-time threat analytics and compliance overview.</p>
      </div>

      {!hasData ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
          <ShieldCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No scan data available yet</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            You haven't run any scans for this project yet. Upload a configuration or log file to get started.
          </p>
          <button 
            onClick={() => navigate('/upload')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition font-medium"
          >
            <UploadCloud className="w-5 h-5 mr-2" /> Upload and Scan
          </button>
        </div>
      ) : (
        <>
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/malware')}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Malware Files</h3>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{malware_count}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg"><Activity className="w-6 h-6 text-red-600" /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-orange-500 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/data-leaks')}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-orange-500 text-xs font-bold uppercase tracking-wider">Data Leaks</h3>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{data_leaks_count}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg"><AlertTriangle className="w-6 h-6 text-orange-600" /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-purple-500 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/incidents')}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-purple-500 text-xs font-bold uppercase tracking-wider">Critical Incidents</h3>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{critical_incidents_count}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg"><ShieldAlert className="w-6 h-6 text-purple-600" /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-blue-500 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/findings')}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-blue-500 text-xs font-bold uppercase tracking-wider">Total Findings</h3>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{total_findings}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg"><Shield className="w-6 h-6 text-blue-600" /></div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1">
              <h3 className="text-gray-800 font-bold mb-6">Risk Distribution</h3>
              <div className="h-64">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                         formatter={(value: any) => [`${value} Findings`, 'Count']}
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">No risk data available</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-2">
              <h3 className="text-gray-800 font-bold mb-6">Findings by Category</h3>
              <div className="h-64">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{fill: '#F3F4F6'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="Count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">No category data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-800 font-bold mb-6">Threat Volume Trend</h3>
              <div className="h-64">
                {scan_trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scan_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFindings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 10}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="findings" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorFindings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-gray-400 text-sm">No trend data available</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-800 font-bold mb-6">Scan Activity Activity</h3>
              <div className="h-64">
                {scan_trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scan_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 10}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Line type="stepAfter" dataKey="findings" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-gray-400 text-sm">No scan data available</div>
                )}
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
