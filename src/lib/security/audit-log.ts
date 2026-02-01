'use server';

import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * 安全审计日志模块
 */

export type AuditAction =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_change'
  | 'order_created'
  | 'order_paid'
  | 'order_refunded'
  | 'admin_access'
  | 'content_access'
  | 'suspicious_activity'
  | 'rate_limit_exceeded';

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  ip?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * 记录审计日志
 * 生产环境建议写入专门的日志表或日志服务
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const logData = {
    timestamp: new Date().toISOString(),
    ...entry,
    details: entry.details ? JSON.stringify(entry.details) : null,
  };

  // 开发环境输出到控制台
  if (process.env.NODE_ENV === 'development') {
    const severityColors: Record<string, string> = {
      info: '\x1b[36m',     // cyan
      warning: '\x1b[33m',  // yellow
      error: '\x1b[31m',    // red
      critical: '\x1b[35m', // magenta
    };
    const reset = '\x1b[0m';
    const color = severityColors[entry.severity] || '';

    console.log(
      `${color}[AUDIT:${entry.severity.toUpperCase()}]${reset}`,
      entry.action,
      entry.userId ? `user:${entry.userId}` : '',
      entry.resourceType ? `${entry.resourceType}:${entry.resourceId}` : '',
      entry.ip ? `ip:${entry.ip}` : ''
    );
  }

  // 生产环境写入数据库
  // 注意：需要先创建 audit_logs 表
  try {
    // 检查表是否存在，如果不存在则跳过
    // 这是一个简化的实现，实际应该在迁移中创建表
    if (process.env.NODE_ENV === 'production') {
      await db.execute(sql`
        INSERT INTO audit_logs (action, user_id, ip, user_agent, resource_type, resource_id, details, severity, created_at)
        VALUES (
          ${entry.action},
          ${entry.userId || null},
          ${entry.ip || null},
          ${entry.userAgent || null},
          ${entry.resourceType || null},
          ${entry.resourceId || null},
          ${logData.details}::jsonb,
          ${entry.severity},
          NOW()
        )
        ON CONFLICT DO NOTHING
      `).catch(() => {
        // 表不存在时静默失败
      });
    }
  } catch {
    // 日志记录失败不应影响主业务
  }
}

/**
 * 快捷方法：记录登录成功
 */
export async function logLoginSuccess(
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action: 'login_success',
    userId,
    ip,
    userAgent,
    severity: 'info',
  });
}

/**
 * 快捷方法：记录登录失败
 */
export async function logLoginFailed(
  email: string,
  ip?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    action: 'login_failed',
    ip,
    severity: 'warning',
    details: { email, reason },
  });
}

/**
 * 快捷方法：记录可疑活动
 */
export async function logSuspiciousActivity(
  description: string,
  userId?: string,
  ip?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    action: 'suspicious_activity',
    userId,
    ip,
    severity: 'warning',
    details: { description, ...details },
  });
}

/**
 * 快捷方法：记录限流触发
 */
export async function logRateLimitExceeded(
  limitType: string,
  identifier: string,
  ip?: string
): Promise<void> {
  await logAuditEvent({
    action: 'rate_limit_exceeded',
    ip,
    severity: 'warning',
    details: { limitType, identifier },
  });
}

/**
 * 快捷方法：记录内容访问
 */
export async function logContentAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  ip?: string
): Promise<void> {
  await logAuditEvent({
    action: 'content_access',
    userId,
    resourceType,
    resourceId,
    ip,
    severity: 'info',
  });
}

/**
 * 快捷方法：记录管理员操作
 */
export async function logAdminAccess(
  userId: string,
  operation: string,
  resourceType?: string,
  resourceId?: string,
  ip?: string
): Promise<void> {
  await logAuditEvent({
    action: 'admin_access',
    userId,
    resourceType,
    resourceId,
    ip,
    severity: 'info',
    details: { operation },
  });
}
