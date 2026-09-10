import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount (if we have a token)
  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (token) {
      api
        .get('/auth/me')
        .then((res) => {
          const u = res.data.data.user;
          // Only allow admin users in the admin portal
          if (u.role !== 'admin') {
            localStorage.removeItem('adminAccessToken');
            setUser(null);
          } else {
            setUser(u);
          }
        })
        .catch(() => {
          localStorage.removeItem('adminAccessToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const u = data.data.user;

    // Enforce admin role
    if (u.role !== 'admin') {
      // Clear any tokens that were set
      localStorage.removeItem('adminAccessToken');
      throw new Error('Access denied. Admin privileges required.');
    }

    localStorage.setItem('adminAccessToken', data.data.accessToken);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore errors
    }
    localStorage.removeItem('adminAccessToken');
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
