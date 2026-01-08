# Calendar Sync Setup Guide

## ✅ Completed

The calendar sync feature has been implemented with the following components:

1. **Database Migration** (`supabase/migrations/20260108000000_add_calendar_sync.sql`)
   - `calendar_integrations` table for storing OAuth tokens
   - Additional columns on `calendar_events` for sync tracking
   - RLS policies for security

2. **Calendar Sync Service** (`src/lib/calendar-sync.ts`)
   - Functions for fetching Google Calendar events
   - Functions for creating events in Google Calendar
   - Sync logic to import events from external calendars
   - Provider detection based on OAuth login

3. **API Endpoints**
   - `POST /api/calendar/sync` - Trigger calendar sync
   - `GET /api/calendar/sync` - Get sync status
   - `POST /api/calendar/setup-integration` - Setup integration after OAuth login

4. **UI Components**
   - Sync status card showing provider and last sync time
   - Manual sync button with loading state
   - Visual indicators for synced events

5. **Documentation**
   - Updated `OAUTH_SETUP.md` with Google Calendar API scopes

---

## 🔧 Required Setup Steps

### 1. Run Database Migration

Run the migration to create the `calendar_integrations` table:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard > SQL Editor
# Copy and paste the contents of:
# daily-pa/supabase/migrations/20260108000000_add_calendar_sync.sql
```

### 2. Update Google OAuth Configuration

#### Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Library**
4. Search for **"Google Calendar API"**
5. Click **Enable**

#### Update OAuth Scopes in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** provider
5. In the **Scopes** field, add:
   ```
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/calendar.events
   ```
6. Click **Save**

> **Important**: Users will need to re-login to grant the new calendar permissions.

### 3. Test the Integration

#### For New Users

1. User logs in with Google
2. After successful login, call the setup endpoint:
   ```javascript
   await fetch('/api/calendar/setup-integration', { method: 'POST' });
   ```
3. Navigate to the calendar page
4. Click the "Sync Now" button
5. Events from Google Calendar should appear

#### For Existing Users

Existing users need to re-login to grant calendar permissions:

1. Log out
2. Log in again with Google
3. Authorize calendar access
4. Call setup endpoint (can be automated in the OAuth callback)
5. Sync calendar

### 4. Automate Integration Setup (Optional)

To automatically setup calendar integration after OAuth login, add this to your OAuth callback handler:

```typescript
// In src/app/auth/callback/route.ts or similar
export async function GET(request: NextRequest) {
  // ... existing OAuth callback logic ...
  
  // After successful login, setup calendar integration
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.provider_token) {
    // Call setup-integration endpoint
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/setup-integration`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
  }
  
  // ... redirect to dashboard ...
}
```

---

## 🍎 Apple Calendar Support (Future)

Apple Calendar sync requires CalDAV protocol or .ics import/export. This is more complex than Google Calendar and is marked as TODO in the code.

**Options for Apple Calendar:**
1. **CalDAV Protocol** - Direct calendar sync (requires Apple ID credentials)
2. **.ics Import/Export** - File-based sync (simpler but less real-time)
3. **iCloud API** - Official API (requires additional Apple Developer setup)

---

## 🔄 How It Works

### Sync Flow

1. **User logs in** with Google or Apple
2. **OAuth tokens** are stored in the session
3. **Setup integration** creates a record in `calendar_integrations` table
4. **Manual sync** or **automatic sync** fetches events from external calendar
5. **Events are imported** into local `calendar_events` table with:
   - `source`: 'google' or 'apple'
   - `external_id`: Original event ID from external calendar
   - `synced_at`: Timestamp of last sync
   - `is_readonly`: Flag to prevent editing synced events

### Provider Detection

The system automatically detects the user's OAuth provider:
- Google login → Google Calendar sync
- Apple login → Apple Calendar sync (when implemented)

### Token Management

- Access tokens are stored in `calendar_integrations` table
- Tokens expire after ~1 hour
- Refresh tokens can be used to get new access tokens (TODO: implement refresh logic)

---

## 🐛 Troubleshooting

### "Integration not found or disabled"

**Cause**: Calendar integration hasn't been set up for the user.

**Solution**: Call `/api/calendar/setup-integration` endpoint after login.

### "Google Calendar API error: 401 Unauthorized"

**Cause**: Access token has expired.

**Solution**: Implement token refresh logic or ask user to re-login.

### "Calendar sync not available for this auth provider"

**Cause**: User logged in with email/password instead of OAuth.

**Solution**: Only Google and Apple OAuth logins support calendar sync.

### Events not appearing after sync

**Cause**: 
- Calendar API not enabled
- Insufficient OAuth scopes
- Token expired

**Solution**:
1. Check Google Cloud Console - ensure Calendar API is enabled
2. Check Supabase - ensure calendar scopes are added
3. Check browser console for API errors
4. Try re-logging in

---

## 📊 Database Schema

### calendar_integrations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| provider | TEXT | 'google' or 'apple' |
| access_token | TEXT | OAuth access token |
| refresh_token | TEXT | OAuth refresh token |
| token_expires_at | TIMESTAMPTZ | Token expiration time |
| calendar_id | TEXT | External calendar ID |
| sync_enabled | BOOLEAN | Whether sync is enabled |
| last_sync_at | TIMESTAMPTZ | Last sync timestamp |
| created_at | TIMESTAMPTZ | Record creation time |
| updated_at | TIMESTAMPTZ | Record update time |

### calendar_events (new columns)

| Column | Type | Description |
|--------|------|-------------|
| source | TEXT | 'manual', 'google', or 'apple' |
| external_id | TEXT | External calendar event ID |
| synced_at | TIMESTAMPTZ | Last sync timestamp |
| is_readonly | BOOLEAN | Whether event can be edited |

---

## 🚀 Next Steps

1. ✅ Run database migration
2. ✅ Enable Google Calendar API
3. ✅ Update OAuth scopes in Supabase
4. ⏳ Test with a Google account
5. ⏳ Implement token refresh logic
6. ⏳ Add automatic sync on login
7. ⏳ Implement Apple Calendar support
8. ⏳ Add two-way sync (local → external calendar)
9. ⏳ Add conflict resolution for edited events
10. ⏳ Add sync scheduling (periodic background sync)

---

## 📚 References

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes#calendar)
