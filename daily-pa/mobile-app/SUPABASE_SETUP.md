# Supabase Setup for Mobile App

Since you already have Supabase configured for the web version, you just need to copy the same credentials to the mobile app.

## Quick Setup

1. **Find your Supabase credentials** from your web app deployment (Vercel, .env.local, etc.)
   - `NEXT_PUBLIC_SUPABASE_URL` (looks like: `https://xxxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (long JWT token)

2. **Update mobile-app/.env** with your credentials:

```bash
# Replace these with your actual Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_ENV=development
```

3. **Restart the Expo server** to pick up the new environment variables:
   - Press `Ctrl+C` to stop the current server
   - Run `npx expo start --clear` again

## Where to Find Your Credentials

### Option 1: Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Option 2: From Your Web App
If you deployed to Vercel:
1. Go to your Vercel project
2. Settings → Environment Variables
3. Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Option 3: Local .env.local
If you have a `.env.local` file in your web app root:
```bash
cat .env.local | grep SUPABASE
```

## After Setup

Once you've updated the credentials:
1. The mobile app will connect to the same Supabase database as your web app
2. You can sign in with the same accounts
3. Data will sync between web and mobile
4. You won't need the "Skip Login" button anymore

## Note

The mobile app uses `EXPO_PUBLIC_` prefix instead of `NEXT_PUBLIC_` because it's an Expo app, but they connect to the same Supabase project.
