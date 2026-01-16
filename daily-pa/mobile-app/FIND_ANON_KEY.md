# How to Find Your Supabase Anon Key

## Method 1: Supabase Dashboard (Recommended)

1. **Go to your project's API settings:**
   ```
   https://supabase.com/dashboard/project/qmpuasmglrkbnsymgaah/settings/api
   ```

2. **Scroll down to "Project API keys" section**
   
   You should see something like this:
   ```
   Project API keys
   
   anon public
   [long key starting with eyJhbGc...] [Copy button]
   
   service_role
   [another long key] [Copy button]
   ```

3. **Copy the "anon public" key** (NOT the service_role key)
   - Click the copy button next to "anon public"
   - This is the key you need for the mobile app

## Method 2: Check Your Web App Deployment

If you deployed your web app to Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings → Environment Variables**
4. Look for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Show" to reveal the value

## Method 3: Browser DevTools (If Web App is Running)

If your web app is currently running:

1. Open your web app in a browser
2. Open DevTools (F12 or Right-click → Inspect)
3. Go to Console tab
4. Type: `localStorage` and press Enter
5. Look for Supabase-related entries

## What the Anon Key Looks Like

The anon public key is a JWT token that:
- Starts with `eyJhbGc`
- Is very long (several hundred characters)
- Contains dots (.) separating three parts
- Example format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcHVhc21nbHJrYm5zeW1nYWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Once You Have Both:

Run this command in the mobile-app directory:

```bash
cd mobile-app
./update-supabase.sh https://qmpuasmglrkbnsymgaah.supabase.co YOUR_ANON_KEY_HERE
```

Or manually edit `mobile-app/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://qmpuasmglrkbnsymgaah.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
EXPO_PUBLIC_ENV=development
```

Then restart the Expo server:
```bash
# Press Ctrl+C to stop current server
npx expo start --clear
```
