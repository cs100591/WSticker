# 🚀 Automated Google Calendar Setup Guide

## What I've Already Done For You ✅

- ✅ Updated Google sign-in to request calendar permissions
- ✅ Updated auth callback to auto-setup calendar integration
- ✅ Calendar sync UI is already built and ready
- ✅ All API endpoints are implemented
- ✅ Database migration script is ready

## What You Need to Do (5 minutes) 🔧

### Step 1: Google Cloud Console Setup

**1.1 Go to Google Cloud Console**
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

**1.2 Create/Select Project**
- Click "Select a project" dropdown at the top
- Click "NEW PROJECT" 
- Name: "Daily PA App" (or any name)
- Click "CREATE"

**1.3 Enable APIs (2 clicks)**
- Left sidebar: "APIs & Services" → "Library"
- Search: "Google Calendar API" → Click it → Click "ENABLE"
- Search: "Google+ API" → Click it → Click "ENABLE"

**1.4 Create OAuth Credentials**
- Left sidebar: "APIs & Services" → "Credentials"
- Click "+ CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
- If prompted for consent screen:
  - Choose "External"
  - App name: "Daily PA"
  - Your email in developer contact
  - Click "Save and Continue" through all steps
- Back to Credentials → "+ CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
- Application type: "Web application"
- Name: "Daily PA Web Client"
- Authorized redirect URIs: `https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback`
  
  **To find your Supabase project ID:**
  - Go to your Supabase dashboard
  - Look at the URL: `https://app.supabase.com/project/[PROJECT-ID]`
  - Or check Settings → General → Reference ID

- Click "CREATE"
- **COPY THE CLIENT ID AND CLIENT SECRET** (you'll need these next)

### Step 2: Supabase Setup

**2.1 Add Google Provider**
- Go to your Supabase dashboard
- Left sidebar: "Authentication" → "Providers"
- Find "Google" and click it (or click "Add provider" if not listed)
- Toggle "Enable sign in with Google" to ON
- Paste your Google Client ID and Client Secret
- **Important**: In the "Scopes" field, paste this exactly:
  ```
  openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events
  ```
- Click "Save"

**2.2 Run Database Migration**
- Left sidebar: "SQL Editor"
- Click "New query"
- Copy the entire SQL script from below and paste it
- Click "RUN"

### Step 3: Test Everything

**3.1 Test Login**
- Log out of your app
- Go to login page
- Click "Sign in with Google"
- Grant calendar permissions
- Should redirect to dashboard

**3.2 Test Calendar Sync**
- Go to Calendar page
- Should see "Google Calendar Sync" status
- Click "Sync" button
- Your Google Calendar events should appear!

---

## Database Migration SQL Script

```sql
-- Add calendar sync support
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar integrations"
  ON calendar_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar integrations"
  ON calendar_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar integrations"
  ON calendar_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar integrations"
  ON calendar_integrations FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google', 'apple')),
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_readonly BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_calendar_events_external_id ON calendar_events(external_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_source ON calendar_events(source);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_provider ON calendar_integrations(user_id, provider);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Troubleshooting 🔧

### "Redirect URI mismatch"
- Check that your Google OAuth redirect URI exactly matches your Supabase callback URL
- Format: `https://[project-id].supabase.co/auth/v1/callback`

### "Calendar sync not available"
- Make sure you logged in with Google (not email/password)
- Check that calendar scopes are added in Supabase

### "No events appearing"
- Check that your Google Calendar has events
- Try clicking "Sync" button again
- Check browser console for errors

---

## What Happens After Setup ✨

1. **Google Login Button** → Requests calendar permissions
2. **After Login** → Automatically sets up calendar integration
3. **Calendar Page** → Shows "Google Calendar Sync" status
4. **Sync Button** → Pulls events from Google Calendar
5. **Events Display** → Beautiful horizontal bars like Google Calendar
6. **Multi-day Events** → Span correctly across days
7. **Colors** → Use your app's color scheme
8. **Read-only** → Synced events are protected from editing

The entire calendar sync system is already built - you just need to connect the OAuth credentials!