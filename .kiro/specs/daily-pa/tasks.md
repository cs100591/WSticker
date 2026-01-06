# Implementation Plan: Daily PA

## Overview

本实现计划将 Daily PA 虚拟私人助理应用的设计转化为可执行的开发任务。采用增量开发方式，从项目基础设施开始，逐步构建核心功能模块，确保每个阶段都有可验证的交付物。

## Tasks

- [x] 1. 项目初始化与基础设施搭建
  - [x] 1.1 创建 Next.js 14 项目并配置 TypeScript
    - 使用 `create-next-app` 创建项目，启用 App Router
    - 配置 TypeScript 严格模式
    - 设置路径别名 (`@/`)
    - _Requirements: 12.1, 12.2_

  - [x] 1.2 配置 Tailwind CSS 和 Shadcn/ui
    - 安装并配置 Tailwind CSS
    - 初始化 Shadcn/ui 组件库
    - 设置主题色（主色 #3B82F6，辅助色 #10B981）
    - _Requirements: 8.1, 8.2_

  - [x] 1.3 配置 Supabase 客户端
    - 安装 `@supabase/supabase-js` 和 `@supabase/ssr`
    - 创建 Supabase 客户端配置（client.ts, server.ts, middleware.ts）
    - 设置环境变量
    - _Requirements: 11.1, 11.6_

  - [x] 1.4 配置测试框架
    - 安装 Vitest、React Testing Library、fast-check
    - 配置测试环境和脚本
    - 创建测试目录结构
    - _Requirements: Testing Strategy_

- [x] 2. Checkpoint - 确保项目基础设施正常运行
  - 运行 `npm run dev` 确认项目启动
  - 运行 `npm run test` 确认测试框架配置正确


- [x] 3. 数据库 Schema 和类型定义
  - [x] 3.1 创建 Supabase 数据库迁移文件
    - 创建 users、todos、expenses、calendar_events 表
    - 创建 monthly_reports、notification_settings 表
    - 创建 google_calendar_connections 表
    - 设置索引和外键约束
    - _Requirements: 11.1, 11.5_

  - [x] 3.2 配置 Row Level Security (RLS) 策略
    - 为每个表创建用户数据隔离策略
    - 创建管理员访问策略
    - _Requirements: 11.5, Security_

  - [x] 3.3 生成 TypeScript 类型定义
    - 使用 Supabase CLI 生成数据库类型
    - 创建业务层类型定义（Todo, Expense, CalendarEvent 等）
    - 创建 API 请求/响应类型
    - _Requirements: Data Models_

  - [x] 3.4 编写数据模型属性测试
    - **Property 3: 待办事项 CRUD 往返一致性**
    - **Property 7: 待办事项优先级排序**
    - **Property 9: 消费记录 CRUD 往返一致性**
    - **Property 13: 消费汇总聚合正确性**
    - **Validates: Requirements 2.1, 2.3, 4.1, 4.4, 4.7**

- [x] 4. 用户认证系统
  - [x] 4.1 实现邮箱注册和登录
    - 创建注册页面 `/register`
    - 创建登录页面 `/login`
    - 实现 Supabase Auth 邮箱认证
    - 实现邮箱验证流程
    - _Requirements: 1.1, 1.4_

  - [x] 4.2 实现 Google OAuth 登录
    - 配置 Google OAuth 应用
    - 实现 Google 登录按钮和回调处理
    - 处理新用户创建和现有用户关联
    - _Requirements: 1.3_

  - [x] 4.3 实现忘记密码功能
    - 创建密码重置请求页面
    - 实现密码重置邮件发送
    - 创建密码重置确认页面
    - _Requirements: 1.5, 1.6_

  - [x] 4.4 创建认证中间件和保护路由
    - 实现 Supabase 中间件检查认证状态
    - 创建认证上下文和 hooks
    - 保护需要登录的路由
    - _Requirements: 1.4, 1.7_

  - [x] 4.5 编写认证属性测试
    - **Property 1: 用户注册数据持久化**
    - **Property 2: 认证凭证验证**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.7**

- [ ] 5. Checkpoint - 确保认证系统正常工作
  - 测试邮箱注册、登录、登出流程
  - 测试 Google OAuth 登录
  - 测试密码重置流程


