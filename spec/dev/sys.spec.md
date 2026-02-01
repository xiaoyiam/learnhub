# 系统架构规格书：LearnHub

<meta>
  <document-id>learnhub-sys-spec</document-id>
  <version>1.0.0</version>
  <project>LearnHub 学习平台</project>
  <type>系统架构规格书</type>
  <created>2025-01-30</created>
  <depends>real.md, cog.md, pr.spec.md, userstory.spec.md, db.spec.md</depends>
</meta>

---

## 1. 架构概述

**架构模式**：分层架构 + 模块化设计

**部署策略**：Serverless（Vercel）

**核心技术栈**：

| 层级 | 技术选型 |
|------|----------|
| 全站框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| CSS 框架 | Tailwind CSS |
| UI 组件 | shadcn/ui |
| 包管理 | Bun |
| 数据库 | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| 认证授权 | Neon Auth (Better Auth) |
| 支付 | 微信支付 / 支付宝 |
| 视频播放 | HLS.js |
| 部署 | Vercel |

---

## 2. 系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        客户端（浏览器/App）                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │
│  │  课程中心  │  │  学习中心  │  │  会员中心  │  │  企业后台  │        │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘        │
└────────┼──────────────┼──────────────┼──────────────┼───────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Next.js App Router                             │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                        API Routes                           │     │
│  │  /api/auth  /api/courses  /api/orders  /api/payments       │     │
│  │  /api/memberships  /api/licenses  /api/organizations       │     │
│  └────────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                      Services 层                            │     │
│  │  AuthService  CourseService  OrderService  PaymentService  │     │
│  │  LicenseService  OrganizationService  ProgressService      │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────────────────┐
│    Neon Auth        │      │           Neon Database              │
│  (用户认证)          │      │  (PostgreSQL + Drizzle ORM)         │
│  ┌───────────────┐  │      │  ┌─────────────────────────────┐    │
│  │ neon_auth     │  │      │  │ public schema               │    │
│  │ • user        │──┼──────┼──│ • user_profiles             │    │
│  │ • account     │  │      │  │ • organizations             │    │
│  │ • session     │  │      │  │ • courses, chapters         │    │
│  └───────────────┘  │      │  │ • orders, order_items       │    │
└─────────────────────┘      │  │ • licenses, user_progress   │    │
                             │  └─────────────────────────────┘    │
                             └─────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────────────────┐
