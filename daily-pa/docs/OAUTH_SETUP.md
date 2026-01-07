# OAuth 登录配置教程

本文档详细说明如何配置 Google 和 Apple 第三方登录功能。

---

## 📋 前提条件

- Supabase 项目已创建
- 应用已部署或有可访问的 URL
- Google 账号（用于 Google 登录）
- Apple Developer 账号（用于 Apple 登录，需付费 $99/年）

---

## 🔵 Google 登录配置

### 步骤 1: 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击顶部的项目下拉菜单
3. 点击 **"新建项目"**
4. 输入项目名称（例如：CLASP）
5. 点击 **"创建"**

### 步骤 2: 启用 Google+ API

1. 在左侧菜单中，选择 **"API 和服务"** > **"库"**
2. 搜索 **"Google+ API"**
3. 点击进入，然后点击 **"启用"**

### 步骤 3: 配置 OAuth 同意屏幕

1. 在左侧菜单中，选择 **"API 和服务"** > **"OAuth 同意屏幕"**
2. 选择 **"外部"**（如果是个人项目）
3. 点击 **"创建"**
4. 填写必填信息：
   - **应用名称**: CLASP
   - **用户支持电子邮件**: 你的邮箱
   - **应用首页**: `https://your-domain.com`
   - **授权域**: `your-domain.com`（不要加 https://）
   - **开发者联系信息**: 你的邮箱
5. 点击 **"保存并继续"**
6. **作用域** 页面：点击 **"保存并继续"**（使用默认）
7. **测试用户** 页面：添加测试用户邮箱（开发阶段需要）
8. 点击 **"保存并继续"**

### 步骤 4: 创建 OAuth 2.0 客户端 ID

1. 在左侧菜单中，选择 **"API 和服务"** > **"凭据"**
2. 点击 **"创建凭据"** > **"OAuth 客户端 ID"**
3. 选择应用类型：**"Web 应用"**
4. 填写信息：
   - **名称**: CLASP Web Client
   - **已获授权的 JavaScript 来源**:
     ```
     http://localhost:3000
     https://your-domain.com
     ```
   - **已获授权的重定向 URI**:
     ```
     https://your-supabase-project.supabase.co/auth/v1/callback
     ```
     
     > 💡 **重要**: 将 `your-supabase-project` 替换为你的 Supabase 项目 ID
     > 
     > 在 Supabase Dashboard > Settings > API 中可以找到完整的 URL

5. 点击 **"创建"**
6. 复制 **客户端 ID** 和 **客户端密钥**

### 步骤 5: 在 Supabase 中配置 Google 登录

1. 打开 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 在左侧菜单中，选择 **"Authentication"** > **"Providers"**
4. 找到 **"Google"**，点击展开
5. 启用 **"Enable Sign in with Google"**
6. 填写信息：
   - **Client ID**: 粘贴从 Google Cloud 复制的客户端 ID
   - **Client Secret**: 粘贴从 Google Cloud 复制的客户端密钥
7. 点击 **"Save"**

### 步骤 6: 测试 Google 登录

1. 确保你的应用正在运行
2. 访问登录页面
3. 点击 **"使用 Google 登录"** 按钮
4. 选择 Google 账号并授权
5. 应该会重定向回你的应用并自动登录

---

## 🍎 Apple 登录配置

### 步骤 1: 创建 App ID

