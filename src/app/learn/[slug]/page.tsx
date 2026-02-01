import { redirect } from 'next/navigation';
import { db } from '@/db';
import { courses, chapters } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LearnPage({ params }: Props) {
  const { slug } = await params;

  // 获取课程及第一个章节
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.sortOrder)],
        limit: 1,
      },
    },
  });

  if (!course || course.chapters.length === 0) {
    redirect(`/courses/${slug}`);
  }

  // 跳转到第一个章节
  redirect(`/learn/${slug}/${course.chapters[0].id}`);
}
