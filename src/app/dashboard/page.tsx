'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserMenu } from '@/components/user-menu';

interface MyCourse {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  chapterCount: number;
  progress: number; // 0-100
  lastChapterId: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/dashboard');
      return;
    }

    if (user) {
      // 获取用户已购课程
      fetch(`/api/my-courses`)
        .then((res) => res.json())
        .then((data) => {
          setCourses(data.courses || []);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              LearnHub
            </Link>
            <UserMenu />
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-48 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            LearnHub
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/courses" className="text-gray-600 hover:text-gray-900">
              课程
            </Link>
            <Link href="/dashboard" className="text-blue-600 font-medium">
              我的学习
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">我的学习</h1>
          <Link
            href="/courses"
            className="text-blue-600 hover:underline text-sm"
          >
            浏览更多课程 →
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500 mb-4">还没有购买课程</p>
            <Link
              href="/courses"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              去选购课程
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={course.lastChapterId
                  ? `/learn/${course.slug}/${course.lastChapterId}`
                  : `/learn/${course.slug}`
                }
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group"
              >
                {course.coverImage ? (
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-4xl text-white">📚</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{course.chapterCount} 章节</span>
                    <span>{course.progress}% 完成</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
