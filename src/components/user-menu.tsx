'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export function UserMenu() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <div className="flex gap-3">
        <Link
          href="/auth/login"
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
        >
          登录
        </Link>
        <Link
          href="/auth/register"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          注册
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    setShowMenu(false);
    router.push('/');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
        </div>
        <span className="hidden md:block text-sm">{user.name || user.email}</span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-20">
            <div className="p-3 border-b">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="p-1">
              <Link
                href="/dashboard"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setShowMenu(false)}
              >
                我的学习
              </Link>
              <Link
                href="/orders"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setShowMenu(false)}
              >
                我的订单
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
