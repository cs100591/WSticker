# Android APK Manual Build Instructions

Due to system permission restrictions and network issues, the automatic build process could not complete.
However, a manual build script `manual_build.sh` has been created for you.

## How to Build

1. Open your terminal in the project directory: `/Users/cssee/Dev/WSticker/daily-pa/mobile-app`
2. Run the build script:
   ```bash
   ./manual_build.sh
   ```

## What this script does
1. Sets up `android/local.properties` to point to your Android SDK.
2. Uses a local Gradle installation found on your system (`~/.gradle/wrapper/dists/...`) to bypass the corrupted project wrapper.
3. Cleans and builds the Release APK.

## Troubleshooting
- **Network Errors**: If the build fails with network errors, ensure you have internet connection. Gradle needs to download dependencies.
- **Missing Dependencies**: If you see errors about missing packages, try running `npm install` again if your network allows.
- **Google Services**: If you use Google features (Maps, Firebase, Auth), ensure `google-services.json` is in `android/app/`.

## Output
Upon success, the APK will be at:
`android/app/build/outputs/apk/release/app-release.apk`
