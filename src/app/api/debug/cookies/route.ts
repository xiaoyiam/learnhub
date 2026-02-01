import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return NextResponse.json({
    cookies: allCookies.map(c => ({
      name: c.name,
      value: c.value.substring(0, 20) + '...',  // 只显示前20字符
    })),
    hasSessionCookie: allCookies.some(c => c.name === 'learnhub_session'),
  });
}
