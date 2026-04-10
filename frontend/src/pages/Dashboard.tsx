import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '../context/ProjectContext';
import { getAnalyticsSummary } from '../api/client';
import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Shield,
  AlertTriangle,
  Activity,
  UploadCloud,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';

const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
};

interface ScanTrendPoint {
  name: string;
  findings: number;
}

interface DashboardStats {
  total_scans?: number;
  total_findings?: number;
  severity_distribution?: Record<string, number>;
  findings_by_type?: Record<string, number>;
  scan_trend?: ScanTrendPoint[];
  cloud_misconfig_count?: number;
  pii_exposure_count?: number;
  findings_needing_remediation?: number;
  malware_count?: number;
  data_leaks_count?: number;
  incident_count?: number;
}

export default function Dashboard() {
  const { selectedProjectId: projectId } = useProjectContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchData = async () => {
    if (!projectId) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getAnalyticsSummary(Number(projectId));
      setStats(data);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600" />
          <p className="font-medium text-gray-500">Aggregating threat intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-bold text-red-800">Failed to load data</h3>
          <p className="mb-6 text-sm text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="rounded bg-red-600 px-4 py-2 text-white shadow transition hover:bg-red-700"
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
    malware_count = 0,
    data_leaks_count = 0,
    incident_count = 0,
  } = stats ?? {};

  const pieData = Object.keys(severity_distribution)
    .filter((k) => (severity_distribution[k] || 0) > 0)
    .map((key) => ({
      name: key,
      value: severity_distribution[key] || 0,
      color: RISK_COLORS[key as keyof typeof RISK_COLORS] || '#6B7280',
    }));

  const barData = Object.keys(findings_by_type)
    .filter((k) => (findings_by_type[k] || 0) > 0)
    .map((key) => ({
      name: key.replace(/_/g, ' ').toUpperCase(),
      Count: findings_by_type[key] || 0,
    }));

  const hasData = total_scans > 0 || total_findings > 0;

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="tracking-tight text-3xl font-extrabold text-gray-900">
          Security Posture Dashboard
        </h1>
        <p className="mt-2 font-medium text-gray-500">
          Real-time threat analytics and compliance overview.
        </p>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h2 className="mb-2 text-xl font-bold text-gray-800">No scan data available yet</h2>
          <p className="mx-auto mb-6 max-w-md text-gray-500">
            You haven&apos;t run any scans for this project yet. Upload a configuration or log
            file to get started.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center rounded bg-blue-600 px-4 py-2 font-medium text-white shadow transition hover:bg-blue-700"
          >
            <UploadCloud className="mr-2 h-5 w-5" /> Upload and Scan
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div
              className="flex cursor-pointer flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => navigate('/malware')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Malware Files
                  </h3>
                  <p className="mt-2 text-3xl font-extrabold text-gray-900">{malware_count}</p>
                </div>
                <div className="rounded-lg bg-red-100 p-3">
                  <Activity className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div
              className="flex cursor-pointer flex-col justify-between rounded-xl border-l-4 border-l-orange-500 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => navigate('/data-leaks')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500">
                    Data Leaks
                  </h3>
                  <p className="mt-2 text-3xl font-extrabold text-gray-900">
                    {data_leaks_count}
                  </p>
                </div>
                <div className="rounded-lg bg-orange-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div
              className="flex cursor-pointer flex-col justify-between rounded-xl border-l-4 border-l-purple-500 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => navigate('/incidents')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-500">
                    Active Incidents
                  </h3>
                  <p className="mt-2 text-3xl font-extrabold text-gray-900">{incident_count}</p>
                </div>
                <div className="rounded-lg bg-purple-100 p-3">
                  <ShieldAlert className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div
              className="flex cursor-pointer flex-col justify-between rounded-xl border-l-4 border-l-blue-500 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => navigate('/findings')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500">
                    Total Findings
                  </h3>
                  <p className="mt-2 text-3xl font-extrabold text-gray-900">{total_findings}</p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="col-span-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 font-bold text-gray-800">Risk Distribution</h3>
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
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No risk data available
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 font-bold text-gray-800">Findings by Category</h3>
              <div className="h-64">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar dataKey="Count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No category data available
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 font-bold text-gray-800">Threat Volume Trend</h3>
              <div className="h-64">
                {scan_trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={scan_trend}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorFindings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="findings"
                        stroke="#EF4444"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorFindings)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No trend data available
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 font-bold text-gray-800">Scan Activity</h3>
              <div className="h-64">
                {scan_trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={scan_trend}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="findings"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No scan data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}