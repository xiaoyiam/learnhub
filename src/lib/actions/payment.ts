'use server';

import { db } from '@/db';
import { siteSettings, orders, orderItems, licenses, userProfiles, courses, membershipPlans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { getSession } from '@/lib/auth';
import { EmailService, formatEmailDate, formatEmailAmount } from '@/lib/email';

// ============ 支付设置类型 ============

export interface PaymentSettings {
  wechatQrCode?: string;      // 微信收款码 URL
  alipayQrCode?: string;      // 支付宝收款码 URL
  paymentInstructions?: string; // 支付说明
  enableManualConfirm: boolean; // 启用手动确认
  // 预留第三方支付配置
  thirdParty?: {
    provider?: 'payjs' | 'xunhupay' | 'epay';
    enabled: boolean;
    merchantId?: string;
    apiKey?: string;
    notifyUrl?: string;
  };
}

const PAYMENT_SETTINGS_KEY = 'payment_settings';

// ============ 获取支付设置 ============

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const setting = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.key, PAYMENT_SETTINGS_KEY),
  });

  if (!setting || !setting.value) {
    return {
      enableManualConfirm: true,
    };
  }

  return setting.value as PaymentSettings;
}

// ============ 更新支付设置（管理员）============

export async function updatePaymentSettings(data: PaymentSettings) {
  await requireAdmin();

  const existing = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.key, PAYMENT_SETTINGS_KEY),
  });

  if (existing) {
    await db.update(siteSettings)
      .set({
        value: data,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.key, PAYMENT_SETTINGS_KEY));
  } else {
    await db.insert(siteSettings).values({
      key: PAYMENT_SETTINGS_KEY,
      value: data,
      description: '支付设置',
    });
  }

  revalidatePath('/admin/settings/payment');
  return { success: true };
}

// ============ 用户提交已支付 ============

export async function submitPaymentConfirmation(orderId: string, paymentMethod: 'wechat' | 'alipay') {
  const session = await getSession();
  if (!session?.user) {
    return { error: '请先登录' };
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return { error: '订单不存在' };
  }

  if (order.userId !== session.user.id) {
    return { error: '无权操作此订单' };
  }

  if (order.status !== 'pending') {
    return { error: '订单状态不正确' };
  }

  // 更新订单，标记用户已提交支付
  // 使用 paymentNo 字段存储提交时间作为标记
  await db.update(orders)
    .set({
      paymentMethod,
      paymentNo: `SUBMITTED_${Date.now()}`,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // 发送邮件通知管理员
  try {
    // 获取订单商品信息
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    });

    // 获取商品名称
    let productName = '未知商品';
    if (items.length > 0) {
      const item = items[0];
      if (item.productType === 'course') {
        const course = await db.query.courses.findFirst({
          where: eq(courses.id, item.productId),
        });
        productName = course?.title || '课程';
      } else if (item.productType === 'membership') {
        const plan = await db.query.membershipPlans.findFirst({
          where: eq(membershipPlans.id, item.productId),
        });
        productName = plan?.name || '会员套餐';
      }
    }

    // 获取用户信息
    const userProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, session.user.id),
    });

    // 获取管理员邮箱
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await EmailService.sendOrderPendingConfirm(adminEmail, {
        orderNo: order.orderNo || orderId.slice(0, 8).toUpperCase(),
        userName: userProfile?.displayName || session.user.name || '用户',
        userEmail: session.user.email || '',
        productName,
        amount: formatEmailAmount(order.totalAmount),
        paymentMethod: paymentMethod === 'wechat' ? '微信支付' : '支付宝',
        createdAt: formatEmailDate(order.createdAt),
      });
    }
  } catch (error) {
    // 邮件发送失败不影响主流程
    console.error('Failed to send admin notification email:', error);
  }

  revalidatePath('/orders');
  revalidatePath('/admin/orders');
  return { success: true };
}

// ============ 管理员确认收款 ============

export async function confirmPayment(orderId: string) {
  await requireAdmin();

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
    return { error: '订单状态不正确' };
  }

  // 更新订单状态为已支付
  await db.update(orders)
    .set({
      status: 'paid',
      paidAt: new Date(),
      paymentNo: order.paymentNo?.replace('SUBMITTED_', 'CONFIRMED_') || `CONFIRMED_${Date.now()}`,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // 创建授权
  for (const item of order.items) {
    // 检查是否已有授权
    const existingLicense = await db.query.licenses.findFirst({
      where: and(
        eq(licenses.userId, order.userId),
        eq(licenses.productType, item.productType),
        eq(licenses.productId, item.productId)
      ),
    });

    if (!existingLicense) {
      await db.insert(licenses).values({
        userId: order.userId,
        productType: item.productType,
        productId: item.productId,
        orderId: order.id,
        type: 'personal',
        isActive: true,
      });
    }
  }

  // 发送支付成功邮件给用户
  try {
    // 获取用户信息
    const userProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, order.userId),
    });

    // 获取商品名称
    let productName = '未知商品';
    if (order.items.length > 0) {
      const item = order.items[0];
      if (item.productType === 'course') {
        const course = await db.query.courses.findFirst({
          where: eq(courses.id, item.productId),
        });
        productName = course?.title || '课程';
      } else if (item.productType === 'membership') {
        const plan = await db.query.membershipPlans.findFirst({
          where: eq(membershipPlans.id, item.productId),
        });
        productName = plan?.name || '会员套餐';
      }
    }

    // 获取用户邮箱（从 neon auth 或 userProfile）
    const userEmail = userProfile?.email;
    if (userEmail) {
      await EmailService.sendPaymentSuccess(userEmail, {
        userName: userProfile?.displayName || '用户',
        orderNo: order.orderNo || orderId.slice(0, 8).toUpperCase(),
        productName,
        amount: formatEmailAmount(order.totalAmount),
        paidAt: formatEmailDate(new Date()),
      });
    }
  } catch (error) {
    // 邮件发送失败不影响主流程
    console.error('Failed to send payment success email:', error);
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

// ============ 获取待确认订单 ============

export async function getPendingConfirmOrders() {
  await requireAdmin();

  // 获取所有 pending 状态且有 paymentNo 的订单（用户已提交支付）
  const allPendingOrders = await db.query.orders.findMany({
    where: eq(orders.status, 'pending'),
    with: {
      items: true,
    },
    orderBy: (orders, { desc }) => [desc(orders.updatedAt)],
  });

  // 过滤出用户已提交支付的订单
  return allPendingOrders.filter(order =>
    order.paymentNo && order.paymentNo.startsWith('SUBMITTED_')
  );
}

// ============ 获取订单详情（用于支付页面）============

export async function getOrderForPayment(orderId: string) {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, orderId),
      eq(orders.userId, session.user.id)
    ),
    with: {
      items: true,
    },
  });

  return order;
}
