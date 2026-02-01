# LearnHub 功能开发路线图

> 本文档记录 LearnHub 在线学习平台从当前状态到可商用版本所需实现的功能清单。
>
> 最后更新：2026-02-01

---

## 项目当前状态

### 已完成功能 ✅

| 模块 | 功能 | 说明 |
|------|------|------|
| 用户认证 | 登录/注册 | Neon Auth 集成 |
| 用户认证 | 角色权限 | individual/employee/org_admin/admin |
| 课程管理 | 课程 CRUD | 创建、编辑、删除、发布 |
| 课程管理 | 章节管理 | 视频/图文类型，排序，试看设置 |
| 课程管理 | 文件上传 | 阿里云 OSS 集成 |
| 学习系统 | 视频播放 | 章节播放器 |
| 学习系统 | 图文阅读 | Markdown 渲染 |
| 学习系统 | 进度追踪 | 记录每章节学习进度 |
| 订单系统 | 订单创建 | 课程/会员订单 |
| 订单系统 | 订单管理 | 状态更新、退款处理 |
| 支付系统 | 二维码收款 | 微信/支付宝个人收款码 |
| 支付系统 | 手动确认 | 管理员确认收款 |
| 会员系统 | 套餐管理 | 月度/季度/年度/企业 |
| 会员系统 | 权限控制 | 会员专属课程访问 |
| 后台管理 | 仪表盘 | 统计数据概览 |
| 后台管理 | 课程管理 | 完整 CRUD |
| 后台管理 | 订单管理 | 列表、详情、状态更新 |
| 后台管理 | 会员套餐 | 套餐编辑 |
| 后台管理 | 支付设置 | 收款码配置 |
| 安全模块 | 限流器 | API 请求限流 |
| 安全模块 | 输入验证 | Zod Schema 验证 |
| 安全模块 | 内容保护 | 签名 URL、防盗链 |
| 安全模块 | 审计日志 | 安全事件记录 |
| 安全模块 | 安全中间件 | CSP、CSRF 保护 |
| 通知系统 | 邮件通知 | 订单通知、支付成功 |

### 当前完成度：约 55%

---

## Phase 1：MVP 完善

> 预计工期：1-2 周
> 目标：完善基础功能，达到可上线的最低标准

### 1.1 用户资料管理

- [ ] **用户资料页面** `/profile`
  - 查看个人信息
  - 编辑昵称、头像
  - 修改密码
  - 绑定手机号

- [ ] **Server Actions**
  - `getUserProfile()` - 获取用户资料
  - `updateUserProfile()` - 更新资料
  - `updatePassword()` - 修改密码

- [ ] **数据库更新**
  - 确保 `userProfiles` 表字段完整

### 1.2 课程搜索与筛选

- [ ] **课程列表页优化** `/courses`
  - 关键词搜索
  - 分类筛选（需新增分类表）
  - 价格排序（免费/付费）
  - 类型筛选（视频/图文）
  - 分页加载

- [ ] **数据库更新**
  - 新增 `categories` 分类表
  - `courses` 表添加 `categoryId` 字段

- [ ] **Server Actions**
  - `searchCourses()` - 搜索课程
  - `getCategories()` - 获取分类

### 1.3 法律合规页面

- [ ] **隐私政策页面** `/privacy`
- [ ] **用户协议页面** `/terms`
- [ ] **Cookie 提示组件**
- [ ] **页脚链接更新**

### 1.4 基础 SEO 优化

- [ ] **Meta 标签优化**
  - 首页 title/description
  - 课程详情页动态 meta
  - Open Graph 标签

- [ ] **Sitemap 生成**
  - `/sitemap.xml` 路由
  - 动态生成课程链接

- [ ] **robots.txt**

---

## Phase 2：商业闭环

> 预计工期：2-3 周
> 目标：完善支付和营销功能，形成商业闭环

### 2.1 优惠券系统

