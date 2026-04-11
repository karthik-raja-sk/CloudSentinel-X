import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { API_V1 } from '../api/client';

export type Role = 'admin' | 'analyst' | 'viewer' | 'demo_admin' | 'demo_analyst' | 'demo_viewer' | string;

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Global authenticated fetch handler
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('cloudSentinelToken');
    
    // Safety guard: if we are calling a protected endpoint without a token, 
    // we should return a 401 early to avoid invalid requests, UNLESS it's the me call during init.
    if (!token && !url.includes('/auth/login') && !url.includes('/auth/refresh') && url !== '/auth/me') {
       return new Response(JSON.stringify({ detail: "Not authenticated" }), { status: 401 });
    }

    options.headers = {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    };

    options.credentials = 'include'; // Essential for HttpOnly cookies

    // Ensure URL doesn't have double slashes if url starts with /
    const targetUrl = url.startsWith('http') ? url : `${API_V1}${url.startsWith('/') ? '' : '/'}${url}`;
    let res = await fetch(targetUrl, options);

    // Automatic Refresh Logic
    if (res.status === 401 && token && !url.includes('/auth/refresh')) {
      try {
        const refreshRes = await fetch(`${API_V1}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });
        
        if (refreshRes.ok) {
           const refreshData = await refreshRes.json();
           const newToken = refreshData.access_token;
           localStorage.setItem('cloudSentinelToken', newToken);
           
           // Retry with new token
           const retryOptions = {
             ...options,
             headers: { ...options.headers, Authorization: `Bearer ${newToken}` }
           };
           res = await fetch(targetUrl, retryOptions);
        } else {
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
          const res = await apiFetch('/auth/me');
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
       await apiFetch('/auth/logout', { method: 'POST' });
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

