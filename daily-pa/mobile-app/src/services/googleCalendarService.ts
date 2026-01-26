/**
 * Google Calendar Service
 * Handles Google Calendar API integration for bidirectional sync
 * 
 * SETUP REQUIRED:
 * 1. Create a project in Google Cloud Console
 * 2. Enable Google Calendar API
 * 3. Create OAuth 2.0 credentials (iOS and Android)
 * 4. Add credentials to environment variables
 * 5. Install @react-native-google-signin/google-signin package
 */

import { CalendarEvent } from '@/models';
import { CalendarEventRepository } from '@/services/repositories/CalendarEventRepository';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  updated: string;
}

export interface GoogleCalendarSyncResult {
  pulled: number;
  pushed: number;
  conflicts: number;
  errors: Error[];
}

class GoogleCalendarService {
  private accessToken: string | null = null;
  private readonly baseUrl = 'https://www.googleapis.com/calendar/v3';

  /**
   * Initialize Google Sign-In
   * Call this on app startup
   */
  async initialize(): Promise<void> {
    try {
      // TODO: Uncomment when @react-native-google-signin/google-signin is installed
      /*
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        scopes: ['https://www.googleapis.com/auth/calendar'],
        offlineAccess: true,
      });
      */

      console.log('Google Calendar service initialized (placeholder)');
    } catch (error) {
      console.error('Failed to initialize Google Calendar service:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google and request calendar access
   */
  async signIn(): Promise<boolean> {
    try {
      // TODO: Uncomment when @react-native-google-signin/google-signin is installed
      /*
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Get access token
      const tokens = await GoogleSignin.getTokens();
      this.accessToken = tokens.accessToken;
      
      return true;
      */

      console.log('Google sign-in not implemented - requires @react-native-google-signin/google-signin');
      return false;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      return false;
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    try {
      // TODO: Uncomment when @react-native-google-signin/google-signin is installed
      /*
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
      */

      this.accessToken = null;
      console.log('Google sign-out completed');
    } catch (error) {
      console.error('Google sign-out failed:', error);
    }
  }

  /**
   * Check if user is signed in
   */
  async isSignedIn(): Promise<boolean> {
    try {
      // TODO: Uncomment when @react-native-google-signin/google-signin is installed
      /*
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      return await GoogleSignin.isSignedIn();
      */

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sync events with Google Calendar
   * Implements bidirectional sync
   */
  async syncEvents(userId: string): Promise<GoogleCalendarSyncResult> {
    const result: GoogleCalendarSyncResult = {
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Ensure we're signed in
      const signedIn = await this.isSignedIn();
      if (!signedIn) {
        const success = await this.signIn();
        if (!success) {
          throw new Error('Failed to sign in to Google');
        }
      }

      // 1. Pull: Fetch events from Google Calendar
      const googleEvents = await this.fetchGoogleEvents();

      // Get local events with source='google'
      // Get local events with source='google'
      const localGoogleEvents = await CalendarEventRepository.findBySource(userId, 'google');

      // Create a map of local events by google_event_id
      const localEventMap = new Map<string, CalendarEvent>(
        localGoogleEvents
          .filter((e: CalendarEvent) => !!e.googleEventId)
          .map((e: CalendarEvent) => [e.googleEventId!, e])
      );

      // Sync Google events to local database
      for (const googleEvent of googleEvents) {
        try {
          const localEvent = localEventMap.get(googleEvent.id);

          if (localEvent) {
            // Update existing local event if Google event is newer
            const googleUpdated = new Date(googleEvent.updated);
            const localUpdated = new Date(localEvent.updatedAt || localEvent.createdAt);

            if (googleUpdated > localUpdated) {
              await this.updateLocalEventFromGoogle(localEvent, googleEvent);
              result.pulled++;
            } else if (localUpdated > googleUpdated) {
              // Local is newer, this is a conflict
              result.conflicts++;
              // For now, we'll keep the Google version (server wins)
              await this.updateLocalEventFromGoogle(localEvent, googleEvent);
            }

            // Remove from map (processed)
            localEventMap.delete(googleEvent.id);
          } else {
            // Create new local event from Google event
            await this.createLocalEventFromGoogle(userId, googleEvent);
            result.pulled++;
          }
        } catch (error) {
          console.error(`Failed to sync Google event ${googleEvent.id}:`, error);
          result.errors.push(error as Error);
        }
      }

      // 2. Push: Upload local changes to Google Calendar
      // 2. Push: Upload local changes to Google Calendar
      const localEvents = await CalendarEventRepository.findBySource(userId, 'google');

      for (const localEvent of localEvents) {
        try {
          if (localEvent.googleEventId) {
            // Event already exists on Google, check if we need to update
            const googleEvent = googleEvents.find(e => e.id === localEvent.googleEventId);

            if (googleEvent) {
              const localUpdated = new Date(localEvent.updatedAt || localEvent.createdAt);
              const googleUpdated = new Date(googleEvent.updated);

              // Update Google event if local is newer
              if (localUpdated > googleUpdated) {
                await this.updateGoogleEvent(localEvent);
                result.pushed++;
              }
            } else {
              // Google event was deleted, delete local event
              await CalendarEventRepository.delete(localEvent.id);
            }
          } else {
            // Create new Google event from local event
            const googleEventId = await this.createGoogleEvent(localEvent);

            // Update local event with Google event ID
            await CalendarEventRepository.update(localEvent.id, {
              googleEventId,
            });

            result.pushed++;
          }
        } catch (error) {
          console.error(`Failed to push local event ${localEvent.id}:`, error);
          result.errors.push(error as Error);
        }
      }

      console.log('Google Calendar sync completed:', result);
      return result;
    } catch (error) {
      console.error('Google Calendar sync failed:', error);
      result.errors.push(error as Error);
      return result;
    }
  }

  /**
   * Fetch events from Google Calendar
   */
  private async fetchGoogleEvents(): Promise<GoogleCalendarEvent[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google');
    }

    try {
      // Fetch events from the past month to 2 months in the future
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

      const response = await fetch(
        `${this.baseUrl}/calendars/primary/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Failed to fetch Google events:', error);
      throw error;
    }
  }

  /**
   * Create a Google Calendar event
   */
  private async createGoogleEvent(localEvent: CalendarEvent): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const googleEvent = this.convertToGoogleEvent(localEvent);

      const response = await fetch(
        `${this.baseUrl}/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create Google event: ${response.status}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Failed to create Google event:', error);
      throw error;
    }
  }

  /**
   * Update a Google Calendar event
   */
  private async updateGoogleEvent(localEvent: CalendarEvent): Promise<void> {
    if (!this.accessToken || !localEvent.googleEventId) {
      throw new Error('Not authenticated or missing Google event ID');
    }

    try {
      const googleEvent = this.convertToGoogleEvent(localEvent);

      const response = await fetch(
        `${this.baseUrl}/calendars/primary/events/${localEvent.googleEventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update Google event: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update Google event:', error);
      throw error;
    }
  }

  /**
   * Delete a Google Calendar event
   */
  private async deleteGoogleEvent(googleEventId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/calendars/primary/events/${googleEventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete Google event: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete Google event:', error);
      throw error;
    }
  }

  /**
   * Convert local event to Google Calendar event format
   */
  private convertToGoogleEvent(localEvent: CalendarEvent): Partial<GoogleCalendarEvent> {
    const event: Partial<GoogleCalendarEvent> = {
      summary: localEvent.title,
      description: localEvent.description,
    };

    if (localEvent.allDay) {
      // All-day event uses date format (YYYY-MM-DD)
      const dateStr = new Date(localEvent.startTime).toISOString().split('T')[0];
      event.start = { date: dateStr };
      event.end = { date: dateStr };
    } else {
      // Timed event uses dateTime format
      event.start = {
        dateTime: new Date(localEvent.startTime).toISOString(),
        timeZone: 'UTC',
      };
      event.end = {
        dateTime: new Date(localEvent.endTime).toISOString(),
        timeZone: 'UTC',
      };
    }

    return event;
  }

  /**
   * Create local event from Google Calendar event
   */
  private async createLocalEventFromGoogle(
    userId: string,
    googleEvent: GoogleCalendarEvent
  ): Promise<CalendarEvent> {
    const startTime = googleEvent.start.dateTime
      ? new Date(googleEvent.start.dateTime).toISOString()
      : new Date(googleEvent.start.date!).toISOString();

    const endTime = googleEvent.end.dateTime
      ? new Date(googleEvent.end.dateTime).toISOString()
      : new Date(googleEvent.end.date!).toISOString();

    const allDay = !googleEvent.start.dateTime;

    return await CalendarEventRepository.create({
      userId,
      title: googleEvent.summary,
      description: googleEvent.description,
      startTime,
      endTime,
      allDay,
      source: 'google',
      googleEventId: googleEvent.id,
    });
  }

  /**
   * Update local event from Google Calendar event
   */
  private async updateLocalEventFromGoogle(
    localEvent: CalendarEvent,
    googleEvent: GoogleCalendarEvent
  ): Promise<void> {
    const startTime = googleEvent.start.dateTime
      ? new Date(googleEvent.start.dateTime).toISOString()
      : new Date(googleEvent.start.date!).toISOString();

    const endTime = googleEvent.end.dateTime
      ? new Date(googleEvent.end.dateTime).toISOString()
      : new Date(googleEvent.end.date!).toISOString();

    const allDay = !googleEvent.start.dateTime;

    await CalendarEventRepository.update(localEvent.id, {
      title: googleEvent.summary,
      description: googleEvent.description,
      startTime,
      endTime,
      allDay,
    });
  }
}

export const googleCalendarService = new GoogleCalendarService();

