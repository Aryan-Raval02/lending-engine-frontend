import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  sub: string;
  roles: string[];
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, tenantId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode<any>(token);
        if (decoded.exp * 1000 > Date.now()) {
          localStorage.setItem('userId', decoded.sub);
          return {
            id: decoded.jti || '',
            sub: decoded.sub || '',
            roles: decoded.roles || [],
            tenantId: decoded.tenantId || localStorage.getItem('tenantId') || '',
          };
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  useEffect(() => {
    // We already initialized synchronously, but we can do a quick check here if needed
    if (!user && localStorage.getItem('accessToken')) {
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('userId');
    }
  }, [user]);

  const login = (token: string, refreshToken: string, tenantId: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('tenantId', tenantId);
    
    try {
      const decoded = jwtDecode<any>(token);
      localStorage.setItem('userId', decoded.sub);
      setUser({
        id: decoded.jti || '',
        sub: decoded.sub || '',
        roles: decoded.roles || [],
        tenantId: decoded.tenantId || tenantId,
      });
    } catch (e) {
      console.error("Failed to decode token", e);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('userId');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
