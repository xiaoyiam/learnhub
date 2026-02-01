import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userProgress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, chapterId, progress, duration, isCompleted } = body;

    if (!courseId || !chapterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = session.user.id;

    // 查找是否已有进度记录
    const existing = await db.query.userProgress.findFirst({
      where: and(
        eq(userProgress.userId, userId),
        eq(userProgress.chapterId, chapterId)
      ),
    });

    if (existing) {
      // 更新进度
      await db.update(userProgress)
        .set({
          progress,
          duration,
          isCompleted: isCompleted || existing.isCompleted,
          completedAt: isCompleted ? new Date() : existing.completedAt,
          lastWatchedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userProgress.id, existing.id));
    } else {
      // 创建新记录
      await db.insert(userProgress).values({
        userId,
        courseId,
        chapterId,
        progress,
        duration,
        isCompleted: isCompleted || false,
        completedAt: isCompleted ? new Date() : null,
        lastWatchedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
