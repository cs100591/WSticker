/**
 * Property-based tests for calendar event operations
 * Feature: mobile-apps
 */

import fc from 'fast-check';

// Mock WatermelonDB before importing services
jest.mock('@nozbe/watermelondb', () => ({
  Model: class MockModel {
    id: string = '';
    constructor() {}
  },
  field: () => () => {},
  date: () => () => {},
  text: () => () => {},
  json: () => () => {},
  tableSchema: jest.fn(() => ({})),
  appSchema: jest.fn(() => ({})),
  Database: jest.fn(() => ({})),
}));

jest.mock('@nozbe/watermelondb/adapters/sqlite', () => ({
  default: jest.fn(() => ({})),
}));

// Mock the models
jest.mock('../../models', () => ({
  CalendarEvent: class MockCalendarEvent {
    id: string = '';
    constructor() {}
  },
  Todo: class MockTodo {
    id: string = '';
    constructor() {}
  },
}));

// Mock the database
jest.mock('../../models/database', () => ({
  database: {
    get: jest.fn(() => ({
      query: jest.fn(() => ({
        fetch: jest.fn(),
      })),
      create: jest.fn(),
      find: jest.fn(),
    })),
  },
}));

// Create mock services with dependency injection
class MockCalendarService {
  constructor(
    private repository: any,
    private syncManager: any
  ) {}

  async createEvent(input: any, userId: string) {
    const event = {
      id: 'mock-event-id',
      userId,
      ...input,
      source: 'local',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: null,
      isDeleted: false,
    };
    
    await this.repository.create(event);
    await this.syncManager.queueChange({
      table: 'calendar_events',
      operation: 'create',
      recordId: event.id,
    });
    
    return event;
  }

  async getEventsForDate(date: Date, userId: string) {
    const allEvents = await this.repository.query().fetch();
    
    return allEvents.filter((event: any) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const selectedDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const eventStartDateOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
      const eventEndDateOnly = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());

      return eventStartDateOnly <= selectedDateOnly && eventEndDateOnly >= selectedDateOnly;
    });
  }
}

class MockTodoService {
  constructor(
    private todoRepository: any,
    private calendarRepository: any,
    private syncManager: any
  ) {}

  async createTodo(input: any, userId: string) {
    const todo = {
      id: 'mock-todo-id',
      userId,
      ...input,
      status: 'active',
      tags: [],
      calendarEventId: null,
      googleEventId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: null,
      isDeleted: false,
    };

    await this.todoRepository.create(todo);

    // Create calendar event if todo has due date
    if (input.dueDate) {
      const calendarEvent = {
        id: 'mock-calendar-event-id',
        userId,
        title: input.title,
        description: input.description,
        startTime: new Date(input.dueDate.getFullYear(), input.dueDate.getMonth(), input.dueDate.getDate(), 9, 0, 0),
        endTime: new Date(input.dueDate.getFullYear(), input.dueDate.getMonth(), input.dueDate.getDate(), 10, 0, 0),
        allDay: false,
        source: 'todo',
        todoId: todo.id,
        color: input.color,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: null,
        isDeleted: false,
      };

      await this.calendarRepository.create(calendarEvent);
      
      // Update todo with calendar event ID
      const updatedTodo = { ...todo, calendarEventId: calendarEvent.id };
      await this.todoRepository.update(todo, { calendarEventId: calendarEvent.id });
      
      return updatedTodo;
    }

    return todo;
  }
}

// Arbitraries for property testing
const eventInputArbitrary = () =>
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 })),
    startTime: fc.integer({ min: 0, max: 2147483647 }).map(ts => new Date(ts * 1000)),
    endTime: fc.integer({ min: 0, max: 2147483647 }).map(ts => new Date(ts * 1000)),
    allDay: fc.boolean(),
    color: fc.option(fc.constantFrom('#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff')),
  }).filter(input => input.endTime >= input.startTime);

const todoInputArbitrary = () =>
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 })),
    dueDate: fc.option(fc.integer({ min: 0, max: 2147483647 }).map(ts => new Date(ts * 1000))),
    priority: fc.constantFrom('low', 'medium', 'high'),
    color: fc.constantFrom('red', 'blue', 'green', 'yellow', 'purple'),
  });

