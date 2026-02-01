/**
 * 简单的内存级别限流器
 * 生产环境建议使用 Redis 实现
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 内存存储（生产环境应使用 Redis）
const rateLimitStore = new Map<string, RateLimitEntry>();

// 定期清理过期条目
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

export interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 窗口内最大请求数 */
  maxRequests: number;
  /** 限流类型标识 */
  type: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * 检查是否超过限流
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.type}:${identifier}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // 如果没有记录或已过期，创建新记录
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // 检查是否超限
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // 增加计数
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * 预定义的限流配置
 */
export const RateLimitConfigs = {
  // 登录尝试：每15分钟最多5次
  login: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    type: 'login',
  },

  // API 请求：每分钟最多60次
  api: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    type: 'api',
  },

  // 支付请求：每小时最多10次
  payment: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    type: 'payment',
  },

  // 文件上传：每小时最多30次
  upload: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 30,
    type: 'upload',
  },

  // 密码重置：每小时最多3次
  passwordReset: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    type: 'password_reset',
  },
} as const;

/**
 * 重置限流计数（例如登录成功后）
 */
export async function resetRateLimit(
  identifier: string,
  type: string
): Promise<void> {
  const key = `${type}:${identifier}`;
  rateLimitStore.delete(key);
}
