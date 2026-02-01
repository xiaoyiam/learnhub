'use server';

import { db } from '@/db';
import { courses, chapters, orders, orderItems, membershipPlans, licenses, userProfiles } from '@/db/schema';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';

// ============ 统计数据 ============

export async function getAdminStats() {
  await requireAdmin();

  const [courseCount] = await db.select({ count: count() }).from(courses);
  const [orderCount] = await db.select({ count: count() }).from(orders).where(eq(orders.status, 'paid'));

  const [revenueResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)` })
    .from(orders)
    .where(eq(orders.status, 'paid'));

  const [userCount] = await db.select({ count: count() }).from(userProfiles);

  return {
    courseCount: courseCount.count,
    orderCount: orderCount.count,
    revenue: parseFloat(revenueResult.total),
    userCount: userCount.count,
  };
}

// ============ 课程管理 ============

export async function getCourses(status?: string) {
  await requireAdmin();

  if (status && status !== 'all') {
    return db.query.courses.findMany({
      where: eq(courses.status, status as 'draft' | 'published' | 'archived'),
      orderBy: desc(courses.createdAt),
    });
  }

  return db.query.courses.findMany({
    orderBy: desc(courses.createdAt),
  });
}

export async function getCourse(id: string) {
  await requireAdmin();

  return db.query.courses.findFirst({
    where: eq(courses.id, id),
  });
}

export async function createCourse(data: {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  type: 'free' | 'paid' | 'member_only';
  price: string;
  originalPrice?: string;
  instructor: string;
}) {
  await requireAdmin();

  // 检查 slug 是否已存在
  const existing = await db.query.courses.findFirst({
    where: eq(courses.slug, data.slug),
  });

  if (existing) {
    return { error: 'URL标识已存在，请使用其他标识' };
  }

  const [course] = await db.insert(courses).values({
    title: data.title,
    slug: data.slug,
    description: data.description,
    coverImage: data.coverImage,
    type: data.type,
    price: data.price,
    originalPrice: data.originalPrice || null,
    instructor: data.instructor,
    status: 'draft',
    duration: 0,
    chapterCount: 0,
    studentCount: 0,
  }).returning();

  revalidatePath('/admin/courses');
  return { course };
}

export async function updateCourse(id: string, data: {
  title?: string;
  slug?: string;
  description?: string;
  coverImage?: string;
  type?: 'free' | 'paid' | 'member_only';
  price?: string;
  originalPrice?: string;
  instructor?: string;
}) {
  await requireAdmin();

  // 如果更新 slug，检查是否已存在
  if (data.slug) {
    const existing = await db.query.courses.findFirst({
      where: and(eq(courses.slug, data.slug), sql`${courses.id} != ${id}`),
    });

    if (existing) {
      return { error: 'URL标识已存在，请使用其他标识' };
    }
  }

  const [course] = await db.update(courses)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id))
    .returning();

  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${id}`);
  return { course };
}

export async function updateCourseStatus(id: string, status: 'draft' | 'published' | 'archived') {
  await requireAdmin();

  const [course] = await db.update(courses)
    .set({ status, updatedAt: new Date() })
    .where(eq(courses.id, id))
    .returning();

  revalidatePath('/admin/courses');
  revalidatePath('/courses');
  return { course };
}

export async function deleteCourse(id: string) {
  await requireAdmin();

  // 检查是否有相关订单
  const relatedOrder = await db.query.orderItems.findFirst({
    where: and(eq(orderItems.productType, 'course'), eq(orderItems.productId, id)),
  });

  if (relatedOrder) {
    return { error: '该课程已有订单记录，无法删除' };
  }

  await db.delete(courses).where(eq(courses.id, id));

  revalidatePath('/admin/courses');
  return { success: true };
}

// ============ 章节管理 ============

export async function getChapters(courseId: string) {
  await requireAdmin();

  return db.query.chapters.findMany({
    where: eq(chapters.courseId, courseId),
    orderBy: chapters.sortOrder,
  });
}

export async function getChapter(id: string) {
  await requireAdmin();

  return db.query.chapters.findFirst({
    where: eq(chapters.id, id),
  });
}

export async function createChapter(courseId: string, data: {
  title: string;
  description?: string;
  videoUrl: string;
  duration: number;
  isFree: boolean;
}) {
  await requireAdmin();

  // 获取当前最大排序值
  const existingChapters = await db.query.chapters.findMany({
    where: eq(chapters.courseId, courseId),
    orderBy: desc(chapters.sortOrder),
  });

  const maxOrder = existingChapters.length > 0 ? existingChapters[0].sortOrder : 0;

  const [chapter] = await db.insert(chapters).values({
    courseId,
    title: data.title,
    description: data.description || null,
    videoUrl: data.videoUrl,
    duration: data.duration,
    isFree: data.isFree,
    sortOrder: maxOrder + 1,
  }).returning();

  // 更新课程章节数
  await db.update(courses)
    .set({
      chapterCount: existingChapters.length + 1,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, courseId));

  revalidatePath(`/admin/courses/${courseId}/chapters`);
  return { chapter };
}

