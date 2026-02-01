/**
 * 邮件模板
 * 使用简洁的 HTML 模板，兼容各种邮件客户端
 */

import { getSiteConfig } from './config';

interface TemplateData {
  [key: string]: string | number | undefined;
}

/**
 * 基础邮件布局
 */
function baseLayout(content: string, preheader?: string): string {
  const site = getSiteConfig();

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${site.name}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
    .header h1 { margin: 0; color: #1f2937; font-size: 24px; }
    .content { padding: 30px 0; color: #374151; line-height: 1.6; }
    .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .button:hover { background-color: #1d4ed8; }
    .footer { padding: 20px 0; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
    .info-box { background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; }
    .info-value { color: #1f2937; font-weight: 500; }
    .highlight { color: #2563eb; font-weight: 600; }
    .warning { color: #dc2626; }
    .success { color: #16a34a; }
  </style>
</head>
<body style="background-color: #f9fafb;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#f9fafb;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <h1>${site.name}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>此邮件由 ${site.name} 系统自动发送，请勿直接回复。</p>
      <p>如有问题，请联系 <a href="mailto:${site.supportEmail}">${site.supportEmail}</a></p>
      <p>&copy; ${new Date().getFullYear()} ${site.name}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 替换模板变量
 */
function replaceVariables(template: string, data: TemplateData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(data[key] ?? '');
  });
}

// ============================================================================
// 邮件模板定义
// ============================================================================

/**
 * 欢迎邮件
 */
export function welcomeEmail(data: { userName: string }): { subject: string; html: string } {
  const site = getSiteConfig();

  const content = `
    <h2>欢迎加入 ${site.name}！</h2>
    <p>亲爱的 <strong>${data.userName}</strong>，</p>
    <p>感谢您注册成为我们的会员！我们非常高兴您能加入我们的学习社区。</p>
    <p>在这里，您可以：</p>
    <ul>
      <li>浏览和学习优质课程</li>
      <li>跟踪您的学习进度</li>
      <li>获得专业的知识和技能</li>
    </ul>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${site.url}/courses" class="button">开始学习</a>
    </p>
    <p>如果您有任何问题，请随时联系我们的客服团队。</p>
    <p>祝学习愉快！</p>
  `;

  return {
    subject: `欢迎加入 ${site.name}`,
    html: baseLayout(content, '感谢您的注册，开始您的学习之旅吧！'),
  };
}

/**
 * 订单创建通知
 */
export function orderCreatedEmail(data: {
  userName: string;
  orderNo: string;
  productName: string;
  amount: string;
  paymentMethod: string;
  createdAt: string;
}): { subject: string; html: string } {
  const site = getSiteConfig();

  const content = `
    <h2>订单已创建</h2>
    <p>亲爱的 <strong>${data.userName}</strong>，</p>
    <p>您的订单已成功创建，请尽快完成支付。</p>

    <div class="info-box">
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">订单编号</td>
          <td style="text-align: right; font-weight: 500; border-bottom: 1px solid #e5e7eb;">${data.orderNo}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">商品名称</td>
          <td style="text-align: right; font-weight: 500; border-bottom: 1px solid #e5e7eb;">${data.productName}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">支付金额</td>
          <td style="text-align: right; font-weight: 600; color: #dc2626; border-bottom: 1px solid #e5e7eb;">¥${data.amount}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">支付方式</td>
          <td style="text-align: right; font-weight: 500; border-bottom: 1px solid #e5e7eb;">${data.paymentMethod}</td>
        </tr>
        <tr>
          <td style="color: #6b7280;">创建时间</td>
          <td style="text-align: right; font-weight: 500;">${data.createdAt}</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${site.url}/orders" class="button">查看订单</a>
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      注意：订单将在 24 小时内未支付自动取消，请尽快完成支付。
    </p>
  `;

  return {
    subject: `订单已创建 - ${data.orderNo}`,
    html: baseLayout(content, `您的订单 ${data.orderNo} 已创建，请尽快支付`),
  };
}

/**
 * 支付成功通知
 */
export function paymentSuccessEmail(data: {
  userName: string;
  orderNo: string;
  productName: string;
  amount: string;
  paidAt: string;
}): { subject: string; html: string } {
  const site = getSiteConfig();

  const content = `
    <h2 style="color: #16a34a;">🎉 支付成功</h2>
    <p>亲爱的 <strong>${data.userName}</strong>，</p>
    <p>恭喜您！您的订单已支付成功，现在可以开始学习了。</p>

    <div class="info-box">
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">订单编号</td>
          <td style="text-align: right; font-weight: 500; border-bottom: 1px solid #e5e7eb;">${data.orderNo}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">商品名称</td>
          <td style="text-align: right; font-weight: 500; border-bottom: 1px solid #e5e7eb;">${data.productName}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">支付金额</td>
          <td style="text-align: right; font-weight: 600; color: #16a34a; border-bottom: 1px solid #e5e7eb;">¥${data.amount}</td>
        </tr>
        <tr>
          <td style="color: #6b7280;">支付时间</td>
          <td style="text-align: right; font-weight: 500;">${data.paidAt}</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${site.url}/dashboard" class="button">开始学习</a>
    </p>

    <p>感谢您的支持，祝学习愉快！</p>
  `;

  return {
    subject: `支付成功 - ${data.productName}`,
    html: baseLayout(content, `您已成功购买 ${data.productName}，快开始学习吧！`),
  };
}

/**
 * 订单待确认通知（管理员）
 */
export function orderPendingConfirmEmail(data: {
  orderNo: string;
  userName: string;
  userEmail: string;
  productName: string;
  amount: string;
  paymentMethod: string;
  createdAt: string;
}): { subject: string; html: string } {
  const site = getSiteConfig();

  const content = `
    <h2>📋 新订单待确认</h2>
    <p>收到一笔新的待确认订单，请及时处理。</p>

    <div class="info-box">
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">订单编号</td>
          <td style="text-align: right; font-weight: 500; border-bottom: 1px solid #e5e7eb;">${data.orderNo}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">用户</td>
          <td style="text-align: right; font-weight: 500; border-bottom: 1px solid #e5e7eb;">${data.userName} (${data.userEmail})</td>
        </tr>
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">商品</td>
          <td style="text-align: right; font-weight: 500; border-bottom: 1px solid #e5e7eb;">${data.productName}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">金额</td>
          <td style="text-align: right; font-weight: 600; color: #dc2626; border-bottom: 1px solid #e5e7eb;">¥${data.amount}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; border-bottom: 1px solid #e5e7eb;">支付方式</td>
          <td style="text-align: right; font-weight: 500; border-bottom: 1px solid #e5e7eb;">${data.paymentMethod}</td>
        </tr>
        <tr>
          <td style="color: #6b7280;">提交时间</td>
          <td style="text-align: right; font-weight: 500;">${data.createdAt}</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${site.url}/admin/orders" class="button">去后台确认</a>
    </p>
  `;

  return {
    subject: `【待处理】新订单 ${data.orderNo} - ¥${data.amount}`,
    html: baseLayout(content, `新订单待确认: ${data.orderNo}`),
  };
}

/**
 * 会员到期提醒
 */
export function membershipExpiringEmail(data: {
  userName: string;
  membershipName: string;
  expiresAt: string;
  daysLeft: number;
}): { subject: string; html: string } {
  const site = getSiteConfig();

  const content = `
    <h2>⏰ 会员即将到期提醒</h2>
    <p>亲爱的 <strong>${data.userName}</strong>，</p>
    <p>您的 <strong>${data.membershipName}</strong> 会员将于 <span class="warning">${data.expiresAt}</span> 到期，仅剩 <strong>${data.daysLeft}</strong> 天。</p>
    <p>为了不影响您的学习体验，建议您尽快续费。</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${site.url}/membership" class="button">立即续费</a>
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      会员到期后，您将无法访问会员专属课程内容。已购买的单独课程不受影响。
    </p>
  `;

  return {
    subject: `会员即将到期 - 还剩 ${data.daysLeft} 天`,
    html: baseLayout(content, `您的会员将在 ${data.daysLeft} 天后到期，请尽快续费`),
  };
}

/**
 * 密码重置邮件
 */
export function passwordResetEmail(data: {
  userName: string;
  resetLink: string;
  expiresIn: string;
}): { subject: string; html: string } {
  const site = getSiteConfig();

  const content = `
    <h2>重置密码</h2>
    <p>亲爱的 <strong>${data.userName}</strong>，</p>
    <p>我们收到了您的密码重置请求。请点击下方按钮重置您的密码：</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${data.resetLink}" class="button">重置密码</a>
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      此链接将在 ${data.expiresIn} 后失效。如果您没有请求重置密码，请忽略此邮件。
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      如果按钮无法点击，请复制以下链接到浏览器：<br>
      <a href="${data.resetLink}" style="color: #2563eb; word-break: break-all;">${data.resetLink}</a>
    </p>
  `;

  return {
    subject: `重置您的密码 - ${site.name}`,
    html: baseLayout(content, '您请求重置密码，请点击邮件中的链接完成操作'),
  };
}

/**
 * 课程更新通知
 */
export function courseUpdateEmail(data: {
  userName: string;
  courseName: string;
  updateType: 'new_chapter' | 'content_update';
  chapterName?: string;
}): { subject: string; html: string } {
  const site = getSiteConfig();

  const updateText = data.updateType === 'new_chapter'
    ? `新增了章节：<strong>${data.chapterName}</strong>`
    : '内容有更新';

  const content = `
    <h2>📚 课程更新通知</h2>
    <p>亲爱的 <strong>${data.userName}</strong>，</p>
    <p>您正在学习的课程 <strong>${data.courseName}</strong> ${updateText}。</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${site.url}/dashboard" class="button">继续学习</a>
    </p>
  `;

  return {
    subject: `课程更新 - ${data.courseName}`,
    html: baseLayout(content, `${data.courseName} 有新内容更新`),
  };
}
