import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8010/api/v1',
});

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
