# Build Android APK - Complete Guide

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize Capacitor
npx cap init

# 3. Add Android platform
npx cap add android

# 4. Build and sync
npm run build:mobile
npm run sync:android

# 5. Build APK
cd android
./gradlew assembleDebug  # Debug APK
# or
./gradlew assembleRelease  # Release APK (requires signing setup)
```

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ **Node.js** (v18+)
- ✅ **Java JDK 17+**
- ✅ **Android Studio** (for Android SDK)
- ✅ **Android SDK** (installed via Android Studio)

### Install Java JDK

**macOS:**
```bash
brew install openjdk@17
```

**Linux:**
```bash
sudo apt-get install openjdk-17-jdk
```

### Set Environment Variables

Add to `~/.zshrc` or `~/.bashrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

## 📁 Files Created

- ✅ `capacitor.config.ts` - Capacitor configuration
- ✅ `next.config.mjs` - Updated for static export
- ✅ `package.json` - Added build scripts
- ✅ `.gitignore` - Updated to exclude Android files

## 🔧 Configuration

### 1. Update API URL for Mobile

Since Next.js API routes don't work in static exports, update `capacitor.config.ts`:

```typescript
server: {
  url: 'https://your-app.vercel.app', // Your Vercel URL
}
```

See `docs/MOBILE_API_CONFIGURATION.md` for details.

### 2. Set Environment Variables

Create `.env.mobile`:

```bash
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_CAPACITOR=true
```

## 🏗️ Build Process

### Step-by-Step

1. **Build Next.js app**:
   ```bash
   npm run build:mobile
   ```

2. **Sync to Android**:
   ```bash
   npm run sync:android
   ```

3. **Build APK**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

4. **Find APK**:
   - Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Release: `android/app/build/outputs/apk/release/app-release.apk`

## 📱 Install APK

### Via ADB

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via File Transfer

1. Copy APK to Android device
2. Open file manager
3. Tap APK and install

## 🔐 Release APK Signing

For release APKs, you need to set up signing:

1. **Generate keystore**:
   ```bash
   cd android/app
   keytool -genkey -v -keystore daily-pa-release.keystore \
     -alias daily-pa -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Create `android/key.properties`**:
   ```properties
   storePassword=YOUR_PASSWORD
   keyPassword=YOUR_PASSWORD
   keyAlias=daily-pa
   storeFile=daily-pa-release.keystore
   ```

3. **Update `android/app/build.gradle`** (see full guide)

4. **Build release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## 📚 Documentation

- **Quick Start**: `QUICK_START_ANDROID.md`
- **Full Guide**: `docs/ANDROID_BUILD_GUIDE.md`
- **API Configuration**: `docs/MOBILE_API_CONFIGURATION.md`

## 🐛 Troubleshooting

### "Command not found: gradlew"

```bash
cd android
chmod +x gradlew
```

### "SDK location not found"

Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### Build fails

1. Run `npm run build:mobile` first
2. Then `npm run sync:android`
3. Then build APK

### API calls fail

- Check `NEXT_PUBLIC_API_URL` is set
- Verify Vercel deployment is accessible
- See `docs/MOBILE_API_CONFIGURATION.md`

## 🔄 Updating the App

When you make changes:

```bash
# 1. Build web app
npm run build:mobile

# 2. Sync to Android
npm run sync:android

# 3. Rebuild APK
cd android && ./gradlew assembleRelease
```

## 📦 NPM Scripts

- `npm run build:mobile` - Build Next.js for mobile
- `npm run sync:android` - Sync web assets to Android
- `npm run open:android` - Open Android Studio
- `npm run android:build` - Build and sync (combined)

## ✅ Checklist

Before building:

- [ ] Prerequisites installed (Java, Android SDK)
- [ ] Capacitor initialized
- [ ] Android platform added
- [ ] API URL configured in Capacitor config
- [ ] Environment variables set
- [ ] Next.js app builds successfully
- [ ] Android project syncs successfully

## 🎯 Next Steps

1. **Test APK** on multiple devices
2. **Set up app signing** for release
3. **Configure app permissions** in AndroidManifest.xml
4. **Add app icons** and splash screens
5. **Set up Google Play Console** for distribution

## 💡 Tips

- Use debug APK for testing (faster builds)
- Use release APK for distribution (smaller, optimized)
- Test API calls before building
- Monitor API usage and costs
- Keep Android SDK updated

## 🆘 Need Help?

- Check `docs/ANDROID_BUILD_GUIDE.md` for detailed instructions
- See `docs/MOBILE_API_CONFIGURATION.md` for API setup
- Check Android Studio logs for build errors
- Use `adb logcat` to debug runtime issues

---

**Ready to build?** Start with `QUICK_START_ANDROID.md`!
