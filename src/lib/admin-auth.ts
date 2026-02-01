'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 检查当前用户是否为管理员
 * 非管理员将被重定向到首页
 */
export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/admin');
  }

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, session.user.id),
  });

  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  return { user: session.user, profile };
}

/**
 * 检查用户是否为管理员（不重定向，返回布尔值）
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();

  if (!session?.user) {
    return false;
  }

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, session.user.id),
  });

  return profile?.role === 'admin';
}
