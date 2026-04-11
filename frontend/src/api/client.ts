import axios from 'axios';

const isProduction = import.meta.env.PROD;
export const API_V1 = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_V1,
  withCredentials: true,
});

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
        if (!res.ok) {
          localStorage.removeItem('cloudSentinelToken');
          return null;
        }
        const data = await res.json();
        const token = typeof data?.access_token === 'string' ? data.access_token : null;
        if (token) {
          localStorage.setItem('cloudSentinelToken', token);
        }
        return token;
      } catch (err) {
        console.error("Refresh token error", err);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

// Request interceptor to attach JWT token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cloudSentinelToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    // Prevent infinite loops if the refresh call itself is returning 401
    if (error?.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      
      localStorage.removeItem('cloudSentinelToken');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }

    if ((import.meta as any).env?.DEV) {
      console.error(`API Request Failed for ${error.config?.url}:`, error);
    }
    
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.response.statusText;
      
      if (status >= 400 && status < 500) {
        error.message = `API Error [${status}]: ${detail}`;
      } else if (status >= 500) {
        error.message = `Server Error [${status}]: The backend encountered an issue. (${detail})`;
      } else {
        error.message = `Unexpected Response [${status}]: ${detail}`;
      }
    } else if (error.request) {
      error.message = isProduction 
        ? `Network Error: CloudSentinel backend is unreachable at ${API_V1}. Please check your connection or service status.`
        : `Network Error: Backend server is unreachable at ${API_V1}. Ensure the FastAPI server is running locally.`;
    } else {
      error.message = `Request Error: ${error.message}`;
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

export const createProject = async (name: string, organizationId?: number) => {
  const payload = organizationId ? { name, organization_id: organizationId } : { name };
  const response = await api.post('/projects/', payload);
  return response.data;
};

export const createProjectInOrg = async (name: string, organizationId: number) => {
  return createProject(name, organizationId);
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
 