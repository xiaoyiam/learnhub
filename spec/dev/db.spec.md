# LearnHub 数据库设计规格书

<meta>
  <document-id>learnhub-db-spec</document-id>
  <version>1.0.0</version>
  <project>LearnHub 学习平台</project>
  <type>数据库设计规格书</type>
  <created>2025-01-30</created>
  <depends>real.md, cog.md</depends>
  <generates>src/db/schema.ts</generates>
</meta>

---

## 1. 设计概述

### 1.1 技术选型

| 组件 | 选型 | 说明 |
|------|------|------|
| 数据库 | PostgreSQL 17 | Neon 无服务器数据库 |
| ORM | Drizzle ORM | 类型安全、轻量 |
| 认证 | Neon Auth | 基于 Better Auth |
| 主键策略 | UUID | 防止 ID 枚举攻击 |

### 1.2 Schema 架构

```
┌──────────────────────────────────────────────────────────────┐
│                     Neon Database                            │
├──────────────────────────┬───────────────────────────────────┤
│     neon_auth schema     │         public schema             │
│  (Neon Auth 管理)         │      (业务表)                     │
├──────────────────────────┼───────────────────────────────────┤
│ • user ◄─────────────────┼─── 外键引用                       │
│ • account                │ • user_profiles (用户扩展)        │
│ • session                │ • organizations (企业)            │
│ • verification           │ • courses, chapters (课程)        │
│                          │ • membership_plans (会员)         │
│                          │ • resources (资源)                │
│                          │ • orders, order_items (订单)      │
│                          │ • licenses (授权)                 │
│                          │ • user_progress (学习进度)        │
└──────────────────────────┴───────────────────────────────────┘
```

---

## 2. 实体关系图 (ER Diagram)

```
                         ┌──────────────┐
                         │ neon_auth.   │
                         │    user      │
                         └──────┬───────┘
                                │ 1:1
                                ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ organizations│◄────────│ user_profiles│────────▶│   licenses   │
└──────┬───────┘   N:1   └──────────────┘   1:N   └──────┬───────┘
       │                                                  │
       │ 1:N                                              │ N:1
       ▼                                                  ▼
┌──────────────┐                                   ┌──────────────┐
│   orders     │◄──────────────────────────────────│ order_items  │
└──────┬───────┘                                   └──────────────┘
       │ 1:N                                              │
       │                          ┌───────────────────────┤
       ▼                          ▼                       ▼
┌──────────────┐           ┌──────────────┐        ┌──────────────┐
│   licenses   │           │   courses    │        │  resources   │
└──────────────┘           └──────┬───────┘        └──────────────┘
                                  │ 1:N                   ▲
                                  ▼                       │
                           ┌──────────────┐        ┌──────────────┐
                           │  chapters    │        │ membership_  │
                           └──────┬───────┘        │    plans     │
                                  │ 1:N            └──────────────┘
                                  ▼
                           ┌──────────────┐
                           │ user_progress│
                           └──────────────┘
```

---

## 3. 表定义详情

### 3.1 用户相关

#### user_profiles（用户扩展信息）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| user_id | UUID | FK, UNIQUE | 关联 neon_auth.user |
| role | ENUM | NOT NULL | 角色：individual/employee/org_admin/admin |
| phone | VARCHAR(20) | | 手机号 |
| organization_id | UUID | FK | 所属企业 |
| preferences | JSONB | | 用户偏好设置 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### organizations（企业/组织）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(200) | NOT NULL | 企业名称 |
| status | ENUM | NOT NULL | 状态：trial/active/vip/suspended |
| contact_name | VARCHAR(100) | | 联系人 |
| contact_email | VARCHAR(255) | | 联系邮箱 |
| contact_phone | VARCHAR(20) | | 联系电话 |
| employee_limit | INTEGER | DEFAULT 10 | 员工上限 |
| employee_count | INTEGER | DEFAULT 0 | 当前员工数 |
| creator_id | UUID | FK, NOT NULL | 创建者（管理员） |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