- [x] 6. 布局组件和响应式设计
  - [x] 6.1 创建应用布局组件
    - 实现 Header 组件（导航、用户菜单）
    - 实现 Sidebar 组件（桌面端导航）
    - 实现 MobileNav 组件（底部标签栏，iOS 风格）
    - _Requirements: 8.1, 8.2, 8.5_

  - [x] 6.2 实现响应式布局系统
    - 创建响应式断点配置
    - 实现桌面/移动端布局切换
    - 添加 iOS 风格的动画和过渡效果
    - _Requirements: 8.3, 8.4, 8.6_

  - [x] 6.3 创建主仪表盘页面
    - 实现仪表盘布局
    - 添加快速操作入口
    - 显示今日待办和最近消费摘要
    - _Requirements: 8.1_

- [x] 7. 待办事项模块
  - [x] 7.1 创建待办事项 API 端点
    - 实现 GET /api/todos（列表查询，支持过滤和排序）
    - 实现 POST /api/todos（创建待办）
    - 实现 PUT /api/todos/:id（更新待办）
    - 实现 DELETE /api/todos/:id（删除待办）
    - 实现 PATCH /api/todos/:id/status（更新状态）
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 7.2 创建待办事项组件
    - 实现 TodoList 组件（列表展示）
    - 实现 TodoItem 组件（单项展示和操作）
    - 实现 TodoForm 组件（创建/编辑表单）
    - 实现 TodoFilters 组件（过滤和排序）
    - _Requirements: 2.1, 2.6, 2.7_

  - [x] 7.3 实现待办事项页面
    - 创建 `/todos` 页面
    - 集成 React hooks 进行数据获取和缓存
    - 实现乐观更新
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 7.4 编写待办事项属性测试
    - **Property 4: 待办事项状态转换**
    - **Property 5: 待办事项删除**
    - **Property 7: 待办事项优先级排序**
    - **Property 8: 待办事项标签过滤**
    - **Validates: Requirements 2.2, 2.4, 2.6, 2.7**

- [ ] 8. Checkpoint - 确保待办事项模块正常工作
  - 测试创建、编辑、删除待办事项
  - 测试状态切换和过滤功能
  - 运行属性测试确保正确性


- [ ] 9. 日历集成模块
  - [ ] 9.1 创建日历事件 API 端点
    - 实现 GET /api/calendar/events（获取事件列表）
    - 实现待办事项创建时自动创建日历事件
    - 实现日历事件与待办事项的双向同步
    - _Requirements: 2.5, 3.1_

  - [ ] 9.2 实现 Google Calendar 集成
    - 实现 Google Calendar OAuth 授权流程
    - 实现 GET /api/calendar/google/auth（授权）
    - 实现 POST /api/calendar/google/callback（回调）
    - 实现 POST /api/calendar/sync（同步事件）
    - _Requirements: 3.2, 3.3_

  - [ ] 9.3 创建日历视图组件
    - 实现 CalendarView 组件（月/周/日视图）
    - 实现 EventCard 组件（事件卡片）
    - 实现 CalendarSync 组件（同步状态和操作）
    - _Requirements: 3.5_

  - [ ] 9.4 实现日历页面
    - 创建 `/calendar` 页面
    - 集成日历视图和事件管理
    - 显示 Google Calendar 同步状态
    - _Requirements: 3.5, 3.6_

  - [ ] 9.5 编写日历同步属性测试
    - **Property 6: 待办事项与日历事件同步**
    - **Validates: Requirements 2.5, 3.1**

- [x] 10. 消费记录模块
  - [x] 10.1 创建消费记录 API 端点
    - 实现 GET /api/expenses（列表查询，支持过滤）
    - 实现 POST /api/expenses（创建记录）
    - 实现 PUT /api/expenses/:id（更新记录）
    - 实现 DELETE /api/expenses/:id（删除记录）
    - 实现 GET /api/expenses/summary（汇总统计）
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.7_

  - [x] 10.2 创建消费记录组件
    - 实现 ExpenseList 组件（列表展示）
    - 实现 ExpenseForm 组件（创建/编辑表单）
    - 实现 ExpenseChart 组件（图表展示）
    - 实现 CategoryPicker 组件（分类选择）
    - _Requirements: 4.1, 4.3, 4.7_

  - [ ] 10.3 实现收据上传功能
    - 配置 Supabase Storage 存储桶
    - 实现图片上传和预览
    - 关联收据到消费记录
    - _Requirements: 4.6_

  - [x] 10.4 实现消费记录页面
    - 创建 `/expenses` 页面
    - 集成列表、表单和图表组件
    - 实现按日期和分类过滤
    - _Requirements: 4.1, 4.2, 4.7_

  - [ ] 10.5 编写消费记录属性测试
    - **Property 9: 消费记录 CRUD 往返一致性**
    - **Property 10: 消费记录时间排序**
    - **Property 11: 消费记录删除**
    - **Property 12: 消费记录收据附件**
    - **Property 13: 消费汇总聚合正确性**
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5, 4.6, 4.7**

