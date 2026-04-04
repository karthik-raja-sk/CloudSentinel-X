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
import { ProjectProvider } from './context/ProjectContext';

function App() {
  return (
    <Router>
      <ProjectProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="upload" element={<Upload />} />
            <Route path="findings" element={<Findings />} />
            <Route path="scans" element={<Scans />} />
            <Route path="iam" element={<IAM />} />
            <Route path="logs" element={<Logs />} />
            <Route path="attack-paths" element={<AttackPaths />} />
          </Route>
        </Routes>
      </ProjectProvider>
    </Router>
  );
}

export default App;
