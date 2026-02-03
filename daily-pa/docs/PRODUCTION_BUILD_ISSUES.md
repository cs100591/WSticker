# Production Build Issues & Solutions

## Whisper API Error (Forbidden)

### Issue
When building for Android production, you may encounter the error:
```
Transcription Failed
Saved as offline draft due to API error.
Whisper API failed: Forbidden
```

### Root Cause
The Whisper API (OpenAI's speech-to-text service) requires an API key that must be configured in your production environment. The error "Forbidden" (HTTP 403) indicates:

1. **Missing API Key**: The `OPENAI_API_KEY` environment variable is not set in production
2. **Invalid API Key**: The API key is incorrect or expired
3. **API Key Restrictions**: The API key may have IP restrictions or domain restrictions that don't allow requests from your production app
4. **Billing Issues**: Your OpenAI account may not have billing enabled or credits available

### Solution

#### For Web/Next.js Production Builds

1. **Set Environment Variables**:
   ```bash
   # In your production environment (Vercel, Netlify, etc.)
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

2. **Verify API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key if needed
   - Ensure billing is enabled: https://platform.openai.com/account/billing

3. **Check API Key Permissions**:
   - Ensure the API key has access to the Whisper API
   - Remove any IP/domain restrictions if your app needs to call from mobile devices

#### For Mobile App Production Builds (React Native, etc.)

If you're building a mobile app that wraps this web app:

1. **Configure Environment Variables**:
   - For React Native: Use `react-native-config` or similar
   - For Capacitor/Cordova: Set in your native config files
   - For Expo: Use `expo-constants` with environment variables

2. **Example React Native Config**:
   ```javascript
   // .env.production
   OPENAI_API_KEY=sk-your-actual-api-key-here
   
   // In your code
   import Config from 'react-native-config';
   const apiKey = Config.OPENAI_API_KEY;
   ```

3. **Security Note**:
   - **DO NOT** hardcode API keys in your mobile app code
   - Use a backend proxy endpoint instead to keep API keys secure
   - Create an API route like `/api/voice/transcribe` that calls Whisper API server-side

### Recommended Approach: Backend Proxy

Instead of calling Whisper API directly from the mobile app, create a backend endpoint:

```typescript
// app/api/voice/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Whisper API not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Whisper API failed: ${response.statusText}`, details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ transcript: data.text });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Then call this endpoint from your mobile app instead of calling Whisper API directly.

### Testing

1. **Test API Key**:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. **Test Whisper API**:
   ```bash
   curl https://api.openai.com/v1/audio/transcriptions \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -F file="@audio.mp3" \
     -F model="whisper-1"
   ```

### Alternative: Use Browser Speech Recognition

If Whisper API is not available, the app already has a fallback to browser's native Speech Recognition API (used in `useVoiceAssistant.ts`). This works in:
- Chrome/Edge (desktop and Android)
- Safari (iOS/macOS)
- Does NOT work in all browsers/devices

Consider showing a message to users when Whisper API is unavailable, directing them to use text input instead.

## Calendar Duplication Issues

### Issue
Calendar events are being duplicated every time the app refreshes or syncs.

### Root Cause
1. The duplicate check was using `.single()` which throws an error if duplicates already exist
2. All-day events from Google Calendar use exclusive end dates, causing display issues

### Solution
Fixed in `src/lib/calendar-sync.ts`:
- Changed `.single()` to `.maybeSingle()` for duplicate checks
- Added cleanup function to remove existing duplicates
- Fixed all-day event date handling
- Added better error handling and logging

### How to Clean Up Existing Duplicates

The sync function now automatically cleans up duplicates before syncing. You can also manually trigger cleanup by calling the sync endpoint.

## Two-Day Event Issue

### Issue
All-day events (like birthdays) appear on two days instead of one (e.g., birthday on Jan 7 also shows on Jan 6).

### Root Cause
Google Calendar uses exclusive end dates for all-day events:
- Event on Jan 7: `start="2026-01-07"`, `end="2026-01-08"`
- The `end` date means "ends at the start of this date", so it's only on Jan 7

### Solution
Fixed in:
1. `src/lib/calendar-sync.ts` - Proper handling of all-day event dates
2. `src/app/(dashboard)/calendar/page.tsx` - Display logic adjusted for single-day all-day events

The calendar now correctly displays single-day all-day events on only one day.
