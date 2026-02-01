'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 调试：检查环境变量
  const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;
  console.log('Auth URL configured:', authUrl ? 'Yes' : 'No', authUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('=== Form submitted ===');
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login for:', email);
      await signIn(email, password);
      console.log('Login successful, redirecting...');
      // 跳转到 redirect 参数指定的页面，或默认首页
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : '登录失败，请重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!authUrl && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
          警告: NEXT_PUBLIC_NEON_AUTH_URL 环境变量未配置
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">登录 LearnHub</h1>
          <p className="text-gray-500">继续你的学习之旅</p>
        </div>

        <Suspense fallback={<div className="text-center">加载中...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center">
          <p className="text-gray-500">
            还没有账号？{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline">
              立即注册
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
