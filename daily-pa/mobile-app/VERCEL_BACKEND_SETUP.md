# AI Features Integration Fix Guide

## Current Status:
Your mobile app is correctly configured to call your Vercel backend at `https://daily-pa1.vercel.app`

## Required Vercel Backend Endpoints:

### 1. Voice Transcription
**Endpoint**: `POST /api/voice/transcribe`
**Request Body**:
```json
{
  "audio": "base64_encoded_audio_string",
  "language": "en" // or "zh", "ms", etc.
}
```
**Response**:
```json
{
  "text": "transcribed text here"
}
```

**Implementation Example** (create `/api/voice/transcribe.ts` in your Vercel project):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side env var
});

export async function POST(req: NextRequest) {
  try {
    const { audio, language } = await req.json();
    
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    
    // Create a File object for OpenAI
    const file = new File([audioBuffer], 'audio.m4a', { type: 'audio/m4a' });
    
    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: language || 'en',
    });
    
    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
```

---

### 2. AI Chat/Assistant
**Endpoint**: `POST /api/chat`
**Request Body**:
```json
{
  "message": "user message",
  "language": "en",
  "history": [] // optional conversation history
}
```
**Response**:
```json
{
  "message": "AI response",
  "actions": [] // optional parsed actions
}
```

---

### 3. Translation (for Voice Notes)
**Endpoint**: `POST /api/translate`
**Request Body**:
```json
{
  "text": "text to translate",
  "from": "en",
  "to": "zh"
}
```
**Response**:
```json
{
  "translatedText": "translated text"
}
```

---

### 4. Receipt OCR (already exists?)
**Endpoint**: `POST /api/ocr/receipt`
**Request Body**:
```json
{
  "image": "base64_encoded_image"
}
```
**Response**:
```json
{
  "items": [...],
  "total": 123.45
}
```

---

## Quick Test:

### Test if your Vercel endpoints exist:
```bash
# Test transcription endpoint
curl -X POST https://daily-pa1.vercel.app/api/voice/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio":"test","language":"en"}'

# Test chat endpoint
curl -X POST https://daily-pa1.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","language":"en"}'
```

---

## If Endpoints Don't Exist:

### Option 1: Create them in your Vercel project
1. Go to your Vercel project folder
2. Create `/app/api/voice/transcribe/route.ts` (Next.js 13+ App Router)
   OR `/pages/api/voice/transcribe.ts` (Pages Router)
3. Implement the endpoint as shown above
4. Deploy to Vercel

### Option 2: Use a different backend URL
If you have the endpoints at a different URL, update `eas.json`:
```json
{
  "env": {
    "EXPO_PUBLIC_API_URL": "https://your-actual-backend-url.com"
  }
}
```

---

## Environment Variables on Vercel:

Make sure these are set in your Vercel project settings:
- `OPENAI_API_KEY` - Your OpenAI API key
- `DEEPSEEK_API_KEY` - Your DeepSeek API key (if using)
- `GOOGLE_CLOUD_API_KEY` - For Vision API (receipt scanning)

---

## Next Steps:

1. ✅ **Verify endpoints exist** - Test with curl commands above
2. ✅ **Create missing endpoints** - Use the code examples
3. ✅ **Set environment variables** - In Vercel dashboard
4. ✅ **Test from mobile app** - Rebuild APK and test voice transcription
5. ✅ **Monitor logs** - Check Vercel function logs for errors

---

## Mobile App is Already Configured! ✅

The mobile app code is correct and will work once your Vercel endpoints are ready:
- FloatingChatbot.tsx → calls `/api/voice/transcribe`
- NotesScreen.tsx → calls `/api/voice/transcribe`  
- ChatScreen.tsx → calls `/api/chat`
- ReceiptService.ts → calls `/api/ocr/receipt`

No changes needed to mobile app code!