│   第三方服务         │      │           CDN / 对象存储             │
│  • 微信支付 API      │      │  • 视频文件存储                      │
│  • 支付宝 API        │      │  • 课程封面图片                      │
│  • 邮件服务          │      │  • 数字资源文件                      │
└─────────────────────┘      └─────────────────────────────────────┘
```

---

## 3. 子系统设计

### 3.1 认证子系统 (Auth)

**职责**：用户注册、登录、会话管理、权限验证

**组件**：
- `AuthProvider`：客户端认证状态管理
- `AuthMiddleware`：API 路由认证中间件
- `RoleGuard`：角色权限校验

**接口**：
- 输入：用户凭证、Session Token
- 输出：用户信息、权限列表

**依赖关系**：
- 依赖于：Neon Auth
- 被使用于：所有需要认证的子系统

---

### 3.2 课程子系统 (Course)

**职责**：课程展示、章节管理、内容交付

**组件**：
- `CourseList`：课程列表页
- `CourseDetail`：课程详情页
- `VideoPlayer`：视频播放器
- `ChapterNav`：章节导航

**接口**：
- 输入：课程 ID、用户授权
- 输出：课程内容、视频流

**依赖关系**：
- 依赖于：Auth、License
- 被使用于：Learning、Order

---

### 3.3 订单子系统 (Order)

**职责**：购物车、订单创建、订单管理

**组件**：
- `Cart`：购物车
- `Checkout`：结算页
- `OrderList`：订单列表
- `OrderDetail`：订单详情

**接口**：
- 输入：商品信息、用户 ID
- 输出：订单信息

**依赖关系**：
- 依赖于：Auth、Course
- 被使用于：Payment、License

---

### 3.4 支付子系统 (Payment)

**职责**：支付流程、支付回调、退款处理

**组件**：
- `PaymentModal`：支付弹窗
- `QRCode`：支付二维码
- `PaymentCallback`：回调处理

**接口**：
- 输入：订单 ID、支付方式
- 输出：支付状态、交易流水

**依赖关系**：
- 依赖于：Order
- 被使用于：License

---

### 3.5 授权子系统 (License)

**职责**：用户授权管理、权限验证、过期检查

**组件**：
- `LicenseCheck`：授权验证中间件
- `LicenseManager`：授权管理

**接口**：
- 输入：用户 ID、商品 ID
- 输出：授权状态、有效期

**依赖关系**：
- 依赖于：Auth、Payment
- 被使用于：Course、Learning

---

### 3.6 学习子系统 (Learning)

**职责**：学习进度跟踪、完成证书

**组件**：
- `ProgressTracker`：进度跟踪
- `LearningDashboard`：学习中心
- `Certificate`：证书生成

**接口**：
- 输入：用户 ID、课程 ID、播放进度
- 输出：进度记录、完成状态

**依赖关系**：
- 依赖于：Auth、License、Course
- 被使用于：无

---

### 3.7 会员子系统 (Membership)

**职责**：会员套餐展示、订阅管理、续费

**组件**：
- `MembershipPlans`：套餐展示
- `MembershipStatus`：会员状态
- `RenewalReminder`：续费提醒

**接口**：
- 输入：用户 ID、套餐 ID
- 输出：会员状态、有效期

**依赖关系**：
- 依赖于：Auth、Order、Payment
- 被使用于：License

---

### 3.8 企业子系统 (Organization)

**职责**：企业账户管理、员工管理、培训管理

**组件**：
- `OrgDashboard`：企业后台
- `EmployeeManager`：员工管理
- `TaskAssignment`：任务分配
- `LearningReport`：学习报表

**接口**：
- 输入：企业 ID、管理员操作
- 输出：员工列表、学习数据

**依赖关系**：
- 依赖于：Auth、License、Learning
- 被使用于：无

---

## 4. API 设计

### 4.1 认证 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 用户注册 | 无 |
| POST | /api/auth/login | 用户登录 | 无 |
| POST | /api/auth/logout | 用户登出 | 必需 |
| GET | /api/auth/session | 获取会话 | 必需 |
| POST | /api/auth/forgot-password | 忘记密码 | 无 |

---

### 4.2 课程 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/courses | 课程列表 | 无 |
| GET | /api/courses/:slug | 课程详情 | 无 |
| GET | /api/courses/:id/chapters | 课程章节 | 无 |
| GET | /api/courses/:id/chapters/:chapterId | 章节详情 | 必需 |
| GET | /api/courses/:id/video/:chapterId | 获取视频流 | 必需 + 授权 |

**课程列表请求参数**：
```typescript
interface CourseListQuery {
  page?: number;        // 页码，默认 1
  limit?: number;       // 每页数量，默认 20
  type?: 'free' | 'paid' | 'member_only';
  status?: 'published';
  q?: string;           // 搜索关键词
}
```

**课程详情响应**：
```typescript
interface CourseResponse {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  type: 'free' | 'paid' | 'member_only';
  price: string;
  originalPrice?: string;
  instructor: string;
  duration: number;
  chapterCount: number;
  studentCount: number;
  rating: string;
  ratingCount: number;
  chapters: ChapterSummary[];
}
```

---

### 4.3 订单 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/orders | 订单列表 | 必需 |
| POST | /api/orders | 创建订单 | 必需 |
| GET | /api/orders/:id | 订单详情 | 必需 |
| POST | /api/orders/:id/cancel | 取消订单 | 必需 |

**创建订单请求**：
```typescript
interface CreateOrderRequest {
  items: {
    productType: 'course' | 'membership' | 'resource';
    productId: string;
    quantity: number;
  }[];
  couponCode?: string;
}
```

**创建订单响应**：
```typescript
interface CreateOrderResponse {
  orderId: string;
  orderNo: string;
  totalAmount: string;
  discountAmount: string;
  expiredAt: string;
}
```

---

### 4.4 支付 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/payments/create | 创建支付 | 必需 |
| GET | /api/payments/:orderId/status | 支付状态 | 必需 |
| POST | /api/payments/wechat/callback | 微信回调 | 无 |
| POST | /api/payments/alipay/callback | 支付宝回调 | 无 |

**创建支付请求**：
```typescript
interface CreatePaymentRequest {
  orderId: string;
  method: 'wechat' | 'alipay';
}
```

**创建支付响应**：
```typescript
interface CreatePaymentResponse {
  paymentUrl?: string;  // 支付宝跳转 URL
  qrCode?: string;      // 微信二维码
  expiredAt: string;
}
```

---

### 4.5 授权 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/licenses | 我的授权列表 | 必需 |
| GET | /api/licenses/check | 检查授权 | 必需 |

**检查授权请求**：
```typescript
interface CheckLicenseQuery {
  productType: 'course' | 'membership' | 'resource';
  productId: string;
}
```

**检查授权响应**：
```typescript
interface CheckLicenseResponse {
  hasAccess: boolean;
  license?: {
    id: string;
    type: 'personal' | 'enterprise' | 'trial';
    expireAt?: string;
  };
}
```

---

### 4.6 学习进度 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/progress | 学习进度列表 | 必需 |
| GET | /api/progress/:courseId | 课程进度 | 必需 |
| POST | /api/progress/:courseId/:chapterId | 更新进度 | 必需 |

**更新进度请求**：
```typescript
interface UpdateProgressRequest {
  progress: number;     // 当前播放秒数
  duration: number;     // 视频总时长
  isCompleted?: boolean;
}
```

---

### 4.7 会员 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/memberships/plans | 会员套餐列表 | 无 |
| GET | /api/memberships/status | 我的会员状态 | 必需 |
| POST | /api/memberships/subscribe | 订阅会员 | 必需 |

---

### 4.8 企业 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/organizations | 注册企业 | 必需 |
| GET | /api/organizations/:id | 企业详情 | 必需 + 管理员 |
| GET | /api/organizations/:id/employees | 员工列表 | 必需 + 管理员 |
| POST | /api/organizations/:id/invite | 邀请员工 | 必需 + 管理员 |
| DELETE | /api/organizations/:id/employees/:userId | 移除员工 | 必需 + 管理员 |
| GET | /api/organizations/:id/reports | 学习报表 | 必需 + 管理员 |

---

## 5. 目录结构

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # 认证路由组（无导航栏）
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (main)/                       # 主应用路由组
│   │   ├── page.tsx                  # 首页
│   │   ├── courses/                  # 课程相关
│   │   │   ├── page.tsx              # 课程列表
│   │   │   └── [slug]/page.tsx       # 课程详情
│   │   ├── learn/                    # 学习相关
│   │   │   ├── page.tsx              # 我的学习
│   │   │   └── [courseId]/           # 学习页面
│   │   │       └── [chapterId]/page.tsx
│   │   ├── membership/               # 会员相关
│   │   │   └── page.tsx
│   │   ├── orders/                   # 订单相关
│   │   │   ├── page.tsx              # 订单列表
│   │   │   └── [id]/page.tsx         # 订单详情
│   │   ├── checkout/                 # 结算
│   │   │   └── page.tsx
│   │   └── profile/                  # 个人中心
│   │       └── page.tsx
│   ├── org/                          # 企业后台
│   │   ├── page.tsx                  # 企业首页
│   │   ├── employees/page.tsx        # 员工管理
│   │   ├── tasks/page.tsx            # 任务管理
│   │   └── reports/page.tsx          # 学习报表
│   ├── api/                          # API 路由
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── courses/route.ts
│   │   ├── courses/[slug]/route.ts
│   │   ├── orders/route.ts
│   │   ├── payments/route.ts
│   │   ├── licenses/route.ts
│   │   ├── progress/route.ts
│   │   ├── memberships/route.ts
│   │   └── organizations/route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── components/                       # React 组件
│   ├── ui/                           # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── course/                       # 课程相关组件
│   │   ├── CourseCard.tsx
│   │   ├── CourseList.tsx
│   │   ├── CourseDetail.tsx
│   │   ├── ChapterList.tsx
│   │   └── VideoPlayer.tsx
│   ├── order/                        # 订单相关组件
│   │   ├── Cart.tsx
│   │   ├── CartItem.tsx
│   │   ├── Checkout.tsx
│   │   └── PaymentModal.tsx
│   ├── membership/                   # 会员相关组件
│   │   ├── PlanCard.tsx
│   │   └── MembershipStatus.tsx
│   ├── org/                          # 企业相关组件
│   │   ├── EmployeeTable.tsx
│   │   ├── TaskAssignment.tsx
│   │   └── LearningChart.tsx
│   └── layout/                       # 布局组件
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── Sidebar.tsx
│       └── MobileNav.tsx
│
├── lib/                              # 工具和配置
│   ├── db/                           # 数据库
│   │   ├── schema.ts                 # Drizzle Schema
│   │   └── index.ts                  # 数据库连接
│   ├── auth/                         # 认证
│   │   └── config.ts
│   ├── payment/                      # 支付
│   │   ├── wechat.ts
│   │   └── alipay.ts
│   ├── validations/                  # Zod 验证
│   │   ├── order.ts
│   │   ├── course.ts
│   │   └── user.ts
│   └── utils.ts                      # 通用工具
│
├── services/                         # 业务逻辑层
│   ├── auth.service.ts
│   ├── course.service.ts
│   ├── order.service.ts
│   ├── payment.service.ts
│   ├── license.service.ts
│   ├── progress.service.ts
│   ├── membership.service.ts
│   └── organization.service.ts
│
├── hooks/                            # React Hooks
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useCourse.ts
│   ├── useProgress.ts
│   └── useMembership.ts
│
├── types/                            # TypeScript 类型
│   ├── course.ts
│   ├── order.ts
│   ├── user.ts
│   └── api.ts
│
├── constants/                        # 常量
│   ├── routes.ts
│   └── config.ts
│
└── stores/                           # 状态管理（如需要）
    └── cart.ts
```

