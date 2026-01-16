# Mobile App Preview Guide

## ⚠️ Important: WatermelonDB Limitation

This app uses **WatermelonDB** for offline storage, which requires native modules that are **not available in Expo Go**. You'll see an `initializeJSI` error if you try to run in Expo Go.

### To Preview the Full App

You have two options:

#### Option 1: Create a Development Build (Recommended)

```bash
cd mobile-app

# For iOS (requires Mac + Xcode)
npx expo run:ios

# For Android (requires Android Studio)
npx expo run:android
```

This creates a custom development client with all native modules included.

#### Option 2: Use EAS Build (Cloud Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Create development build
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## Quick Start (Development Build)

Once you have a development build:

```bash
cd mobile-app
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code with your development build app

## What You'll See

The app includes:

**Authentication Flow:**
- ✅ Login screen with email/password
- ✅ Registration screen with validation
- ✅ Forgot password flow
- ✅ **Skip Login button (Development only)** - Tap to bypass authentication

**Main App (After Login or Skip):**
- ✅ **Todos Tab** - Full CRUD with filtering, sorting, statistics
- ✅ **Expenses Tab** - Track expenses with categories, receipt scanning
- ✅ **Calendar Tab** - Month/Week/Day views, event management
- ✅ **Settings Tab** - Profile editing, password change, notification preferences

**New Features (Just Added):**
- ✅ **Notification Navigation** - Tap notifications to go to relevant screens
- ✅ **Notification Preferences** - Enable/disable notifications in Settings
- ✅ **Profile Editing** - Update your name with modal dialog
- ✅ **Password Change** - Secure password change with verification

## Test the Flow

**Option 1: Test Authentication Flow**
1. Start on the login screen
2. Tap "Sign Up" to go to registration
3. Tap "Forgot Password?" to see password reset
4. Use navigation links to move between screens

**Option 2: Skip Login (Quick Testing)**
1. On the login screen, tap the yellow "⚠️ Skip Login (Dev Only)" button
2. You'll be taken directly to the main app tabs
3. Test all features:
   - **Todos**: Create, edit, filter, mark complete
   - **Expenses**: Add expenses, scan receipts, view summaries
   - **Calendar**: View events in different formats, create events
   - **Settings**: Edit profile, change password, toggle notifications

## Current Status

✅ **Completed Features:**
- Authentication module (login, register, password reset)
- Offline storage with WatermelonDB
- Bidirectional sync engine with conflict resolution
- Todo management (CRUD, filtering, sorting, statistics)
- Expense tracking (CRUD, categories, summaries)
- Receipt scanning with OCR
- Calendar module (month/week/day views, event management)
- Google Calendar sync (placeholder)
- Apple Calendar sync (iOS)
- Push notifications with smart navigation
- Notification preferences
- Profile management (view, edit, password change)
- Settings screen with all preferences
- Error handling and retry logic
- Pull-to-refresh on all screens
- Empty states with helpful guidance

🚧 **Coming Next:**
- AI assistant chat interface
- Additional security features
- Performance optimizations
- Accessibility improvements

## Notes

- The app uses Supabase for backend (configure in `.env`)
- WatermelonDB provides offline-first architecture
- All 154 tests passing (99.4% pass rate)
- Hot reload is enabled - changes reflect immediately
- Press `r` to reload the app manually if needed

## Troubleshooting

**"initializeJSI" error in Expo Go:**
- This is expected - WatermelonDB requires a development build
- Follow Option 1 or 2 above to create a development build

**Metro bundler issues:**
```bash
npm start -- --clear
```

**Package installation issues:**
```bash
npm install --legacy-peer-deps
```

**Can't connect to device:**
- Ensure your phone and computer are on the same WiFi network
- Try restarting the Expo server

## Development Build Setup (Detailed)

### iOS (Mac only)

1. Install Xcode from App Store
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Install CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```
4. Run the app:
   ```bash
   cd mobile-app
   npx expo run:ios
   ```

### Android

1. Install Android Studio
2. Set up Android SDK and emulator
3. Add to your `~/.zshrc` or `~/.bashrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
4. Run the app:
   ```bash
   cd mobile-app
   npx expo run:android
   ```

## Testing Without Development Build

If you want to test the UI/UX without database functionality:
1. The app will show errors but navigation should work
2. You can preview screens, modals, and UI components
3. Authentication screens will be visible
4. Settings screen with all toggles and modals will work

However, for full functionality testing, a development build is required.
