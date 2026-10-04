import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

export type PathMilestone = {
  id: string;
  topic: string;
  level: string;
  description: string;
  status: 'completed' | 'in_progress' | 'up_next' | 'locked';
  accuracy?: number;
  sessionsCount: number;
  lastStudied?: string;
  weakConcepts?: string[];
};

export type Student = {
  id: string;
  username: string;
  name: string;
  grade: string;
  track: string;
  customGoal?: string;
  createdAt: string;
  learningPath: PathMilestone[];
};

export type AuthContextType = {
  student: Student | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (params: {
    username: string;
    password: string;
    name: string;
    grade?: string;
    track?: string;
    customGoal?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginDemo: () => Promise<void>;
  updateTrack: (track: string, customGoal?: string) => Promise<{ success: boolean; error?: string }>;
  refreshStudent: () => Promise<void>;
  syncSession: (sessionData: unknown) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'study_auth_token';
const CACHED_STUDENT_KEY = 'study_cached_student';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [student, setStudent] = useState<Student | null>(() => {
    try {
      const cached = localStorage.getItem(CACHED_STUDENT_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Configure api-client-react auth getter
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
  }, []);

  const saveAuth = (newToken: string, newStudent: Student) => {
    setToken(newToken);
    setStudent(newStudent);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(CACHED_STUDENT_KEY, JSON.stringify(newStudent));
  };

  const clearAuth = () => {
    setToken(null);
    setStudent(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CACHED_STUDENT_KEY);
  };

  const refreshStudent = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
        localStorage.setItem(CACHED_STUDENT_KEY, JSON.stringify(data.student));
      } else if (res.status === 401) {
        clearAuth();
      }
    } catch {
      // In case network is offline, rely on cached student
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStudent();
  }, [refreshStudent]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed. Please check credentials.' };
      }
      saveAuth(data.token, data.student);
      return { success: true };
    } catch {
      return { success: false, error: 'Could not connect to server. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (params: {
    username: string;
    password: string;
    name: string;
    grade?: string;
    track?: string;
    customGoal?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }
      saveAuth(data.token, data.student);
      return { success: true };
    } catch {
      return { success: false, error: 'Could not connect to server. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch {
        // Ignore logout error
      }
    }
    clearAuth();
  };

  const loginDemo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        saveAuth(data.token, data.student);
      }
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTrack = async (track: string, customGoal?: string) => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return { success: false, error: 'Please sign in first.' };

    try {
      const res = await fetch('/api/learning-path/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ track, customGoal }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update track.' };
      }
      if (data.student) {
        setStudent(data.student);
        localStorage.setItem(CACHED_STUDENT_KEY, JSON.stringify(data.student));
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error updating track.' };
    }
  };

  const syncSession = async (sessionData: unknown) => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return;

    try {
      const res = await fetch('/api/study/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(sessionData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.learningPath && student) {
          const updated = { ...student, learningPath: data.learningPath };
          setStudent(updated);
          localStorage.setItem(CACHED_STUDENT_KEY, JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error('Failed to sync session with student learning path:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        token,
        isLoading,
        isAuthenticated: Boolean(student && token),
        login,
        register,
        logout,
        loginDemo,
        updateTrack,
        refreshStudent,
        syncSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
