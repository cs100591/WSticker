// Calendar Sync Service
// Handles Google Calendar and Apple Calendar (iCloud) synchronization

import { createClient } from '@/lib/supabase/server';

export type CalendarProvider = 'google' | 'apple';

interface GoogleCalendarItem {
  id: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
}

interface GoogleCalendarResponse {
  items?: GoogleCalendarItem[];
}

interface CalendarIntegration {
  id: string;
  userId: string;
  provider: CalendarProvider;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  calendarId?: string;
  syncEnabled: boolean;
  lastSyncAt?: Date;
}

interface ExternalCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

/**
 * Get calendar integration for a user
 */
export async function getCalendarIntegration(
  userId: string,
  provider: CalendarProvider
): Promise<CalendarIntegration | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    provider: data.provider,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: data.token_expires_at ? new Date(data.token_expires_at) : undefined,
    calendarId: data.calendar_id,
    syncEnabled: data.sync_enabled,
    lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
  };
}

/**
 * Fetch events from Google Calendar
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<ExternalCalendarEvent[]> {
  try {
    const params = new URLSearchParams({
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    const data: GoogleCalendarResponse = await response.json();
    
    return (data.items || []).map((item: any) => {
      const isAllDay = !item.start.dateTime;
      let startTime = item.start.dateTime || item.start.date;
      let endTime = item.end.dateTime || item.end.date;
      
      // Fix all-day events: Google Calendar uses exclusive end dates
      // For all-day events, if end date is the next day, it means the event is only on the start day
      if (isAllDay && startTime && endTime) {
        // Google Calendar format: start="2026-01-07", end="2026-01-08" means event is on Jan 7 only
        // We'll keep this format but ensure our display logic handles it correctly
        void startTime;
        void endTime;
      }
      
      return {
        id: item.id,
        title: item.summary || 'Untitled Event',
        description: item.description,
        startTime,
        endTime,
        allDay: isAllDay,
      };
    });
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return [];
  }
}

/**
 * Create event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    allDay?: boolean;
  }
): Promise<string | null> {
  try {
    interface GoogleEventData {
      summary: string;
      description?: string;
      start: { date?: string; dateTime?: string; timeZone?: string };
      end: { date?: string; dateTime?: string; timeZone?: string };
    }

    const eventData: GoogleEventData = {
      summary: event.title,
      description: event.description,
      start: {},
      end: {},
    };

    if (event.allDay) {
      eventData.start = { date: event.startTime.split('T')[0] };
      eventData.end = { date: event.endTime.split('T')[0] };
    } else {
      eventData.start = { dateTime: event.startTime };
      eventData.end = { dateTime: event.endTime };
    }

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

/**
 * Clean up duplicate calendar events (keep the first one, delete the rest)
 */
export async function cleanupDuplicateEvents(userId: string): Promise<{ removed: number }> {
  const supabase = await createClient();
  let removed = 0;

  try {
    // Find all synced events grouped by external_id
    const { data: allSyncedEvents } = await supabase
      .from('calendar_events')
      .select('id, external_id, source, synced_at')
      .eq('user_id', userId)
      .not('external_id', 'is', null)
      .in('source', ['google', 'apple']);

    if (!allSyncedEvents || allSyncedEvents.length === 0) {
      return { removed: 0 };
    }

    // Group by external_id and source
    const grouped = new Map<string, Array<{ id: string; synced_at: string | null }>>();
    for (const event of allSyncedEvents) {
      const groupKey = `${event.source}:${event.external_id}`;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push({ id: event.id, synced_at: event.synced_at });
    }

    // For each group with duplicates, keep the oldest (first synced) and delete the rest
    const entries = Array.from(grouped.entries());
    for (const [, events] of entries) {
      if (events.length > 1) {
        // Sort by synced_at (oldest first), or by id if synced_at is null
        events.sort((a: { id: string; synced_at: string | null }, b: { id: string; synced_at: string | null }) => {
          if (a.synced_at && b.synced_at) {
            return new Date(a.synced_at).getTime() - new Date(b.synced_at).getTime();
          }
          if (a.synced_at) return -1;
          if (b.synced_at) return 1;
          return a.id.localeCompare(b.id);
        });

        // Keep the first one, delete the rest
        const toDelete = events.slice(1);
        for (const event of toDelete) {
          const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', event.id)
            .eq('user_id', userId);

          if (!error) {
            removed++;
          }
        }
      }
    }

    return { removed };
  } catch (error) {
    console.error('Error cleaning up duplicate events:', error);
    return { removed };
  }
}

