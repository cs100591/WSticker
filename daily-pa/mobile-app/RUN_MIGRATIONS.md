# Running Database Migrations

The "Network request failed" error occurs because the database tables don't exist yet in your Supabase project.

## Option 1: Run Migrations via Supabase Dashboard (Easiest)

1. Go to your Supabase project: https://supabase.com/dashboard/project/qmpuasmglrkbnsymgaah

2. Click on **SQL Editor** in the left sidebar

3. Click **"New query"**

4. Copy and paste the contents of `supabase/migrations/20240101000000_initial_schema.sql` from your project

5. Click **"Run"** to execute the migration

6. Repeat for `supabase/migrations/20260108000000_add_calendar_sync.sql`

## Option 2: Use Supabase CLI

If you have Supabase CLI installed:

```bash
# From the project root
cd ..
supabase db push
```

## Option 3: Manual SQL Execution

Copy the SQL from the migration files and run them in the Supabase SQL Editor:

### File 1: Initial Schema
Location: `supabase/migrations/20240101000000_initial_schema.sql`

### File 2: Calendar Sync
Location: `supabase/migrations/20260108000000_add_calendar_sync.sql`

## After Running Migrations

1. Restart the Expo app (press `r` in the terminal)
2. You'll be able to sign in with real accounts
3. The app will connect to your database successfully

## For Now: Use Skip Login

While you set up the database:
1. Scroll down on the login screen
2. Tap the yellow **"⚠️ Skip Login (Dev Only)"** button
3. This lets you explore the app UI without authentication
