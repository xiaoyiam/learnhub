import Link from 'next/link';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { UserMenu } from '@/components/user-menu';

export default async function CoursesPage() {
  // 获取已发布的课程
  const publishedCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.status, 'published'));

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            LearnHub
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/courses" className="text-blue-600 font-medium">
              课程
            </Link>
            <Link href="/membership" className="text-gray-600 hover:text-gray-900">
              会员
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">全部课程</h1>
            <p className="text-gray-500 mt-1">共 {publishedCourses.length} 门课程</p>
          </div>
        </div>

        {publishedCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 mb-4">暂无课程</p>
            <p className="text-sm text-gray-400">课程即将上线，敬请期待</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="block bg-white rounded-xl overflow-hidden hover:shadow-lg transition group"
              >
                {course.coverImage ? (
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-4xl text-white">📚</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {course.type === 'free' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded">
                        免费
                      </span>
                    )}
                    {course.type === 'member_only' && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                        会员专享
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition">
                    {course.title}
                  </h3>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        {course.rating}
                      </span>
                      <span>{course.studentCount} 人</span>
                    </div>

                    {course.type === 'paid' && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-blue-600 font-bold text-lg">
                          ¥{course.price}
                        </span>
                        {course.originalPrice && (
                          <span className="text-gray-300 text-sm line-through">
                            ¥{course.originalPrice}
                          </span>
                        )}
                      </div>
                    )}
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
