import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkStatus, login as apiLogin, logout as apiLogout } from '../api/auth';

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  authenticated: false,
  loading: true,
  login: async () => false,
  logout: async () => {},
});

export function useAuthProvider() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus()
      .then((res) => setAuthenticated(res.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (password: string) => {
    try {
      await apiLogin(password);
      setAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setAuthenticated(false);
  }, []);

  return { authenticated, loading, login, logout };
}

export function useAuth() {
  return useContext(AuthContext);
}
