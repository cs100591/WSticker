# OAuth 登录快速配置指南（中文）

## 🔵 Google 登录配置（5 步）

### 1️⃣ 创建 Google Cloud 项目
- 访问：https://console.cloud.google.com/
- 点击"新建项目" → 输入名称 → 创建

### 2️⃣ 启用 API
- 左侧菜单：API 和服务 → 库
- 搜索"Google+ API" → 启用

### 3️⃣ 配置 OAuth 同意屏幕
- 左侧菜单：API 和服务 → OAuth 同意屏幕
- 选择"外部" → 创建
- 填写：
  - 应用名称：CLASP
  - 用户支持邮箱：你的邮箱
  - 授权域：你的域名（不要加 https://）
  - 开发者联系信息：你的邮箱
- 保存并继续（其他页面使用默认设置）

### 4️⃣ 创建 OAuth 客户端 ID
- 左侧菜单：API 和服务 → 凭据
- 创建凭据 → OAuth 客户端 ID
- 应用类型：Web 应用
- 填写：
  - 名称：CLASP Web Client
  - 已获授权的 JavaScript 来源：
    ```
    http://localhost:3000
    https://你的域名.com
    ```
  - 已获授权的重定向 URI：
    ```
    https://你的项目ID.supabase.co/auth/v1/callback
    ```
- 创建 → **复制客户端 ID 和密钥**

### 5️⃣ 在 Supabase 配置
- 打开 Supabase Dashboard
- Authentication → Providers → Google
- 启用"Enable Sign in with Google"
- 粘贴 Client ID 和 Client Secret
- 保存

✅ **完成！测试 Google 登录**

---

## 🍎 Apple 登录配置（5 步）

> ⚠️ **需要**: Apple Developer 账号（$99/年）

### 1️⃣ 创建 App ID
- 访问：https://developer.apple.com/account/
- Certificates, Identifiers & Profiles → Identifiers
- 点击 "+" → App IDs → App
- 填写：
  - Description: CLASP
  - Bundle ID: com.yourcompany.clasp
  - 勾选 "Sign in with Apple"
- Register

### 2️⃣ 创建 Services ID
- Identifiers → 点击 "+" → Services IDs
- 填写：
  - Description: CLASP Web Service
  - Identifier: com.yourcompany.clasp.web
- Register
- 点击刚创建的 Services ID
- 勾选 "Sign in with Apple" → Configure
- 填写：
  - Primary App ID: 选择步骤 1 的 App ID
  - Domains: `你的项目ID.supabase.co`
  - Return URLs: `https://你的项目ID.supabase.co/auth/v1/callback`
- Done → Save

### 3️⃣ 创建 Private Key
- Keys → 点击 "+"
- 填写：
  - Key Name: CLASP Sign in with Apple Key
  - 勾选 "Sign in with Apple" → Configure
  - 选择 Primary App ID
- Save → Continue → Register
- **下载 .p8 文件**（只能下载一次！）
- **记录 Key ID**（10 位字符）

### 4️⃣ 获取 Team ID
- 点击右上角账号名称
- 查看并复制 Team ID（10 位字符）

### 5️⃣ 在 Supabase 配置
- 打开 Supabase Dashboard
- Authentication → Providers → Apple
- 启用"Enable Sign in with Apple"
- 填写：
  - Services ID: com.yourcompany.clasp.web
  - Team ID: 你的 Team ID
  - Key ID: 你的 Key ID
  - Private Key: 打开 .p8 文件，复制全部内容
- 保存

✅ **完成！测试 Apple 登录**

---

## 🔧 环境变量

在 `.env.local` 中确保有：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🐛 常见错误

### Google 登录

**错误**: "redirect_uri_mismatch"
- **解决**: 检查 Google Cloud Console 中的重定向 URI 是否为：
  ```
  https://你的项目ID.supabase.co/auth/v1/callback
  ```

**错误**: "Access blocked"
- **解决**: 在 OAuth 同意屏幕添加测试用户

### Apple 登录

**错误**: "invalid_client"
- **解决**: 检查 Services ID、Team ID、Key ID 是否正确

**错误**: "invalid_request"
- **解决**: 检查重定向 URL 是否与 Apple Developer Portal 完全一致

---

## 📍 重要提示

1. **Supabase 回调 URL 格式**：
   ```
   https://你的项目ID.supabase.co/auth/v1/callback
   ```
   
2. **在 Supabase Dashboard 查看项目 ID**：
   - Settings → API → Project URL

3. **测试前重启开发服务器**

4. **Apple 私钥只能下载一次**，请妥善保管！

5. **开发阶段**：
   - Google: 需要添加测试用户
   - Apple: 可以直接使用

---

## 🎯 快速检查

配置完成后，测试步骤：

1. 访问 `http://localhost:3000/login`
2. 点击"使用 Google 登录"或"使用 Apple 登录"
3. 授权后应该自动跳转到 Dashboard

如果失败，检查：
- [ ] Supabase Provider 是否已启用
- [ ] 回调 URL 是否正确
- [ ] 环境变量是否正确
- [ ] 开发服务器是否已重启

---

**需要帮助？** 查看完整文档：`OAUTH_SETUP.md`