- [ ] 11. Checkpoint - 确保日历和消费模块正常工作
  - 测试日历事件创建和同步
  - 测试消费记录 CRUD 操作
  - 测试收据上传功能
  - 运行属性测试确保正确性


- [x] 12. AI 语音助手模块
  - [x] 12.1 创建语音处理 API 端点
    - 实现 POST /api/voice/parse（解析语音意图，使用 DeepSeek API）
    - 使用 Web Speech API 进行浏览器端语音转文字（免费）
    - 定义意图解析提示词模板
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 12.2 创建语音助手组件
    - 实现 VoiceAssistant 组件（语音输入模态框）
    - 实现录音按钮和状态显示
    - 实现转录结果展示和确认
    - _Requirements: 5.1, 5.6_

  - [x] 12.3 实现语音意图解析逻辑
    - 解析待办事项创建意图（标题、日期、优先级）
    - 解析消费记录创建意图（金额、分类、描述）
    - 处理模糊输入和确认流程
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 12.4 集成语音助手到主界面
    - 在仪表盘添加语音输入入口
    - 实现语音创建待办事项流程
    - 实现语音创建消费记录流程
    - 添加手动输入回退选项
    - _Requirements: 5.1, 5.7_

  - [ ] 12.5 编写语音解析属性测试
    - **Property 14: 语音输入解析 - 待办事项**
    - **Property 15: 语音输入解析 - 消费记录**
    - **Validates: Requirements 5.2, 5.3, 5.4**

- [ ] 13. 月度报告模块
  - [ ] 13.1 创建报告生成 API 端点
    - 实现 GET /api/reports/monthly（获取月度报告）
    - 实现 GET /api/reports/custom（自定义日期范围报告）
    - 实现 POST /api/reports/export（导出报告为 PDF）
    - _Requirements: 6.1, 6.6, 6.7_

  - [ ] 13.2 实现报告数据聚合逻辑
    - 计算待办事项完成率和统计
    - 计算消费分类汇总和趋势
    - 生成生产力洞察和建议
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ] 13.3 创建报告展示组件
    - 实现 MonthlyReport 组件（报告主视图）
    - 实现 ReportChart 组件（图表展示，使用 Recharts）
    - 实现 ReportExport 组件（导出选项）
    - _Requirements: 6.5, 6.7_

  - [ ] 13.4 实现报告页面
    - 创建 `/reports` 页面
    - 实现月份选择和自定义日期范围
    - 集成报告展示和导出功能
    - _Requirements: 6.5, 6.6_

  - [ ] 13.5 编写报告生成属性测试
    - **Property 16: 报告数据完整性**
    - **Validates: Requirements 6.2, 6.6**

- [ ] 14. Checkpoint - 确保语音助手和报告模块正常工作
  - 测试语音录制和转录
  - 测试意图解析和自动创建
  - 测试月度报告生成和导出
  - 运行属性测试确保正确性


- [ ] 15. 通知与分享模块
  - [ ] 15.1 配置邮件服务
    - 集成 Resend 邮件服务
    - 创建邮件模板（验证、重置密码、提醒、报告）
    - 实现邮件发送工具函数
    - _Requirements: 3.4, 7.2_

  - [ ] 15.2 实现通知设置功能
    - 创建 GET/PUT /api/notifications/settings 端点
    - 实现通知偏好设置页面
    - 支持邮件通知、每日/每周摘要设置
    - _Requirements: 7.6_

  - [ ] 15.3 实现待办事项提醒
    - 创建定时任务检查即将到期的待办
    - 发送邮件提醒通知
    - 实现提醒时间配置
    - _Requirements: 7.1_

  - [ ] 15.4 实现分享功能
    - 创建分享链接生成 API
    - 实现待办列表分享页面
    - 实现消费报告导出（PDF、CSV、Excel）
    - 添加分享权限控制
    - _Requirements: 7.3, 7.4, 7.5, 7.7_

  - [ ] 15.5 编写分享功能属性测试
    - **Property 17: 分享链接往返一致性**
    - **Property 18: 用户偏好设置持久化**
    - **Validates: Requirements 7.3, 7.5, 7.6**