---

### 3.2 商品相关

#### courses（课程）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| slug | VARCHAR(100) | UNIQUE | URL 友好标识 |
| title | VARCHAR(200) | NOT NULL | 课程标题 |
| description | TEXT | | 课程描述 |
| cover_image | VARCHAR(500) | | 封面图 URL |
| status | ENUM | NOT NULL | draft/published/archived |
| type | ENUM | NOT NULL | free/paid/member_only |
| price | DECIMAL(10,2) | NOT NULL | 价格 |
| original_price | DECIMAL(10,2) | | 原价 |
| instructor | VARCHAR(100) | | 讲师 |
| duration | INTEGER | | 总时长（分钟） |
| chapter_count | INTEGER | DEFAULT 0 | 章节数 |
| student_count | INTEGER | DEFAULT 0 | 学员数 |
| rating | DECIMAL(2,1) | DEFAULT 0 | 评分 |
| rating_count | INTEGER | DEFAULT 0 | 评分人数 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### chapters（课程章节）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| course_id | UUID | FK, NOT NULL | 所属课程 |
| title | VARCHAR(200) | NOT NULL | 章节标题 |
| description | TEXT | | 章节描述 |
| sort_order | INTEGER | NOT NULL | 排序 |
| duration | INTEGER | | 时长（分钟） |
| video_url | VARCHAR(500) | | 视频 URL |
| is_free | BOOLEAN | DEFAULT false | 是否可试看 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### membership_plans（会员套餐）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| code | VARCHAR(50) | UNIQUE | 套餐代码 |
| name | VARCHAR(100) | NOT NULL | 套餐名称 |
| type | ENUM | NOT NULL | monthly/quarterly/yearly/enterprise |
| price | DECIMAL(10,2) | NOT NULL | 价格 |
| original_price | DECIMAL(10,2) | | 原价 |
| duration_days | INTEGER | NOT NULL | 有效天数 |
| features | JSONB | | 权益列表 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| sort_order | INTEGER | DEFAULT 0 | 排序 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### resources（数字资源）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| title | VARCHAR(200) | NOT NULL | 资源标题 |
| description | TEXT | | 资源描述 |
| cover_image | VARCHAR(500) | | 封面图 |
| type | ENUM | NOT NULL | ebook/template/material/tool |
| price | DECIMAL(10,2) | NOT NULL | 价格 |
| original_price | DECIMAL(10,2) | | 原价 |
| file_url | VARCHAR(500) | | 文件 URL |
| file_size | INTEGER | | 文件大小（字节） |
| download_count | INTEGER | DEFAULT 0 | 下载次数 |
| is_member_free | BOOLEAN | DEFAULT false | 会员免费 |
| is_active | BOOLEAN | DEFAULT true | 是否上架 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

---

### 3.3 订单相关

#### orders（订单）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| order_no | VARCHAR(50) | UNIQUE | 订单号 |
| user_id | UUID | FK, NOT NULL | 用户 ID |
| organization_id | UUID | FK | 企业 ID（企业订单） |
| status | ENUM | NOT NULL | pending/paid/cancelled/refunded |
| total_amount | DECIMAL(10,2) | NOT NULL | 总金额 |
| discount_amount | DECIMAL(10,2) | DEFAULT 0 | 优惠金额 |
| payment_method | ENUM | | wechat/alipay |
| payment_no | VARCHAR(100) | | 第三方支付流水号 |
| paid_at | TIMESTAMP | | 支付时间 |
| expired_at | TIMESTAMP | | 订单过期时间 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### order_items（订单明细）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| order_id | UUID | FK, NOT NULL | 订单 ID |
| product_type | VARCHAR(20) | NOT NULL | course/membership/resource |
| product_id | UUID | NOT NULL | 商品 ID |
| product_name | VARCHAR(200) | NOT NULL | 商品名称（快照） |
| quantity | INTEGER | DEFAULT 1 | 数量 |
| unit_price | DECIMAL(10,2) | NOT NULL | 单价 |
| total_price | DECIMAL(10,2) | NOT NULL | 小计 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

