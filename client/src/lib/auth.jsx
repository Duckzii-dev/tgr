import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.get('/auth/me');
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { user } = await api.post('/auth/login', { email, password });
    setUser(user);
  };
  const register = async (email, password, name) => {
    const { user } = await api.post('/auth/register', { email, password, name });
    setUser(user);
  };
  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthCtx.Provider
      value={{ user, loading, login, register, logout, refresh, setUser }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);