- [ ] **数据库设计**
  ```
  coupons 表：
  - id, code, name
  - type: fixed/percent
  - value: 折扣金额/比例
  - minAmount: 最低消费
  - maxDiscount: 最大折扣（百分比券）
  - totalCount: 总数量
  - usedCount: 已使用
  - startAt, endAt: 有效期
  - applicableType: all/course/membership
  - applicableIds: 适用商品ID列表
  ```

- [ ] **后台管理**
  - `/admin/coupons` - 优惠券列表
  - `/admin/coupons/new` - 创建优惠券
  - `/admin/coupons/[id]` - 编辑优惠券

- [ ] **前台功能**
  - 结算页优惠券输入框
  - 优惠券验证和折扣计算
  - 订单记录使用的优惠券

- [ ] **Server Actions**
  - `createCoupon()` - 创建优惠券
  - `validateCoupon()` - 验证优惠券
  - `applyCoupon()` - 应用优惠券

### 2.2 课程评价系统

- [ ] **数据库设计**
  ```
  reviews 表：
  - id, courseId, userId
  - rating: 1-5 星
  - content: 评价内容
  - isAnonymous: 是否匿名
  - status: pending/approved/rejected
  - createdAt, updatedAt
  ```

- [ ] **前台功能**
  - 课程详情页评价列表
  - 提交评价（需已购买）
  - 评分统计显示

- [ ] **后台管理**
  - `/admin/reviews` - 评价审核
  - 批量审核/删除

- [ ] **Server Actions**
  - `submitReview()` - 提交评价
  - `getReviews()` - 获取评价列表
  - `approveReview()` - 审核评价

### 2.3 发票功能

- [ ] **数据库设计**
  ```
  invoices 表：
  - id, orderId, userId
  - type: personal/company
  - title: 抬头
  - taxNumber: 税号
  - email: 接收邮箱
  - status: pending/issued/sent
  - invoiceNo: 发票号
  - invoiceUrl: 发票文件URL
  - createdAt, issuedAt
  ```

- [ ] **前台功能**
  - 订单详情页申请发票
  - 发票信息填写表单
  - 发票下载

- [ ] **后台管理**
  - `/admin/invoices` - 发票管理
  - 开具发票、上传发票

- [ ] **Server Actions**
  - `requestInvoice()` - 申请发票
  - `issueInvoice()` - 开具发票

### 2.4 第三方支付对接（可选）

- [ ] **微信支付 Native**
  - 商户号配置
  - 下单接口
  - 回调处理
  - 订单查询

- [ ] **支付宝当面付**
  - 应用配置
  - 预创建接口
  - 回调处理

- [ ] **支付设置页面更新**
  - 第三方支付开关
  - API 密钥配置

---

## Phase 3：体验提升

> 预计工期：2-3 周
> 目标：提升用户体验和运营效率

### 3.1 站内消息系统

- [ ] **数据库设计**
  ```
  notifications 表：
  - id, userId
  - type: system/order/course/comment
  - title, content
  - link: 跳转链接
  - isRead: 是否已读
  - createdAt
  ```

- [ ] **前台功能**
  - 顶部消息图标 + 未读数
  - `/notifications` 消息中心
  - 标记已读/全部已读

- [ ] **触发场景**
  - 订单支付成功
  - 课程更新（新章节）
  - 评论回复
  - 会员到期提醒

- [ ] **Server Actions**
  - `getNotifications()` - 获取通知列表
  - `markAsRead()` - 标记已读
  - `sendNotification()` - 发送通知

### 3.2 学习证书

- [ ] **数据库设计**
  ```
  certificates 表：
  - id, courseId, userId
  - certificateNo: 证书编号
  - issuedAt: 颁发时间
  - completedAt: 完成时间
  - pdfUrl: 证书PDF链接
  ```

- [ ] **证书生成**
  - PDF 模板设计
  - 动态填充信息
  - 二维码验证

- [ ] **前台功能**
  - 课程完成后显示证书
  - `/certificates` 我的证书页面
  - 证书下载/分享

