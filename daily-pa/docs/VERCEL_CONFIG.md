# Vercel 生产环境配置指南 / Vercel Production Configuration Guide

## 🚀 当前部署状态 / Current Deployment Status

- **部署 URL**: https://daily-pa1.vercel.app
- **问题**: 仍在开发模式，无法登录
- **原因**: 环境变量配置不正确

---

## ✅ 配置步骤 / Configuration Steps

### 第 1 步：访问 Vercel Dashboard

1. 打开浏览器访问: https://vercel.com/dashboard
2. 登录您的 Vercel 账户
3. 找到并点击 `daily-pa1` 项目

### 第 2 步：进入环境变量设置

1. 点击顶部导航栏的 **Settings** 标签
2. 在左侧菜单中点击 **Environment Variables**

### 第 3 步：删除开发模式变量（重要！）

⚠️ **如果存在以下变量，必须删除：**

```
NEXT_PUBLIC_DEV_SKIP_AUTH
```

**删除方法：**
- 找到该变量
- 点击右侧的 **...** 菜单
- 选择 **Delete**
- 确认删除

### 第 4 步：添加生产环境变量

点击 **Add New** 按钮，逐个添加以下环境变量：

#### 4.1 Supabase 配置

**变量名**: `NEXT_PUBLIC_SUPABASE_URL`
**值**: 
```
https://qmpuasmglrkbnsymgaah.supabase.co
```
**环境**: 选择 `Production`, `Preview`, `Development` (全选)

---

**变量名**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**值**: 
```
sb_publishable_7IbnqO7JXVqr7kavaxoPEg_Zxh0kons
```
**环境**: 选择 `Production`, `Preview`, `Development` (全选)

---

#### 4.2 站点 URL 配置

**变量名**: `NEXT_PUBLIC_SITE_URL`
**值**: 
```
https://daily-pa1.vercel.app
```
**环境**: 选择 `Production` 和 `Preview`

---

#### 4.3 DeepSeek API 配置

**变量名**: `DEEPSEEK_API_KEY`
**值**: 
```
sk-f71c96e47d6b435cbfc35ebd357075b3
```
**环境**: 选择 `Production`, `Preview`, `Development` (全选)

---

#### 4.4 Google Cloud Vision API 配置

**变量名**: `GOOGLE_PROJECT_ID`
**值**: 
```
gen-lang-client-0429021933
```
**环境**: 选择 `Production`, `Preview`, `Development` (全选)

---

**变量名**: `GOOGLE_PRIVATE_KEY_ID`
**值**: 
```
7cdf4d138848ff5ec81d58f108ebdfe478442feb
```
**环境**: 选择 `Production`, `Preview`, `Development` (全选)

---

**变量名**: `GOOGLE_PRIVATE_KEY`
**值**: 
```
-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCMu+IsEcKxeBgi
cX/6qSzBarhHBE32tDuHR6KlBw3Dl2sjklIt0Rxn1LsF18H7dD8UNjdjdp4ToUmV
JoERGT9GMC0it9X5kgGudhaDOKiRNXv39kbbhrpiHcg1hpDG+L8nE0GHqJ5uDWLD
GZDQ6Z60ROAE0jHeWwekwp4xkoDskWlf2hynBO9TUouCY9DyculNeqXGfUDAzwg8
K0GP31slXMK9hBXbzaSHRDjgvK8RTvw92dAijhEc0hv29m1iQAa67fhA3ser1LKM
9oTrTj30LaTco/HkdH+G15/EYhWLdrbkB/URqilP7QOZvEny12kl1BiA/wx4w6gv
CsMq2+8TAgMBAAECggEARaZUrI/Lpc40T5ORjYn9cunwsoDwXtjbHzv2RCtGBhdh
uFSZpEA6CS8QsjcSM3LYJxYf+nNBj6CCjLTmKoKuvHtqUyTdWqsGdwPNZ3r6fgcU
x+bUMaAvjRCFPexPqZGA9QNEKrHqWrf4OWtlLud4Gmp93hTzBkNR+Joy9YC2mp0u
pdKFW6eVy7wB8eAkPkULucKgexHCId7ovLnfV7HPbhcvngkDVKdAz+3A/OPtkXlR
ApZBhLthz/nTKVVrFtnfsJ9uaKJUYnp5Eay0A97Zp4IHf478Om4HpBnfDcdDDuz5
xk5FlKyRbCVFNcv5U0leBtOAzlitcQJzAMoa42fl0QKBgQDEjVBM0fpniItPnM0N
7NHUsoPqKEuRugPdljKUl6ZvfHUMvdPRm81DKivAWuvSh8QbNNzN0NKiUSt+wb2h
nQ9HT/0f9Tw7rPrAemeu8t8h2A+3L1DMTj0UjInMAw3jvOHEzqkB07uTzhl70cLF
0/quV8jXop5aHQ9dCuLaPwD2kQKBgQC3TKuvuwztIi5aNc2Vn4V2qNQnCa5CMv07
4ZnRr8DMb8CRmWiElEbJ4Qsf6qrLcDAMaTIki+9GyK+dYl1A6d1gHKGRroW32HxE
6BWgybiruJM1O5XVxGtH9tC2drYmWl0THN1h4lCUpCSOLYGvqcpRNIUxUCYoQoTk
nYz76U/FYwKBgHZfGMY7C1BBBo1axI+nWTN8kz95JxHLcjqIE0w0DJNF5ARZanDp
IPRbOGAvIaj4BN3Rt0zof4Ir2kMLkRX8zc/H14zgl3blFVrIHRtav5DVW5maEFIK
qHRwsyg/iqTmAx4Qy+4Cwwwf6m8Mg/26TVWkHpvnHvDsYW1KehawLPdRAoGAAYE1
n5mvf3raWo86gtHubIzyQOfJcG2uuoEdnCUPNh5svEVAIGZ/NkUMrFRm1oizPEbY
zIgBjNk059vY3CGPWayifump21qBmqc1Fj7Rr0cynitBDaIxJ0QVbooG8MWpIfEI
uDb9Zlr6mdgxyllgec4ukbsQtR/mq2HHuIGvz/UCgYBtj4S37A4pIzdIqlDoBlCL
xwhPzrezRFbPiOFH+WxkL6KvR6KXLPO8aqAQuAbYM693EnwflIVz8ykPQbM4M9cy
znRUeXDC1BleJHWWS+WfGuJGbimn6MG3/IadZXHbJnPBTce1eiZGKwN9hYV4pZv6
hTOsHII9lMorAk73u9uw9w==
-----END PRIVATE KEY-----
```
**环境**: 选择 `Production`, `Preview`, `Development` (全选)
**注意**: 复制整个私钥，包括开头和结尾的标记

