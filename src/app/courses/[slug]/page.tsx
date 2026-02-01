import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { courses, chapters } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { UserMenu } from '@/components/user-menu';
import { EnrollButton } from './enroll-button';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;

  // 获取课程信息
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.sortOrder)],
      },
    },
  });

  if (!course) {
    notFound();
  }

  // 计算免费章节数
  const freeChapters = course.chapters.filter(c => c.isFree);
  const totalDuration = course.chapters.reduce((sum, c) => sum + (c.duration || 0), 0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            LearnHub
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/courses" className="text-gray-600 hover:text-gray-900">
              课程
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Course Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Course Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Link href="/courses" className="text-blue-200 hover:text-white text-sm">
                  课程
                </Link>
                <span className="text-blue-200">/</span>
                <span className="text-sm">{course.title}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-blue-100 text-lg mb-6">{course.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  {course.rating} ({course.ratingCount} 评价)
                </span>
                <span>{course.studentCount} 人学习</span>
                <span>{course.chapterCount} 章节</span>
                <span>{Math.floor(totalDuration / 60)} 小时 {totalDuration % 60} 分钟</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="bg-blue-500 px-2 py-1 rounded">讲师</span>
                <span>{course.instructor}</span>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="w-full md:w-80">
              <div className="bg-white text-gray-900 rounded-xl p-6 shadow-xl">
                {course.coverImage && (
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}

                <div className="mb-4">
                  {course.type === 'free' ? (
                    <span className="text-3xl font-bold text-green-600">免费</span>
                  ) : course.type === 'member_only' ? (
                    <div>
                      <span className="text-3xl font-bold text-purple-600">会员专享</span>
                      <p className="text-sm text-gray-500 mt-1">
                        或 ¥{course.price} 单独购买
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-blue-600">¥{course.price}</span>
                      {course.originalPrice && (
                        <span className="text-gray-400 line-through">¥{course.originalPrice}</span>
                      )}
                    </div>
                  )}
                </div>

                <EnrollButton course={course} />

                <div className="mt-4 text-center text-sm text-gray-500">
                  {freeChapters.length > 0 && (
                    <p>{freeChapters.length} 个章节可免费试看</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Chapters List */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-6">课程目录</h2>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {course.chapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{chapter.title}</h3>
                      {chapter.description && (
                        <p className="text-sm text-gray-500 mt-1">{chapter.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {chapter.duration && (
                        <span className="text-gray-400">{chapter.duration} 分钟</span>
                      )}
                      {chapter.isFree ? (
                        <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">
                          试看
                        </span>
                      ) : (
                        <span className="text-gray-300">🔒</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-80">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                <h3 className="font-bold mb-4">课程包含</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {course.chapterCount} 个视频章节
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {Math.floor(totalDuration / 60)} 小时视频内容
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    配套源码下载
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    永久访问权限
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    学习进度记录
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
