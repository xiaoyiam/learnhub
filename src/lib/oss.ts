/**
 * 阿里云 OSS 配置和工具函数
 *
 * 环境变量配置：
 * - ALIYUN_OSS_REGION: OSS 区域，如 oss-cn-hangzhou
 * - ALIYUN_OSS_BUCKET: OSS Bucket 名称
 * - ALIYUN_OSS_ACCESS_KEY_ID: AccessKey ID
 * - ALIYUN_OSS_ACCESS_KEY_SECRET: AccessKey Secret
 * - ALIYUN_OSS_CDN_DOMAIN: (可选) 自定义域名/CDN 域名
 */

export interface OSSConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  cdnDomain?: string;
}

export function getOSSConfig(): OSSConfig | null {
  const region = process.env.ALIYUN_OSS_REGION;
  const bucket = process.env.ALIYUN_OSS_BUCKET;
  const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET;

  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    return null;
  }

  return {
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    cdnDomain: process.env.ALIYUN_OSS_CDN_DOMAIN,
  };
}

/**
 * 生成 OSS 文件路径
 */
export function generateOSSPath(type: 'video' | 'image' | 'file', filename: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  // 获取文件扩展名
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // 生成新文件名
  const newFilename = `${timestamp}_${random}.${ext}`;

  return `${type}s/${year}/${month}/${day}/${newFilename}`;
}

/**
 * 获取文件的 OSS URL
 */
export function getOSSUrl(path: string, config: OSSConfig): string {
  if (config.cdnDomain) {
    return `https://${config.cdnDomain}/${path}`;
  }
  return `https://${config.bucket}.${config.region}.aliyuncs.com/${path}`;
}

/**
 * 验证文件类型
 */
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return allowedTypes.includes(ext);
}

/**
 * 视频允许的文件类型
 */
export const VIDEO_TYPES = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

/**
 * 图片允许的文件类型
 */
export const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

/**
 * 最大文件大小限制
 */
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
