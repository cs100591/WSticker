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

const VISIBLE_CALENDARS_KEY = '@visible_calendars';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface EventsByDate {
  [dateKey: string]: CalendarEvent[];
}

class CalendarService {
  private isSyncing = false;
  private lastSyncTime: number = 0;
  private readonly SYNC_COOLDOWN_MS = 10000; // 10 seconds cooldown between syncs

  /**
   * Get available calendars from device
   */
  async getAvailableCalendars(): Promise<any[]> {
    try {
      // Dynamic import to avoid premature native module loading (though imports usually hoist, 
      // wrapping in try/catch helps if the module itself throws on access)
      const { Platform } = require('react-native');
      const Calendar = require('expo-calendar');

      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') return [];

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      return calendars;
    } catch (error: any) {
      console.warn('Calendar API not available (likely Expo Go):', error.message);
      return [];
    }
  }

  /**
   * Get visible calendar IDs
   */
  async getVisibleCalendarIds(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(VISIBLE_CALENDARS_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Set visible calendar IDs
   */
  async saveVisibleCalendarIds(ids: string[]): Promise<void> {
    await AsyncStorage.setItem(VISIBLE_CALENDARS_KEY, JSON.stringify(ids));
  }

  /**
   * Create a new calendar event
   */
  async createEvent(data: CreateCalendarEventData & { externalCalendarId?: string }): Promise<CalendarEvent> {
    // Convert Date to string if needed
    const startTimeStr = typeof data.startTime === 'string' ? data.startTime : (data.startTime as any).toISOString?.() || String(data.startTime);
    const endTimeStr = typeof data.endTime === 'string' ? data.endTime : (data.endTime as any).toISOString?.() || String(data.endTime);

    let appleEventId: string | undefined = undefined;

    // If writing to an external calendar
    if (data.externalCalendarId) {
      try {
        const Calendar = require('expo-calendar');
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === 'granted') {
          appleEventId = await Calendar.createEventAsync(data.externalCalendarId, {
            title: data.title,
            startDate: new Date(data.startTime),
            endDate: new Date(data.endTime),
            allDay: data.allDay,
            notes: data.description,
            location: '',
          });
        }
      } catch (e) {
        console.warn('Failed to create event in device calendar:', e);
      }
    }

    const createData = {
      ...data,
      startTime: startTimeStr,
      endTime: endTimeStr,
      appleEventId: appleEventId, // Store the external ID
      source: data.externalCalendarId ? 'device' : (data.source || 'local'), // Mark as device event if synced
      externalCalendarId: data.externalCalendarId,
    };

    const event = await CalendarEventRepository.create(createData as any);

    try {
      await this.scheduleEventNotification(event);
    } catch (error) {
      console.warn('Notification schedule failed', error);
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
    // If it's a device event, update it on the device too
    if (event.externalCalendarId && event.appleEventId) {
      try {
        const Calendar = require('expo-calendar');
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === 'granted') {
          // Construct update object
          const update: any = {};
          if (data.title) update.title = data.title;
          if (data.description) update.notes = data.description;
          if (data.startTime) update.startDate = new Date(data.startTime);
          if (data.endTime) update.endDate = new Date(data.endTime);
          if (data.allDay !== undefined) update.allDay = data.allDay;

          await Calendar.updateEventAsync(event.appleEventId, update);
        }
      } catch (e) {
        console.warn('Failed to update external device event', e);
      }
    }

    await CalendarEventRepository.update(event.id, data);
    const updated = await CalendarEventRepository.findById(event.id);
    if (!updated) throw new Error('Failed to get updated event');

    // ... Notifications ...
    if (data.startTime !== undefined) {
      try {
        await this.cancelEventNotification(event.id);
        await this.scheduleEventNotification(updated);
      } catch (error) { }
    }

    return updated;
  }

  /**
   * Delete an event
   */
  async deleteEvent(event: CalendarEvent): Promise<void> {
    try {
      await this.cancelEventNotification(event.id);
    } catch (error) { }

    // If device event, delete from device
    if (event.externalCalendarId && event.appleEventId) {
      try {
        const Calendar = require('expo-calendar');
        await Calendar.deleteEventAsync(event.appleEventId);
      } catch (e) {
        console.warn('Failed to delete device event', e);
      }
    }

    await CalendarEventRepository.delete(event.id);
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

  async getEventsForDate(date: Date, userId: string): Promise<CalendarEvent[]> {
    const dateStr = date.toISOString().split('T')[0];
    return await CalendarEventRepository.findByDate(userId, dateStr);
  }

  async getEventsForRange(range: DateRange, userId: string): Promise<CalendarEvent[]> {
    return await this.getEvents({ userId, dateFrom: range.start, dateTo: range.end });
  }

  async getEventsByDate(range: DateRange, userId: string): Promise<EventsByDate> {
    const events = await this.getEventsForRange(range, userId);
    const grouped: EventsByDate = {};
    events.forEach((event) => {
      const dateKey = this.getDateKey(new Date(event.startTime));
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });
    return grouped;
  }

  async observeEvents(filters?: CalendarEventFilters): Promise<CalendarEvent[]> {
    return await this.getEvents(filters);
  }

  filterEventsByDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
    return events.filter((event) => {
      const eventStart = new Date(event.startTime).getTime();
      const eventEnd = new Date(event.endTime).getTime();
      const dayStart = startOfDay.getTime();
      const dayEnd = endOfDay.getTime();
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  }

  getMonthRange(date: Date): DateRange {
    const start = new Date(date.getFullYear(), date.getMonth(), 1); start.setHours(0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0); end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  getWeekRange(date: Date): DateRange {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const start = new Date(date); start.setDate(diff); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  getDayRange(date: Date): DateRange {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async createEventFromTodo(todoId: string, userId: string, title: string, dueDate: Date, color?: string): Promise<CalendarEvent> {
    const startTime = new Date(dueDate); startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime); endTime.setHours(10, 0, 0, 0);
    return await this.createEvent({
      userId, title, startTime: startTime.toISOString(), endTime: endTime.toISOString(),
      allDay: false, source: 'local', todoId, color,
    });
  }

  /**
   * Sync with Device Calendar (Multi-Calendar Support)
   */
  async syncWithDevice(userId: string): Promise<void> {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      console.log('Calendar sync already in progress, skipping...');
      return;
    }

    // Cooldown check
    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_COOLDOWN_MS) {
      console.log(`Sync cooldown active, skipping...`);
      return;
    }

    this.isSyncing = true;
    this.lastSyncTime = now;

    try {
      const { Platform } = require('react-native');
      const Calendar = require('expo-calendar');

      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') throw new Error('Calendar permission not granted');

      // 1. Determine which calendars to sync
      const visibleIds = await this.getVisibleCalendarIds();
      let calendarsToSync = visibleIds;

      if (visibleIds.length === 0) {
        const allCals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        calendarsToSync = allCals.map((c: any) => c.id);
        await this.saveVisibleCalendarIds(calendarsToSync);
      }

      if (calendarsToSync.length === 0) return;

      // 2. Fetch events from these calendars
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 4, 0);

      const currentCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const validIds = calendarsToSync.filter(id => currentCalendars.find((c: any) => c.id === id));

      if (validIds.length === 0) return;

      const deviceEvents = await Calendar.getEventsAsync(validIds, startDate, endDate);

      // 3. Sync to Local DB - "Wipe and Replace Strategy" for Device Events
      // This ensures we don't get duplicates if ID logic fails or varies
      const localEvents = await this.getEvents({ userId });
      const deviceEventsToDelete = localEvents.filter(e => e.source === 'device');

      console.log(`Clearing ${deviceEventsToDelete.length} existing device events...`);
      // Wipe existing device mirrors
      for (const e of deviceEventsToDelete) {
        await CalendarEventRepository.delete(e.id);
      }

      // Import fresh events
      console.log(`Importing ${deviceEvents.length} fresh device events...`);
      for (const dEvent of deviceEvents) {
        const calendarColor = currentCalendars.find((c: any) => c.id === dEvent.calendarId)?.color || '#3B82F6';

        await CalendarEventRepository.create({
          userId,
          title: dEvent.title,
          startTime: new Date(dEvent.startDate).toISOString(),
          endTime: new Date(dEvent.endDate).toISOString(),
          allDay: dEvent.allDay,
          description: dEvent.notes,
          source: 'device',
          appleEventId: dEvent.id, // Store original ID for reference
          externalCalendarId: dEvent.calendarId,
          color: calendarColor
        });
      }

      console.log(`Synced ${deviceEvents.length} events from ${validIds.length} calendars.`);
    } catch (e: any) {
      console.warn('Sync failed (likely Expo Go missing native module):', e.message);
    } finally {
      this.isSyncing = false;
    }
  }

  // Stubs for future/legacy
  async syncWithGoogle(userId: string): Promise<void> { }
  async getSyncProvider(): Promise<CalendarProvider> { return 'none'; }
  async setSyncProvider(p: CalendarProvider): Promise<void> { }

  private async scheduleEventNotification(event: CalendarEvent): Promise<void> {
    try {
      const start = new Date(event.startTime);
      const now = new Date();
      if (start > now) {
        await notificationService.scheduleNotification(
          event.title,
          event.description || 'Upcoming Event',
          start.getTime() - 10 * 60 * 1000, // 10 mins before? Or just at start time. App logic usually 10 mins before.
          { eventId: event.id }
        );
      }
    } catch (e) {
      console.warn('Failed to schedule notification', e);
    }
  }
  private async cancelEventNotification(eventId: string): Promise<void> {
    // Need notification ID logic? Simple notification service doesn't track IDs by event ID yet.
    // Ignoring for now to prevent crashes.
  }

  /**
   * Check for scheduling conflicts
   * Returns true if there is an overlapping event
   */
  async checkConflict(userId: string, startTime: Date, endTime: Date, excludeEventId?: string): Promise<boolean> {
    const events = await CalendarEventRepository.findByDateRange(userId, startTime.toISOString(), endTime.toISOString());
    // Filter out the event itself if updating
    const conflicting = events.filter(e => e.id !== excludeEventId);
    return conflicting.length > 0;
  }
}

export const calendarService = new CalendarService();
