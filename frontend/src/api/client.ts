import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
});
const API_V1 = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_V1}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return null;
        const data = await res.json();
        const token = typeof data?.access_token === 'string' ? data.access_token : null;
        if (token) {
          localStorage.setItem('cloudSentinelToken', token);
        }
        return token;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

// Request interceptor to attach JWT token if it exists (useful as a hardening measure)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cloudSentinelToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors globally and pass actionable messages
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = (error?.config || {}) as any;
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
      }
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      localStorage.removeItem('cloudSentinelToken');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }

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

export type Organization = {
  id: number;
  name: string;
  current_role?: 'org_admin' | 'org_member' | string;
  created_at: string;
};

export const getOrganizations = async (): Promise<Organization[]> => {
  const response = await api.get('/organizations/');
  return Array.isArray(response.data) ? response.data : [];
};

export const createOrganization = async (name: string): Promise<Organization> => {
  const response = await api.post('/organizations/', { name });
  return response.data;
};

export const createProject = async (name: string) => {
  const response = await api.post('/projects/', { name });
  return response.data;
};

export const createProjectInOrg = async (name: string, organizationId: number) => {
  const response = await api.post('/projects/', { name, organization_id: organizationId });
  return response.data;
};

export type ProjectMember = {
  id: number;
  user_id: number;
  project_id: number;
  role: 'admin' | 'analyst' | 'viewer' | string;
  created_at: string;
  email?: string | null;
  full_name?: string | null;
};

export const listProjectMembers = async (projectId: number): Promise<ProjectMember[]> => {
  const response = await api.get(`/projects/${projectId}/members`);
  return Array.isArray(response.data) ? response.data : [];
};

export const inviteProjectMember = async (projectId: number, email: string, role: string): Promise<ProjectMember> => {
  const response = await api.post(`/projects/${projectId}/members`, { email, role });
  return response.data;
};

export const updateProjectMemberRole = async (projectId: number, userId: number, role: string): Promise<ProjectMember> => {
  const response = await api.patch(`/projects/${projectId}/members/${userId}`, { role });
  return response.data;
};

export const removeProjectMember = async (projectId: number, userId: number): Promise<{ status: string }> => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};

export type OrganizationMember = {
  id: number;
  organization_id: number;
  user_id: number;
  role: 'org_admin' | 'org_member' | string;
  created_at: string;
  email?: string | null;
  full_name?: string | null;
};

export const listOrganizationMembers = async (organizationId: number): Promise<OrganizationMember[]> => {
  const response = await api.get(`/organizations/${organizationId}/members`);
  return Array.isArray(response.data) ? response.data : [];
};

export const inviteOrganizationMember = async (
  organizationId: number,
  email: string,
  role: 'org_admin' | 'org_member'
): Promise<{ status: string; token: string }> => {
  const response = await api.post(`/organizations/${organizationId}/invites`, { email, role });
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
 