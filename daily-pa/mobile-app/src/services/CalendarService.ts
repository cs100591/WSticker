/**
 * Calendar Service
 * Business logic for calendar event management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CalendarEventRepository,
  CreateCalendarEventData,
  UpdateCalendarEventData,
} from '@/services/repositories/CalendarEventRepository';
import { CalendarEvent, EventSource } from '@/models';

export interface CalendarEventFilters {
  userId?: string;
  source?: EventSource;
  dateFrom?: Date;
  dateTo?: Date;
}
import { syncManager } from '@/services/sync';
import { notificationService } from '@/services/notificationService';

export type CalendarView = 'month' | 'week' | 'day';
export type CalendarProvider = 'google' | 'apple' | 'none';

const CALENDAR_PROVIDER_KEY = '@calendar_provider';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface EventsByDate {
  [dateKey: string]: CalendarEvent[];
}

class CalendarService {
  /**
   * Create a new calendar event
   */
  async createEvent(data: CreateCalendarEventData): Promise<CalendarEvent> {
    // Convert Date to string if needed
    const startTimeStr = typeof data.startTime === 'string' ? data.startTime : (data.startTime as any).toISOString?.() || String(data.startTime);
    const endTimeStr = typeof data.endTime === 'string' ? data.endTime : (data.endTime as any).toISOString?.() || String(data.endTime);

    const createData = {
      ...data,
      startTime: startTimeStr,
      endTime: endTimeStr,
    };
    const event = await CalendarEventRepository.create(createData as any);

    // Queue for sync
    try {
      await syncManager.queueChange('calendar_events', event.id, 'create', {
        id: event.id,
        user_id: event.userId,
        title: event.title,
        description: event.description,
        start_time: event.startTime,
        end_time: event.endTime,
        all_day: event.allDay,
        source: event.source,
        todo_id: event.todoId,
        color: event.color,
        created_at: event.createdAt,
        updated_at: event.updatedAt,
      });
    } catch (e) {
      console.log('Sync queue failed (offline mode):', e);
    }

    // Schedule notification for event
    try {
      await this.scheduleEventNotification(event);
    } catch (error) {
      console.error('Failed to schedule notification for event:', error);
    }

    return event;
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    event: CalendarEvent,
    data: UpdateCalendarEventData
  ): Promise<CalendarEvent> {
    await CalendarEventRepository.update(event.id, data);
    const updated = await CalendarEventRepository.findById(event.id);
    if (!updated) throw new Error('Failed to get updated event');

    // Queue for sync
    try {
      await syncManager.queueChange('calendar_events', updated.id, 'update', {
        id: updated.id,
        user_id: updated.userId,
        title: updated.title,
        description: updated.description,
        start_time: updated.startTime,
        end_time: updated.endTime,
        all_day: updated.allDay,
        source: updated.source,
        todo_id: updated.todoId,
        color: updated.color,
        updated_at: updated.updatedAt,
      });
    } catch (e) {
      console.log('Sync queue failed (offline mode):', e);
    }

    // Reschedule notification if start time changed
    if (data.startTime !== undefined) {
      try {
        await this.cancelEventNotification(event.id);
        await this.scheduleEventNotification(updated);
      } catch (error) {
        console.error('Failed to update notification for event:', error);
      }
    }

    return updated;
  }

  /**
   * Delete an event
   */
  async deleteEvent(event: CalendarEvent): Promise<void> {
    try {
      await this.cancelEventNotification(event.id);
    } catch (error) {
      console.error('Failed to cancel notification for event:', error);
    }

    await CalendarEventRepository.delete(event.id);

    // Queue for sync
    try {
      await syncManager.queueChange('calendar_events', event.id, 'delete', { id: event.id });
    } catch (e) {
      console.log('Sync queue failed (offline mode):', e);
    }
  }

  /**
   * Get events with filters
   */
  async getEvents(filters?: CalendarEventFilters): Promise<CalendarEvent[]> {
    let events: CalendarEvent[];

    if (filters?.userId) {
      events = await CalendarEventRepository.findByUserId(filters.userId);
    } else {
      events = await CalendarEventRepository.findAll();
    }

    // Apply source filter
    if (filters?.source) {
      events = events.filter((e) => e.source === filters.source);
    }

    // Apply date range filter
    if (filters?.dateFrom || filters?.dateTo) {
      events = events.filter((event) => {
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        if (filters.dateFrom && end < filters.dateFrom) return false;
        if (filters.dateTo && start > filters.dateTo) return false;
        return true;
      });
    }

    return events;
  }

  /**
   * Get events for a specific date
   */
  async getEventsForDate(date: Date, userId: string): Promise<CalendarEvent[]> {
    const dateStr = date.toISOString().split('T')[0];
    return await CalendarEventRepository.findByDate(userId, dateStr);
  }

  /**
   * Get events for a date range
   */
  async getEventsForRange(
    range: DateRange,
    userId: string
  ): Promise<CalendarEvent[]> {
    return await this.getEvents({
      userId,
      dateFrom: range.start,
      dateTo: range.end,
    });
  }

  /**
   * Get events grouped by date
   */
  async getEventsByDate(
    range: DateRange,
    userId: string
  ): Promise<EventsByDate> {
    const events = await this.getEventsForRange(range, userId);
    const grouped: EventsByDate = {};

    events.forEach((event) => {
      const dateKey = this.getDateKey(new Date(event.startTime));
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort events within each date by start time
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  }

  /**
   * Observe events (reactive) - returns current events
   */
  async observeEvents(filters?: CalendarEventFilters): Promise<CalendarEvent[]> {
    return await this.getEvents(filters);
  }

  /**
   * Filter events by date
   * Returns events that occur on the specified date
   */
  filterEventsByDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = new Date(event.startTime).getTime();
      const eventEnd = new Date(event.endTime).getTime();
      const dayStart = startOfDay.getTime();
      const dayEnd = endOfDay.getTime();

      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  }

  /**
   * Get date range for month view
   */
  getMonthRange(date: Date): DateRange {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Get date range for week view
   */
  getWeekRange(date: Date): DateRange {
    const day = date.getDay();
    const diff = date.getDate() - day; // Sunday as first day

    const start = new Date(date);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Get date range for day view
   */
  getDayRange(date: Date): DateRange {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Get date key for grouping (YYYY-MM-DD)
   */
  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Create event from todo
   */
  async createEventFromTodo(
    todoId: string,
    userId: string,
    title: string,
    dueDate: Date,
    color?: string
  ): Promise<CalendarEvent> {
    const startTime = new Date(dueDate);
    startTime.setHours(9, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(10, 0, 0, 0);

    return await this.createEvent({
      userId,
      title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      allDay: false,
      source: 'local',
      todoId,
      color,
    });
  }

  /**
   * Sync with Google Calendar
   * Implements bidirectional sync with Google Calendar API
   */
  async syncWithGoogle(userId: string): Promise<void> {
    const { googleCalendarService } = await import('./googleCalendarService');

    try {
      const result = await googleCalendarService.syncEvents(userId);

      console.log('Google Calendar sync completed:', {
        pulled: result.pulled,
        pushed: result.pushed,
        conflicts: result.conflicts,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        console.error('Google Calendar sync had errors:', result.errors);
        throw new Error(`Sync completed with ${result.errors.length} errors`);
      }
    } catch (error) {
      console.error('Google Calendar sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync with Apple Calendar (iOS only)
   * Implements bidirectional sync with device's native calendar
   */
  async syncWithApple(userId: string): Promise<void> {
    const { Platform } = await import('react-native');

    // Only available on iOS
    if (Platform.OS !== 'ios') {
      console.log('Apple Calendar sync is only available on iOS');
      return;
    }

    const Calendar = await import('expo-calendar');

    try {
      // 1. Request calendar permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Calendar permission not granted');
      }

      // 2. Get the default calendar or create one
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      let targetCalendar = calendars.find(cal => cal.title === 'Daily PA');

      if (!targetCalendar) {
        // Create a new calendar for Daily PA
        const defaultCalendarSource = calendars.find(
          cal => cal.source.name === 'Default' || cal.isPrimary
        )?.source;

        if (defaultCalendarSource) {
          const calendarId = await Calendar.createCalendarAsync({
            title: 'Daily PA',
            color: '#4A90E2',
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: defaultCalendarSource.id,
            source: defaultCalendarSource,
            name: 'Daily PA',
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
          });

          const newCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
          targetCalendar = newCalendars.find(cal => cal.id === calendarId);
        }
      }

      if (!targetCalendar) {
        throw new Error('Could not find or create calendar');
      }

      // 3. Pull: Fetch events from device calendar
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 1 month ago
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); // 2 months ahead

      const deviceEvents = await Calendar.getEventsAsync(
        [targetCalendar.id],
        startDate,
        endDate
      );

      // Get local events with source='apple'
      const localAppleEvents = await this.getEvents({
        userId,
        source: 'apple',
      });

      // Create a map of local events by apple_event_id
      const localEventMap = new Map(
        localAppleEvents
          .filter(e => e.appleEventId)
          .map(e => [e.appleEventId!, e])
      );

      // Sync device events to local database
      for (const deviceEvent of deviceEvents) {
        const localEvent = localEventMap.get(deviceEvent.id);

        if (localEvent) {
          // Update existing local event if device event is newer
          const deviceUpdated = new Date(deviceEvent.lastModifiedDate || deviceEvent.creationDate || 0);
          const localUpdatedDate = new Date(localEvent.updatedAt || localEvent.createdAt);

          if (deviceUpdated > localUpdatedDate) {
            await this.updateEvent(localEvent, {
              title: deviceEvent.title,
              startTime: new Date(deviceEvent.startDate).toISOString(),
              endTime: new Date(deviceEvent.endDate).toISOString(),
              allDay: deviceEvent.allDay || false,
              description: deviceEvent.notes || undefined,
            });
          }

          // Remove from map (processed)
          localEventMap.delete(deviceEvent.id);
        } else {
          // Create new local event from device event
          await CalendarEventRepository.create({
            userId,
            title: deviceEvent.title,
            startTime: new Date(deviceEvent.startDate).toISOString(),
            endTime: new Date(deviceEvent.endDate).toISOString(),
            allDay: deviceEvent.allDay || false,
            description: deviceEvent.notes || undefined,
            source: 'apple',
          });
        }
      }

      // 4. Push: Upload local changes to device calendar
      const localEvents = await this.getEvents({
        userId,
        source: 'apple',
      });

      for (const localEvent of localEvents) {
        if (localEvent.appleEventId) {
          // Event already exists on device, check if we need to update
          const deviceEvent = deviceEvents.find(e => e.id === localEvent.appleEventId);

          if (deviceEvent) {
            const localUpdatedDate = new Date(localEvent.updatedAt || localEvent.createdAt);
            const deviceUpdated = new Date(deviceEvent.lastModifiedDate || deviceEvent.creationDate || 0);

            // Update device event if local is newer
            if (localUpdatedDate > deviceUpdated) {
              await Calendar.updateEventAsync(localEvent.appleEventId, {
                title: localEvent.title,
                startDate: new Date(localEvent.startTime),
                endDate: new Date(localEvent.endTime),
                allDay: localEvent.allDay,
                notes: localEvent.description,
              });
            }
          } else {
            // Device event was deleted, delete local event
            await this.deleteEvent(localEvent);
          }
        } else {
          // Create new device event from local event
          const eventId = await Calendar.createEventAsync(targetCalendar.id, {
            title: localEvent.title,
            startDate: new Date(localEvent.startTime),
            endDate: new Date(localEvent.endTime),
            allDay: localEvent.allDay,
            notes: localEvent.description,
          });

          // Update local event with device event ID
          await CalendarEventRepository.update(localEvent.id, { appleEventId: eventId });
        }
      }

      console.log('Apple Calendar sync completed successfully');
    } catch (error) {
      console.error('Apple Calendar sync failed:', error);
      throw error;
    }
  }

  /**
   * Get calendar sync provider preference
   */
  async getSyncProvider(): Promise<CalendarProvider> {
    try {
      const provider = await AsyncStorage.getItem(CALENDAR_PROVIDER_KEY);
      if (provider === 'google' || provider === 'apple' || provider === 'none') {
        return provider;
      }
      return 'none';
    } catch (error) {
      console.error('Failed to get calendar provider:', error);
      return 'none';
    }
  }

  /**
   * Set calendar sync provider preference
   */
  async setSyncProvider(provider: CalendarProvider): Promise<void> {
    try {
      await AsyncStorage.setItem(CALENDAR_PROVIDER_KEY, provider);
      console.log(`Calendar sync provider set to: ${provider}`);
    } catch (error) {
      console.error('Failed to set calendar provider:', error);
      throw error;
    }
  }

  /**
   * Schedule notification for calendar event
   * Notification is scheduled 15 minutes before event start time
   */
  private async scheduleEventNotification(event: CalendarEvent): Promise<void> {
    const startTime = new Date(event.startTime);

    if (event.allDay) {
      const notificationTime = new Date(startTime);
      notificationTime.setHours(9, 0, 0, 0);

      const now = new Date();
      if (notificationTime > now) {
        await notificationService.scheduleNotification(
          'Event Today',
          `"${event.title}" is today`,
          notificationTime,
          {
            type: 'calendar_event',
            eventId: event.id,
            notificationId: `event-${event.id}`,
          }
        );

        console.log(`Scheduled notification for all-day event "${event.title}" at ${notificationTime.toISOString()}`);
      }
    } else {
      const notificationTime = new Date(startTime.getTime() - 15 * 60 * 1000);

      const now = new Date();
      if (notificationTime > now) {
        await notificationService.scheduleNotification(
          'Event Starting Soon',
          `"${event.title}" starts in 15 minutes`,
          notificationTime,
          {
            type: 'calendar_event',
            eventId: event.id,
            notificationId: `event-${event.id}`,
          }
        );

        console.log(`Scheduled notification for event "${event.title}" at ${notificationTime.toISOString()}`);
      }
    }
  }

  /**
   * Cancel notification for calendar event
   */
  private async cancelEventNotification(eventId: string): Promise<void> {
    // Get all scheduled notifications and find the one for this event
    const notifications = await notificationService.getScheduledNotifications();
    const eventNotification = notifications.find(
      (n) => n.content.data?.eventId === eventId
    );

    if (eventNotification) {
      await notificationService.cancelNotification(eventNotification.identifier);
      console.log(`Cancelled notification for event ${eventId}`);
    }
  }
}

export const calendarService = new CalendarService();
