/**
 * Neon Auth 服务器端工具函数
 *
 * 仅用于 Server Components, Server Actions, API Routes
 */

import { cookies } from 'next/headers';
import type { AuthResponse } from './auth';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_NEON_AUTH_URL!;
const SESSION_COOKIE_NAME = 'learnhub_session';

/**
 * 获取当前会话（服务器端）
 * 从我们域名的 cookie 中读取 session token，然后向 Neon Auth 验证
 */
export async function getServerSession(): Promise<AuthResponse | null> {
  try {
    if (!AUTH_BASE_URL) {
      console.error('NEXT_PUBLIC_NEON_AUTH_URL is not configured');
      return null;
    }

    // 读取我们存储的 session token
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    // 使用 token 向 Neon Auth 验证会话
    const response = await fetch(`${AUTH_BASE_URL}/get-session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
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
    console.error('Failed to get server session:', error);
    return null;
  }
}
