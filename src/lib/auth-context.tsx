'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, getSession, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from './auth';
import { saveSessionToken, clearSessionToken } from './actions/auth-actions';

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
    console.log('Login result:', JSON.stringify(result, null, 2));
    // 保存 session token 到我们域名的 cookie
    // Better Auth 可能返回 token 或 session.token
    const token = result.session?.token || (result as unknown as { token?: string }).token;
    if (token) {
      console.log('Saving session token...');
      await saveSessionToken(token);
    } else {
      console.warn('No token found in login response');
    }
    setUser(result.user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await authSignUp(email, password, name);
    console.log('Signup result:', JSON.stringify(result, null, 2));
    // 保存 session token 到我们域名的 cookie
    const token = result.session?.token || (result as unknown as { token?: string }).token;
    if (token) {
      await saveSessionToken(token);
    }
    setUser(result.user);
  };

  const signOut = async () => {
    await authSignOut();
    await clearSessionToken();
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
