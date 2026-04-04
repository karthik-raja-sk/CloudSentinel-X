import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Role = 'Admin' | 'Analyst';

interface AuthContextType {
  role: Role | null;
  isAuthenticated: boolean;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check localStorage on mount
    const storedRole = localStorage.getItem('cloudSentinelAuthRole') as Role;
    if (storedRole === 'Admin' || storedRole === 'Analyst') {
       setRole(storedRole);
       setIsAuthenticated(true);
    }
  }, []);

  const login = (newRole: Role) => {
    localStorage.setItem('cloudSentinelAuthRole', newRole);
    setRole(newRole);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('cloudSentinelAuthRole');
    setRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ role, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
