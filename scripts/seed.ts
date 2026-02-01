/**
 * 种子数据脚本 - 创建测试课程和会员套餐
 *
 * 运行: node --env-file=.env --experimental-strip-types scripts/seed.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { courses, chapters, membershipPlans, resources } from '../src/db/schema.ts';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log('🌱 开始创建种子数据...\n');

  // 1. 创建课程
  console.log('📚 创建课程...');
  const coursesData = [
    {
      slug: 'nextjs-fullstack',
      title: 'Next.js 15 全栈开发实战',
      description: '从零开始学习 Next.js 15，掌握 App Router、Server Actions、数据库集成等核心技能，构建完整的全栈应用。',
      coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      status: 'published' as const,
      type: 'paid' as const,
      price: '299.00',
      originalPrice: '599.00',
      instructor: '张老师',
      duration: 1200,
      chapterCount: 12,
      studentCount: 1256,
      rating: '4.8',
      ratingCount: 328,
    },
    {
      slug: 'react-fundamentals',
      title: 'React 19 核心概念精讲',
      description: '深入理解 React 19 的核心概念，包括 Hooks、状态管理、性能优化等，为进阶学习打下坚实基础。',
      coverImage: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800',
      status: 'published' as const,
      type: 'free' as const,
      price: '0.00',
      instructor: '李老师',
      duration: 480,
      chapterCount: 8,
      studentCount: 3421,
      rating: '4.9',
      ratingCount: 892,
    },
    {
      slug: 'typescript-advanced',
      title: 'TypeScript 高级类型编程',
      description: '掌握 TypeScript 的高级类型系统，学习泛型、条件类型、映射类型等进阶技巧，写出更安全的代码。',
      coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
      status: 'published' as const,
      type: 'member_only' as const,
      price: '199.00',
      originalPrice: '399.00',
      instructor: '王老师',
      duration: 600,
      chapterCount: 10,
      studentCount: 876,
      rating: '4.7',
      ratingCount: 234,
    },
    {
      slug: 'database-design',
      title: '数据库设计与优化',
      description: '学习关系型数据库设计原则、SQL 优化技巧、索引策略，以及 PostgreSQL 的高级特性。',
      coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
      status: 'published' as const,
      type: 'paid' as const,
      price: '249.00',
      instructor: '陈老师',
      duration: 720,
      chapterCount: 9,
      studentCount: 654,
      rating: '4.6',
      ratingCount: 178,
    },
  ];

  const insertedCourses = await db.insert(courses).values(coursesData).returning();
  console.log(`  ✓ 创建了 ${insertedCourses.length} 门课程`);

  // 2. 为第一门课程创建章节
  console.log('\n📖 创建课程章节...');
  const nextjsCourse = insertedCourses.find(c => c.slug === 'nextjs-fullstack');
  if (nextjsCourse) {
    const chaptersData = [
      { courseId: nextjsCourse.id, title: '课程介绍与环境搭建', description: '了解课程目标，安装开发环境', sortOrder: 1, duration: 30, isFree: true },
      { courseId: nextjsCourse.id, title: 'Next.js 15 新特性概览', description: '了解 App Router、Server Components 等新特性', sortOrder: 2, duration: 45, isFree: true },
      { courseId: nextjsCourse.id, title: '路由系统详解', description: '掌握文件系统路由、动态路由、路由组等', sortOrder: 3, duration: 60, isFree: false },
      { courseId: nextjsCourse.id, title: '数据获取策略', description: '学习 SSR、SSG、ISR 等数据获取方式', sortOrder: 4, duration: 90, isFree: false },
      { courseId: nextjsCourse.id, title: 'Server Actions 实战', description: '使用 Server Actions 处理表单和数据变更', sortOrder: 5, duration: 75, isFree: false },
      { courseId: nextjsCourse.id, title: '数据库集成 (Drizzle ORM)', description: '连接 PostgreSQL，实现 CRUD 操作', sortOrder: 6, duration: 120, isFree: false },
      { courseId: nextjsCourse.id, title: '用户认证实现', description: '集成 Neon Auth 实现登录注册', sortOrder: 7, duration: 90, isFree: false },
      { courseId: nextjsCourse.id, title: '文件上传与存储', description: '实现图片上传和云存储集成', sortOrder: 8, duration: 60, isFree: false },
      { courseId: nextjsCourse.id, title: '支付集成', description: '对接微信支付和支付宝', sortOrder: 9, duration: 120, isFree: false },
      { courseId: nextjsCourse.id, title: '性能优化', description: '图片优化、代码分割、缓存策略', sortOrder: 10, duration: 90, isFree: false },
      { courseId: nextjsCourse.id, title: '部署与运维', description: '部署到 Vercel，配置域名和监控', sortOrder: 11, duration: 60, isFree: false },
      { courseId: nextjsCourse.id, title: '项目实战总结', description: '回顾课程内容，完成最终项目', sortOrder: 12, duration: 60, isFree: false },
    ];
    await db.insert(chapters).values(chaptersData);
    console.log(`  ✓ 为《${nextjsCourse.title}》创建了 ${chaptersData.length} 个章节`);
  }

  // 3. 创建会员套餐
  console.log('\n👑 创建会员套餐...');
  const plansData = [
    {
      code: 'monthly',
      name: '月度会员',
      type: 'monthly' as const,
      price: '49.00',
      originalPrice: '99.00',
      durationDays: 30,
      features: ['全站课程免费学', '专属学习群', '作业批改'],
      isActive: true,
      sortOrder: 1,
    },
    {
      code: 'quarterly',
      name: '季度会员',
      type: 'quarterly' as const,
      price: '129.00',
      originalPrice: '297.00',
      durationDays: 90,
      features: ['全站课程免费学', '专属学习群', '作业批改', '1v1 答疑（每月1次）'],
      isActive: true,
      sortOrder: 2,
    },
    {
      code: 'yearly',
      name: '年度会员',
      type: 'yearly' as const,
      price: '399.00',
      originalPrice: '1188.00',
      durationDays: 365,
      features: ['全站课程免费学', '专属学习群', '作业批改', '1v1 答疑（每月2次）', '线下活动优先', '专属证书'],
      isActive: true,
      sortOrder: 3,
    },
  ];

  await db.insert(membershipPlans).values(plansData);
  console.log(`  ✓ 创建了 ${plansData.length} 个会员套餐`);

  // 4. 创建数字资源
  console.log('\n📦 创建数字资源...');
  const resourcesData = [
    {
      title: 'React 组件库模板',
      description: '开箱即用的 React 组件库模板，包含 Button、Modal、Form 等常用组件，支持主题定制。',
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      type: 'template' as const,
      price: '49.00',
      originalPrice: '99.00',
      downloadCount: 1234,
      isMemberFree: true,
      isActive: true,
    },
    {
      title: 'TypeScript 类型体操练习册',
      description: '50+ 道 TypeScript 类型编程练习题，从入门到进阶，附带详细解答。',
      coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
      type: 'ebook' as const,
      price: '29.00',
      downloadCount: 567,
      isMemberFree: true,
      isActive: true,
    },
    {
      title: '全栈项目启动模板',
      description: 'Next.js + Drizzle + Tailwind CSS 项目模板，包含认证、数据库、部署配置。',
      coverImage: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800',
      type: 'template' as const,
      price: '0.00',
      downloadCount: 2345,
      isMemberFree: false,
      isActive: true,
    },
  ];

  await db.insert(resources).values(resourcesData);
  console.log(`  ✓ 创建了 ${resourcesData.length} 个数字资源`);

  console.log('\n✅ 种子数据创建完成！');
}

seed().catch(console.error);
