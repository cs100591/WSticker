# Daily PA - Web & App 联动说明

## ✅ 已完成

### 1. 创意 Landing Page
- **位置**: `src/app/page.tsx`
- **设计**: 现代玻璃拟态风格 (Glassmorphism)
- **动画**: Framer Motion 流畅动画
- **主题**: 4种主题色（Ocean/Sage/Sunset/Minimal）
- **响应式**: 移动端优先

### 2. 已推送到 Git
- **分支**: `web-deploy`
- **Commit**: `8a9dfbc` - feat(landing): Create modern glassmorphism landing page
- **仓库**: https://github.com/cs100591/WSticker

### 3. Web-App 联动功能

#### App 下载入口
Landing page 包含：
- ✅ App Store 下载按钮
- ✅ Google Play 下载按钮
- ✅ Web 版直接注册/登录入口

#### 跨平台同步
- 使用 **Supabase** 作为共享后端
- Web 和 App 共享同一数据库
- 实时数据同步

#### Deeplink 支持（建议添加）
```typescript
// 添加到 landing page
const openApp = () => {
  // 尝试打开 App
  window.location.href = 'dailypa://open';
  
  // 如果 App 未安装，跳转到下载页
  setTimeout(() => {
    window.location.href = '/download';
  }, 500);
};
```

#### 统一 API 端点
| 功能 | Web | App |
|------|-----|-----|
| 认证 | Supabase Auth | Supabase Auth |
| 数据存储 | Supabase DB | Supabase DB |
| 实时同步 | Supabase Realtime | Supabase Realtime |
| AI 聊天 | Supabase Edge Functions | Supabase Edge Functions |

## 🎨 Landing Page 功能

### 页面区块
1. **Hero** - 动态标题 + CTA
2. **Features** - 4大功能展示（Chat/Calendar/Tasks/Expenses）
3. **How It Works** - 3步使用流程
4. **Preview** - 多设备展示（Desktop + Mobile）
5. **Testimonials** - 用户评价
6. **Download** - App 下载入口
7. **Footer** - 完整网站导航

### 技术栈
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide Icons

## 🚀 部署

### Web 部署
```bash
# Vercel（已配置）
git push origin web-deploy
# 自动部署到: https://daily-pa1.vercel.app/

# 或手动
vercel --prod
```

### App 联动
```bash
# App 下载链接（需替换为真实链接）
App Store: https://apps.apple.com/app/daily-pa/xxx
Google Play: https://play.google.com/store/apps/details?id=com.dailypa
```

## 📱 与 App 联动建议

### 1. 添加 Universal Links（iOS）
```json
// apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM.com.dailypa.app",
        "paths": ["/dashboard/*", "/login"]
      }
    ]
  }
}
```

### 2. 添加 Android App Links
```json
// assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.dailypa.app",
    "sha256_cert_fingerprints": ["..."]
  }
}]
```

### 3. 添加 Meta Tags（SEO + App Banner）
```html
<!-- iOS -->
<meta name="apple-itunes-app" content="app-id=123456789">

<!-- Android -->
<meta name="google-play-app" content="app-id=com.dailypa.app">
```

## 📝 后续优化建议

1. **添加 PWA 支持** - 让 Web 可以"安装"到手机
2. **添加推送通知** - Web 推送与 App 推送同步
3. **添加 QR 码** - 扫码直接下载 App
4. **A/B 测试** - 测试不同 CTA 文案效果
5. **分析追踪** - 添加 Google Analytics / Mixpanel

---
*由店小二生成 - 2026-02-05*
