'use server';

import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'learnhub_session';

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * 保存用户会话到 cookie
 * 存储用户基本信息，避免每次都要向 Neon Auth 验证
 */
export async function saveSession(user: SessionUser, token: string): Promise<void> {
  const cookieStore = await cookies();
  const sessionData = JSON.stringify({ user, token });
  // Base64 编码
  const encoded = Buffer.from(sessionData).toString('base64');

  cookieStore.set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: '/',
  });
}

/**
 * 清除 session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
