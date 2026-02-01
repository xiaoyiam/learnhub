import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { isAdmin } from '@/lib/admin-auth';
import {
  getOSSConfig,
  generateOSSPath,
  getOSSUrl,
  validateFileType,
  VIDEO_TYPES,
  IMAGE_TYPES,
  MAX_VIDEO_SIZE,
  MAX_IMAGE_SIZE,
} from '@/lib/oss';
import { checkRateLimit, RateLimitConfigs } from '@/lib/security/rate-limit';
import { logAuditEvent, logRateLimitExceeded } from '@/lib/security/audit-log';
import { detectSuspiciousInput } from '@/lib/security/validation';

/**
 * 文件上传 API
 *
 * 支持两种模式：
 * 1. 直接上传到服务器（小文件）
 * 2. 获取预签名 URL 上传到 OSS（大文件）
 *
 * POST /api/upload
 * - type: 'video' | 'image'
 * - action: 'direct' | 'presign'
 * - filename: 文件名（presign 模式必需）
 * - file: 文件（direct 模式必需）
 */

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  try {
    // 验证登录和权限
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    // 限流检查
    const rateLimitResult = await checkRateLimit(
      session.user.id,
      RateLimitConfigs.upload
    );

    if (!rateLimitResult.success) {
      await logRateLimitExceeded('upload', session.user.id, ip);
      return NextResponse.json(
        {
          error: '上传过于频繁，请稍后再试',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const formData = await request.formData();
    const type = formData.get('type') as 'video' | 'image';
    const action = formData.get('action') as 'direct' | 'presign' || 'direct';

    if (!type || !['video', 'image'].includes(type)) {
      return NextResponse.json({ error: '无效的文件类型' }, { status: 400 });
    }

    const allowedTypes = type === 'video' ? VIDEO_TYPES : IMAGE_TYPES;
    const maxSize = type === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    // 预签名模式：返回签名 URL 供客户端直接上传
    if (action === 'presign') {
      const filename = formData.get('filename') as string;
      if (!filename) {
        return NextResponse.json({ error: '缺少文件名' }, { status: 400 });
      }

      // 安全检查：文件名
      if (detectSuspiciousInput(filename)) {
        await logAuditEvent({
          action: 'suspicious_activity',
          userId: session.user.id,
          ip,
          severity: 'warning',
          details: { type: 'suspicious_filename', filename },
        });
        return NextResponse.json({ error: '无效的文件名' }, { status: 400 });
      }

      if (!validateFileType(filename, allowedTypes)) {
        return NextResponse.json({
          error: `不支持的文件格式，允许: ${allowedTypes.join(', ')}`
        }, { status: 400 });
      }

      const config = getOSSConfig();
      if (!config) {
        return NextResponse.json({ error: '未配置 OSS' }, { status: 500 });
      }

      const path = generateOSSPath(type, filename);
      const url = getOSSUrl(path, config);

      // 动态导入 ali-oss
      const OSS = (await import('ali-oss')).default;
      const client = new OSS({
        region: config.region,
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        bucket: config.bucket,
      });

      // 生成预签名 URL（有效期 10 分钟）
      const signedUrl = client.signatureUrl(path, {
        method: 'PUT',
        expires: 600,
        'Content-Type': type === 'video' ? 'video/*' : 'image/*',
      });

      return NextResponse.json({
        uploadUrl: signedUrl,
        fileUrl: url,
        path,
      });
    }

    // 直接上传模式
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    if (!validateFileType(file.name, allowedTypes)) {
      return NextResponse.json({
        error: `不支持的文件格式，允许: ${allowedTypes.join(', ')}`
      }, { status: 400 });
    }

    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json({
        error: `文件过大，最大允许 ${sizeMB}MB`
      }, { status: 400 });
    }

    const config = getOSSConfig();
    if (!config) {
      return NextResponse.json({ error: '未配置 OSS，请联系管理员' }, { status: 500 });
    }

    const path = generateOSSPath(type, file.name);

    // 动态导入 ali-oss
    const OSS = (await import('ali-oss')).default;
    const client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
    });

    // 转换 File 为 Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 上传到 OSS
    await client.put(path, buffer, {
      headers: {
        'Content-Type': file.type,
      },
    });

    const url = getOSSUrl(path, config);

    // 记录上传成功
    await logAuditEvent({
      action: 'admin_access',
      userId: session.user.id,
      ip,
      severity: 'info',
      details: {
        operation: 'file_upload',
        type,
        filename: file.name,
        size: file.size,
        path,
      },
    });

    return NextResponse.json({
      url,
      path,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '上传失败，请重试' },
      { status: 500 }
    );
  }
}
