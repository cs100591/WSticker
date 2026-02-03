# Mobile API Configuration Guide

## Important: API Routes in Mobile App

Since Next.js API routes don't work in static exports (required for Capacitor), your mobile app needs to call your **production API endpoints** (hosted on Vercel).

## Configuration Options

### Option 1: Point to Vercel Production API (Recommended)

1. **Update Capacitor Config** (`capacitor.config.ts`):

```typescript
server: {
  androidScheme: 'https',
  url: 'https://your-app.vercel.app', // Your Vercel deployment URL
}
```

2. **Update API Base URL** in your app:

Create `src/lib/mobile-config.ts`:

```typescript
// Detect if running in Capacitor
export const isMobile = typeof window !== 'undefined' && 
  (window as any).Capacitor !== undefined;

// Get API base URL
export const getApiBaseUrl = () => {
  if (isMobile) {
    // Use your Vercel URL for mobile
    return process.env.NEXT_PUBLIC_API_URL || 'https://your-app.vercel.app';
  }
  // Use relative URLs for web
  return '';
};
```

3. **Update API Calls**:

Instead of:
```typescript
fetch('/api/voice/transcribe', ...)
```

Use:
```typescript
import { getApiBaseUrl } from '@/lib/mobile-config';

fetch(`${getApiBaseUrl()}/api/voice/transcribe`, ...)
```

### Option 2: Environment Variables

Set environment variables at build time:

1. **Create `.env.mobile`**:
```bash
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

2. **Update build script**:
```json
"build:mobile": "NEXT_PUBLIC_CAPACITOR=true NEXT_PUBLIC_API_URL=https://your-app.vercel.app next build"
```

3. **Use in code**:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
fetch(`${apiUrl}/api/voice/transcribe`, ...)
```

## API Routes That Need Attention

These API routes need to work from mobile:

1. ✅ `/api/voice/transcribe` - Whisper API (already configured)
2. ✅ `/api/voice/parse` - Voice intent parsing
3. ✅ `/api/chat` - AI chatbot
4. ✅ `/api/todos` - Todo CRUD
5. ✅ `/api/expenses` - Expense CRUD
6. ✅ `/api/calendar` - Calendar events
7. ✅ `/api/ocr/scan` - Receipt scanning

## CORS Configuration

Make sure your Vercel deployment allows requests from your mobile app:

1. **Next.js API Routes** - Should work by default
2. **If using custom domain** - May need CORS headers

Add to your API routes if needed:

```typescript
export async function POST(req: NextRequest) {
  // CORS headers for mobile
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }
  
  // Your API logic...
}
```

## Testing Mobile API Calls

### 1. Test from Android Emulator

```bash
# Start emulator
emulator -avd Pixel_5_API_33

# Install app
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Check logs
adb logcat | grep -i "api\|error\|fetch"
```

### 2. Test API Endpoints Directly

```bash
# Test transcription endpoint
curl -X POST https://your-app.vercel.app/api/voice/transcribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer guest-user" \
  -d '{"audio": "base64-encoded-audio"}'
```

### 3. Use Chrome DevTools

1. Connect Android device via USB
2. Enable USB debugging
3. Open Chrome → `chrome://inspect`
4. Inspect your app
5. Check Network tab for API calls

## Common Issues

### Issue: API calls fail with "Network Error"

**Solutions**:
1. Check if `NEXT_PUBLIC_API_URL` is set correctly
2. Verify Vercel deployment is accessible
3. Check Android manifest for internet permission
4. Ensure API uses HTTPS (not HTTP)

### Issue: CORS errors

**Solution**: Add CORS headers to API routes (see above)

### Issue: API works in browser but not mobile

**Solution**: 
1. Check if using relative URLs (`/api/...`) - these won't work in mobile
2. Use absolute URLs with `NEXT_PUBLIC_API_URL`
3. Verify Capacitor config has correct server URL

## Best Practices

1. ✅ **Always use environment variables** for API URLs
2. ✅ **Test API endpoints** before building APK
3. ✅ **Use HTTPS** for all API calls in production
4. ✅ **Handle network errors** gracefully in your app
5. ✅ **Show loading states** during API calls
6. ✅ **Cache API responses** when appropriate

## Example: Updated API Call

```typescript
// src/lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function transcribeAudio(audio: string, language?: string) {
  const response = await fetch(`${API_BASE_URL}/api/voice/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer guest-user', // or get from auth
    },
    body: JSON.stringify({ audio, language }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}
```

## Next Steps

1. Update all API calls to use `getApiBaseUrl()` helper
2. Set `NEXT_PUBLIC_API_URL` in your build process
3. Test API calls from mobile app
4. Monitor API usage and errors
5. Consider implementing API response caching
