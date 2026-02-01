'use server';

import { db } from '@/db';
import { orders, orderItems, licenses, courses, membershipPlans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * 生成订单号
 */
function generateOrderNo(): string {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LH${timestamp}${random}`;
}

/**
 * 创建课程订单
 */
export async function createCourseOrder(userId: string, courseId: string) {
  // 获取课程信息
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course) {
    return { error: '课程不存在' };
  }

  if (course.type === 'free') {
    return { error: '免费课程无需购买' };
  }

  // 检查是否已购买
  const existingLicense = await db.query.licenses.findFirst({
    where: and(
      eq(licenses.userId, userId),
      eq(licenses.productType, 'course'),
      eq(licenses.productId, courseId),
      eq(licenses.isActive, true)
    ),
  });

  if (existingLicense) {
    return { error: '您已购买该课程' };
  }

  // 创建订单
  const orderNo = generateOrderNo();
  const [order] = await db.insert(orders).values({
    orderNo,
    userId,
    status: 'pending',
    totalAmount: course.price,
    expiredAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟过期
  }).returning();

  // 创建订单明细
  await db.insert(orderItems).values({
    orderId: order.id,
    productType: 'course',
    productId: courseId,
    productName: course.title,
    quantity: 1,
    unitPrice: course.price,
    totalPrice: course.price,
  });

  return { orderId: order.id, orderNo: order.orderNo };
}

/**
 * 创建会员订单
 */
export async function createMembershipOrder(userId: string, planId: string) {
  // 获取套餐信息
  const plan = await db.query.membershipPlans.findFirst({
    where: eq(membershipPlans.id, planId),
  });

  if (!plan) {
    return { error: '套餐不存在' };
  }

  // 创建订单
  const orderNo = generateOrderNo();
  const [order] = await db.insert(orders).values({
    orderNo,
    userId,
    status: 'pending',
    totalAmount: plan.price,
    expiredAt: new Date(Date.now() + 30 * 60 * 1000),
  }).returning();

  // 创建订单明细
  await db.insert(orderItems).values({
    orderId: order.id,
    productType: 'membership',
    productId: planId,
    productName: plan.name,
    quantity: 1,
    unitPrice: plan.price,
    totalPrice: plan.price,
  });

  return { orderId: order.id, orderNo: order.orderNo };
}

/**
 * 模拟支付成功（实际项目中应由支付回调触发）
 */
export async function simulatePayment(orderId: string, paymentMethod: 'wechat' | 'alipay') {
  // 获取订单
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: true,
    },
  });

  if (!order) {
    return { error: '订单不存在' };
  }

  if (order.status !== 'pending') {
    return { error: '订单状态异常' };
  }

  // 更新订单状态
  await db.update(orders)
    .set({
      status: 'paid',
      paymentMethod,
      paymentNo: `PAY${Date.now()}`,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // 为每个订单项创建授权
  for (const item of order.items) {
    // 计算过期时间
    let expireAt: Date | null = null;

    if (item.productType === 'membership') {
      const plan = await db.query.membershipPlans.findFirst({
        where: eq(membershipPlans.id, item.productId),
      });
      if (plan) {
        expireAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
      }
    }

    await db.insert(licenses).values({
      userId: order.userId,
      type: 'personal',
      productType: item.productType,
      productId: item.productId,
      orderId: order.id,
      startAt: new Date(),
      expireAt,
      isActive: true,
    });
  }

  revalidatePath('/orders');
  revalidatePath('/dashboard');

  return { success: true };
}

/**
 * 获取用户订单列表
 */
export async function getUserOrders(userId: string) {
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      items: true,
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });

  return userOrders;
}

/**
 * 检查用户是否有课程权限
 */
export async function checkCourseAccess(userId: string, courseId: string) {
  // 检查课程授权
  const courseLicense = await db.query.licenses.findFirst({
    where: and(
      eq(licenses.userId, userId),
      eq(licenses.productType, 'course'),
      eq(licenses.productId, courseId),
      eq(licenses.isActive, true)
    ),
  });

  if (courseLicense) {
    return { hasAccess: true, type: 'course' as const };
  }

  // 检查会员权限
  const membershipLicense = await db.query.licenses.findFirst({
    where: and(
      eq(licenses.userId, userId),
      eq(licenses.productType, 'membership'),
      eq(licenses.isActive, true)
    ),
  });

  if (membershipLicense) {
    // 检查是否过期
    if (!membershipLicense.expireAt || membershipLicense.expireAt > new Date()) {
      return { hasAccess: true, type: 'membership' as const };
    }
  }

  return { hasAccess: false };
}
