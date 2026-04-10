import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProjects, createProjectInOrg, getOrganizations, type Organization } from '../api/client';

export interface Project {
  id: number;
  name: string;
  created_at: string;
  current_role?: 'admin' | 'analyst' | 'viewer' | string;
}

interface ProjectContextType {
  organizations: Organization[];
  selectedOrganizationId: number | null;
  setSelectedOrganizationId: (id: number) => void;
  selectedOrganizationRole: string | null;
  projects: Project[];
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number) => void;
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  handleCreateProject: (name: string) => Promise<Project>;
  selectedProjectRole: string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedProjectRole =
    projects.find((p) => p.id === selectedProjectId)?.current_role || null;
  const selectedOrganizationRole =
    organizations.find((o) => o.id === selectedOrganizationId)?.current_role || null;

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const [orgData, projectData] = await Promise.all([getOrganizations(), getProjects()]);
      setOrganizations(orgData);
      const activeOrgId = selectedOrganizationId || orgData[0]?.id || null;
      if (!selectedOrganizationId && activeOrgId) setSelectedOrganizationId(activeOrgId);
      const filteredProjects = activeOrgId
        ? (projectData || []).filter((p: Project & { organization_id?: number | null }) => p.organization_id === activeOrgId || p.organization_id == null)
        : projectData;
      setProjects(filteredProjects);
            
      // Auto-select first project if none selected
      if (filteredProjects.length > 0) {
        setSelectedProjectId(prev => {
          if (!prev || !filteredProjects.some((p: Project) => p.id === prev)) {
             return filteredProjects[0].id;
          }
          return prev;
        });
      } else {
        setSelectedProjectId(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch projects', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedOrganizationId]);

  const handleCreateProject = async (name: string) => {
    const orgId = selectedOrganizationId || organizations[0]?.id;
    const newProject = orgId ? await createProjectInOrg(name, orgId) : await createProjectInOrg(name, 1);
    await fetchProjects();
    setSelectedProjectId(newProject.id);
    return newProject;
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
        handleCreateProject
        ,
        selectedProjectRole
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
