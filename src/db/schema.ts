/**
 * LearnHub 数据库 Schema
 *
 * 基于 42COG 认知模型设计，使用 Neon Auth + Drizzle ORM
 *
 * 实体映射：
 * - user → neon_auth.user (认证) + userProfiles (业务扩展)
 * - organization → organizations (企业)
 * - course → courses + chapters (课程)
 * - membership → membershipPlans (会员套餐)
 * - resource → resources (数字资源)
 * - order → orders + orderItems (订单)
 * - license → licenses (授权)
 */

import { sql, relations } from 'drizzle-orm';
import {
  pgSchema,
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ============================================================================
// Neon Auth 引用 - 定义但不导出（用于外键关联）
// ============================================================================

const neonAuthSchema = pgSchema('neon_auth');

const neonAuthUser = neonAuthSchema.table('user', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

// 导出类型用于类型提示
export type NeonAuthUser = typeof neonAuthUser.$inferSelect;

// ============================================================================
// 枚举定义
// ============================================================================

// 用户角色（individual, employee, org_admin, admin）
export const userRoleEnum = pgEnum('user_role', [
  'individual',   // 个人用户
  'employee',     // 企业员工
  'org_admin',    // 企业管理员
  'admin',        // 平台管理员
]);

// 企业状态
export const orgStatusEnum = pgEnum('org_status', [
  'trial',        // 试用企业
  'active',       // 付费企业
  'vip',          // VIP企业
  'suspended',    // 已暂停
]);

// 课程状态
export const courseStatusEnum = pgEnum('course_status', [
  'draft',        // 草稿
  'published',    // 已发布
  'archived',     // 已归档
]);

// 课程类型
export const courseTypeEnum = pgEnum('course_type', [
  'free',         // 免费课程
  'paid',         // 付费课程
  'member_only',  // 会员专享
]);

// 资源类型
export const resourceTypeEnum = pgEnum('resource_type', [
  'ebook',        // 电子书
  'template',     // 模板
  'material',     // 素材包
  'tool',         // 工具
]);

// 会员套餐类型
export const membershipTypeEnum = pgEnum('membership_type', [
  'monthly',      // 月度会员
  'quarterly',    // 季度会员
  'yearly',       // 年度会员
  'enterprise',   // 企业会员
]);

// 订单状态
export const orderStatusEnum = pgEnum('order_status', [
  'pending',      // 待支付
  'paid',         // 已支付
  'cancelled',    // 已取消
  'refunded',     // 已退款
]);

// 支付方式
export const paymentMethodEnum = pgEnum('payment_method', [
  'wechat',       // 微信支付
  'alipay',       // 支付宝
]);

// 授权类型
export const licenseTypeEnum = pgEnum('license_type', [
  'personal',     // 个人授权
  'enterprise',   // 企业授权
  'trial',        // 试用授权
]);

// 章节类型
export const chapterTypeEnum = pgEnum('chapter_type', [
  'video',        // 视频课程
  'article',      // 图文课程
]);

// ============================================================================
// 用户相关表
// ============================================================================

/**
 * 用户扩展信息表（一对一关联 neon_auth.user）
 */
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => neonAuthUser.id, { onDelete: 'cascade' }),
  role: userRoleEnum('role').default('individual').notNull(),
  phone: varchar('phone', { length: 20 }),
  organizationId: uuid('organization_id'),  // 后面添加外键
  preferences: jsonb('preferences'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('user_profiles_user_id_idx').on(table.userId),
  index('user_profiles_org_id_idx').on(table.organizationId),
]);

// ============================================================================
// 企业/组织表
// ============================================================================

/**
 * 企业/组织表
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  status: orgStatusEnum('status').default('trial').notNull(),
  contactName: varchar('contact_name', { length: 100 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  employeeLimit: integer('employee_limit').default(10),
  employeeCount: integer('employee_count').default(0),
  // 创建者（企业管理员）
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => neonAuthUser.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('organizations_creator_id_idx').on(table.creatorId),
]);

// ============================================================================
// 课程相关表
// ============================================================================

/**
 * 课程表
 */
