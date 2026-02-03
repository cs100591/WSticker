/**
 * Calendar Event Repository
 * Uses Zustand local store for data persistence
 */

import { useLocalStore, CalendarEvent, EventSource } from '@/models';

export interface CreateCalendarEventData {
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  source?: EventSource;
  todoId?: string;
  color?: string;
  appleEventId?: string;
  googleEventId?: string;
  externalCalendarId?: string;
}

export interface UpdateCalendarEventData {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  source?: EventSource;
  todoId?: string;
  color?: string;
  appleEventId?: string;
  googleEventId?: string;
  externalCalendarId?: string;
}

class CalendarEventRepositoryClass {
  async create(data: CreateCalendarEventData): Promise<CalendarEvent> {
    const store = useLocalStore.getState();
    return store.addCalendarEvent({
      userId: data.userId,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      allDay: data.allDay || false,
      source: data.source || 'local',
      todoId: data.todoId,
      color: data.color,
      appleEventId: data.appleEventId,
      googleEventId: data.googleEventId,
      externalCalendarId: data.externalCalendarId,
      isDeleted: false,
    });
  }

  async findById(id: string): Promise<CalendarEvent | null> {
    const store = useLocalStore.getState();
    const events = store.getCalendarEvents();
    return events.find((e) => e.id === id) || null;
  }

  async findByUserId(userId: string): Promise<CalendarEvent[]> {
    const store = useLocalStore.getState();
    return store.getCalendarEvents().filter((e) => e.userId === userId);
  }

  async findAll(): Promise<CalendarEvent[]> {
    const store = useLocalStore.getState();
    return store.getCalendarEvents();
  }

  async update(id: string, data: UpdateCalendarEventData): Promise<void> {
    const store = useLocalStore.getState();
    store.updateCalendarEvent(id, data);
  }

  async delete(id: string): Promise<void> {
    const store = useLocalStore.getState();
    store.deleteCalendarEvent(id);
  }

  // SIMPLIFIED: All-day events are now stored with correct end times at sync time
  async findByDateRange(userId: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const store = useLocalStore.getState();
    return store.getCalendarEvents().filter((e) => {
      if (e.userId !== userId) return false;
      const eventStart = new Date(e.startTime);
      const eventEnd = new Date(e.endTime);
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);
      // Simple overlap: event starts before range ends AND event ends after range starts
      return eventStart <= rangeEnd && eventEnd >= rangeStart;
    });
  }

  // SIMPLIFIED: All-day events are now stored with correct end times at sync time
  async findByDate(userId: string, date: string): Promise<CalendarEvent[]> {
    const store = useLocalStore.getState();
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return store.getCalendarEvents().filter((e) => {
      if (e.userId !== userId) return false;
      const eventStart = new Date(e.startTime);
      const eventEnd = new Date(e.endTime);
      // Simple overlap: event starts before day ends AND event ends after day starts
      return eventStart <= endOfDay && eventEnd >= startOfDay;
    });
  }

  async findBySource(userId: string, source: EventSource): Promise<CalendarEvent[]> {
    const store = useLocalStore.getState();
    return store.getCalendarEvents().filter((e) => e.userId === userId && e.source === source);
  }

  async count(userId: string): Promise<number> {
    const store = useLocalStore.getState();
    return store.getCalendarEvents().filter((e) => e.userId === userId).length;
  }
}

export const CalendarEventRepository = new CalendarEventRepositoryClass();
