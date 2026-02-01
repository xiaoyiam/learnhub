import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_NEON_AUTH_URL!;
const SESSION_COOKIE_NAME = 'learnhub_session';

export async function GET() {
  try {
    // 1. 读取 cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({
        error: '未登录',
        debug: {
          step: 'read_cookie',
          message: 'No session cookie found',
          cookieName: SESSION_COOKIE_NAME,
        }
      });
    }

    // 2. 调用 Neon Auth 验证
    const response = await fetch(`${AUTH_BASE_URL}/get-session`, {
      method: 'GET',
      headers: {
        'Cookie': `better-auth.session_token=${sessionToken}`,
      },
      cache: 'no-store',
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json({
        error: '验证失败',
        debug: {
          step: 'neon_auth_call',
          status: response.status,
          authUrl: AUTH_BASE_URL,
          response: responseText.substring(0, 500),
        }
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json({
        error: '解析响应失败',
        debug: {
          step: 'parse_response',
          response: responseText.substring(0, 500),
        }
      });
    }

    if (!data?.user) {
      return NextResponse.json({
        error: '无用户数据',
        debug: {
          step: 'check_user',
          data: data,
        }
      });
    }

    // 3. 查询用户角色
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, data.user.id),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      },
      profile: profile || null,
      isAdmin: profile?.role === 'admin',
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
