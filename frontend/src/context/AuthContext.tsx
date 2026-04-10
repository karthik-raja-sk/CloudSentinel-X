import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type Role = 'admin' | 'analyst' | 'demo_admin' | 'demo_analyst' | string;

export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: Role;
  is_verified: boolean;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginState: (token: string, userData: User) => void;
  logout: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_ROOT = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Global authenticated fetch handler
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    let token = localStorage.getItem('cloudSentinelToken');
    
    options.headers = {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    };

    // Need credentials to pass httponly cookies!
    options.credentials = 'include';

    let res = await fetch(`${API_ROOT}${url}`, options);

    // If Access Token is expired, try to catch the 401 and Refresh!
    if (res.status === 401 && token) {
      try {
        const refreshRes = await fetch(`${API_ROOT}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include' // passes HttpOnly refresh cookie natively
        });
        
        if (refreshRes.ok) {
           const refreshData = await refreshRes.json();
           localStorage.setItem('cloudSentinelToken', refreshData.access_token);
           options.headers = { ...options.headers, Authorization: `Bearer ${refreshData.access_token}` };
           // Retry original
           res = await fetch(`${API_ROOT}${url}`, options);
        } else {
           // Refresh token failed/expired
           logout(true);
        }
      } catch (err) {
        logout(true);
      }
    }
    return res;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('cloudSentinelToken');
      if (token) {
        try {
          const res = await apiFetch('/api/v1/auth/me');
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setRole(userData.role);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Failed to fetch user", error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [apiFetch]);

  const loginState = (token: string, userData: User) => {
    localStorage.setItem('cloudSentinelToken', token);
    setUser(userData);
    setRole(userData.role);
    setIsAuthenticated(true);
  };

  const logout = async (expired: boolean = false) => {
    try {
       await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('cloudSentinelToken');
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    
    if (expired) {
      window.location.href = '/login?expired=true';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, isLoading, loginState, logout, apiFetch }}>
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

