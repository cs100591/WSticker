# ⚡ 5-Minute Google Calendar Setup

## I've automated everything possible. You just need to:

### 1. Google Cloud Console (2 minutes)
1. Go to: https://console.cloud.google.com/
2. Create project: "Daily PA App"
3. Enable APIs: "Google Calendar API" + "Google+ API"
4. Create OAuth credentials (Web application)
5. Add redirect URI: `https://[YOUR-SUPABASE-ID].supabase.co/auth/v1/callback`
6. Copy Client ID & Secret

### 2. Supabase (2 minutes)
1. Authentication → Providers → Google
2. Paste Client ID & Secret
3. Scopes: `openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events`
4. SQL Editor → Run the migration (see setup-google-calendar.md)

### 3. Test (1 minute)
1. Log out → Log in with Google
2. Calendar page → Click "Sync"
3. Done! 🎉

**Everything else is already coded and ready to go!**