/**
 * Sync calendar events from external provider to local database
 */
export async function syncCalendarEvents(
  userId: string,
  provider: CalendarProvider
): Promise<{ success: boolean; syncedCount: number; error?: string; duplicatesRemoved?: number }> {
  try {
    const integration = await getCalendarIntegration(userId, provider);
    
    if (!integration || !integration.syncEnabled) {
      return { success: false, syncedCount: 0, error: 'Integration not found or disabled' };
    }

    // Clean up any existing duplicates before syncing
    const cleanupResult = await cleanupDuplicateEvents(userId);
    if (cleanupResult.removed > 0) {
      console.log(`Cleaned up ${cleanupResult.removed} duplicate events before sync`);
    }

    let externalEvents: ExternalCalendarEvent[] = [];

    if (provider === 'google') {
      externalEvents = await fetchGoogleCalendarEvents(integration.accessToken);
    } else if (provider === 'apple') {
      // TODO: Implement Apple Calendar (CalDAV) sync
      return { success: false, syncedCount: 0, error: 'Apple Calendar sync not yet implemented' };
    }

    // Save events to local database
    const supabase = await createClient();
    let syncedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const event of externalEvents) {
      try {
        // Check if event already exists - use maybeSingle() to avoid errors
        const { data: existing, error: checkError } = await supabase
          .from('calendar_events')
          .select('id')
          .eq('user_id', userId)
          .eq('external_id', event.id)
          .eq('source', provider)
          .maybeSingle();

        // If there's an error (like multiple matches), log it but continue
        if (checkError && checkError.code !== 'PGRST116') {
          console.warn(`Error checking for existing event ${event.id}:`, checkError);
        }

        // If event doesn't exist, insert it
        if (!existing) {
          // For all-day events, adjust end date if needed
          // Google Calendar uses exclusive end dates: end="2026-01-08" means event ends at start of Jan 8
          // For single-day all-day events, we want end to be the same as start
          const adjustedEndTime = event.endTime;

          const { error: insertError } = await supabase
            .from('calendar_events')
            .insert({
              user_id: userId,
              title: event.title,
              description: event.description,
              start_time: event.startTime,
              end_time: adjustedEndTime,
              all_day: event.allDay,
              source: provider,
              external_id: event.id,
              synced_at: new Date().toISOString(),
            });

          if (insertError) {
            // Check if it's a duplicate key error (unique constraint violation)
            if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
              duplicateCount++;
              console.warn(`Duplicate event detected (skipping): ${event.id} - ${event.title}`);
            } else {
              errorCount++;
              console.error(`Error inserting event ${event.id}:`, insertError);
            }
          } else {
            syncedCount++;
          }
        } else {
          duplicateCount++;
        }
      } catch (err) {
        errorCount++;
        console.error(`Unexpected error processing event ${event.id}:`, err);
      }
    }

    // Log sync summary
    console.log(`Calendar sync completed: ${syncedCount} new, ${duplicateCount} duplicates, ${errorCount} errors`);

    // Update last sync time
    await supabase
      .from('calendar_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    return { 
      success: true, 
      syncedCount,
      duplicatesRemoved: cleanupResult.removed,
    };
  } catch (error) {
    console.error('Error syncing calendar events:', error);
    return { 
      success: false, 
      syncedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if user has calendar integration based on their auth provider
 */
export async function getUserAuthProvider(userId: string): Promise<string | null> {
  const supabase = await createClient();
  
  // Use getUser() instead of admin API
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || user.id !== userId) {
    return null;
  }

  // Check user's identities to determine auth provider
  const identities = user.identities || [];
  if (identities.length > 0 && identities[0]) {
    return identities[0].provider;
  }

  // Check app_metadata for provider
  if (user.app_metadata?.provider) {
    return user.app_metadata.provider;
  }

  return null;
}