- [ ] **触发条件**
  - 所有章节完成
  - 自动生成证书

### 3.3 课程问答/评论

- [ ] **数据库设计**
  ```
  comments 表：
  - id, chapterId, userId
  - parentId: 父评论ID（回复）
  - content: 内容
  - status: pending/approved/rejected
  - createdAt, updatedAt
  ```

- [ ] **前台功能**
  - 章节页评论区
  - 提交问题/评论
  - 回复功能
  - 点赞功能

- [ ] **后台管理**
  - 评论审核
  - 讲师回复入口

### 3.4 数据统计面板

- [ ] **后台仪表盘增强**
  - 收入趋势图（日/周/月）
  - 用户增长曲线
  - 热门课程排行
  - 订单转化漏斗

- [ ] **数据导出**
  - 订单报表导出
  - 用户数据导出

---

## Phase 4：增长功能（可选）

> 根据业务需要选择实现

### 4.1 分销/推荐系统

- [ ] **数据库设计**
  ```
  referrals 表：
  - id, referrerId, refereeId
  - orderId, commission
  - status: pending/paid
  - createdAt, paidAt
  ```

- [ ] **功能**
  - 用户专属推荐码
  - 推荐返佣设置
  - 佣金提现

### 4.2 直播功能

- [ ] **直播间**
  - 第三方直播 SDK 集成
  - 直播回放
  - 互动聊天

### 4.3 企业版功能

- [ ] **企业管理**
  - 员工批量导入
  - 学习任务分配
  - 学习报告

- [ ] **企业采购**
  - 批量购买折扣
  - 企业发票

### 4.4 移动端

- [ ] **响应式优化**
  - 移动端适配检查
  - 触摸交互优化

- [ ] **小程序/APP**
  - 微信小程序
  - React Native APP

---

## 技术债务清理

### 待优化项

- [ ] 统一错误处理
- [ ] API 响应格式规范化
- [ ] 组件库整理（提取公共组件）
- [ ] 单元测试覆盖
- [ ] E2E 测试
- [ ] TypeScript 严格模式检查
- [ ] 代码注释完善
- [ ] 性能优化（图片懒加载、代码分割）

### 依赖更新

- [ ] Next.js 版本对齐（@next/swc 版本警告）
- [ ] 安全漏洞修复（npm audit）

---

## 上线检查清单

### 部署前

- [ ] 环境变量配置完整
- [ ] 数据库迁移执行
- [ ] 管理员账户创建
- [ ] 支付配置测试
- [ ] 邮件配置测试

### 域名与备案

- [ ] 域名购买与解析
- [ ] SSL 证书配置
- [ ] ICP 备案（中国大陆）
- [ ] 公安备案（如需）

### 监控与运维

- [ ] 错误监控（Sentry）
- [ ] 性能监控
- [ ] 日志收集
- [ ] 数据库备份策略
- [ ] CDN 配置

### 安全检查

- [ ] HTTPS 强制
- [ ] 敏感信息脱敏
- [ ] SQL 注入防护（Drizzle ORM）
- [ ] XSS 防护（React 默认）
- [ ] CSRF 防护（已实现）
- [ ] 限流配置（已实现）

---

## 参考资源

### 环境变量模板

```env
# 数据库
DATABASE_URL=

# 认证
AUTH_SECRET=

# 邮件
EMAIL_PROVIDER=resend
EMAIL_FROM=
RESEND_API_KEY=
ADMIN_EMAIL=

# OSS 存储
OSS_REGION=
OSS_BUCKET=
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=

# 安全
CONTENT_SIGNING_SECRET=

# 站点
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SITE_NAME=LearnHub
```

### 数据库迁移命令

```bash
# 生成迁移
npx drizzle-kit generate

# 执行迁移
npx drizzle-kit push

# 打开数据库管理界面
npx drizzle-kit studio
```

---

## 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2026-02-01 | 初始版本，完成功能评估 |