export const courses = pgTable('courses', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),  // URL 友好标识
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  coverImage: varchar('cover_image', { length: 500 }),
  status: courseStatusEnum('status').default('draft').notNull(),
  type: courseTypeEnum('type').default('paid').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0').notNull(),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
  instructor: varchar('instructor', { length: 100 }),
  duration: integer('duration'),  // 总时长（分钟）
  chapterCount: integer('chapter_count').default(0),
  studentCount: integer('student_count').default(0),
  rating: decimal('rating', { precision: 2, scale: 1 }).default('0'),
  ratingCount: integer('rating_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('courses_slug_idx').on(table.slug),
  index('courses_status_idx').on(table.status),
  index('courses_type_idx').on(table.type),
]);

/**
 * 课程章节表
 */
export const chapters = pgTable('chapters', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: chapterTypeEnum('type').default('video').notNull(),  // 章节类型
  sortOrder: integer('sort_order').default(0).notNull(),
  duration: integer('duration'),  // 时长（分钟）
  videoUrl: varchar('video_url', { length: 500 }),
  content: text('content'),  // 图文内容（Markdown）
  isFree: boolean('is_free').default(false),  // 是否可试看
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('chapters_course_id_idx').on(table.courseId),
  index('chapters_sort_order_idx').on(table.sortOrder),
]);

// ============================================================================
// 会员套餐表
// ============================================================================

/**
 * 会员套餐表
 */
export const membershipPlans = pgTable('membership_plans', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),  // monthly, yearly 等
  name: varchar('name', { length: 100 }).notNull(),
  type: membershipTypeEnum('type').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
  durationDays: integer('duration_days').notNull(),  // 有效天数
  features: jsonb('features'),  // 权益列表
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('membership_plans_code_idx').on(table.code),
]);

// ============================================================================
// 数字资源表
// ============================================================================

/**
 * 数字资源表
 */
export const resources = pgTable('resources', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  coverImage: varchar('cover_image', { length: 500 }),
  type: resourceTypeEnum('type').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0').notNull(),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
  fileUrl: varchar('file_url', { length: 500 }),
  fileSize: integer('file_size'),  // 文件大小（字节）
  downloadCount: integer('download_count').default(0),
  isMemberFree: boolean('is_member_free').default(false),  // 会员是否免费
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('resources_type_idx').on(table.type),
  index('resources_is_active_idx').on(table.isActive),
]);

// ============================================================================
// 订单相关表
// ============================================================================

/**
 * 订单表
 */
export const orders = pgTable('orders', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  orderNo: varchar('order_no', { length: 50 }).notNull().unique(),  // 订单号
  userId: uuid('user_id')
    .notNull()
    .references(() => neonAuthUser.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'set null' }),  // 企业订单
  status: orderStatusEnum('status').default('pending').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  paymentMethod: paymentMethodEnum('payment_method'),
  paymentNo: varchar('payment_no', { length: 100 }),  // 第三方支付流水号
  paidAt: timestamp('paid_at'),
  expiredAt: timestamp('expired_at'),  // 订单过期时间
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('orders_order_no_idx').on(table.orderNo),
  index('orders_user_id_idx').on(table.userId),
  index('orders_org_id_idx').on(table.organizationId),
  index('orders_status_idx').on(table.status),
]);

/**
 * 订单明细表（多对多中间表）
 */
export const orderItems = pgTable('order_items', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  // 商品类型和ID（支持课程、会员、资源）
  productType: varchar('product_type', { length: 20 }).notNull(),  // course, membership, resource
  productId: uuid('product_id').notNull(),
  productName: varchar('product_name', { length: 200 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('order_items_order_id_idx').on(table.orderId),
  index('order_items_product_idx').on(table.productType, table.productId),
]);

// ============================================================================
// 授权/许可表
// ============================================================================

/**
 * 用户授权表（记录用户对商品的访问权限）
 */
export const licenses = pgTable('licenses', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => neonAuthUser.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'set null' }),  // 企业授权
  type: licenseTypeEnum('type').default('personal').notNull(),
  // 商品类型和ID
  productType: varchar('product_type', { length: 20 }).notNull(),  // course, membership, resource
  productId: uuid('product_id').notNull(),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'set null' }),  // 关联订单
  startAt: timestamp('start_at').defaultNow().notNull(),
  expireAt: timestamp('expire_at'),  // null 表示永久
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('licenses_user_id_idx').on(table.userId),
  index('licenses_org_id_idx').on(table.organizationId),
  index('licenses_product_idx').on(table.productType, table.productId),
  index('licenses_is_active_idx').on(table.isActive),
  // 用户对同一商品只能有一个有效授权
  uniqueIndex('licenses_user_product_idx').on(
    table.userId,
    table.productType,
    table.productId
  ),
]);

