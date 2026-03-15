'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import api, { setAccessToken } from '@/lib/axios';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const scheduleRefresh = useCallback((accessToken: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const exp = parseJwtExp(accessToken);
    if (!exp) return;

    // Refresh 2 minutes before expiry
    const delay = Math.max(exp - Date.now() - 2 * 60 * 1000, 0);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return;

        const { data } = await api.post('/auth/refresh', { refreshToken });

        setAccessToken(data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setState((prev) => ({
          ...prev,
          user: data.user,
          isAuthenticated: true,
        }));

        scheduleRefresh(data.accessToken);
      } catch {
        setAccessToken(null);
        localStorage.removeItem('refreshToken');
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    }, delay);
  }, []);

  // Boot: try to restore session from refresh token
  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    api
      .post('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        });
        scheduleRefresh(data.accessToken);
      })
      .catch(() => {
        localStorage.removeItem('refreshToken');
        setState({ user: null, isLoading: false, isAuthenticated: false });
      });

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post('/auth/login', { email, password });

      setAccessToken(data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setState({ user: data.user, isLoading: false, isAuthenticated: true });
      scheduleRefresh(data.accessToken);
    },
    [scheduleRefresh],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string,
    ) => {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });

      setAccessToken(data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setState({ user: data.user, isLoading: false, isAuthenticated: true });
      scheduleRefresh(data.accessToken);
    },
    [scheduleRefresh],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      localStorage.removeItem('refreshToken');
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/auth/google`;
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, loginWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
