#!/bin/bash

# Android APK Build Setup Script
# This script helps set up Capacitor and Android for building APKs

set -e

echo "🚀 Setting up Android build environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "⚠️  Java is not installed. Please install Java JDK 17 or higher."
    echo "   macOS: brew install openjdk@17"
    echo "   Linux: sudo apt-get install openjdk-17-jdk"
    exit 1
fi

echo "✅ Java found: $(java -version 2>&1 | head -n 1)"

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME is not set."
    echo "   Please set it in your ~/.zshrc or ~/.bashrc:"
    echo "   export ANDROID_HOME=\$HOME/Library/Android/sdk  # macOS"
    echo "   export ANDROID_HOME=\$HOME/Android/Sdk  # Linux"
    exit 1
fi

echo "✅ ANDROID_HOME: $ANDROID_HOME"

# Install Capacitor dependencies
echo ""
echo "📦 Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor if not already initialized
if [ ! -f "capacitor.config.ts" ]; then
    echo ""
    echo "🔧 Initializing Capacitor..."
    npx cap init "Daily PA" "com.dailypa.app" --web-dir=out
else
    echo "✅ Capacitor already initialized"
fi

# Add Android platform if not exists
if [ ! -d "android" ]; then
    echo ""
    echo "🤖 Adding Android platform..."
    npx cap add android
else
    echo "✅ Android platform already exists"
fi

# Build Next.js app
echo ""
echo "🏗️  Building Next.js app for mobile..."
NEXT_PUBLIC_CAPACITOR=true npm run build

# Sync to Android
echo ""
echo "🔄 Syncing web assets to Android..."
npx cap sync android

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Build debug APK: cd android && ./gradlew assembleDebug"
echo "3. Build release APK: cd android && ./gradlew assembleRelease"
echo ""
echo "See docs/ANDROID_BUILD_GUIDE.md for detailed instructions."
