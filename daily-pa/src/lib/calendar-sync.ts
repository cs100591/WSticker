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
    
    return (data.items || [])
      .filter((item): item is GoogleCalendarItem & { 
        id: string; 
        start: { dateTime?: string; date?: string }; 
        end: { dateTime?: string; date?: string } 
      } => {
        return !!(item.id && item.start && item.end && (item.start.dateTime || item.start.date) && (item.end.dateTime || item.end.date));
      })
      .map((item) => ({
        id: item.id,
        title: item.summary || 'Untitled Event',
        description: item.description,
        startTime: (item.start.dateTime || item.start.date) as string,
        endTime: (item.end.dateTime || item.end.date) as string,
        allDay: !item.start.dateTime,
      }));
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
 * Sync calendar events from external provider to local database
 */
export async function syncCalendarEvents(
  userId: string,
  provider: CalendarProvider
): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  try {
    const integration = await getCalendarIntegration(userId, provider);
    
    if (!integration || !integration.syncEnabled) {
      return { success: false, syncedCount: 0, error: 'Integration not found or disabled' };
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

    for (const event of externalEvents) {
      // Check if event already exists
      const { data: existing } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('user_id', userId)
        .eq('external_id', event.id)
        .eq('source', provider)
        .single();

      if (!existing) {
        // Insert new event
        const { error } = await supabase
          .from('calendar_events')
          .insert({
            user_id: userId,
            title: event.title,
            description: event.description,
            start_time: event.startTime,
            end_time: event.endTime,
            all_day: event.allDay,
            source: provider,
            external_id: event.id,
            synced_at: new Date().toISOString(),
          });

        if (!error) {
          syncedCount++;
        }
      }
    }

    // Update last sync time
    await supabase
      .from('calendar_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    return { success: true, syncedCount };
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