---

## 6. 安全架构

### 6.1 安全层级

```
┌─────────────────────────────────────┐
│         传输层                       │
│   HTTPS + HSTS + TLS 1.3            │
├─────────────────────────────────────┤
│         认证层                       │
│   Neon Auth (Better Auth)           │
│   • Session 管理                    │
│   • 密码 bcrypt 哈希                │
├─────────────────────────────────────┤
│         授权层                       │
│   • 角色权限 (RBAC)                 │
│   • 资源所有权验证                   │
│   • 企业数据隔离                     │
├─────────────────────────────────────┤
│         数据保护层                   │
│   • 输入验证 (Zod)                  │
│   • SQL 注入防护 (Drizzle ORM)      │
│   • XSS 防护 (React 自动转义)       │
│   • 支付凭证不存储                   │
└─────────────────────────────────────┘
```

### 6.2 安全需求矩阵（来自 real.md）

| 约束 | 需求 | 实现方式 |
|------|------|----------|
| R-01 | 密码加密 | bcrypt 哈希（Neon Auth 自动处理） |
| R-02 | 支付安全 | 官方 SDK，不存储支付凭证 |
| R-03 | 金额验证 | 服务端计算，客户端只读 |
| R-04 | 内容保护 | License 验证 + 视频加密 |
| R-05 | 数据隔离 | organization_id 强制过滤 |

