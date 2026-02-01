/**
 * 服务器端认证工具函数
 *
 * 从本地 cookie 中读取用户会话
 */

import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'learnhub_session';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export interface ServerSession {
  user: SessionUser;
  token: string;
}

/**
 * 获取当前会话（服务器端）
 * 从我们域名的 cookie 中读取用户会话数据
 */
export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    // Base64 解码
    const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as ServerSession;

    if (!session?.user?.id) {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to get server session:', error);
    return null;
  }
}
