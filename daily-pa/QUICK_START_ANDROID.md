# Quick Start: Build Android APK

## Prerequisites Checklist

- [ ] Node.js installed (v18+)
- [ ] Java JDK 17+ installed
- [ ] Android Studio installed
- [ ] Android SDK installed (via Android Studio)
- [ ] ANDROID_HOME environment variable set

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name**: Daily PA
- **App ID**: com.dailypa.app
- **Web dir**: out

### 3. Add Android Platform

```bash
npx cap add android
```

### 4. Build and Sync

```bash
# Build Next.js app for mobile
npm run build:mobile

# Sync to Android project
npm run sync:android
```

### 5. Build APK

#### Debug APK (Quick Testing)

```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Release APK (For Distribution)

```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

**Note**: For release APK, you'll need to set up signing first (see full guide).

## Using the Setup Script

For automated setup:

```bash
chmod +x scripts/setup-android.sh
./scripts/setup-android.sh
```

## Common Issues

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

1. Make sure you ran `npm run build:mobile` first
2. Then run `npm run sync:android`
3. Then build the APK

## Full Documentation

See `docs/ANDROID_BUILD_GUIDE.md` for:
- Detailed setup instructions
- Release signing configuration
- Troubleshooting guide
- Environment variables setup

## Next Steps After Building

1. **Test the APK**: Install on a device and test all features
2. **Set up signing**: For release builds (see full guide)
3. **Configure app**: Update app name, icon, permissions
4. **Distribute**: Upload to Google Play Store or distribute directly
