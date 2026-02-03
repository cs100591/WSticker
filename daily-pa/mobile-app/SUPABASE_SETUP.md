# Supabase Edge Functions Setup Guide

To use Supabase Edge Functions for your AI features (Chat & Voice Transcription) and securely store your OpenAI API Key, follow these steps:

## 1. Deploy the Edge Function

You already have the function code in `supabase/functions/api/index.ts`. You need to deploy it to your Supabase project.

Run this command in your terminal (from the project root):

```bash
npx supabase functions deploy api --no-verify-jwt
```

*Note: `--no-verify-jwt` is used if you want to allow public access or handle auth manually inside the function. Since the function checks for `req.method === 'OPTIONS'`, it should be fine. Ideally, restrict it, but for now this matches your current setup.*

## 2. Set the OpenAI API Key in Supabase

This is the most important step. You **must** store your OpenAI key as a secret in Supabase so the function can access it via `Deno.env.get('OPENAI_API_KEY')`.

Run this command:

```bash
npx supabase secrets set OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_OPENAI_KEY_HERE
```

*Replace `sk-proj-YOUR_ACTUAL...` with your actual OpenAI API Key that starts with `sk-`.*

## 3. Verify on Supabase Dashboard

1.  Go to your Supabase Dashboard: [https://supabase.com/dashboard/project/qmpuasmgkrlkbnsymgaah](https://supabase.com/dashboard/project/qmpuasmgkrlkbnsymgaah) (Check your actual project ID).
2.  Navigate to **Edge Functions**.
3.  You should see the `api` function listed.
4.  Navigate to **Project Settings > Secrets** (or within the Edge Functions section) to verify `OPENAI_API_KEY` is set.

## 4. Troubleshooting

If the app still says "API Error" or behaves dumbly:
1.  **Check Logs:** Go to the Supabase Dashboard > Edge Functions > `api` > Logs.
2.  **Watch for Errors:** Look for "Missing OPENAI_API_KEY" or "OpenAI Error".
3.  **Permissions:** Ensure the function allows usage. The current code handles CORS basics.
