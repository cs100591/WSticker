# Fixes for API and Calendar Issues

## Issue 1: API Keys Not Working

**Problem**: The app is trying to use OpenAI API key from environment variables, but you said all AI APIs are on Vercel backend.

**Solution**: The app should call your Vercel API endpoints instead of using client-side API keys.

### Files to Check:
1. `/src/components/FloatingChatbot.tsx` - Remove direct OpenAI API calls
2. `/src/services/aiService.ts` - Ensure it calls your Vercel backend
3. Voice transcription should also go through your Vercel API

### What to do:
- Make sure all AI features call `EXPO_PUBLIC_API_URL` (https://daily-pa1.vercel.app)
- Remove any direct OpenAI/DeepSeek API calls from the mobile app
- The Vercel backend should handle all AI API calls securely

---

## Issue 2: Calendar Duplicates

**Problem**: The calendar sync function (`syncWithDevice` in CalendarService.ts) uses a "wipe and replace" strategy that deletes ALL device events and re-imports them every time it runs. If this function is called multiple times (e.g., on every screen refresh), it creates duplicates.

**Root Cause**: Lines 333-361 in CalendarService.ts:
```typescript
// Wipe existing device mirrors
for (const e of deviceEventsToDelete) {
  await CalendarEventRepository.delete(e.id);
}

// Import fresh events
for (const dEvent of deviceEvents) {
  await CalendarEventRepository.create({...});
}
```

### Solution Options:

#### Option A: Add Sync Lock (Recommended)
Add these properties to the CalendarService class (around line 37):

```typescript
private isSyncing = false;
private lastSyncTime: number = 0;
private readonly SYNC_COOLDOWN_MS = 10000; // 10 seconds cooldown
```

Then modify `syncWithDevice` to check the lock:

```typescript
async syncWithDevice(userId: string): Promise<void> {
  // Prevent concurrent syncs
  if (this.isSyncing) {
    console.log('Sync already in progress, skipping...');
    return;
  }

  // Cooldown check
  const now = Date.now();
  if (now - this.lastSyncTime < this.SYNC_COOLDOWN_MS) {
    console.log('Sync cooldown active, skipping...');
    return;
  }

  try {
    this.isSyncing = true;
    this.lastSyncTime = now;
    
    // ... rest of sync logic ...
    
  } finally {
    this.isSyncing = false;
  }
}
```

#### Option B: Smart Sync (Better, but more complex)
Instead of deleting all and re-creating, compare events and only update changed ones:

```typescript
// Instead of wiping all device events, check each one
const existingEventsMap = new Map(
  deviceEventsToDelete.map(e => [e.appleEventId, e])
);

for (const dEvent of deviceEvents) {
  const existing = existingEventsMap.get(dEvent.id);
  
  if (existing) {
    // Update if changed
    const hasChanged = 
      existing.title !== dEvent.title ||
      new Date(existing.startTime).getTime() !== new Date(dEvent.startDate).getTime();
    
    if (hasChanged) {
      await CalendarEventRepository.update(existing.id, {...});
    }
  } else {
    // Create new
    await CalendarEventRepository.create({...});
  }
}
```

---

## Issue 3: Where is Sync Being Called?

**Need to find**: Search for where `syncWithDevice` is being called. It might be:
- In a `useEffect` without proper dependencies
- On every screen focus/refresh
- In multiple places simultaneously

**Action**: Add console.log to track when sync is called:
```typescript
async syncWithDevice(userId: string): Promise<void> {
  console.log('=== SYNC CALLED ===', new Date().toISOString());
  console.trace(); // This will show the call stack
  // ... rest of function
}
```

---

## Quick Fix for Now:

1. **Stop the duplicate sync**: Add the sync lock (Option A above)
2. **Fix API calls**: Ensure all AI features call your Vercel backend, not client-side APIs
3. **Rebuild APK**: Run `npx eas-cli build --platform android --profile preview`

---

## Testing:
1. Install new APK
2. Open Calendar screen
3. Pull to refresh multiple times
4. Check if duplicates still appear
5. Try voice transcription - it should call your Vercel API, not show "Demo Mode"
