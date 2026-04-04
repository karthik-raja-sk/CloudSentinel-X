import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProjects, createProject } from '../api/client';

export interface Project {
  id: number;
  name: string;
  created_at: string;
}

interface ProjectContextType {
  projects: Project[];
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number) => void;
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  handleCreateProject: (name: string) => Promise<Project>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data);
            
      // Auto-select first project if none selected
      if (data.length > 0) {
        setSelectedProjectId(prev => {
          if (!prev || !data.some((p: Project) => p.id === prev)) {
             return data[0].id;
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
  }, []);

  const handleCreateProject = async (name: string) => {
    const newProject = await createProject(name);
    await fetchProjects();
    setSelectedProjectId(newProject.id);
    return newProject;
  };

  return (
    <ProjectContext.Provider 
      value={{ 
        projects, 
        selectedProjectId, 
        setSelectedProjectId, 
        loading, 
        error, 
        refreshProjects: fetchProjects,
        handleCreateProject
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
