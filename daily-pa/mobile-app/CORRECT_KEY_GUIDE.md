# Finding the Correct Supabase Anon Key

## ⚠️ Important: You Found the Wrong Key

The key you found (`116D0899-BA3D-4E05-A483-D2C23AC4C14D`) is the **JWT Secret**, which is NOT what we need.

## What You Need to Find

On the Supabase API settings page, you should see a section called **"Project API keys"** with these entries:

```
Project API keys

┌─────────────────────────────────────────────────────────────┐
│ anon public                                                  │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz... │  ← THIS ONE!
│ [Copy button]                                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ service_role                                                 │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz... │  ← NOT this one
│ [Copy button]                                                │
└─────────────────────────────────────────────────────────────┘
```

## Key Characteristics

The **anon public** key:
- ✅ Starts with `eyJhbGc`
- ✅ Is very long (300+ characters)
- ✅ Has two dots (.) in it
- ✅ Looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcHVhc21nbHJrYm5zeW1nYWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.xxxxxxxxxx`

The **JWT Secret** (what you found):
- ❌ Short UUID format
- ❌ Looks like: `116D0899-BA3D-4E05-A483-D2C23AC4C14D`
- ❌ This is NOT the anon key

## Step-by-Step Instructions

1. Go to: https://supabase.com/dashboard/project/qmpuasmglrkbnsymgaah/settings/api

2. Scroll down past the "Connection string" section

3. Find the section titled **"Project API keys"**

4. Look for the row labeled **"anon public"** (NOT "JWT Secret")

5. Click the **Copy** button next to the long key that starts with `eyJhbGc`

6. Paste it here to replace `REPLACE_WITH_ANON_PUBLIC_KEY` in `mobile-app/.env`

## Alternative: Check Your Web App

If you still can't find it, check where your web app gets it from:

### If deployed to Vercel:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Look for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Show" to reveal the value

### If running locally:
Check if you have a `.env.local` file in your web app root directory.

## Once You Have the Correct Key

Update `mobile-app/.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://qmpuasmglrkbnsymgaah.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
EXPO_PUBLIC_ENV=development
```

Then restart Expo:
```bash
# Press Ctrl+C in the terminal running Expo
npx expo start --clear
```
