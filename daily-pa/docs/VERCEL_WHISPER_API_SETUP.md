# Vercel Whisper API Setup Guide

## Quick Fix for "Forbidden" Error

If you're getting `Whisper API failed: Forbidden` errors, follow these steps:

### 1. Add Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add a new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-`)
   - **Environment**: Select all (Production, Preview, Development)

4. **Redeploy** your application after adding the variable

### 2. Verify API Key

Test your API key:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

If you get a 401 or 403 error, your API key is invalid or doesn't have the right permissions.

### 3. Enable Billing

1. Go to https://platform.openai.com/account/billing
2. Add a payment method
3. Ensure you have credits available

### 4. Check API Key Permissions

1. Go to https://platform.openai.com/api-keys
2. Verify your API key exists and is active
3. Check if there are any restrictions (IP whitelist, etc.)
4. If restricted, either:
   - Remove restrictions, OR
   - Add Vercel's IP ranges (not recommended, better to remove restrictions)

## Common Issues & Solutions

### Issue: "Missing OpenAI API Key"

**Solution**: Add `OPENAI_API_KEY` to Vercel environment variables and redeploy.

### Issue: "Invalid API key format"

**Solution**: Ensure your API key starts with `sk-`. Generate a new key if needed.

### Issue: "API access forbidden" (403)

**Possible causes**:
1. **Billing not enabled**: Enable billing at https://platform.openai.com/account/billing
2. **API key restrictions**: Remove IP/domain restrictions from your API key
3. **Insufficient credits**: Add credits to your OpenAI account
4. **Wrong API key**: Verify you're using the correct key

**Solution**: 
- Check billing status
- Remove API key restrictions
- Verify API key is correct

### Issue: "Rate limit exceeded" (429)

**Solution**: 
- Wait a few minutes and retry
- Upgrade your OpenAI plan for higher rate limits
- Implement client-side rate limiting

### Issue: Works locally but fails in production

**Common causes**:
1. Environment variable not set in Vercel
2. Environment variable set but app not redeployed
3. Different API key used locally vs production

**Solution**:
1. Verify variable exists in Vercel dashboard
2. Redeploy after adding/changing environment variables
3. Use the same API key for both environments (or separate keys if needed)

## Alternative Solutions

### Option 1: Use Browser Speech Recognition (Already Implemented)

The app already has a fallback to browser's native Speech Recognition API. This works without any API keys but has limitations:
- ✅ Works in Chrome/Edge (desktop & Android)
- ✅ Works in Safari (iOS/macOS)
- ❌ Doesn't work in all browsers
- ❌ Less accurate than Whisper API

### Option 2: Use a Different Speech-to-Text Service

If OpenAI Whisper API is too expensive or unreliable, consider:

1. **Google Cloud Speech-to-Text**
   - More reliable for production
   - Better pricing for high volume
   - Requires Google Cloud setup

2. **Azure Speech Services**
   - Good accuracy
   - Competitive pricing
   - Requires Azure account

3. **AssemblyAI**
   - Developer-friendly API
   - Good documentation
   - Free tier available

### Option 3: Proxy Through Your Own Backend

Instead of calling OpenAI directly, proxy through your own backend:

```typescript
// app/api/voice/transcribe-proxy/route.ts
export async function POST(req: NextRequest) {
  // Your backend logic here
  // This gives you more control over:
  // - Rate limiting
  // - Caching
  // - Fallback strategies
  // - Cost management
}
```

## Best Practices

1. **Never expose API keys in client-side code**
   - Always use server-side API routes (which you're already doing ✅)

2. **Implement retry logic**
   - The updated code includes retry logic for transient failures

3. **Add rate limiting**
   - Prevent abuse and control costs
   - Use Vercel's rate limiting or implement your own

4. **Monitor usage**
   - Set up alerts in OpenAI dashboard
   - Track costs and usage patterns

5. **Have a fallback**
   - The app should gracefully degrade if Whisper API is unavailable
   - Show helpful error messages to users

## Testing

After setting up, test the endpoint:

```bash
# Test transcription
curl -X POST https://your-app.vercel.app/api/voice/transcribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer guest-user" \
  -d '{
    "audio": "base64-encoded-audio-here",
    "language": "en"
  }'
```

## Cost Optimization

1. **Use appropriate models**: The code uses `whisper-1` for transcription and `gpt-4o-mini` for translation (cheaper)
2. **Cache transcriptions**: If the same audio is transcribed multiple times, cache the result
3. **Set usage limits**: Configure spending limits in OpenAI dashboard
4. **Monitor costs**: Regularly check your OpenAI usage dashboard

## Support

If issues persist:
1. Check OpenAI status: https://status.openai.com
2. Review OpenAI API documentation: https://platform.openai.com/docs/api-reference/audio
3. Check Vercel logs: Project > Deployments > View Function Logs
4. Test API key directly using curl commands above