### 6.3 API 安全策略

| 策略 | 实现 |
|------|------|
| 认证 | 所有写操作必须登录 |
| 授权 | 检查资源所有权 |
| 限流 | API 调用频率限制 |
| 验证 | Zod Schema 验证所有输入 |
| 日志 | 关键操作审计日志 |

---

## 7. 技术决策记录 (ADR)

### ADR-001：框架选择 - Next.js 15

**状态**：已接受

**背景**：需要一个支持 SSR、API Routes、良好 TypeScript 支持的全栈框架。

**决策**：使用 Next.js 15 with App Router。

**后果**：
- ✅ 服务端渲染提升 SEO 和首屏性能
- ✅ API Routes 简化后端开发
- ✅ 与 Vercel 完美集成
- ⚠️ App Router 学习曲线

---

### ADR-002：数据库选择 - Neon PostgreSQL

**状态**：已接受

**背景**：需要一个可靠的关系型数据库，支持无服务器部署。

**决策**：使用 Neon Serverless PostgreSQL。

**后果**：
- ✅ 无服务器架构，自动扩展
- ✅ 分支功能便于开发测试
- ✅ 与 Neon Auth 原生集成
- ⚠️ 冷启动延迟

---

### ADR-003：ORM 选择 - Drizzle

**状态**：已接受

