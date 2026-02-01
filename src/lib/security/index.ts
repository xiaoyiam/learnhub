/**
 * 安全模块导出
 */

export * from './rate-limit';
export * from './validation';
export * from './content-protection';
export * from './audit-log';

/**
 * 安全配置检查清单
 */
export const SecurityChecklist = {
  // 环境变量检查
  requiredEnvVars: [
    'DATABASE_URL',
    'CONTENT_SIGNING_SECRET',
  ],

  // 推荐的环境变量
  recommendedEnvVars: [
    'NEXT_PUBLIC_APP_URL',
    'OSS_ACCESS_KEY_ID',
    'OSS_ACCESS_KEY_SECRET',
  ],

  // 检查环境变量
  checkEnvironment(): { passed: boolean; missing: string[]; warnings: string[] } {
    const missing: string[] = [];
    const warnings: string[] = [];

    for (const envVar of this.requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    for (const envVar of this.recommendedEnvVars) {
      if (!process.env[envVar]) {
        warnings.push(envVar);
      }
    }

    // 检查是否使用了默认的 secret
    if (
      !process.env.CONTENT_SIGNING_SECRET ||
      process.env.CONTENT_SIGNING_SECRET === 'default-secret-change-in-production'
    ) {
      warnings.push('CONTENT_SIGNING_SECRET 使用了默认值，请在生产环境修改');
    }

    return {
      passed: missing.length === 0,
      missing,
      warnings,
    };
  },
};

/**
 * 常用安全工具
 */
export const SecurityUtils = {
  /**
   * 生成随机字符串
   */
  generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);

    // 在服务端使用 crypto
    if (typeof globalThis.crypto !== 'undefined') {
      globalThis.crypto.getRandomValues(randomValues);
    } else {
      // 回退到 Math.random（不推荐用于安全场景）
      for (let i = 0; i < length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
    }

    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }

    return result;
  },

  /**
   * 安全比较字符串（防止时序攻击）
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  },

  /**
   * 隐藏敏感信息
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }

    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(Math.min(data.length - visibleChars * 2, 8));

    return `${start}${middle}${end}`;
  },

  /**
   * 验证是否为合法 UUID
   */
  isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  },
};