---

**变量名**: `GOOGLE_CLIENT_EMAIL`
**值**: 
```
daily-pa@gen-lang-client-0429021933.iam.gserviceaccount.com
```
**环境**: 选择 `Production`, `Preview`, `Development` (全选)

---

**变量名**: `GOOGLE_CLIENT_ID`
**值**: 
```
106089833813432456279
```
**环境**: 选择 `Production`, `Preview`, `Development` (全选)

---

### 第 5 步：重新部署

1. 保存所有环境变量后
2. 返回项目主页（点击顶部的项目名称）
3. 点击 **Deployments** 标签
4. 找到最新的部署
5. 点击右侧的 **...** 菜单
6. 选择 **Redeploy**
7. 确认重新部署

---

## 🔧 额外配置 / Additional Configuration

### Google OAuth 配置

在 Google Cloud Console 中添加重定向 URI：

1. 访问: https://console.cloud.google.com/apis/credentials
2. 选择您的 OAuth 2.0 客户端
3. 在"已获授权的重定向 URI"中添加：
   ```
   https://qmpuasmglrkbnsymgaah.supabase.co/auth/v1/callback
   https://daily-pa1.vercel.app/auth/callback
   ```
4. 保存更改

### Supabase 配置

在 Supabase Dashboard 中：

1. 访问: https://supabase.com/dashboard/project/qmpuasmglrkbnsymgaah
2. 进入 **Authentication** → **URL Configuration**
3. 设置 **Site URL**: `https://daily-pa1.vercel.app`
4. 在 **Redirect URLs** 中添加:
   ```
   https://daily-pa1.vercel.app/auth/callback
   https://daily-pa1.vercel.app/**
   ```
5. 保存更改

---

## ✅ 验证清单 / Verification Checklist

配置完成后，请验证：

- [ ] 删除了 `NEXT_PUBLIC_DEV_SKIP_AUTH` 变量
- [ ] 添加了所有必需的环境变量
- [ ] `NEXT_PUBLIC_SITE_URL` 设置为 `https://daily-pa1.vercel.app`
- [ ] 重新部署完成
- [ ] 访问 https://daily-pa1.vercel.app/dashboard 会重定向到登录页
- [ ] 可以使用邮箱/密码注册新账户
- [ ] 可以使用邮箱/密码登录
- [ ] Google 登录按钮可用（需要先配置 Google OAuth）

---

## 🐛 故障排除 / Troubleshooting

### 问题 1: 仍然显示开发模式

**解决方案**:
- 确认已删除 `NEXT_PUBLIC_DEV_SKIP_AUTH`
- 清除浏览器缓存
- 强制刷新页面 (Ctrl + Shift + R)

### 问题 2: 登录后出现错误

**解决方案**:
- 检查 Supabase URL 和 ANON_KEY 是否正确
- 确认 `NEXT_PUBLIC_SITE_URL` 设置正确
- 查看 Vercel 部署日志中的错误信息

### 问题 3: Google 登录不工作

**解决方案**:
- 确认已在 Google Cloud Console 中添加重定向 URI
- 确认已在 Supabase 中启用 Google 提供商
- 检查 Google OAuth 客户端 ID 和密钥

---

## 📞 需要帮助？/ Need Help?

如果遇到问题，请提供：
1. Vercel 部署日志截图
2. 浏览器控制台错误信息
3. 具体的错误描述

---

**最后更新**: 2025-01-07
**文档版本**: 1.0