**背景**：需要类型安全的 ORM，与 TypeScript 良好集成。

**决策**：使用 Drizzle ORM。

**后果**：
- ✅ 完整的类型推断
- ✅ 轻量级，性能好
- ✅ SQL-like 语法，学习曲线低
- ⚠️ 生态系统较 Prisma 小

---

### ADR-004：认证方案 - Neon Auth

**状态**：已接受

**背景**：需要安全可靠的用户认证系统。

**决策**：使用 Neon Auth（基于 Better Auth）。

**后果**：
- ✅ 与 Neon 数据库原生集成
- ✅ 用户数据在自己数据库
- ✅ 无需 webhook 同步
- ⚠️ 依赖 Neon 平台

---

### ADR-005：支付集成 - 微信/支付宝官方 SDK

**状态**：已接受

**背景**：需要支持国内主流支付方式。

**决策**：直接对接微信支付和支付宝官方 API。

**后果**：
- ✅ 安全合规
- ✅ 手续费低
- ⚠️ 需要企业资质

---

### ADR-006：视频播放 - HLS 加密流

**状态**：已接受

**背景**：需要保护付费视频内容，防止非法下载。

**决策**：使用 HLS 加密流 + 播放权限验证。

**后果**：
- ✅ 视频内容加密
- ✅ 支持自适应码率
- ⚠️ 需要视频转码服务

---

## 8. 性能考虑

### 8.1 前端优化

| 策略 | 实现 |
|------|------|
| 代码分割 | Next.js 自动代码分割 |
| 图片优化 | Next/Image 自动优化 |
| 懒加载 | 课程列表无限滚动 |
| 缓存 | SWR / React Query |

### 8.2 后端优化

| 策略 | 实现 |
|------|------|
| 数据库索引 | 常用查询字段索引 |
| 连接池 | Neon Serverless 连接池 |
| 缓存 | 热门课程 Redis 缓存（可选） |
| CDN | 静态资源和视频 CDN 分发 |

---

## 9. 质量检查清单

- [x] 架构模式适合需求（分层 + 模块化）
- [x] 所有子系统有清晰的职责
- [x] API 遵循 RESTful 约定
- [x] 目录结构支持模块化
- [x] 安全需求已解决（real.md 5 条约束）
- [x] 技术决策已记录（6 个 ADR）
- [x] 已纳入 real.md 中的约束

---

**文档版本**：v1.0.0
**创建日期**：2025-01-30
**基于技能**：dev-system-architecture (v3.1)
**维护者**：xiaoyi
