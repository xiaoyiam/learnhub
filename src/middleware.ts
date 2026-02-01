import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 安全中间件
 * 处理安全头部、CSRF 保护等
 */

// 需要 CSRF 保护的路径前缀
const CSRF_PROTECTED_PATHS = ['/api/'];
const CSRF_SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// 公开 API 路径（不需要严格的 Origin 检查）
const PUBLIC_API_PATHS = ['/api/auth/'];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. 设置安全响应头
  setSecurityHeaders(response);

  // 2. CSRF 保护（仅 API 路由）
  if (shouldCheckCSRF(request)) {
    const csrfResult = checkCSRF(request);
    if (!csrfResult.valid) {
      return new NextResponse(
        JSON.stringify({ error: csrfResult.error }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return response;
}

/**
 * 设置安全响应头
 */
function setSecurityHeaders(response: NextResponse): void {
  // 防止点击劫持
  response.headers.set('X-Frame-Options', 'DENY');

  // XSS 保护（现代浏览器内置）
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 防止 MIME 类型嗅探
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 引用策略
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 权限策略（限制敏感 API）
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );

  // Content Security Policy
  // 注意：根据实际使用的第三方服务调整
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js 需要 unsafe-eval
    "style-src 'self' 'unsafe-inline'", // Tailwind 需要 unsafe-inline
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self' https: blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  // 开发环境放宽 CSP
  if (process.env.NODE_ENV === 'development') {
    cspDirectives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
    cspDirectives[4] = "connect-src 'self' ws: wss: https:";
  }

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // HTTPS 严格传输安全（生产环境）
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
}

/**
 * 判断是否需要 CSRF 检查
 */
function shouldCheckCSRF(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 安全方法不需要 CSRF 保护
  if (CSRF_SAFE_METHODS.includes(method)) {
    return false;
  }

  // 检查是否是受保护的路径
  const isProtectedPath = CSRF_PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return false;
  }

  // 公开 API 不严格检查
  const isPublicAPI = PUBLIC_API_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  return !isPublicAPI;
}

/**
 * CSRF 检查
 */
function checkCSRF(request: NextRequest): { valid: boolean; error?: string } {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // 获取允许的来源
  const allowedOrigins = getAllowedOrigins();

  // 检查 Origin 头
  if (origin) {
    if (!allowedOrigins.some((allowed) => origin === allowed || origin.endsWith(`.${new URL(allowed).hostname}`))) {
      return { valid: false, error: 'Invalid origin' };
    }
    return { valid: true };
  }

  // 没有 Origin 时检查 Referer
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      if (!allowedOrigins.some((allowed) => refererOrigin === allowed)) {
        return { valid: false, error: 'Invalid referer' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid referer format' };
    }
  }

  // 既没有 Origin 也没有 Referer，可能是直接 API 调用
  // 根据安全需求决定是否允许
  return { valid: false, error: 'Missing origin or referer' };
}

/**
 * 获取允许的来源列表
 */
function getAllowedOrigins(): string[] {
  const origins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ];

  // 开发环境允许本地访问
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:3000');
  }

  return origins;
}

/**
 * 中间件配置
 * 匹配所有路由
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - 公共资源
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