// ============================================================================
// 学习进度表
// ============================================================================

/**
 * 用户学习进度表
 */
export const userProgress = pgTable('user_progress', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => neonAuthUser.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  chapterId: uuid('chapter_id')
    .references(() => chapters.id, { onDelete: 'cascade' }),
  progress: integer('progress').default(0).notNull(),  // 视频播放进度（秒）
  duration: integer('duration').default(0).notNull(),  // 视频总时长（秒）
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  lastWatchedAt: timestamp('last_watched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('user_progress_user_id_idx').on(table.userId),
  index('user_progress_course_id_idx').on(table.courseId),
  // 用户对每个章节只有一条进度记录
  uniqueIndex('user_progress_user_chapter_idx').on(table.userId, table.chapterId),
]);

// ============================================================================
// 关系定义
// ============================================================================

// 企业和员工的关系
export const organizationsRelations = relations(organizations, ({ many }) => ({
  employees: many(userProfiles),
  orders: many(orders),
  licenses: many(licenses),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  organization: one(organizations, {
    fields: [userProfiles.organizationId],
    references: [organizations.id],
  }),
}));

// 课程和章节的关系
export const coursesRelations = relations(courses, ({ many }) => ({
  chapters: many(chapters),
  progress: many(userProgress),
}));

export const chaptersRelations = relations(chapters, ({ one }) => ({
  course: one(courses, {
    fields: [chapters.courseId],
    references: [courses.id],
  }),
}));

// 订单和订单明细的关系
export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  organization: one(organizations, {
    fields: [orders.organizationId],
    references: [organizations.id],
  }),
  licenses: many(licenses),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

// 授权关系
export const licensesRelations = relations(licenses, ({ one }) => ({
  organization: one(organizations, {
    fields: [licenses.organizationId],
    references: [organizations.id],
  }),
  order: one(orders, {
    fields: [licenses.orderId],
    references: [orders.id],
  }),
}));

// 学习进度关系
export const userProgressRelations = relations(userProgress, ({ one }) => ({
  course: one(courses, {
    fields: [userProgress.courseId],
    references: [courses.id],
  }),
  chapter: one(chapters, {
    fields: [userProgress.chapterId],
    references: [chapters.id],
  }),
}));

// ============================================================================
// 系统设置表
// ============================================================================

/**
 * 系统设置表（键值对存储）
 */
export const siteSettings = pgTable('site_settings', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: jsonb('value'),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('site_settings_key_idx').on(table.key),
]);

// ============================================================================
// 安全审计日志表
// ============================================================================

/**
 * 审计日志严重级别
 */
export const auditSeverityEnum = pgEnum('audit_severity', [
  'info',
  'warning',
  'error',
  'critical',
]);

/**
 * 审计日志表
 * 记录系统中的安全相关事件
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

  // 事件信息
  action: varchar('action', { length: 50 }).notNull(),
  severity: auditSeverityEnum('severity').default('info').notNull(),

  // 用户和来源
  userId: uuid('user_id'),
  ip: varchar('ip', { length: 45 }),  // 支持 IPv6
  userAgent: text('user_agent'),

  // 资源信息
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId: uuid('resource_id'),

  // 详细信息（JSON）
  details: jsonb('details'),

  // 时间戳
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('audit_logs_user_id_idx').on(table.userId),
  index('audit_logs_action_idx').on(table.action),
  index('audit_logs_created_at_idx').on(table.createdAt),
  index('audit_logs_severity_idx').on(table.severity),
]);

// ============================================================================
// 类型导出
// ============================================================================

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;

export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type NewMembershipPlan = typeof membershipPlans.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type License = typeof licenses.$inferSelect;
export type NewLicense = typeof licenses.$inferInsert;

export type UserProgressRecord = typeof userProgress.$inferSelect;
export type NewUserProgressRecord = typeof userProgress.$inferInsert;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
