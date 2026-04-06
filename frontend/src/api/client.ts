import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1',
});

// Request interceptor to attach JWT token if it exists (useful as a hardening measure)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors globally and pass actionable messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if ((import.meta as any).env?.DEV) {
      console.error(`API Request Failed for ${error.config?.url}:`, error);
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      error.message = `[${error.response.status}] ${error.response.data?.detail || error.response.statusText} (${error.config?.url})`;
    } else if (error.request) {
      // The request was made but no response was received
      error.message = `Backend server is unreachable. Please check if the API is running on localhost:8000 (Failed calling ${error.config?.url})`;
    }
    return Promise.reject(error);
  }
);

export const getScanStatus = async (scanId: number) => {
  const response = await api.get(`/scans/${scanId}`);
  return response.data;
};

export const getProjects = async () => {
  const response = await api.get('/projects/');
  return response.data;
};

export const createProject = async (name: string) => {
  const response = await api.post('/projects/', { name });
  return response.data;
};

export const getFindings = async (projectId: number, type?: string) => {
  const params = type ? { type } : {};
  const response = await api.get(`/findings/project/${projectId}`, { params });
  return response.data;
};

export const updateFindingStatus = async (findingId: number, status: string) => {
  const response = await api.patch(`/findings/${findingId}/status`, { status });
  return response.data;
};

export const getIAMEntities = async (projectId: number) => {
  const response = await api.get(`/iam/project/${projectId}`);
  return response.data;
};

export const getLogEvents = async (projectId: number) => {
  const response = await api.get(`/logs/project/${projectId}`);
  return response.data;
};

export const getAttackPaths = async (projectId: number) => {
  const response = await api.get(`/attack-paths/project/${projectId}`);
  return response.data;
};

// Generic helper to get the latest scan ID for a project implicitly if needed
export const getProjectScans = async (projectId: number) => {
  const response = await api.get(`/scans/project/${projectId}`);
  return response.data;
}

export const getAnalyticsSummary = async (projectId: number) => {
  const response = await api.get(`/analytics/summary/${projectId}`);
  return response.data;
};

export const uploadFile = async (projectId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/uploads/${projectId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const previewRedaction = async (rawValue: string, dataType: string) => {
  const response = await api.post(`/redaction/preview`, {
    raw_value: rawValue,
    data_type: dataType
  });
  return response.data;
};

// --- New Endpoints ---

export const getMalwareFindings = async (projectId: number) => {
  const response = await api.get(`/malware/${projectId}`);
  return response.data;
};

export const getDataLeakFindings = async (projectId: number) => {
  const response = await api.get(`/data-leaks/${projectId}`);
  return response.data;
};

export const getIncidents = async (projectId: number) => {
  const response = await api.get(`/incidents/${projectId}`);
  return response.data;
};

export const triggerFileScan = async (projectId: number) => {
  const response = await api.post(`/scans/${projectId}/files`);
  return response.data;
};

export const triggerDataLeakScan = async (projectId: number) => {
  const response = await api.post(`/scans/${projectId}/data-leaks`);
  return response.data;
};

export const triggerCorrelation = async (projectId: number) => {
  const response = await api.post(`/scans/${projectId}/correlate`);
  return response.data;
};
