import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getProjects,
  createProjectInOrg,
  getOrganizations,
  createOrganization,
  type Organization,
} from '../api/client';
import { useAuth } from './AuthContext';

export interface Project {
  id: number;
  name: string;
  created_at: string;
  organization_id?: number | null;
  current_role?: 'admin' | 'analyst' | 'viewer' | string;
}

interface ProjectContextType {
  organizations: Organization[];
  selectedOrganizationId: number | null;
  setSelectedOrganizationId: (id: number | null) => void;
  selectedOrganizationRole: string | null;
  projects: Project[];
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number | null) => void;
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  handleCreateProject: (name: string, orgName?: string) => Promise<Project>;
  selectedProjectRole: string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

function getStoredNumber(key: string): number | null {
  const saved = localStorage.getItem(key);
  if (!saved) return null;
  const parsed = Number(saved);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(() =>
    getStoredNumber('cs_org_id')
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() =>
    getStoredNumber('cs_project_id')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedOrganizationId !== null) {
      localStorage.setItem('cs_org_id', selectedOrganizationId.toString());
    } else {
      localStorage.removeItem('cs_org_id');
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (selectedProjectId !== null) {
      localStorage.setItem('cs_project_id', selectedProjectId.toString());
    } else {
      localStorage.removeItem('cs_project_id');
    }
  }, [selectedProjectId]);

  const selectedProjectRole =
    projects.find((p) => p.id === selectedProjectId)?.current_role ?? null;

  const selectedOrganizationRole =
    organizations.find((o) => o.id === selectedOrganizationId)?.current_role ?? null;

  const fetchProjects = async () => {
    if (!isAuthenticated || authLoading) return;

    try {
      setLoading(true);
      setError(null);

      const [orgResponse, projectResponse] = await Promise.all([
        getOrganizations(),
        getProjects(),
      ]);

      const orgData = Array.isArray(orgResponse) ? orgResponse : [];
      const projectData = Array.isArray(projectResponse) ? projectResponse : [];

      setOrganizations(orgData);

      let activeOrgId = selectedOrganizationId;
      const hasValidSelectedOrg =
        activeOrgId !== null && orgData.some((o) => o.id === activeOrgId);

      if (!hasValidSelectedOrg) {
        activeOrgId = orgData[0]?.id ?? null;
        setSelectedOrganizationId(activeOrgId);
      }

      const filteredProjects =
        activeOrgId !== null
          ? projectData.filter(
            (p) => p.organization_id === activeOrgId || p.organization_id == null
          )
          : projectData;

      setProjects(filteredProjects);

      if (filteredProjects.length > 0) {
        const hasValidSelectedProject =
          selectedProjectId !== null &&
          filteredProjects.some((p) => p.id === selectedProjectId);

        if (!hasValidSelectedProject) {
          setSelectedProjectId(filteredProjects[0].id);
        }
      } else {
        setSelectedProjectId(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';

      if (message.includes('401')) {
        console.warn('Silent 401 in ProjectContext - auth may still be refreshing');
        return;
      }

      console.error('Failed to fetch projects', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      void fetchProjects();
    } else if (!isAuthenticated && !authLoading) {
      setProjects([]);
      setOrganizations([]);
      setSelectedOrganizationId(null);
      setSelectedProjectId(null);
      setError(null);
    }
  }, [isAuthenticated, authLoading, selectedOrganizationId]);

  const handleCreateProject = async (name: string, orgName?: string): Promise<Project> => {
    let orgId = selectedOrganizationId ?? organizations[0]?.id ?? null;

    if (!orgId && orgName) {
      try {
        const newOrg = await createOrganization(orgName);
        orgId = newOrg.id;
        setSelectedOrganizationId(orgId);
      } catch (err: unknown) {
        console.error('Failed to create organization during onboarding', err);
        const message =
          err instanceof Error ? err.message : 'Failed to create organization';
        throw new Error(message);
      }
    }

    if (!orgId) {
      throw new Error(
        'Organization context is required. Please create or select an organization first.'
      );
    }

    try {
      const newProject = await createProjectInOrg(name, orgId);
      await fetchProjects();
      setSelectedProjectId(newProject.id);
      return newProject;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create project';

      if (message.includes('403')) {
        throw new Error('You do not have permission to create projects in this organization.');
      }

      throw new Error(message);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        organizations,
        selectedOrganizationId,
        setSelectedOrganizationId,
        selectedOrganizationRole,
        selectedProjectId,
        setSelectedProjectId,
        loading,
        error,
        refreshProjects: fetchProjects,
        handleCreateProject,
        selectedProjectRole,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}