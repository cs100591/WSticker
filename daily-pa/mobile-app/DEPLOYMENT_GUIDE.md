# Deployment Guide - Production Setup

## 🚨 Important: Localhost vs Production

### Current Setup (Development)
```
Mobile App (Expo Go on phone)
    ↓
    Connects to: http://192.168.100.111:3000 (your computer's local IP)
    ↓
Backend Server (Next.js on your computer)
    ↓
Supabase (cloud database)
```

**This only works for development!** Your phone and computer must be on the same WiFi network.

### Production Setup (Deployed)
```
Mobile App (Published to App Store/Play Store)
    ↓
    Connects to: https://your-domain.com (public URL)
    ↓
Backend Server (Deployed to Vercel/Railway/etc.)
    ↓
Supabase (cloud database)
```

---

## 📱 Deployment Options

### Option 1: Full Deployment (Recommended)
Deploy both the backend and mobile app to production.

### Option 2: Offline-Only App
Remove backend dependency and use only local storage (current offline mode).

### Option 3: Hybrid Approach
Use offline mode as default, optionally connect to backend when available.

---

## 🚀 Option 1: Full Deployment

### Step 1: Deploy Backend to Vercel

#### 1.1 Install Vercel CLI
```bash
npm install -g vercel
```

#### 1.2 Deploy Backend
```bash
# In the root directory (where package.json is)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? daily-pa-backend
# - Directory? ./
# - Override settings? No
```

#### 1.3 Set Environment Variables
```bash
# Add environment variables to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add DEEPSEEK_API_KEY
vercel env add OPENAI_API_KEY

# Or use Vercel dashboard:
# https://vercel.com/your-project/settings/environment-variables
```

#### 1.4 Get Production URL
After deployment, Vercel gives you a URL like:
```
https://daily-pa-backend.vercel.app
```

### Step 2: Update Mobile App Configuration

#### 2.1 Create Production Environment File
Create `mobile-app/.env.production`:
```env
# Production Backend URL (from Vercel)
EXPO_PUBLIC_API_URL=https://daily-pa-backend.vercel.app

# Supabase (same as development)
EXPO_PUBLIC_SUPABASE_URL=https://qmpuasmglrkbnsymgaah.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Environment
EXPO_PUBLIC_ENV=production
```

#### 2.2 Update FloatingChatbot.tsx
The current code already handles this correctly:
```typescript
const API_URL = Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.100.111:3000'; // Fallback for development
```

### Step 3: Build and Publish Mobile App

#### 3.1 Configure app.json
Update `mobile-app/app.json`:
```json
{
  "expo": {
    "name": "Daily PA",
    "slug": "daily-pa",
    "version": "1.0.0",
    "extra": {
      "apiUrl": "https://daily-pa-backend.vercel.app"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.dailypa",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.dailypa",
      "versionCode": 1
    }
  }
}
```

#### 3.2 Build for iOS (TestFlight/App Store)
```bash
cd mobile-app

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

#### 3.3 Build for Android (Play Store)
```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

---

## 🔧 Option 2: Offline-Only App

If you want to avoid backend deployment, use only offline mode.

### Step 1: Remove Backend Dependency

Update `FloatingChatbot.tsx`:
```typescript
// Remove API call, use only offline mode
const sendMessage = async (manualText?: string) => {
  const text = typeof manualText === 'string' ? manualText.trim() : inputText.trim();
  if (!text || isLoading) return;

  setMessages(prev => [...prev, { id: `user_${Date.now()}`, text, isUser: true }]);
  setInputText('');
  Keyboard.dismiss();
  setIsLoading(true);

  // OFFLINE MODE ONLY - No API call
  const lowerText = text.toLowerCase();
  let responseText = '';
  let actions: ParsedAction[] | undefined;

  // ... existing offline intent detection code ...

  setMessages(prev => [...prev, {
    id: `ai_${Date.now()}`,
    text: responseText,
    isUser: false,
    actions,
  }]);

  setIsLoading(false);
};
```

### Step 2: Remove Voice Input
Voice transcription requires backend (OpenAI Whisper API), so keep it disabled.

### Step 3: Update Welcome Message
```typescript
const welcomeMsg = lang === 'zh'
  ? '你好！我是智能助手 ✨\n\n我可以帮你：\n📝 创建任务\n📅 添加日程\n💰 记录支出\n📷 扫描收据'
  : "Hi! I'm your smart assistant ✨\n\nI can help you:\n📝 Create tasks\n📅 Add events\n💰 Track expenses\n📷 Scan receipts";
```

### Step 4: Build and Publish
Follow the same build process as Option 1, but without backend URL.

---

## 🔀 Option 3: Hybrid Approach (Recommended)

Keep the current implementation! It already supports both:
- ✅ Offline mode (works without backend)
- ✅ Backend mode (enhanced features when available)

### How It Works
```typescript
try {
  // Try backend API first
  const response = await fetch(`${API_URL}/api/chat`, ...);
  // Use AI response
} catch (error) {
  // Fallback to offline mode
  // Use keyword detection
}
```

### Benefits
- Works offline (basic features)
- Enhanced when backend available (AI, voice, conflict detection)
- Best user experience
- No deployment required for basic functionality

### Deployment
1. Deploy backend to Vercel (optional)
2. Update `EXPO_PUBLIC_API_URL` in production build
3. App works offline if backend unavailable
4. App uses backend when available

---