1. 访问 [Apple Developer Portal](https://developer.apple.com/account/)
2. 登录你的 Apple Developer 账号
3. 在左侧菜单中，选择 **"Certificates, Identifiers & Profiles"**
4. 选择 **"Identifiers"**
5. 点击 **"+"** 按钮创建新的 Identifier
6. 选择 **"App IDs"**，点击 **"Continue"**
7. 选择 **"App"**，点击 **"Continue"**
8. 填写信息：
   - **Description**: CLASP
   - **Bundle ID**: 选择 **"Explicit"**，输入 `com.yourcompany.clasp`
   - **Capabilities**: 勾选 **"Sign in with Apple"**
9. 点击 **"Continue"**，然后点击 **"Register"**

### 步骤 2: 创建 Services ID

1. 在 **"Identifiers"** 页面，点击 **"+"** 按钮
2. 选择 **"Services IDs"**，点击 **"Continue"**
3. 填写信息：
   - **Description**: CLASP Web Service
   - **Identifier**: `com.yourcompany.clasp.web`（必须不同于 App ID）
4. 点击 **"Continue"**，然后点击 **"Register"**
5. 点击刚创建的 Services ID
6. 勾选 **"Sign in with Apple"**
7. 点击 **"Configure"** 按钮
8. 配置域名和重定向 URL：
   - **Primary App ID**: 选择之前创建的 App ID
   - **Domains and Subdomains**: 
     ```
     your-supabase-project.supabase.co
     ```
   - **Return URLs**:
     ```
     https://your-supabase-project.supabase.co/auth/v1/callback
     ```
     
     > 💡 **重要**: 将 `your-supabase-project` 替换为你的 Supabase 项目 ID

9. 点击 **"Next"**，然后点击 **"Done"**
10. 点击 **"Continue"**，然后点击 **"Save"**

### 步骤 3: 创建 Private Key

1. 在左侧菜单中，选择 **"Keys"**
2. 点击 **"+"** 按钮
3. 填写信息：
   - **Key Name**: CLASP Sign in with Apple Key
   - **Enable**: 勾选 **"Sign in with Apple"**
4. 点击 **"Configure"**
5. 选择之前创建的 **Primary App ID**
6. 点击 **"Save"**
7. 点击 **"Continue"**，然后点击 **"Register"**
8. 点击 **"Download"** 下载 `.p8` 文件
9. **记录 Key ID**（10 位字符）

> ⚠️ **重要**: 私钥只能下载一次，请妥善保管！

### 步骤 4: 获取 Team ID

1. 在 Apple Developer Portal 右上角，点击你的账号名称
2. 在下拉菜单中可以看到 **Team ID**（10 位字符）
3. 复制并保存

### 步骤 5: 在 Supabase 中配置 Apple 登录

1. 打开 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 在左侧菜单中，选择 **"Authentication"** > **"Providers"**
4. 找到 **"Apple"**，点击展开
5. 启用 **"Enable Sign in with Apple"**
6. 填写信息：
   - **Services ID**: `com.yourcompany.clasp.web`（步骤 2 中创建的）
   - **Team ID**: 你的 Team ID（步骤 4 中获取的）
   - **Key ID**: 你的 Key ID（步骤 3 中记录的）
   - **Private Key**: 打开下载的 `.p8` 文件，复制全部内容粘贴
7. 点击 **"Save"**

### 步骤 6: 测试 Apple 登录

1. 确保你的应用正在运行
2. 访问登录页面
3. 点击 **"使用 Apple 登录"** 按钮
4. 使用 Apple ID 登录并授权
5. 应该会重定向回你的应用并自动登录

---

## 🔧 环境变量配置

确保你的 `.env.local` 文件包含以下变量：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URL (用于 OAuth 回调)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # 开发环境
# NEXT_PUBLIC_SITE_URL=https://your-domain.com  # 生产环境

# Dev Mode (可选，用于跳过认证)
NEXT_PUBLIC_DEV_SKIP_AUTH=true
```

---

## 🚀 部署到生产环境

### 更新 Google OAuth 设置

1. 在 Google Cloud Console 中，编辑 OAuth 客户端 ID
2. 在 **"已获授权的 JavaScript 来源"** 中添加：
   ```
   https://your-production-domain.com
   ```
3. 在 **"已获授权的重定向 URI"** 中确保包含：
   ```
   https://your-supabase-project.supabase.co/auth/v1/callback
   ```

### 更新 Apple OAuth 设置

1. 在 Apple Developer Portal 中，编辑 Services ID
2. 在 **"Sign in with Apple"** 配置中，确保域名和重定向 URL 正确

### 更新环境变量

在生产环境中设置：
```env
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

---

## 🐛 常见问题

### Google 登录问题

**问题**: 点击 Google 登录后显示 "redirect_uri_mismatch"

**解决方案**:
1. 检查 Google Cloud Console 中的重定向 URI 是否正确
2. 确保使用的是 Supabase 的回调 URL：
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
3. 等待几分钟让 Google 更新配置

**问题**: "Access blocked: This app's request is invalid"

**解决方案**:
1. 确保 OAuth 同意屏幕已配置完成
2. 添加测试用户（开发阶段）
3. 检查授权域是否正确

### Apple 登录问题

**问题**: "invalid_client"

**解决方案**:
1. 检查 Services ID 是否正确
2. 确保 Team ID 和 Key ID 正确
3. 检查私钥是否完整复制（包括 BEGIN 和 END 行）

**问题**: "invalid_request"

**解决方案**:
1. 检查重定向 URL 是否与 Apple Developer Portal 中配置的完全一致
2. 确保域名已正确添加

---

## 📚 参考资料

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Apple Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-apple)

---

## ✅ 配置检查清单

### Google 登录
- [ ] Google Cloud 项目已创建
- [ ] Google+ API 已启用
- [ ] OAuth 同意屏幕已配置
- [ ] OAuth 客户端 ID 已创建
- [ ] 重定向 URI 已正确配置
- [ ] Supabase 中 Google Provider 已启用
- [ ] Client ID 和 Secret 已填写
- [ ] 测试登录成功

### Apple 登录
- [ ] Apple Developer 账号已激活
- [ ] App ID 已创建并启用 Sign in with Apple
- [ ] Services ID 已创建并配置
- [ ] 域名和重定向 URL 已配置
- [ ] Private Key 已创建并下载
- [ ] Team ID 已获取
- [ ] Supabase 中 Apple Provider 已启用
- [ ] 所有配置信息已填写
- [ ] 测试登录成功

---

**配置完成后，记得重启你的开发服务器！** 🎉