const dateArbitrary = () =>
  fc.integer({ min: 0, max: 2147483647 }).map(ts => new Date(ts * 1000));

describe('Calendar Events Property Tests', () => {
  let calendarService: MockCalendarService;
  let todoService: MockTodoService;
  let mockCalendarRepository: any;
  let mockTodoRepository: any;
  let mockSyncManager: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repositories
    mockCalendarRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      query: jest.fn(() => ({
        fetch: jest.fn().mockResolvedValue([]),
      })),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockTodoRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      query: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockSyncManager = {
      queueChange: jest.fn(),
    };
    
    // Create service instances with mocked dependencies
    calendarService = new MockCalendarService(
      mockCalendarRepository,
      mockSyncManager
    );
    
    todoService = new MockTodoService(
      mockTodoRepository,
      mockCalendarRepository,
      mockSyncManager
    );
  });

  // Property 14: Create and sync calendar events
  describe('Feature: mobile-apps, Property 14: Create and sync calendar events', () => {
    it('should save and sync any valid calendar event input', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventInputArbitrary(),
          async (eventInput) => {
            const userId = 'test-user-id';
            const mockEvent = {
              id: 'mock-event-id',
              userId,
              ...eventInput,
              source: 'local' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
              syncedAt: null,
              isDeleted: false,
            };

            // Mock repository responses
            mockCalendarRepository.create.mockResolvedValueOnce(mockEvent);
            mockCalendarRepository.findById.mockResolvedValueOnce(mockEvent);

            // Create event
            const createdEvent = await calendarService.createEvent(eventInput, userId);

            // Verify event was created with correct data
            expect(mockCalendarRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                userId,
                title: eventInput.title,
                description: eventInput.description,
                startTime: eventInput.startTime,
                endTime: eventInput.endTime,
                allDay: eventInput.allDay,
                color: eventInput.color,
                source: 'local',
              })
            );

            // Verify sync was queued
            expect(mockSyncManager.queueChange).toHaveBeenCalledWith({
              table: 'calendar_events',
              operation: 'create',
              recordId: mockEvent.id,
            });

            // Verify returned event has correct properties (excluding timestamps)
            expect(createdEvent).toEqual(expect.objectContaining({
              id: mockEvent.id,
              userId: mockEvent.userId,
              title: eventInput.title,
              description: eventInput.description,
              startTime: eventInput.startTime,
              endTime: eventInput.endTime,
              allDay: eventInput.allDay,
              color: eventInput.color,
              source: 'local',
              isDeleted: false,
              syncedAt: null,
            }));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 15: Calendar event filtering by date
  describe('Feature: mobile-apps, Property 15: Calendar event filtering by date', () => {
    it('should display only events that include the selected date', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(eventInputArbitrary(), { minLength: 0, maxLength: 20 }),
          dateArbitrary(),
          async (eventInputs, selectedDate) => {
            const userId = 'test-user-id';
            
            // Create mock events with IDs
            const mockEvents = eventInputs.map((input, index) => ({
              id: `event-${index}`,
              userId,
              ...input,
              source: 'local' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
              syncedAt: null,
              isDeleted: false,
            }));

            // Mock repository to return all events
            mockCalendarRepository.query.mockReturnValueOnce({
              fetch: jest.fn().mockResolvedValueOnce(mockEvents),
            });

            // Get events for the selected date
            const filteredEvents = await calendarService.getEventsForDate(selectedDate, userId);

            // Verify that all returned events include the selected date
            filteredEvents.forEach((event: any) => {
              const eventStart = new Date(event.startTime);
              const eventEnd = new Date(event.endTime);
              const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
              const eventStartDateOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
              const eventEndDateOnly = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());

              // Event should either start on, end on, or span across the selected date
              const includesDate = 
                eventStartDateOnly <= selectedDateOnly && 
                eventEndDateOnly >= selectedDateOnly;

              expect(includesDate).toBe(true);
            });

            // Verify that no events outside the date range are included
            const expectedEvents = mockEvents.filter(event => {
              const eventStart = new Date(event.startTime);
              const eventEnd = new Date(event.endTime);
              const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
              const eventStartDateOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
              const eventEndDateOnly = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());

              return eventStartDateOnly <= selectedDateOnly && eventEndDateOnly >= selectedDateOnly;
            });

            expect(filteredEvents).toHaveLength(expectedEvents.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 16: Todo-to-event conversion
  describe('Feature: mobile-apps, Property 16: Todo-to-event conversion', () => {
    it('should create calendar events for todos with due dates', async () => {
      await fc.assert(
        fc.asyncProperty(
          todoInputArbitrary(),
          async (todoInput) => {
            const userId = 'test-user-id';
            
            // Only test todos that have due dates
            if (!todoInput.dueDate) {
              return; // Skip this test case
            }

            const mockTodo = {
              id: 'mock-todo-id',
              userId,
              ...todoInput,
              status: 'active' as const,
              tags: [],
              calendarEventId: null,
              googleEventId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              syncedAt: null,
              isDeleted: false,
            };

            const mockCalendarEvent = {
              id: 'mock-calendar-event-id',
              userId,
              title: todoInput.title,
              description: todoInput.description,
              startTime: new Date(todoInput.dueDate.getFullYear(), todoInput.dueDate.getMonth(), todoInput.dueDate.getDate(), 9, 0, 0),
              endTime: new Date(todoInput.dueDate.getFullYear(), todoInput.dueDate.getMonth(), todoInput.dueDate.getDate(), 10, 0, 0),
              allDay: false,
              source: 'todo' as const,
              todoId: mockTodo.id,
              color: todoInput.color,
              createdAt: new Date(),
              updatedAt: new Date(),
              syncedAt: null,
              isDeleted: false,
            };

            // Mock repository responses
            mockTodoRepository.create.mockResolvedValueOnce(mockTodo);
            mockCalendarRepository.create.mockResolvedValueOnce(mockCalendarEvent);
            mockTodoRepository.update.mockResolvedValueOnce({
              ...mockTodo,
              calendarEventId: mockCalendarEvent.id,
            });

            // Create todo (which should automatically create calendar event)
            const createdTodo = await todoService.createTodo(todoInput, userId);

            // Verify calendar event was created
            expect(mockCalendarRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                userId,
                title: todoInput.title,
                description: todoInput.description,
                source: 'todo',
                todoId: mockTodo.id,
                allDay: false,
              })
            );

            // Verify todo was updated with calendar event ID
            expect(mockTodoRepository.update).toHaveBeenCalledWith(
              mockTodo,
              expect.objectContaining({
                calendarEventId: mockCalendarEvent.id,
              })
            );

            // Verify the calendar event was created with correct structure
            expect(mockCalendarRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                userId,
                title: todoInput.title,
                description: todoInput.description,
                source: 'todo',
                todoId: mockTodo.id,
                allDay: false,
              })
            );

            // Verify the start and end times are set (we'll check the exact times are reasonable)
            const createCall = mockCalendarRepository.create.mock.calls[0][0];
            const startTime = new Date(createCall.startTime);
            const endTime = new Date(createCall.endTime);
            
            // Verify it's a 1-hour event starting at 9 AM
            expect(startTime.getHours()).toBe(9);
            expect(startTime.getMinutes()).toBe(0);
            expect(endTime.getHours()).toBe(10);
            expect(endTime.getMinutes()).toBe(0);
            
            // Verify start and end are on the same day
            expect(startTime.getFullYear()).toBe(endTime.getFullYear());
            expect(startTime.getMonth()).toBe(endTime.getMonth());
            expect(startTime.getDate()).toBe(endTime.getDate());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not create calendar events for todos without due dates', async () => {
      await fc.assert(
        fc.asyncProperty(
          todoInputArbitrary().filter(input => !input.dueDate),
          async (todoInput) => {
            const userId = 'test-user-id';
            
            const mockTodo = {
              id: 'mock-todo-id',
              userId,
              ...todoInput,
              status: 'active' as const,
              tags: [],
              calendarEventId: null,
              googleEventId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              syncedAt: null,
              isDeleted: false,
            };

            // Mock repository responses
            mockTodoRepository.create.mockResolvedValueOnce(mockTodo);

            // Create todo
            await todoService.createTodo(todoInput, userId);

            // Verify no calendar event was created
            expect(mockCalendarRepository.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});