## 🌐 Backend Deployment Options

### Option A: Vercel (Recommended)
**Pros:**
- ✅ Free tier available
- ✅ Easy deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions

**Cons:**
- ⚠️ Serverless cold starts
- ⚠️ Function timeout limits

**Setup:**
```bash
vercel
```

### Option B: Railway
**Pros:**
- ✅ Free tier available
- ✅ Always-on server (no cold starts)
- ✅ Easy deployment
- ✅ Database hosting

**Cons:**
- ⚠️ Limited free tier

**Setup:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Option C: Render
**Pros:**
- ✅ Free tier available
- ✅ Always-on server
- ✅ Easy deployment

**Cons:**
- ⚠️ Slower than Vercel

**Setup:**
1. Connect GitHub repo
2. Configure build settings
3. Deploy

### Option D: AWS/Google Cloud/Azure
**Pros:**
- ✅ Full control
- ✅ Scalable
- ✅ Professional

**Cons:**
- ⚠️ More complex
- ⚠️ More expensive
- ⚠️ Requires DevOps knowledge

---

## 📝 Environment Variables for Production

### Backend (.env.production)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qmpuasmglrkbnsymgaah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# AI Services
DEEPSEEK_API_KEY=sk-f3eeedd188e14b7d8577472ef5dc5158
OPENAI_API_KEY=sk-proj-...

# URLs
NEXT_PUBLIC_SITE_URL=https://daily-pa-backend.vercel.app
NEXT_PUBLIC_APP_URL=https://daily-pa-backend.vercel.app
```

### Mobile App (.env.production)
```env
# Backend API
EXPO_PUBLIC_API_URL=https://daily-pa-backend.vercel.app

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://qmpuasmglrkbnsymgaah.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Environment
EXPO_PUBLIC_ENV=production
```

---

## 🔒 Security Considerations

### 1. API Keys
- ❌ Never commit API keys to Git
- ✅ Use environment variables
- ✅ Use different keys for dev/prod

### 2. Backend Security
- ✅ Enable CORS only for your domain
- ✅ Use HTTPS only
- ✅ Validate all inputs
- ✅ Rate limiting

### 3. Mobile App Security
- ✅ Use Supabase RLS (Row Level Security)
- ✅ Validate tokens
- ✅ Encrypt sensitive data
- ✅ Use secure storage

---

## 📊 Cost Estimation

### Free Tier (Recommended for Start)
```
Backend (Vercel):     $0/month (free tier)
Supabase:             $0/month (free tier)
Expo:                 $0/month (free tier)
DeepSeek API:         ~$1-5/month (pay per use)
OpenAI Whisper:       ~$1-5/month (pay per use)
---
Total:                ~$2-10/month
```

### Paid Tier (For Growth)
```
Backend (Vercel Pro): $20/month
Supabase Pro:         $25/month
Expo:                 $0/month (still free)
DeepSeek API:         ~$10-50/month
OpenAI Whisper:       ~$10-50/month
---
Total:                ~$65-145/month
```

---

## 🚀 Quick Deployment Checklist

### Backend Deployment
- [ ] Deploy to Vercel/Railway/Render
- [ ] Set environment variables
- [ ] Test API endpoints
- [ ] Get production URL
- [ ] Enable HTTPS
- [ ] Configure CORS

### Mobile App Deployment
- [ ] Update `EXPO_PUBLIC_API_URL` in app.json
- [ ] Test with production backend
- [ ] Build iOS app (EAS)
- [ ] Build Android app (EAS)
- [ ] Submit to App Store
- [ ] Submit to Play Store

### Testing
- [ ] Test offline mode
- [ ] Test backend connection
- [ ] Test voice input
- [ ] Test all features
- [ ] Test on real devices

---

## 🎯 Recommended Approach

For your app, I recommend **Option 3: Hybrid Approach**:

1. **Keep current implementation** (already supports offline + backend)
2. **Deploy backend to Vercel** (free, easy, fast)
3. **Update mobile app config** with production URL
4. **Build and publish** to App Store/Play Store

### Why This Works Best
- ✅ Works offline (no backend required)
- ✅ Enhanced features when backend available
- ✅ Best user experience
- ✅ Easy to deploy
- ✅ Low cost (free tier available)
- ✅ Scalable

---

## 📚 Next Steps

1. **Test current fixes** (reload app, test offline mode)
2. **Decide deployment strategy** (full/offline/hybrid)
3. **Deploy backend** (if using backend features)
4. **Update mobile app config** (production URL)
5. **Build and test** (EAS build)
6. **Submit to stores** (App Store + Play Store)

---

## ❓ FAQ

### Q: Can I use localhost in production?
**A:** No! Localhost only works on your computer. Production apps need a public URL.

### Q: Do I need to deploy the backend?
**A:** No, if you use offline-only mode. Yes, if you want AI features, voice input, or conflict detection.

### Q: How much does deployment cost?
**A:** Free tier is available for everything! Paid tiers start around $65/month for growth.

### Q: Can I deploy later?
**A:** Yes! The app works offline now. Deploy backend when you're ready for advanced features.

### Q: What's the easiest deployment?
**A:** Vercel for backend (one command: `vercel`), EAS for mobile app (one command: `eas build`).

---

**Status**: Ready for deployment
**Recommended**: Hybrid approach (offline + backend)
**Cost**: Free tier available
**Time**: 1-2 hours for full deployment

