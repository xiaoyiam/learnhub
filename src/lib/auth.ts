/**
 * Neon Auth 工具函数
 *
 * Neon Auth 基于 Better Auth，提供 REST API
 * 文档: https://www.better-auth.com/docs/api-reference
 */

import { cookies } from 'next/headers';

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
 * 获取当前会话（服务器端）
 * 从请求中读取 cookies 并转发给 Neon Auth
 */
export async function getSession(): Promise<AuthResponse | null> {
  try {
    // 检查环境变量
    if (!AUTH_BASE_URL) {
      console.error('NEXT_PUBLIC_NEON_AUTH_URL is not configured');
      return null;
    }

    // 服务器端：读取并转发 cookies
    let cookieHeader = '';
    try {
      const cookieStore = await cookies();
      cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join('; ');
    } catch {
      // 客户端调用时 cookies() 会失败，使用 credentials: include
    }

    const response = await fetch(`${AUTH_BASE_URL}/get-session`, {
      method: 'GET',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // 安全检查
    if (!data || typeof data !== 'object') {
      return null;
    }

    return data.session ? data : null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}
