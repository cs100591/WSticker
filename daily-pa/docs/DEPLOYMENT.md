# 部署指南 - CLASP 应用

本文档说明如何将 CLASP 应用从开发模式切换到生产模式并部署。

---

## 📋 部署前检查清单

### 1. 环境变量配置

确保 `.env.local` 文件配置正确：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qmpuasmglrkbnsymgaah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7IbnqO7JXVqr7kavaxoPEg_Zxh0kons

# Site URL (for OAuth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3001  # 本地开发
# NEXT_PUBLIC_SITE_URL=https://your-domain.com  # 生产环境

# 开发模式：跳过认证 (仅用于本地开发)
# NEXT_PUBLIC_DEV_SKIP_AUTH=true  # ⚠️ 生产环境必须注释掉或删除！

# DeepSeek API
DEEPSEEK_API_KEY=your-deepseek-api-key

# Google Cloud Vision API
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id
```

### 2. 关闭开发模式

**重要**: 生产环境必须关闭 dev mode！

✅ **正确配置**（生产环境）:
```env
# NEXT_PUBLIC_DEV_SKIP_AUTH=true  # 已注释
```

❌ **错误配置**（不要在生产环境使用）:
```env
NEXT_PUBLIC_DEV_SKIP_AUTH=true  # 这会跳过所有认证！
```

### 3. Supabase 数据库表

确保 Supabase 中已创建所有必要的表：

- ✅ `todos` - 待办事项
- ✅ `calendar_events` - 日历事件
- ✅ `expenses` - 消费记录
- ✅ `profiles` - 用户资料（可选）

### 4. OAuth 配置

确保已配置 Google OAuth（参考 `OAUTH_SETUP.md`）：

- ✅ Google Cloud Console 配置完成
- ✅ Supabase Google Provider 已启用
- ✅ 回调 URL 已正确配置

---

## 🚀 部署到 Vercel（推荐）

### 步骤 1: 准备代码

```bash
# 确保所有更改已提交
git add -A
git commit -m "chore: prepare for production deployment"
git push
```

### 步骤 2: 连接 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New Project"**
3. 选择你的 GitHub 仓库
4. 点击 **"Import"**

### 步骤 3: 配置环境变量

在 Vercel 项目设置中添加环境变量：

**必需的环境变量**:

```
NEXT_PUBLIC_SUPABASE_URL=https://qmpuasmglrkbnsymgaah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7IbnqO7JXVqr7kavaxoPEg_Zxh0kons
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
DEEPSEEK_API_KEY=your-deepseek-api-key
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id
```

**⚠️ 重要**: 不要添加 `NEXT_PUBLIC_DEV_SKIP_AUTH` 变量！

### 步骤 4: 部署

1. 点击 **"Deploy"**
2. 等待构建完成
3. 访问生成的 URL 测试应用

### 步骤 5: 更新 OAuth 配置

部署完成后，更新 Google OAuth 配置：

1. 打开 Google Cloud Console
2. 编辑 OAuth 客户端 ID
3. 在 **"已获授权的 JavaScript 来源"** 中添加：
   ```
   https://your-vercel-domain.vercel.app
   ```
4. 保存更改

---

## 🌐 部署到 Netlify

### 步骤 1: 连接 Netlify

1. 访问 [Netlify Dashboard](https://app.netlify.com/)
2. 点击 **"Add new site"** > **"Import an existing project"**
3. 选择 GitHub 并授权
4. 选择你的仓库

### 步骤 2: 配置构建设置

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Base directory**: `daily-pa`

### 步骤 3: 添加环境变量

在 Netlify 项目设置中添加所有环境变量（同 Vercel）。

### 步骤 4: 部署

点击 **"Deploy site"** 并等待完成。

---

## 🐳 使用 Docker 部署

### Dockerfile

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t clasp-app .

# 运行容器
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://qmpuasmglrkbnsymgaah.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -e NEXT_PUBLIC_SITE_URL=https://your-domain.com \
  clasp-app
```

---

## 🔒 安全检查

### 生产环境安全清单

- [ ] `NEXT_PUBLIC_DEV_SKIP_AUTH` 已删除或注释
- [ ] 所有 API 密钥已正确配置
- [ ] Supabase RLS (Row Level Security) 已启用
- [ ] OAuth 回调 URL 已正确配置
- [ ] HTTPS 已启用
- [ ] 环境变量未暴露在客户端代码中

### 测试认证流程

1. **测试邮箱登录**:
   - 访问 `/login`
   - 使用邮箱密码登录
   - 确认能正常访问 Dashboard

2. **测试 Google 登录**:
   - 点击"使用 Google 登录"
   - 完成 Google 授权
   - 确认能正常登录

3. **测试数据持久化**:
   - 创建待办事项
   - 刷新页面
   - 确认数据仍然存在

---

## 📊 监控和日志

### Vercel 日志

1. 打开 Vercel Dashboard
2. 选择你的项目
3. 点击 **"Logs"** 查看实时日志

### Supabase 日志

1. 打开 Supabase Dashboard
2. 选择你的项目
3. 点击 **"Logs"** > **"API"** 查看 API 请求日志

---

## 🔄 更新部署

### 自动部署（推荐）

Vercel 和 Netlify 都支持自动部署：

1. 推送代码到 GitHub
   ```bash
   git push
   ```
2. 平台自动检测并部署

### 手动部署

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

---

## 🐛 常见问题

### 问题 1: 登录后显示 "Unauthorized"

**原因**: Dev mode 仍然启用

**解决方案**:
1. 检查环境变量中是否有 `NEXT_PUBLIC_DEV_SKIP_AUTH=true`
2. 删除或注释该变量
3. 重新部署

### 问题 2: Google 登录失败

**原因**: OAuth 配置不正确

**解决方案**:
1. 检查 Google Cloud Console 中的重定向 URI
2. 确保包含 Supabase 回调 URL
3. 检查 Supabase 中的 Google Provider 配置

### 问题 3: 数据无法保存

**原因**: Supabase 表不存在或 RLS 配置错误

**解决方案**:
1. 检查 Supabase 中是否有所有必要的表
2. 检查 RLS 策略是否正确
3. 查看 Supabase 日志了解详细错误

### 问题 4: 环境变量未生效

**原因**: 环境变量未正确配置或未重新部署

**解决方案**:
1. 检查部署平台的环境变量设置
2. 确保变量名正确（注意大小写）
3. 重新部署应用

---

## 📝 部署后检查清单

- [ ] 应用可以正常访问
- [ ] 登录功能正常工作
- [ ] Google OAuth 登录正常
- [ ] 数据可以正常创建和读取
- [ ] Dashboard 显示实时数据
- [ ] 所有页面正常加载
- [ ] 移动端显示正常
- [ ] AI 聊天功能正常（如果已配置）
- [ ] 收据扫描功能正常（如果已配置）

---

## 🎯 性能优化建议

1. **启用 CDN**: Vercel 和 Netlify 自动提供
2. **图片优化**: 使用 Next.js Image 组件
3. **代码分割**: Next.js 自动处理
4. **缓存策略**: 配置适当的缓存头
5. **数据库索引**: 在 Supabase 中为常用查询添加索引

---

## 📞 获取帮助

如果遇到问题：

1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 查看 [Supabase 文档](https://supabase.com/docs)
3. 查看项目的 `OAUTH_SETUP.md` 文档
4. 检查 GitHub Issues

---

**部署成功后，记得更新 README.md 中的演示链接！** 🎉
