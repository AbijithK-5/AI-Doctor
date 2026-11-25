import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { apiRequest, clearToken, getToken, setToken } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  unreadNotifications: number;
  refreshUser: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  loginUser: (token: string, user: User, rememberMe?: boolean) => void;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  unreadNotifications: 0,
  refreshUser: async () => {},
  refreshUnreadCount: async () => {},
  loginUser: () => {},
  logoutUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await apiRequest<{ unread_count: number }>('/api/notifications');
      setUnreadNotifications(data.unread_count || 0);
    } catch {
      // ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await apiRequest<User>('/api/auth/me');
      setUser(u);
      await refreshUnreadCount();
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginUser = (token: string, u: User, rememberMe = true) => {
    setToken(token, rememberMe);
    setUser(u);
    refreshUnreadCount();
  };

  const logoutUser = async () => {
    try {
      if (getToken()) {
        await apiRequest('/api/auth/logout', { method: 'POST' });
      }
    } catch {
      // ignore logout audit failures
    } finally {
      clearToken();
      setUser(null);
      setUnreadNotifications(0);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, unreadNotifications, refreshUser, refreshUnreadCount, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