export async function updateChapter(id: string, data: {
  title?: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  isFree?: boolean;
}) {
  await requireAdmin();

  const [chapter] = await db.update(chapters)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(chapters.id, id))
    .returning();

  revalidatePath(`/admin/courses/${chapter.courseId}/chapters`);
  return { chapter };
}

export async function deleteChapter(id: string) {
  await requireAdmin();

  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, id),
  });

  if (!chapter) {
    return { error: '章节不存在' };
  }

  await db.delete(chapters).where(eq(chapters.id, id));

  // 更新课程章节数
  const remainingChapters = await db.query.chapters.findMany({
    where: eq(chapters.courseId, chapter.courseId),
  });

  await db.update(courses)
    .set({
      chapterCount: remainingChapters.length,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, chapter.courseId));

  revalidatePath(`/admin/courses/${chapter.courseId}/chapters`);
  return { success: true };
}

export async function reorderChapters(courseId: string, chapterIds: string[]) {
  await requireAdmin();

  // 批量更新排序
  for (let i = 0; i < chapterIds.length; i++) {
    await db.update(chapters)
      .set({ sortOrder: i + 1, updatedAt: new Date() })
      .where(eq(chapters.id, chapterIds[i]));
  }

  revalidatePath(`/admin/courses/${courseId}/chapters`);
  return { success: true };
}

// ============ 订单管理 ============

export async function getOrders(status?: string) {
  await requireAdmin();

  if (status && status !== 'all') {
    return db.query.orders.findMany({
      where: eq(orders.status, status as 'pending' | 'paid' | 'cancelled' | 'refunded'),
      with: {
        items: true,
      },
      orderBy: desc(orders.createdAt),
    });
  }

  return db.query.orders.findMany({
    with: {
      items: true,
    },
    orderBy: desc(orders.createdAt),
  });
}

export async function getOrder(id: string) {
  await requireAdmin();

  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
    },
  });
}

export async function updateOrderStatus(id: string, status: 'pending' | 'paid' | 'cancelled' | 'refunded') {
  await requireAdmin();

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };

  if (status === 'paid') {
    updateData.paidAt = new Date();
  }

  const [order] = await db.update(orders)
    .set(updateData)
    .where(eq(orders.id, id))
    .returning();

  // 如果是退款，需要取消相关授权
  if (status === 'refunded') {
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, id),
    });

    for (const item of items) {
      await db.update(licenses)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(licenses.userId, order.userId),
          eq(licenses.productType, item.productType),
          eq(licenses.productId, item.productId)
        ));
    }
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  return { order };
}

// ============ 会员套餐管理 ============

export async function getMembershipPlans() {
  await requireAdmin();

  return db.query.membershipPlans.findMany({
    orderBy: membershipPlans.sortOrder,
  });
}

export async function getMembershipPlan(id: string) {
  await requireAdmin();

  return db.query.membershipPlans.findFirst({
    where: eq(membershipPlans.id, id),
  });
}

export async function updateMembershipPlan(id: string, data: {
  name?: string;
  price?: string;
  originalPrice?: string;
  durationDays?: number;
  features?: string[];
  isActive?: boolean;
}) {
  await requireAdmin();

  const [plan] = await db.update(membershipPlans)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(membershipPlans.id, id))
    .returning();

  revalidatePath('/admin/memberships');
  revalidatePath(`/admin/memberships/${id}`);
  revalidatePath('/membership');
  return { plan };
}

export async function createMembershipPlan(data: {
  name: string;
  code: string;
  type: 'monthly' | 'quarterly' | 'yearly' | 'enterprise';
  price: string;
  originalPrice?: string;
  durationDays: number;
  features?: string[];
}) {
  await requireAdmin();

  // 检查 code 是否已存在
  const existing = await db.query.membershipPlans.findFirst({
    where: eq(membershipPlans.code, data.code),
  });

  if (existing) {
    return { error: '套餐代码已存在' };
  }

  // 获取最大排序值
  const existingPlans = await db.query.membershipPlans.findMany({
    orderBy: desc(membershipPlans.sortOrder),
  });

  const maxOrder = existingPlans.length > 0 ? (existingPlans[0].sortOrder ?? 0) : 0;

  const [plan] = await db.insert(membershipPlans).values({
    name: data.name,
    code: data.code,
    type: data.type,
    price: data.price,
    originalPrice: data.originalPrice || null,
    durationDays: data.durationDays,
    features: data.features || [],
    isActive: true,
    sortOrder: maxOrder + 1,
  }).returning();

  revalidatePath('/admin/memberships');
  revalidatePath('/membership');
  return { plan };
}
