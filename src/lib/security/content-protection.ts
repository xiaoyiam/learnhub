'use server';

import { createHmac, randomBytes } from 'crypto';

/**
 * 内容保护模块
 * 用于保护视频、课程等付费内容
 */

const SIGNING_SECRET = process.env.CONTENT_SIGNING_SECRET || 'default-secret-change-in-production';
const URL_EXPIRY_SECONDS = 4 * 60 * 60; // 4小时

/**
 * 生成签名 URL（用于视频等资源）
 */
export async function generateSignedUrl(
  originalUrl: string,
  userId: string,
  expirySeconds: number = URL_EXPIRY_SECONDS
): Promise<string> {
  const expiryTime = Math.floor(Date.now() / 1000) + expirySeconds;
  const dataToSign = `${originalUrl}|${userId}|${expiryTime}`;

  const signature = createHmac('sha256', SIGNING_SECRET)
    .update(dataToSign)
    .digest('hex')
    .substring(0, 16); // 使用前16位

  const url = new URL(originalUrl);
  url.searchParams.set('_uid', userId);
  url.searchParams.set('_exp', expiryTime.toString());
  url.searchParams.set('_sig', signature);

  return url.toString();
}

/**
 * 验证签名 URL
 */
export async function verifySignedUrl(
  signedUrl: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const url = new URL(signedUrl);
    const userId = url.searchParams.get('_uid');
    const expiry = url.searchParams.get('_exp');
    const signature = url.searchParams.get('_sig');

    if (!userId || !expiry || !signature) {
      return { valid: false, error: '缺少签名参数' };
    }

    // 检查是否过期
    const expiryTime = parseInt(expiry, 10);
    if (Date.now() / 1000 > expiryTime) {
      return { valid: false, error: '链接已过期' };
    }

    // 移除签名参数，重新计算
    url.searchParams.delete('_uid');
    url.searchParams.delete('_exp');
    url.searchParams.delete('_sig');
    const originalUrl = url.toString();

    const dataToSign = `${originalUrl}|${userId}|${expiry}`;
    const expectedSignature = createHmac('sha256', SIGNING_SECRET)
      .update(dataToSign)
      .digest('hex')
      .substring(0, 16);

    if (signature !== expectedSignature) {
      return { valid: false, error: '签名无效' };
    }

    return { valid: true, userId };
  } catch {
    return { valid: false, error: '无效的 URL' };
  }
}

/**
 * 生成一次性访问令牌
 */
export async function generateAccessToken(
  resourceId: string,
  userId: string,
  resourceType: 'video' | 'article' | 'download'
): Promise<string> {
  const timestamp = Date.now();
  const nonce = randomBytes(8).toString('hex');
  const data = `${resourceType}:${resourceId}:${userId}:${timestamp}:${nonce}`;

  const token = createHmac('sha256', SIGNING_SECRET)
    .update(data)
    .digest('base64url');

  // 返回编码的令牌
  return Buffer.from(`${data}|${token}`).toString('base64url');
}

/**
 * 验证访问令牌
 */
export async function verifyAccessToken(
  token: string,
  maxAgeMs: number = 30 * 60 * 1000 // 默认30分钟
): Promise<{
  valid: boolean;
  resourceId?: string;
  userId?: string;
  resourceType?: string;
  error?: string;
}> {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [data, signature] = decoded.split('|');

    if (!data || !signature) {
      return { valid: false, error: '无效的令牌格式' };
    }

    const expectedSignature = createHmac('sha256', SIGNING_SECRET)
      .update(data)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { valid: false, error: '令牌签名无效' };
    }

    const [resourceType, resourceId, userId, timestamp] = data.split(':');
    const tokenTime = parseInt(timestamp, 10);

    if (Date.now() - tokenTime > maxAgeMs) {
      return { valid: false, error: '令牌已过期' };
    }

    return { valid: true, resourceId, userId, resourceType };
  } catch {
    return { valid: false, error: '令牌解析失败' };
  }
}

/**
 * 检查防盗链 Referer
 */
export function checkReferer(
  referer: string | null,
  allowedDomains: string[]
): boolean {
  if (!referer) {
    // 没有 referer 可能是直接访问，根据业务需求决定是否允许
    return false;
  }

  try {
    const refererUrl = new URL(referer);
    return allowedDomains.some(
      (domain) =>
        refererUrl.hostname === domain ||
        refererUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * 生成内容水印信息
 */
export function generateWatermarkInfo(userId: string, courseId: string): string {
  const timestamp = Date.now();
  const hash = createHmac('sha256', SIGNING_SECRET)
    .update(`${userId}:${courseId}:${timestamp}`)
    .digest('hex')
    .substring(0, 8);

  // 生成用于追踪的隐藏标识
  return `${hash}-${timestamp.toString(36)}`;
}

/**
 * IP 地址脱敏
 */
export function maskIpAddress(ip: string): string {
  if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + ':****';
  } else {
    // IPv4
    const parts = ip.split('.');
    return parts.slice(0, 2).join('.') + '.***';
  }
}
