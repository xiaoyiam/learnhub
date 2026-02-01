import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/db';
import { courses, chapters } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkCourseAccess } from '@/lib/actions/order';
import { getSession } from '@/lib/auth';
import { VideoPlayer } from './video-player';
import { ChapterList } from './chapter-list';

interface Props {
  params: Promise<{ slug: string; chapterId: string }>;
}

export default async function ChapterPage({ params }: Props) {
  const { slug, chapterId } = await params;

  // 获取课程和章节
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

  const currentChapter = course.chapters.find((c) => c.id === chapterId);
  if (!currentChapter) {
    notFound();
  }

  // 检查访问权限
  const session = await getSession();
  let hasAccess = false;
  let accessType: 'free' | 'course' | 'membership' | null = null;

  if (currentChapter.isFree) {
    // 免费试看章节
    hasAccess = true;
    accessType = 'free';
  } else if (course.type === 'free') {
    // 免费课程
    hasAccess = true;
    accessType = 'free';
  } else if (session?.user) {
    // 检查用户权限
    const access = await checkCourseAccess(session.user.id, course.id);
    hasAccess = access.hasAccess;
    accessType = access.type || null;
  }

  // 找到当前章节的索引，计算上一章/下一章
  const currentIndex = course.chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? course.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < course.chapters.length - 1
    ? course.chapters[currentIndex + 1]
    : null;

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/courses/${slug}`} className="text-gray-400 hover:text-white">
              ← 返回课程
            </Link>
            <span className="text-gray-600">|</span>
            <span className="font-medium truncate max-w-md">{course.title}</span>
          </div>
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
            我的学习
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1">
          {/* Video Player */}
          <div className="aspect-video bg-black">
            {hasAccess ? (
              <VideoPlayer
                chapter={currentChapter}
                courseId={course.id}
                userId={session?.user?.id}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-medium mb-2">需要购买后观看</h3>
                <p className="text-gray-400 mb-6">
                  登录并购买课程后即可观看完整内容
                </p>
                <div className="flex gap-3">
                  {!session?.user ? (
                    <Link
                      href={`/auth/login?redirect=/learn/${slug}/${chapterId}`}
                      className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                    >
                      登录
                    </Link>
                  ) : (
                    <Link
                      href={`/checkout?course=${course.id}`}
                      className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                    >
                      购买课程
                    </Link>
                  )}
                  <Link
                    href={`/courses/${slug}`}
                    className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Chapter Info */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-400">
                第 {currentIndex + 1} 章 / 共 {course.chapters.length} 章
              </span>
              {currentChapter.isFree && (
                <span className="px-2 py-0.5 bg-green-600 text-xs rounded">试看</span>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-3">{currentChapter.title}</h1>
            {currentChapter.description && (
              <p className="text-gray-400">{currentChapter.description}</p>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
              {prevChapter ? (
                <Link
                  href={`/learn/${slug}/${prevChapter.id}`}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                >
                  <span>←</span>
                  <div>
                    <div className="text-xs text-gray-500">上一章</div>
                    <div>{prevChapter.title}</div>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextChapter ? (
                <Link
                  href={`/learn/${slug}/${nextChapter.id}`}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition text-right"
                >
                  <div>
                    <div className="text-xs text-gray-500">下一章</div>
                    <div>{nextChapter.title}</div>
                  </div>
                  <span>→</span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Chapter List */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 hidden lg:block">
          <ChapterList
            chapters={course.chapters}
            currentChapterId={chapterId}
            slug={slug}
            hasFullAccess={hasAccess && accessType !== 'free'}
          />
        </div>
      </div>
    </main>
  );
}
