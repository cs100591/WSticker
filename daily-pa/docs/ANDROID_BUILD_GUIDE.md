# Android APK Build Guide

This guide will help you build an Android APK from your Next.js application using Capacitor.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Java JDK** (17 or higher) - Required for Android builds
3. **Android Studio** - For Android SDK and build tools
4. **Android SDK** - Install via Android Studio

### Install Java JDK

**macOS:**
```bash
brew install openjdk@17
```

**Linux:**
```bash
sudo apt-get install openjdk-17-jdk
```

**Windows:**
Download from [Oracle](https://www.oracle.com/java/technologies/downloads/#java17) or use [Adoptium](https://adoptium.net/)

### Install Android Studio

1. Download from https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio → **More Actions** → **SDK Manager**
4. Install:
   - Android SDK Platform 33 (or latest)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools

### Set Environment Variables

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk  # Linux
# export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

## Step 1: Install Dependencies

```bash
cd daily-pa
npm install @capacitor/core @capacitor/cli @capacitor/android
```

Or if using pnpm:
```bash
pnpm add @capacitor/core @capacitor/cli @capacitor/android
```

## Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name**: Daily PA
- **App ID**: com.dailypa.app (or your preferred bundle ID)
- **Web dir**: out

## Step 3: Add Android Platform

```bash
npx cap add android
```

This will create the `android/` directory with the Android project.

## Step 4: Build Next.js App for Mobile

```bash
npm run build:mobile
```

This builds your Next.js app with static export (required for Capacitor).

## Step 5: Sync Web Assets to Android

```bash
npm run sync:android
```

This copies your built web app to the Android project.

## Step 6: Configure Android App

### Update AndroidManifest.xml

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:usesCleartextTraffic="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|colorMode|uiMode"
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
    
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
</manifest>
```

### Update build.gradle

Edit `android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.dailypa.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Step 7: Build APK

### Option A: Debug APK (Quick Testing)

```bash
cd android
./gradlew assembleDebug
```

APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Release APK (For Distribution)

#### 7.1 Generate Keystore (First Time Only)

```bash
cd android/app
keytool -genkey -v -keystore daily-pa-release.keystore -alias daily-pa -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: Save the password and alias - you'll need them!

#### 7.2 Configure Signing

Create `android/key.properties`:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=daily-pa
storeFile=daily-pa-release.keystore
```

**Add to `.gitignore`**:
```
android/key.properties
android/app/daily-pa-release.keystore
```

#### 7.3 Update build.gradle for Signing

Edit `android/app/build.gradle`:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 7.4 Build Release APK

```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Option C: Build AAB (For Google Play Store)

```bash
cd android
./gradlew bundleRelease
```

AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## Step 8: Install APK on Device

### Via ADB (Android Debug Bridge)

```bash
# Connect your Android device via USB
# Enable USB debugging on your device

# Install APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Via File Transfer

1. Copy APK to your Android device
2. Open file manager on device
3. Tap the APK file
4. Allow installation from unknown sources if prompted
5. Install

## Quick Build Script

Use the provided npm scripts:

```bash
# Build everything
npm run android:build

# Then build APK
cd android && ./gradlew assembleRelease
```

## Troubleshooting

### Issue: "Command not found: gradlew"

**Solution**: Make gradlew executable:
```bash
cd android
chmod +x gradlew
```

### Issue: "SDK location not found"

**Solution**: Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### Issue: "Java version mismatch"

**Solution**: Ensure Java 17 is installed and set JAVA_HOME:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Issue: Build fails with "out" directory not found

**Solution**: Run `npm run build:mobile` first, then `npm run sync:android`

### Issue: App crashes on startup

**Solution**: 
1. Check Android logs: `adb logcat`
2. Ensure API endpoints use HTTPS (not HTTP)
3. Check Capacitor config for correct `webDir`

## Updating the App

When you make changes to your Next.js app:

```bash
# 1. Build the web app
npm run build:mobile

# 2. Sync to Android
npm run sync:android

# 3. Rebuild APK
cd android && ./gradlew assembleRelease
```

## Environment Variables for Mobile

For production builds, you may need to set environment variables differently. Consider:

1. Using Capacitor's `@capacitor/preferences` plugin
2. Building with environment variables at build time
3. Using a config file that's included in the build

## Next Steps

- [ ] Set up app icons and splash screens
- [ ] Configure app permissions
- [ ] Test on multiple Android devices
- [ ] Set up Google Play Console for distribution
- [ ] Configure app signing for release
- [ ] Add app versioning strategy

## Resources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/guide)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
