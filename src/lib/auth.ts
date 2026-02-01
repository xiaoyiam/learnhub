/**
 * Neon Auth 工具函数（客户端）
 *
 * Neon Auth 基于 Better Auth，提供 REST API
 * 文档: https://www.better-auth.com/docs/api-reference
 */

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_NEON_AUTH_URL!;

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

/**
 * 用户注册
 */
export async function signUp(email: string, password: string, name: string): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

/**
 * 用户登录
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

/**
 * 用户登出
 */
export async function signOut(): Promise<void> {
  await fetch(`${AUTH_BASE_URL}/sign-out`, {
    method: 'POST',
    credentials: 'include',
  });
}

/**
 * 获取当前会话（客户端）
 * 使用 credentials: include 让浏览器自动发送 cookies
 */
export async function getSession(): Promise<AuthResponse | null> {
  try {
    if (!AUTH_BASE_URL) {
      console.error('NEXT_PUBLIC_NEON_AUTH_URL is not configured');
      return null;
    }

    const response = await fetch(`${AUTH_BASE_URL}/get-session`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      return null;
    }

    return data.session ? data : null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}
