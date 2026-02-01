'use server';

import { db } from '@/db';
import { siteSettings, orders, orderItems, licenses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { getSession } from '@/lib/auth';

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
