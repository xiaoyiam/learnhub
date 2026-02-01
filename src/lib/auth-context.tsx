'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, getSession, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from './auth';
import { saveSession, clearSession } from './actions/auth-actions';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const session = await getSession();
      setUser(session?.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await authSignIn(email, password);
    // 获取用户和 token
    const user = result.user || (result as unknown as { user: User }).user;
    const token = result.session?.token || (result as unknown as { token?: string }).token || '';

    // 保存用户会话到 cookie
    if (user) {
      await saveSession(
        { id: user.id, email: user.email, name: user.name },
        token
      );
    }
    setUser(user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await authSignUp(email, password, name);
    const user = result.user || (result as unknown as { user: User }).user;
    const token = result.session?.token || (result as unknown as { token?: string }).token || '';

    if (user) {
      await saveSession(
        { id: user.id, email: user.email, name: user.name },
        token
      );
    }
    setUser(user);
  };

  const signOut = async () => {
    await authSignOut();
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshSession }}>
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
