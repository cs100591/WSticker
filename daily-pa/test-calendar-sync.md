# Calendar Sync Test Checklist

## ✅ Setup Verification

### Database Migration
- [ ] Run the SQL migration in Supabase Dashboard
- [ ] Verify `calendar_integrations` table exists
- [ ] Verify `calendar_events` table has new columns (`source`, `external_id`, `synced_at`, `is_readonly`)

### Google Cloud Console
- [ ] Google Calendar API is enabled
- [ ] Project has proper OAuth credentials

### Supabase Configuration
- [ ] Google provider has calendar scopes:
  ```
  openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events
  ```

## 🧪 Testing Steps

### 1. Login Test
- [ ] Log out of the app
- [ ] Log in with Google
- [ ] Grant calendar permissions when prompted

### 2. Integration Setup Test
- [ ] Go to Calendar page
- [ ] Check if sync status shows "Google Calendar Sync"
- [ ] If not, click "Sync" button to trigger setup

### 3. Sync Test
- [ ] Click "Sync" button
- [ ] Should see "Syncing..." loading state
- [ ] Events from Google Calendar should appear
- [ ] Events should have horizontal bar style
- [ ] "Last synced" timestamp should update

### 4. Event Display Test
- [ ] Google Calendar events show with correct colors
- [ ] Multi-day events span correctly
- [ ] Event details show in tooltips
- [ ] Events are read-only (synced events shouldn't be editable)

## 🐛 Troubleshooting

### "Integration not found or disabled"
- User needs to re-login with Google to grant calendar permissions
- Click "Sync" button to trigger integration setup

### "Google Calendar API error: 401 Unauthorized"
- Access token expired - user needs to re-login
- Check if Google Calendar API is enabled in Google Cloud Console

### "Calendar sync not available for this auth provider"
- User logged in with email/password instead of Google OAuth
- Need to log in with Google account

### No events appearing after sync
- Check browser console for errors
- Verify Google Calendar has events in the date range
- Check if events are private/hidden in Google Calendar

## 📊 Expected Behavior

### Sync Status Card
```
🔵 Google Calendar Sync
Last synced: [timestamp]
[Sync] button
```

### Event Display
- Google Calendar events appear with horizontal bars
- Events span multiple days correctly
- Colors match Google Calendar or use app's color scheme
- Tooltips show event details
- Events are marked as read-only (from external source)

### Performance
- Initial sync may take a few seconds
- Subsequent syncs should be faster
- Events are cached locally for offline viewing