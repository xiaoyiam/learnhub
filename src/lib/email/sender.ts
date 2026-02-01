/**
 * 邮件发送服务
 * 支持多种邮件服务商
 */

import { getEmailConfig, type EmailConfig } from './config';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 发送邮件
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = getEmailConfig();

  if (!config) {
    console.error('Email not configured');
    return { success: false, error: '邮件服务未配置' };
  }

  try {
    switch (config.provider) {
      case 'resend':
        return await sendWithResend(config, options);
      case 'smtp':
        return await sendWithSMTP(config, options);
      case 'aliyun':
        return await sendWithAliyun(config, options);
      default:
        return { success: false, error: `Unknown email provider: ${config.provider}` };
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '发送失败',
    };
  }
}

/**
 * 使用 Resend 发送
 */
async function sendWithResend(
  config: EmailConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  if (!config.resend?.apiKey) {
    return { success: false, error: 'Resend API key not configured' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${config.fromName} <${config.from}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || config.replyTo,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.message || 'Resend API error' };
  }

  const result = await response.json();
  return { success: true, messageId: result.id };
}

/**
 * 使用 SMTP 发送
 */
async function sendWithSMTP(
  config: EmailConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  if (!config.smtp) {
    return { success: false, error: 'SMTP not configured' };
  }

  // 动态导入 nodemailer
  const nodemailer = await import('nodemailer');

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  const info = await transporter.sendMail({
    from: `"${config.fromName}" <${config.from}>`,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo || config.replyTo,
  });

  return { success: true, messageId: info.messageId };
}

/**
 * 使用阿里云邮件推送发送
 */
async function sendWithAliyun(
  config: EmailConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  if (!config.aliyun) {
    return { success: false, error: 'Aliyun email not configured' };
  }

  // 阿里云邮件推送 API
  // 这里使用简化的 HTTP 请求方式，生产环境建议使用官方 SDK
  const { accessKeyId, accessKeySecret, region = 'cn-hangzhou' } = config.aliyun;

  const endpoint = `https://dm.${region}.aliyuncs.com`;
  const timestamp = new Date().toISOString();

  const params: Record<string, string> = {
    Action: 'SingleSendMail',
    AccountName: config.from,
    AddressType: '1',
    ReplyToAddress: 'true',
    ToAddress: Array.isArray(options.to) ? options.to[0] : options.to,
    Subject: options.subject,
    HtmlBody: options.html,
    Format: 'JSON',
    Version: '2015-11-23',
    AccessKeyId: accessKeyId,
    SignatureMethod: 'HMAC-SHA1',
    Timestamp: timestamp,
    SignatureVersion: '1.0',
    SignatureNonce: Math.random().toString(36).substring(2),
  };

  // 签名逻辑（简化版，实际需要完整的阿里云签名算法）
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const stringToSign = `POST&${encodeURIComponent('/')}&${encodeURIComponent(sortedParams)}`;

  // 使用 Web Crypto API 计算签名
  const encoder = new TextEncoder();
  const keyData = encoder.encode(accessKeySecret + '&');
  const msgData = encoder.encode(stringToSign);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  params.Signature = signatureBase64;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.Message || 'Aliyun email error' };
  }

  const result = await response.json();
  return { success: true, messageId: result.RequestId };
}

/**
 * 批量发送邮件（带限流）
 */
export async function sendBulkEmails(
  emails: SendEmailOptions[],
  options: { delayMs?: number; onProgress?: (sent: number, total: number) => void } = {}
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { delayMs = 100, onProgress } = options;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < emails.length; i++) {
    const result = await sendEmail(emails[i]);

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${emails[i].to}: ${result.error}`);
    }

    onProgress?.(i + 1, emails.length);

    // 限流
    if (delayMs > 0 && i < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { sent, failed, errors };
}
