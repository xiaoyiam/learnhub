/**
 * 邮件配置
 * 支持多种邮件服务商：Resend、阿里云邮件、SMTP
 */

export type EmailProvider = 'resend' | 'aliyun' | 'smtp';

export interface EmailConfig {
  provider: EmailProvider;
  from: string;
  fromName: string;
  replyTo?: string;

  // Resend 配置
  resend?: {
    apiKey: string;
  };

  // 阿里云邮件配置
  aliyun?: {
    accessKeyId: string;
    accessKeySecret: string;
    region?: string;
  };

  // SMTP 配置
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
}

/**
 * 获取邮件配置
 */
export function getEmailConfig(): EmailConfig | null {
  const provider = (process.env.EMAIL_PROVIDER as EmailProvider) || 'resend';
  const from = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME || 'LearnHub';

  if (!from) {
    console.warn('EMAIL_FROM not configured');
    return null;
  }

  const config: EmailConfig = {
    provider,
    from,
    fromName,
    replyTo: process.env.EMAIL_REPLY_TO,
  };

  switch (provider) {
    case 'resend':
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured');
        return null;
      }
      config.resend = {
        apiKey: process.env.RESEND_API_KEY,
      };
      break;

    case 'aliyun':
      if (!process.env.ALIYUN_EMAIL_ACCESS_KEY_ID || !process.env.ALIYUN_EMAIL_ACCESS_KEY_SECRET) {
        console.warn('Aliyun email credentials not configured');
        return null;
      }
      config.aliyun = {
        accessKeyId: process.env.ALIYUN_EMAIL_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_EMAIL_ACCESS_KEY_SECRET,
        region: process.env.ALIYUN_EMAIL_REGION || 'cn-hangzhou',
      };
      break;

    case 'smtp':
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials not configured');
        return null;
      }
      config.smtp = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: process.env.SMTP_SECURE !== 'false',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
      break;
  }

  return config;
}

/**
 * 站点配置（用于邮件模板）
 */
export function getSiteConfig() {
  return {
    name: process.env.NEXT_PUBLIC_SITE_NAME || 'LearnHub',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    logo: process.env.NEXT_PUBLIC_SITE_LOGO || '',
    supportEmail: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || '',
  };
}
