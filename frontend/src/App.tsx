import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Findings = lazy(() => import('./pages/Findings'));
const Scans = lazy(() => import('./pages/Scans'));
const IAM = lazy(() => import('./pages/IAM'));
const Logs = lazy(() => import('./pages/Logs'));
const AttackPaths = lazy(() => import('./pages/AttackPaths'));
const Upload = lazy(() => import('./pages/Upload'));
const Report = lazy(() => import('./pages/Report'));
const MalwareFindings = lazy(() => import('./pages/MalwareFindings'));
const DataLeaks = lazy(() => import('./pages/DataLeaks'));
const Incidents = lazy(() => import('./pages/Incidents'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const ProjectMembers = lazy(() => import('./pages/ProjectMembers'));
const OrganizationMembers = lazy(() => import('./pages/OrganizationMembers'));

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PageSkeleton() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  );
}

function SafePage({ children }: { children: JSX.Element }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProjectProvider>
          <Routes>
            <Route path="/login" element={<SafePage><Login /></SafePage>} />
            <Route path="/register" element={<SafePage><Register /></SafePage>} />
            <Route path="/verify-email" element={<SafePage><VerifyEmail /></SafePage>} />
            <Route path="/forgot-password" element={<SafePage><ForgotPassword /></SafePage>} />
            <Route path="/reset-password" element={<SafePage><ResetPassword /></SafePage>} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/report" element={<PrivateRoute><SafePage><Report /></SafePage></PrivateRoute>} />

            <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
              <Route path="dashboard" element={<SafePage><Dashboard /></SafePage>} />
              <Route path="upload" element={<SafePage><Upload /></SafePage>} />
              <Route path="findings" element={<SafePage><Findings /></SafePage>} />
              <Route path="malware" element={<SafePage><MalwareFindings /></SafePage>} />
              <Route path="data-leaks" element={<SafePage><DataLeaks /></SafePage>} />
              <Route path="incidents" element={<SafePage><Incidents /></SafePage>} />
              <Route path="scans" element={<SafePage><Scans /></SafePage>} />
              <Route path="iam" element={<SafePage><IAM /></SafePage>} />
              <Route path="logs" element={<SafePage><Logs /></SafePage>} />
              <Route path="attack-paths" element={<SafePage><AttackPaths /></SafePage>} />
              <Route path="audit-logs" element={<SafePage><AuditLogs /></SafePage>} />
              <Route path="project-members" element={<SafePage><ProjectMembers /></SafePage>} />
              <Route path="organization-members" element={<SafePage><OrganizationMembers /></SafePage>} />
            </Route>
          </Routes>
        </ProjectProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
