/**
 * 邮件服务模块
 *
 * 使用示例：
 * ```ts
 * import { EmailService } from '@/lib/email';
 *
 * // 发送欢迎邮件
 * await EmailService.sendWelcome('user@example.com', '张三');
 *
 * // 发送支付成功通知
 * await EmailService.sendPaymentSuccess('user@example.com', {
 *   userName: '张三',
 *   orderNo: 'ORD123',
 *   productName: 'Python 入门课程',
 *   amount: '99.00',
 *   paidAt: '2024-01-15 10:30',
 * });
 * ```
 */

import { sendEmail, sendBulkEmails, type SendEmailResult } from './sender';
import * as templates from './templates';

export { getEmailConfig, getSiteConfig } from './config';
export { sendEmail, sendBulkEmails } from './sender';
export * from './templates';

/**
 * 邮件服务
 */
export const EmailService = {
  /**
   * 发送欢迎邮件
   */
  async sendWelcome(
    to: string,
    userName: string
  ): Promise<SendEmailResult> {
    const { subject, html } = templates.welcomeEmail({ userName });
    return sendEmail({ to, subject, html });
  },

  /**
   * 发送订单创建通知
   */
  async sendOrderCreated(
    to: string,
    data: {
      userName: string;
      orderNo: string;
      productName: string;
      amount: string;
      paymentMethod: string;
      createdAt: string;
    }
  ): Promise<SendEmailResult> {
    const { subject, html } = templates.orderCreatedEmail(data);
    return sendEmail({ to, subject, html });
  },

  /**
   * 发送支付成功通知
   */
  async sendPaymentSuccess(
    to: string,
    data: {
      userName: string;
      orderNo: string;
      productName: string;
      amount: string;
      paidAt: string;
    }
  ): Promise<SendEmailResult> {
    const { subject, html } = templates.paymentSuccessEmail(data);
    return sendEmail({ to, subject, html });
  },

  /**
   * 发送订单待确认通知（给管理员）
   */
  async sendOrderPendingConfirm(
    to: string | string[],
    data: {
      orderNo: string;
      userName: string;
      userEmail: string;
      productName: string;
      amount: string;
      paymentMethod: string;
      createdAt: string;
    }
  ): Promise<SendEmailResult> {
    const { subject, html } = templates.orderPendingConfirmEmail(data);
    return sendEmail({ to, subject, html });
  },

  /**
   * 发送会员到期提醒
   */
  async sendMembershipExpiring(
    to: string,
    data: {
      userName: string;
      membershipName: string;
      expiresAt: string;
      daysLeft: number;
    }
  ): Promise<SendEmailResult> {
    const { subject, html } = templates.membershipExpiringEmail(data);
    return sendEmail({ to, subject, html });
  },

  /**
   * 发送密码重置邮件
   */
  async sendPasswordReset(
    to: string,
    data: {
      userName: string;
      resetLink: string;
      expiresIn: string;
    }
  ): Promise<SendEmailResult> {
    const { subject, html } = templates.passwordResetEmail(data);
    return sendEmail({ to, subject, html });
  },

  /**
   * 发送课程更新通知
   */
  async sendCourseUpdate(
    to: string,
    data: {
      userName: string;
      courseName: string;
      updateType: 'new_chapter' | 'content_update';
      chapterName?: string;
    }
  ): Promise<SendEmailResult> {
    const { subject, html } = templates.courseUpdateEmail(data);
    return sendEmail({ to, subject, html });
  },

  /**
   * 发送自定义邮件
   */
  async sendCustom(
    to: string | string[],
    subject: string,
    html: string,
    text?: string
  ): Promise<SendEmailResult> {
    return sendEmail({ to, subject, html, text });
  },

  /**
   * 批量发送邮件
   */
  sendBulk: sendBulkEmails,
};

/**
 * 格式化日期为邮件友好格式
 */
export function formatEmailDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化金额
 */
export function formatEmailAmount(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(2);
}