- [ ] 16. 用户个人中心
  - [ ] 16.1 创建个人中心页面
    - 创建 `/profile` 页面
    - 实现个人信息展示和编辑
    - 实现头像上传功能
    - _Requirements: 9.1, 9.2_

  - [ ] 16.2 实现账户设置功能
    - 实现密码修改功能
    - 实现 Google 账户关联/取消关联
    - 实现账户删除功能（含确认流程）
    - _Requirements: 9.4, 9.5, 9.7_

  - [ ] 16.3 实现偏好设置功能
    - 实现主题切换（亮色/暗色/跟随系统）
    - 实现语言切换（中文/英文）
    - 实现货币和时区设置
    - _Requirements: 9.3, 9.6_

  - [ ] 16.4 编写用户设置属性测试
    - **Property 19: 用户数据级联删除**
    - **Validates: Requirements 9.7**

- [ ] 17. Checkpoint - 确保通知和个人中心模块正常工作
  - 测试邮件发送功能
  - 测试分享链接生成和访问
  - 测试个人信息编辑和偏好设置
  - 测试账户删除流程


- [ ] 18. 管理后台
  - [ ] 18.1 创建管理后台布局
    - 创建 `/admin` 路由组
    - 实现管理员认证检查
    - 创建管理后台导航和布局
    - _Requirements: 10.1_

  - [ ] 18.2 实现数据看板
    - 显示用户总数和活跃用户数
    - 显示内容统计（待办、消费记录数量）
    - 实现使用趋势图表
    - _Requirements: 10.1, 10.6_

  - [ ] 18.3 实现用户管理功能
    - 用户列表展示和搜索
    - 用户详情查看
    - 用户账户操作（暂停、删除）
    - _Requirements: 10.2, 10.3_

  - [ ] 18.4 实现系统设置
    - 全局参数配置
    - 管理员操作日志
    - _Requirements: 10.5, 10.7_

- [ ] 19. 性能优化与 PWA
  - [ ] 19.1 实现性能优化
    - 配置图片优化（Next.js Image）
    - 实现代码分割和懒加载
    - 配置 CDN 和静态资源缓存
    - _Requirements: 12.2, 12.6_

  - [ ] 19.2 实现离线支持
    - 配置 Service Worker
    - 实现离线数据缓存
    - 实现离线操作队列和同步
    - _Requirements: 11.3, 11.4_

  - [ ] 19.3 配置 PWA
    - 创建 Web App Manifest
    - 配置应用图标和启动画面
    - 支持添加到主屏幕
    - _Requirements: 8.3_

  - [ ] 19.4 编写数据同步属性测试
    - **Property 20: 跨设备数据一致性**
    - **Validates: Requirements 11.1, 11.2**

- [ ] 20. 最终集成与部署
  - [ ] 20.1 配置 CI/CD 流水线
    - 创建 GitHub Actions 工作流
    - 配置 lint、测试、构建任务
    - 配置 Vercel 自动部署
    - _Requirements: CI/CD Pipeline_

  - [ ] 20.2 配置监控和错误追踪
    - 集成 Vercel Analytics
    - 集成 Sentry 错误追踪
    - 配置性能监控告警
    - _Requirements: 12.4_

  - [ ] 20.3 安全审查和加固
    - 审查 RLS 策略完整性
    - 配置 CSP 和安全头
    - 进行安全漏洞扫描
    - _Requirements: 11.5, 11.6, Security_

  - [ ] 20.4 编写 E2E 测试
    - 测试完整用户注册和登录流程
    - 测试待办事项完整 CRUD 流程
    - 测试消费记录完整 CRUD 流程
    - 测试报告生成和导出流程
    - _Requirements: Testing Strategy_

- [ ] 21. Final Checkpoint - 确保所有功能正常工作
  - 运行完整测试套件（单元测试、属性测试、E2E 测试）
  - 进行手动功能验收测试
  - 确认生产环境部署成功
  - 验证监控和告警配置

## Notes

- 所有任务均为必需任务，确保全面的功能覆盖和测试覆盖
- 每个 Checkpoint 用于验证阶段性成果，确保增量开发的质量
- 属性测试使用 fast-check 库，每个测试运行 100+ 次迭代
- 所有 API 端点需要实现统一的错误处理和响应格式
- 移动端 UI 需遵循 iOS Human Interface Guidelines