---

### 3.4 授权与进度

#### licenses（用户授权）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| user_id | UUID | FK, NOT NULL | 用户 ID |
| organization_id | UUID | FK | 企业 ID（企业授权） |
| type | ENUM | NOT NULL | personal/enterprise/trial |
| product_type | VARCHAR(20) | NOT NULL | course/membership/resource |
| product_id | UUID | NOT NULL | 商品 ID |
| order_id | UUID | FK | 关联订单 |
| start_at | TIMESTAMP | NOT NULL | 生效时间 |
| expire_at | TIMESTAMP | | 过期时间（null=永久） |
| is_active | BOOLEAN | DEFAULT true | 是否有效 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**唯一约束**：`(user_id, product_type, product_id)` - 用户对同一商品只能有一个授权

#### user_progress（学习进度）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| user_id | UUID | FK, NOT NULL | 用户 ID |
| course_id | UUID | FK, NOT NULL | 课程 ID |
| chapter_id | UUID | FK | 章节 ID |
| progress | INTEGER | DEFAULT 0 | 播放进度（秒） |
| duration | INTEGER | DEFAULT 0 | 视频时长（秒） |
| is_completed | BOOLEAN | DEFAULT false | 是否完成 |
| completed_at | TIMESTAMP | | 完成时间 |
| last_watched_at | TIMESTAMP | | 最后观看时间 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**唯一约束**：`(user_id, chapter_id)` - 用户对每章节只有一条记录

---

## 4. 索引策略

### 4.1 主要索引

| 表 | 索引 | 类型 | 用途 |
|------|------|------|------|
| user_profiles | user_id | UNIQUE | 快速查找用户扩展信息 |
| user_profiles | organization_id | INDEX | 按企业查询员工 |
| courses | slug | UNIQUE | URL 路由查找 |
| courses | status, type | INDEX | 课程列表筛选 |
| chapters | course_id | INDEX | 按课程查章节 |
| orders | order_no | UNIQUE | 订单号查找 |
| orders | user_id | INDEX | 用户订单列表 |
| orders | status | INDEX | 订单状态筛选 |
| licenses | user_id | INDEX | 用户授权列表 |
| licenses | (user_id, product_type, product_id) | UNIQUE | 防止重复授权 |
| user_progress | user_id | INDEX | 用户学习记录 |
| user_progress | (user_id, chapter_id) | UNIQUE | 防止重复进度 |

---

## 5. 约束实现（来自 real.md）

| 约束 | 实现方式 | 相关表 |
|------|----------|--------|
| R-01 密码加密 | Neon Auth 自动处理 | neon_auth.account |
| R-02 支付安全 | 不存储支付凭证，仅 payment_no | orders |
| R-03 金额计算 | 服务端计算 total_amount | orders, order_items |
| R-04 内容保护 | 查询时 JOIN licenses 验证 | licenses |
| R-05 数据隔离 | organization_id 过滤 | 所有业务表 |

---

## 6. 迁移命令

```bash
# 生成迁移 SQL
bunx drizzle-kit generate

# 推送到数据库（开发环境）
bunx drizzle-kit push

# 运行迁移（生产环境）
bunx drizzle-kit migrate

# 打开可视化管理
bunx drizzle-kit studio
```

---

## 7. 与 Cog 模型的映射

| Cog 实体 | 数据库表 | 说明 |
|----------|----------|------|
| user | neon_auth.user + user_profiles | 认证 + 业务扩展 |
| organization | organizations | 企业/组织 |
| course | courses + chapters | 课程 + 章节 |
| membership | membership_plans | 会员套餐 |
| resource | resources | 数字资源 |
| order | orders + order_items | 订单 + 明细 |
| license | licenses | 用户授权 |
| (新增) | user_progress | 学习进度 |

---

**文档版本**：v1.0.0
**创建日期**：2025-01-30
**Schema 文件**：`src/db/schema.ts`
**维护者**：xiaoyi
