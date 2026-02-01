import { NextResponse } from 'next/server';
import { db } from '@/db';
import { licenses, courses, userProgress, chapters } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-server';

export async function GET() {
  try {
    // 获取用户会话
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ courses: [] });
    }

    const userId = session.user.id;

    // 获取用户拥有的课程授权
    const courseLicenses = await db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.userId, userId),
          eq(licenses.productType, 'course'),
          eq(licenses.isActive, true)
        )
      );

    // 获取会员授权（会员可以访问所有 member_only 课程）
    const membershipLicense = await db.query.licenses.findFirst({
      where: and(
        eq(licenses.userId, userId),
        eq(licenses.productType, 'membership'),
        eq(licenses.isActive, true)
      ),
    });

    const hasMembership = membershipLicense &&
      (!membershipLicense.expireAt || membershipLicense.expireAt > new Date());

    // 获取课程 ID 列表
    const courseIds = courseLicenses.map((l) => l.productId);

    // 如果没有课程授权，返回空
    if (courseIds.length === 0 && !hasMembership) {
      return NextResponse.json({ courses: [] });
    }

    // 获取课程详情
    let userCourses;
    if (hasMembership) {
      // 会员：获取所有已购课程 + 会员专享课程
      userCourses = await db
        .select()
        .from(courses)
        .where(
          courseIds.length > 0
            ? sql`${courses.id} IN ${courseIds} OR ${courses.type} = 'member_only'`
            : eq(courses.type, 'member_only')
        );
    } else {
      userCourses = await db
        .select()
        .from(courses)
        .where(inArray(courses.id, courseIds));
    }

    // 获取学习进度
    const progressData = await db
      .select({
        courseId: userProgress.courseId,
        completedCount: sql<number>`COUNT(CASE WHEN ${userProgress.isCompleted} THEN 1 END)`,
        lastChapterId: sql<string>`MAX(${userProgress.chapterId})`,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .groupBy(userProgress.courseId);

    const progressMap = new Map(
      progressData.map((p) => [p.courseId, p])
    );

    // 组装返回数据
    const result = userCourses.map((course) => {
      const progress = progressMap.get(course.id);
      const completedCount = progress?.completedCount || 0;
      const totalChapters = course.chapterCount || 1;
      const progressPercent = Math.round((completedCount / totalChapters) * 100);

      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        coverImage: course.coverImage,
        chapterCount: course.chapterCount,
        progress: progressPercent,
        lastChapterId: progress?.lastChapterId || null,
      };
    });

    return NextResponse.json({ courses: result });
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return NextResponse.json({ courses: [] });
  }
}
