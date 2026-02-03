# Quick Fix: Whisper API "Forbidden" Error on Vercel

## ✅ Immediate Solution (5 minutes)

### Step 1: Add API Key to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (get it from https://platform.openai.com/api-keys)
   - **Environments**: ✅ Production ✅ Preview ✅ Development
6. Click **Save**
7. **Redeploy** your app (go to Deployments → Redeploy)

### Step 2: Verify API Key Works

Test your API key:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"
```

If you get a list of models, your key works! ✅

### Step 3: Enable Billing (if needed)

If you still get 403 errors:
1. Go to https://platform.openai.com/account/billing
2. Add a payment method
3. Add some credits ($5 minimum)

## 🔍 Why This Happens

The "Forbidden" (403) error means:
- ❌ API key is missing in Vercel (most common)
- ❌ API key is invalid or expired
- ❌ Billing is not enabled on your OpenAI account
- ❌ API key has restrictions (IP whitelist, etc.)

## 🛠️ What We Fixed

The updated code now:
1. ✅ Provides **clear error messages** telling you exactly what's wrong
2. ✅ **Validates API key format** before making requests
3. ✅ **Retries automatically** on temporary failures
4. ✅ **Handles all error codes** with helpful solutions
5. ✅ **Validates file size** (max 25MB for Whisper API)
6. ✅ Uses **cheaper model** (`gpt-4o-mini`) for translations

## 📋 Error Codes Reference

| Code | Meaning | Solution |
|------|---------|----------|
| `MISSING_API_KEY` | Not set in Vercel | Add `OPENAI_API_KEY` to Vercel env vars |
| `INVALID_API_KEY` | Wrong format or expired | Get new key from OpenAI dashboard |
| `FORBIDDEN` | No permission or billing | Enable billing, check API key permissions |
| `RATE_LIMIT` | Too many requests | Wait a few minutes, upgrade plan |
| `SERVICE_UNAVAILABLE` | OpenAI is down | Check https://status.openai.com |

## 🚀 Alternative Solutions

### Option 1: Use Browser Speech Recognition (Free)

The app already supports browser's native speech recognition. It works without any API keys but:
- ✅ Free
- ✅ Works in Chrome/Edge/Safari
- ❌ Less accurate than Whisper
- ❌ Doesn't work in all browsers

### Option 2: Use Different Service

If OpenAI is too expensive:
- **Google Cloud Speech-to-Text**: More reliable, better pricing
- **Azure Speech**: Good accuracy, competitive pricing
- **AssemblyAI**: Developer-friendly, free tier available

### Option 3: Self-Hosted Solution

For maximum control:
- Deploy Whisper model on your own server
- Use services like Replicate or Hugging Face Inference API
- More complex but potentially cheaper at scale

## 💰 Cost Optimization

Current setup uses:
- `whisper-1` for transcription: **$0.006 per minute**
- `gpt-4o-mini` for translation: **$0.15 per 1M tokens**

Tips:
- Cache transcriptions if same audio is used multiple times
- Set spending limits in OpenAI dashboard
- Monitor usage regularly

## 📞 Still Having Issues?

1. **Check Vercel logs**: Project → Deployments → View Function Logs
2. **Test API key directly**: Use curl command above
3. **Check OpenAI status**: https://status.openai.com
4. **Verify environment variable**: Make sure it's set for the right environment (Production/Preview)

## 🎯 Next Steps

After fixing:
1. Test the transcription endpoint
2. Monitor costs in OpenAI dashboard
3. Set up usage alerts
4. Consider implementing rate limiting to prevent abuse

---

**Need more help?** See `VERCEL_WHISPER_API_SETUP.md` for detailed troubleshooting.
