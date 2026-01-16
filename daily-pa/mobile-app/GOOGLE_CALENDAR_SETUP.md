# Google Calendar Integration Setup Guide

This guide explains how to complete the Google Calendar integration for the Daily PA mobile app.

## Overview

The Google Calendar sync feature has been implemented with a complete framework, but requires external configuration to function. The implementation includes:

- ✅ Google Calendar API integration code
- ✅ Bidirectional sync (pull from Google, push to Google)
- ✅ Conflict resolution (server wins strategy)
- ✅ Event creation, update, and deletion
- ⏳ OAuth 2.0 authentication (requires setup)
- ⏳ Google Sign-In integration (requires package installation)

## Prerequisites

- Google Cloud Console account
- iOS and Android app identifiers
- React Native development environment

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Google Calendar API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click **Enable**

### 3. Create OAuth 2.0 Credentials

#### For iOS:

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **iOS** as application type
4. Enter your iOS bundle identifier (e.g., `com.dailypa.app`)
5. Copy the **Client ID** (you'll need this)

#### For Android:

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Android** as application type
4. Enter your Android package name (e.g., `com.dailypa.app`)
5. Get your SHA-1 certificate fingerprint:
   ```bash
   # For debug builds
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For release builds
   keytool -list -v -keystore /path/to/your/keystore -alias your-key-alias
   ```
6. Enter the SHA-1 fingerprint
7. Copy the **Client ID**

#### For Web (Required for token refresh):

1. Create another OAuth client ID
2. Select **Web application** as type
3. Add authorized redirect URIs if needed
4. Copy the **Client ID**

### 4. Install Required Package

Install the Google Sign-In package:

```bash
cd mobile-app
npm install @react-native-google-signin/google-signin --legacy-peer-deps
```

### 5. Configure Environment Variables

Add the following to your `.env` file:

```env
# Google Calendar Integration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

### 6. Update iOS Configuration

Add the following to `mobile-app/ios/DailyPA/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR-IOS-CLIENT-ID</string>
    </array>
  </dict>
</array>
```

Replace `YOUR-IOS-CLIENT-ID` with your iOS client ID (reversed, without `.apps.googleusercontent.com`).

### 7. Update Android Configuration

The package should automatically configure Android, but verify `mobile-app/android/app/build.gradle` includes:

```gradle
dependencies {
    implementation project(':react-native-google-signin_google-signin')
}
```

### 8. Uncomment Implementation Code

Open `mobile-app/src/services/googleCalendarService.ts` and uncomment the following sections:

1. **initialize() method** - Uncomment GoogleSignin.configure()
2. **signIn() method** - Uncomment Google sign-in flow
3. **signOut() method** - Uncomment Google sign-out
4. **isSignedIn() method** - Uncomment sign-in check

Look for comments like:
```typescript
// TODO: Uncomment when @react-native-google-signin/google-signin is installed
```

### 9. Test the Integration

1. **Build and run the app:**
   ```bash
   npm run ios
   # or
   npm run android
   ```

2. **Test Google Sign-In:**
   - Go to Settings > Calendar Sync
   - Select "Google Calendar" as provider
   - Tap "Sync Now"
   - Sign in with your Google account
   - Grant calendar permissions

3. **Test Sync:**
   - Create an event in the app
   - Check if it appears in Google Calendar
   - Create an event in Google Calendar
   - Sync in the app and verify it appears

### 10. Handle Errors

Common issues and solutions:

**"Sign in failed"**
- Verify OAuth client IDs are correct
- Check bundle identifier/package name matches
- Ensure Google Calendar API is enabled

**"Permission denied"**
- User needs to grant calendar access
- Check OAuth scopes include calendar access

**"Token expired"**
- Implement token refresh logic
- Use refresh tokens from Google Sign-In

## Implementation Details

### Sync Strategy

The implementation uses a **bidirectional sync** with **server-wins conflict resolution**:

1. **Pull Phase:**
   - Fetch events from Google Calendar (past month to 2 months ahead)
   - Compare with local events by `googleEventId`
   - Update local events if Google version is newer
   - Create new local events for Google events not in local DB

2. **Push Phase:**
   - Get all local events with `source='google'`
   - For events with `googleEventId`: update Google if local is newer
   - For events without `googleEventId`: create new Google event
   - Delete local events if corresponding Google event was deleted

3. **Conflict Resolution:**
   - If both local and Google versions are modified: Google wins
   - Conflicts are counted and logged
   - No data loss - local changes are overwritten but logged

### Data Mapping

**Local Event → Google Event:**
- `title` → `summary`
- `description` → `description`
- `startTime` → `start.dateTime` or `start.date`
- `endTime` → `end.dateTime` or `end.date`
- `allDay` → determines date vs dateTime format

**Google Event → Local Event:**
- `summary` → `title`
- `description` → `description`
- `start.dateTime/date` → `startTime`
- `end.dateTime/date` → `endTime`
- `id` → `googleEventId`
- `source` → `'google'`

### API Endpoints Used

- `GET /calendars/primary/events` - Fetch events
- `POST /calendars/primary/events` - Create event
- `PUT /calendars/primary/events/{eventId}` - Update event
- `DELETE /calendars/primary/events/{eventId}` - Delete event

## Testing Checklist

- [ ] Google Sign-In works on iOS
- [ ] Google Sign-In works on Android
- [ ] Events sync from Google to app
- [ ] Events sync from app to Google
- [ ] Event updates sync bidirectionally
- [ ] Event deletions sync correctly
- [ ] All-day events sync correctly
- [ ] Timed events sync correctly
- [ ] Conflict resolution works (Google wins)
- [ ] Sync errors are handled gracefully
- [ ] Token refresh works for long sessions

## Security Considerations

1. **Never commit credentials** - Keep OAuth client IDs in `.env` file
2. **Use HTTPS only** - All API calls use secure connections
3. **Validate tokens** - Check token expiration and refresh
4. **Limit scopes** - Only request calendar access, not full Google account
5. **Handle errors** - Don't expose sensitive error details to users

## Troubleshooting

### iOS Issues

**"The operation couldn't be completed"**
- Check Info.plist URL scheme is correct
- Verify bundle identifier matches OAuth client

**"Sign in cancelled"**
- User cancelled the flow - this is normal
- Provide clear UI feedback

### Android Issues

**"Developer error"**
- SHA-1 fingerprint doesn't match
- Package name doesn't match OAuth client

**"Sign in failed with error 12500"**
- Google Play Services not available
- Update Google Play Services on device

### API Issues

**"401 Unauthorized"**
- Access token expired - implement refresh
- OAuth client not configured correctly

**"403 Forbidden"**
- Calendar API not enabled in Google Cloud Console
- Insufficient permissions granted by user

**"404 Not Found"**
- Event was deleted - handle gracefully
- Calendar ID is incorrect

## Next Steps

After completing the setup:

1. **Add UI for Google Sign-In** - Add button in Settings screen
2. **Implement token refresh** - Handle expired tokens automatically
3. **Add sync status indicator** - Show sync progress to users
4. **Handle offline sync** - Queue changes when offline
5. **Add conflict resolution UI** - Let users choose in conflicts
6. **Implement selective sync** - Let users choose which calendars to sync
7. **Add sync frequency settings** - Let users control sync timing

## Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [OAuth 2.0 for Mobile Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

For issues with:
- **Google Calendar API**: Check Google Cloud Console logs
- **OAuth setup**: Verify credentials in Google Cloud Console
- **Package installation**: Check React Native compatibility
- **App implementation**: Review code in `googleCalendarService.ts`

