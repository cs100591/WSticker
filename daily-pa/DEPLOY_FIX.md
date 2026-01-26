# Deploy the Dynamic Import Fix

Run these commands to deploy the fix:

```bash
cd /Users/cssee/Dev/WSticker/daily-pa
git add src/app/api/voice/transcribe/route.ts
git commit -m "Fix OpenAI import with dynamic import for Vercel"
git push
```

This should fix the Vercel build error!

## What I Changed:
- Changed from static `import OpenAI from 'openai'` to dynamic `await import('openai')`
- This fixes Vercel's module resolution issue

## After Deployment:
Wait 1-2 minutes for Vercel to deploy, then test:

```bash
curl -X POST https://daily-pa1.vercel.app/api/voice/transcribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer guest-user" \
  -d '{"audio":"test","language":"en"}'
```

Should work now! ✅
