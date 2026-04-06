import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Findings from './pages/Findings';
import Scans from './pages/Scans';
import IAM from './pages/IAM';
import Logs from './pages/Logs';
import AttackPaths from './pages/AttackPaths';
import Upload from './pages/Upload';
import Report from './pages/Report';
import MalwareFindings from './pages/MalwareFindings';
import DataLeaks from './pages/DataLeaks';
import Incidents from './pages/Incidents';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProjectProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/report" element={<PrivateRoute><Report /></PrivateRoute>} />

            <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="upload" element={<Upload />} />
              <Route path="findings" element={<Findings />} />
              <Route path="malware" element={<MalwareFindings />} />
              <Route path="data-leaks" element={<DataLeaks />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="scans" element={<Scans />} />
              <Route path="iam" element={<IAM />} />
              <Route path="logs" element={<Logs />} />
              <Route path="attack-paths" element={<AttackPaths />} />
            </Route>
          </Routes>
        </ProjectProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
