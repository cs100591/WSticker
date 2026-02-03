#!/bin/bash
# Android APK Manual Build Script

echo "Starting Manual Build Process..."

# Check for dependencies
if [ ! -d "node_modules/react-native" ]; then
    echo "ERROR: node_modules/react-native not found."
    echo "It seems dependencies are missing."
    echo "Please run 'npm install' or 'yarn install' first, then run this script again."
    exit 1
fi

# 1. Ensure local.properties exists and points to SDK
echo "Configuring android/local.properties..."
echo "sdk.dir=/Users/cssee/Library/Android/sdk" > android/local.properties

# 2. Define the path to the Gradle binary found on your system
GRADLE_BIN="/Users/cssee/.gradle/wrapper/dists/gradle-8.14.3-bin/cv11ve7ro1n3o1j4so8xd9n66/gradle-8.14.3/bin/gradle"

if [ ! -f "$GRADLE_BIN" ]; then
    echo "Error: Gradle binary not found at $GRADLE_BIN"
    echo "Please check your gradle installation."
    exit 1
fi

echo "Using Gradle at: $GRADLE_BIN"

# 3. Run Clean
echo "Cleaning project..."
"$GRADLE_BIN" clean -p android

# 4. Run Build
echo "Building Release APK..."
# -x lint skips linting to speed up build
"$GRADLE_BIN" assembleRelease -p android -x lint --stacktrace

if [ $? -eq 0 ]; then
    echo "--------------------------------------------------------"
    echo "BUILD SUCCESSFUL"
    echo "APK located at: android/app/build/outputs/apk/release/app-release.apk"
    echo "--------------------------------------------------------"
    open android/app/build/outputs/apk/release/
else
    echo "--------------------------------------------------------"
    echo "BUILD FAILED"
    echo "Please check the error output above."
    echo "--------------------------------------------------------"
fi
