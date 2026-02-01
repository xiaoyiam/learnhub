import { z } from 'zod';

/**
 * 通用安全验证规则
 */

// 防止 XSS 的字符串清理
const sanitizeString = (str: string) => {
  return str
    .replace(/[<>]/g, '') // 移除 < >
    .replace(/javascript:/gi, '') // 移除 javascript: 协议
    .replace(/on\w+=/gi, '') // 移除事件处理器
    .trim();
};

// 安全字符串 schema
export const safeString = z.string().transform(sanitizeString);

// Email 验证
export const emailSchema = z
  .string()
  .email('请输入有效的邮箱地址')
  .max(255, '邮箱地址过长')
  .toLowerCase()
  .transform(sanitizeString);

// 密码验证（至少8位，包含字母和数字）
export const passwordSchema = z
  .string()
  .min(8, '密码至少需要8个字符')
  .max(100, '密码过长')
  .regex(/[a-zA-Z]/, '密码必须包含字母')
  .regex(/[0-9]/, '密码必须包含数字');

// 用户名验证
export const usernameSchema = z
  .string()
  .min(2, '用户名至少需要2个字符')
  .max(50, '用户名过长')
  .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/, '用户名只能包含中文、字母、数字、下划线和连字符')
  .transform(sanitizeString);

// URL Slug 验证
export const slugSchema = z
  .string()
  .min(1, 'URL 标识不能为空')
  .max(100, 'URL 标识过长')
  .regex(/^[a-z0-9-]+$/, 'URL 标识只能包含小写字母、数字和连字符')
  .transform((s) => s.toLowerCase());

// 价格验证
export const priceSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, '请输入有效的价格')
  .refine((val) => parseFloat(val) >= 0, '价格不能为负数')
  .refine((val) => parseFloat(val) <= 999999.99, '价格超出范围');

// UUID 验证
export const uuidSchema = z
  .string()
  .uuid('无效的 ID 格式');

// URL 验证
export const urlSchema = z
  .string()
  .url('请输入有效的 URL')
  .max(2000, 'URL 过长')
  .refine(
    (url) => url.startsWith('https://') || url.startsWith('http://'),
    '请使用 HTTP 或 HTTPS 协议'
  );

// 安全的 HTML 内容（用于 Markdown）
export const safeContentSchema = z
  .string()
  .max(500000, '内容过长') // 500KB 限制
  .transform((content) => {
    // 移除危险的脚本标签
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=/gi, 'data-removed=');
  });

/**
 * 课程相关验证
 */
export const courseSchema = z.object({
  title: safeString.pipe(z.string().min(1, '请输入课程标题').max(200, '标题过长')),
  slug: slugSchema,
  description: safeString.pipe(z.string().max(5000, '描述过长')).optional(),
  coverImage: urlSchema.optional().or(z.literal('')),
  type: z.enum(['free', 'paid', 'member_only']),
  price: priceSchema,
  originalPrice: priceSchema.optional().or(z.literal('')),
  instructor: safeString.pipe(z.string().min(1, '请输入讲师名称').max(100, '讲师名称过长')),
});

export const chapterSchema = z.object({
  title: safeString.pipe(z.string().min(1, '请输入章节标题').max(200, '标题过长')),
  description: safeString.pipe(z.string().max(1000, '描述过长')).optional(),
  type: z.enum(['video', 'article']),
  videoUrl: urlSchema.optional().or(z.literal('')),
  content: safeContentSchema.optional(),
  duration: z.number().int().min(0).max(9999),
  isFree: z.boolean(),
});

/**
 * 订单相关验证
 */
export const createOrderSchema = z.object({
  productType: z.enum(['course', 'membership']),
  productId: uuidSchema,
  paymentMethod: z.enum(['wechat', 'alipay']).optional(),
});

/**
 * 验证工具函数
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessage = result.error.issues
    .map((e) => e.message)
    .join('; ');

  return { success: false, error: errorMessage };
}

/**
 * 检测可疑输入模式
 */
export function detectSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /\.cookie/i,
    /\.localStorage/i,
    /union\s+select/i, // SQL injection
    /;\s*drop\s+table/i, // SQL injection
    /--\s*$/m, // SQL comment
    /'\s*or\s+'1'\s*=\s*'1/i, // SQL injection
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}
