# Design Document: iOS & Android Mobile Apps

## Overview

This document outlines the technical design for native iOS and Android mobile applications for the Daily PA system. The mobile apps will be built using React Native with Expo, leveraging the existing Supabase backend infrastructure. The design emphasizes offline-first architecture, cross-platform code sharing, and native platform integration where appropriate.

### Technology Stack

- **Framework**: React Native with Expo (managed workflow)
- **Language**: TypeScript
- **State Management**: Zustand with AsyncStorage persistence
- **Local Storage**: AsyncStorage (via Zustand persist middleware)
- **Backend**: Existing Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper + custom components
- **Forms**: React Hook Form with Zod validation
- **Testing**: Jest + React Native Testing Library + fast-check (property-based testing)
- **Push Notifications**: Expo Notifications
- **Camera**: Expo Camera + Expo Image Picker
- **Voice**: Expo Speech + Expo AV
- **Biometrics**: Expo Local Authentication
- **Apple Auth**: Expo Apple Authentication (Sign in with Apple)
- **Apple Calendar**: expo-calendar (EventKit integration for iOS)

### Design Rationale

**React Native with Expo** was selected over Flutter because:
1. The existing web app uses React and TypeScript, enabling code sharing for business logic, types, and validation schemas
2. Team familiarity with JavaScript/TypeScript ecosystem reduces learning curve
3. Expo provides managed workflow with over-the-air updates and simplified native module integration
4. Strong Supabase integration support with official React Native libraries
5. Mature ecosystem with extensive third-party libraries

**Zustand with AsyncStorage** was chosen for local data persistence because:
1. Works seamlessly with Expo Go without native module compilation issues
2. Simple, lightweight state management consistent with web app patterns
3. Built-in persist middleware with AsyncStorage for offline data
4. No complex database setup or migrations required
5. Reactive updates automatically refresh UI when data changes
6. Free and open source with no licensing concerns

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile Application                    │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer                                      │
│  ├─ Screens (Todos, Expenses, Calendar, Profile)       │
│  ├─ Components (UI elements, forms, lists)             │
│  └─ Navigation (Stack, Tab, Modal navigators)          │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                    │
│  ├─ Hooks (useTodos, useExpenses, useCalendar)         │
│  ├─ State Management (Zustand stores)                  │
│  └─ Validation (Zod schemas - shared with web)         │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                              │
│  ├─ WatermelonDB (Local SQLite database)               │
│  ├─ Sync Engine (Bidirectional sync with Supabase)     │
│  └─ Supabase Client (Auth, Realtime, Storage)          │
├─────────────────────────────────────────────────────────┤
│  Platform Services                                       │
│  ├─ Camera (Receipt scanning)                          │
│  ├─ Voice (Speech recognition)                         │
│  ├─ Notifications (Push notifications)                 │
│  ├─ Biometrics (Face ID, Touch ID, Fingerprint)        │
│  └─ Secure Storage (Keychain/Keystore)                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Backend (Existing)                 │
│  ├─ PostgreSQL Database                                 │
│  ├─ Authentication (JWT tokens)                         │
│  ├─ Storage (Receipt images)                            │
│  ├─ Realtime (WebSocket subscriptions)                  │
│  └─ Edge Functions (OCR processing)                     │
└─────────────────────────────────────────────────────────┘
```

### Offline-First Architecture

The app follows an offline-first pattern where all data operations happen against the local Zustand store (persisted to AsyncStorage) first, then sync with Supabase when connectivity is available.

**Data Flow:**
1. User performs action (create, update, delete)
2. Action updates local Zustand store immediately
3. UI updates reactively via Zustand subscriptions
4. AsyncStorage persists changes automatically via persist middleware
5. Sync engine queues change for upload
6. When online, sync engine pushes changes to Supabase
7. Sync engine pulls remote changes and merges into local store
8. Conflicts resolved using last-write-wins (server timestamp)


## Components and Interfaces

### Core Modules

#### 1. Authentication Module

**Responsibilities:**
- User login, registration, password reset
- Token management and refresh
- Biometric authentication
- Session persistence

**Key Components:**
- `AuthProvider`: Context provider for auth state
- `LoginScreen`: Email/password login with biometric option and social login
- `RegisterScreen`: New user registration
- `ForgotPasswordScreen`: Password reset flow
- `BiometricPrompt`: Platform-specific biometric authentication
- `AppleSignInButton`: Sign in with Apple button (iOS only)

**Interfaces:**
```typescript
interface AuthService {
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string, profile: UserProfile): Promise<AuthResult>;
  signInWithApple(): Promise<AuthResult>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  refreshSession(): Promise<AuthResult>;
  enableBiometric(): Promise<void>;
  authenticateWithBiometric(): Promise<AuthResult>;
}

interface AuthResult {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
```

#### 2. Todo Module

**Responsibilities:**
- Todo CRUD operations
- Filtering and sorting
- Status management
- Color assignment

**Key Components:**
- `TodoListScreen`: Grid/list view of todos with filters
- `TodoDetailScreen`: View/edit single todo
- `TodoForm`: Create/edit todo form
- `TodoCard`: Individual todo display component
- `TodoFilters`: Filter controls for status and color

**Interfaces:**
```typescript
interface TodoService {
  getTodos(filters?: TodoFilters): Observable<Todo[]>;
  getTodoById(id: string): Observable<Todo | null>;
  createTodo(input: CreateTodoInput): Promise<Todo>;
  updateTodo(id: string, input: UpdateTodoInput): Promise<Todo>;
  deleteTodo(id: string): Promise<void>;
  toggleStatus(id: string): Promise<Todo>;
}

interface TodoRepository {
  query(filters?: TodoFilters): Query<Todo>;
  findById(id: string): Promise<Todo | null>;
  create(data: TodoInsert): Promise<Todo>;
  update(todo: Todo, changes: Partial<Todo>): Promise<Todo>;
  delete(todo: Todo): Promise<void>;
}
```

#### 3. Expense Module

**Responsibilities:**
- Expense CRUD operations
- Receipt image capture and upload
- OCR processing integration
- Category-based filtering
- Summary calculations

**Key Components:**
- `ExpenseListScreen`: Chronological list with summaries
- `ExpenseDetailScreen`: View/edit single expense
- `ExpenseForm`: Create/edit expense form
- `ReceiptScanner`: Camera integration for receipt capture
- `ExpenseSummary`: Category breakdown and totals

**Interfaces:**
```typescript
interface ExpenseService {
  getExpenses(filters?: ExpenseFilters): Observable<Expense[]>;
  getExpenseById(id: string): Observable<Expense | null>;
  createExpense(input: CreateExpenseInput): Promise<Expense>;
  updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  getSummary(filters?: ExpenseFilters): Observable<ExpenseSummary>;
  scanReceipt(imageUri: string): Promise<ReceiptData>;
}

interface ReceiptData {
  amount: number | null;
  date: Date | null;
  merchant: string | null;
  category: ExpenseCategory | null;
  confidence: number;
}
```


#### 4. Calendar Module

**Responsibilities:**
- Calendar event CRUD operations
- Multiple view types (month, week, day)
- Google Calendar sync
- Apple Calendar sync (iOS)
- Todo-to-event conversion

**Key Components:**
- `CalendarScreen`: Main calendar view with view switcher
- `EventDetailScreen`: View/edit single event
- `EventForm`: Create/edit event form
- `MonthView`: Month calendar grid
- `WeekView`: Week timeline view
- `DayView`: Day schedule view
- `CalendarSyncSettings`: Settings for choosing calendar provider

**Interfaces:**
```typescript
type CalendarProvider = 'none' | 'google' | 'apple';

interface CalendarService {
  getEvents(filters?: CalendarEventFilters): Observable<CalendarEvent[]>;
  getEventById(id: string): Observable<CalendarEvent | null>;
  createEvent(input: CreateCalendarEventInput): Promise<CalendarEvent>;
  updateEvent(id: string, input: UpdateCalendarEventInput): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;
  syncWithGoogle(): Promise<SyncResult>;
  syncWithApple(): Promise<SyncResult>;
  setCalendarProvider(provider: CalendarProvider): Promise<void>;
  getCalendarProvider(): CalendarProvider;
}

interface SyncResult {
  pulled: number;
  pushed: number;
  conflicts: number;
  errors: Error[];
}
```

#### 5. AI Assistant Module

**Responsibilities:**
- Chat interface
- Message sending and receiving
- Action confirmation dialogs
- Voice input integration

**Key Components:**
- `ChatScreen`: Chat interface with message history
- `MessageBubble`: Individual message display
- `ActionConfirmation`: Dialog for confirming AI suggestions
- `VoiceInput`: Voice recording and transcription

**Interfaces:**
```typescript
interface AIService {
  sendMessage(message: string): Promise<AIResponse>;
  sendVoiceMessage(audioUri: string): Promise<AIResponse>;
  confirmAction(actionId: string, data: any): Promise<void>;
}

interface AIResponse {
  message: string;
  action?: AIAction;
}

interface AIAction {
  type: 'create_todo' | 'create_expense' | 'create_event';
  data: any;
  requiresConfirmation: boolean;
}
```

#### 6. Sync Engine

**Responsibilities:**
- Bidirectional data synchronization
- Conflict resolution
- Queue management
- Network status monitoring

**Key Components:**
- `SyncManager`: Orchestrates sync operations
- `SyncQueue`: Manages pending changes
- `ConflictResolver`: Resolves sync conflicts
- `NetworkMonitor`: Tracks connectivity status

**Interfaces:**
```typescript
interface SyncEngine {
  sync(): Promise<SyncResult>;
  syncTable(tableName: string): Promise<SyncResult>;
  getLastSyncTime(): Date | null;
  getPendingChanges(): Promise<Change[]>;
  resolveConflict(conflict: Conflict): Promise<void>;
}

interface Change {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

interface Conflict {
  localChange: Change;
  remoteChange: Change;
  resolution: 'local' | 'remote' | 'manual';
}
```

## Data Models

### Zustand Store Schema

The local store schema mirrors the Supabase schema with additional sync metadata.

```typescript
// Types for local storage
interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TodoPriority;
  status: TodoStatus;
  tags: string[];
  color: TodoColor;
  calendarEventId?: string;
  googleEventId?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description?: string;
  expenseDate: string;
  receiptUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  source: EventSource;
  googleEventId?: string;
  appleEventId?: string;
  todoId?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

// Zustand store interface
interface LocalStore {
  todos: Todo[];
  expenses: Expense[];
  calendarEvents: CalendarEvent[];
  lastSyncTime: string | null;
  
  // Todo actions
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  setTodos: (todos: Todo[]) => void;
  
  // Expense actions
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  setExpenses: (expenses: Expense[]) => void;
  
  // Calendar event actions
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  setCalendarEvents: (events: CalendarEvent[]) => void;
  
  // Sync actions
  setLastSyncTime: (time: string) => void;
  clearAll: () => void;
}
```

### Sync Metadata

Each model includes sync-specific fields:
- `syncedAt`: Timestamp of last successful sync
- `isDeleted`: Soft delete flag for sync purposes
- `updatedAt`: Used for conflict resolution


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication Properties

**Property 1: Valid credentials grant access**
*For any* valid email and password combination, when a user attempts to authenticate, the Auth_System should successfully authenticate the user and grant access to the app.
**Validates: Requirements 1.2**

**Property 2: Invalid credentials are rejected**
*For any* invalid email or password combination, when a user attempts to authenticate, the Auth_System should reject the authentication and display an error message.
**Validates: Requirements 1.3**

**Property 3: Token storage after successful login**
*For any* successful authentication, the Mobile_App should store authentication tokens securely in device keychain/keystore.
**Validates: Requirements 1.4**

**Property 4: Auto-authentication with valid tokens**
*For any* app launch with valid stored tokens, the Mobile_App should automatically authenticate the user without requiring credentials.
**Validates: Requirements 1.5**

**Property 5: Logout clears authentication state**
*For any* authenticated session, when a user logs out, the Mobile_App should clear all authentication tokens and return to the login screen.
**Validates: Requirements 1.7**

**Property 6: Password reset sends email**
*For any* valid email address, when a user requests password reset, the Auth_System should send a reset link to that email.
**Validates: Requirements 1.8**

### Data Management Properties

**Property 7: Create and sync todos**
*For any* valid todo input, when a user creates a todo, the Sync_Engine should save it to local storage, sync to Backend_API, and display it in the todo list.
**Validates: Requirements 2.3**

**Property 8: Todo status toggle**
*For any* todo, when a user marks it as complete or incomplete, the Mobile_App should update the status and reflect the change in the UI.
**Validates: Requirements 2.5**

**Property 9: Todo filtering**
*For any* set of todos and filter criteria (status or color), the Mobile_App should display only todos that match all active filters.
**Validates: Requirements 2.6**

**Property 10: Todo statistics accuracy**
*For any* set of todos, the displayed active count should equal the number of todos with status 'active', and completed count should equal the number with status 'completed'.
**Validates: Requirements 2.8**

**Property 11: Create and sync expenses**
*For any* valid expense input, when a user creates an expense, the Sync_Engine should save it to local storage, sync to Backend_API, and display it in the expense list.
**Validates: Requirements 3.3**

**Property 12: Expense filtering**
*For any* set of expenses and filter criteria (category or date range), the Mobile_App should display only expenses that match all active filters.
**Validates: Requirements 3.5**

**Property 13: Expense summary accuracy**
*For any* set of expenses, the total spending should equal the sum of all expense amounts, and category breakdowns should equal the sum of expenses in each category.
**Validates: Requirements 3.6**

**Property 14: Create and sync calendar events**
*For any* valid calendar event input, when a user creates an event, the Sync_Engine should save it to local storage, sync to Backend_API, and display it in the calendar.
**Validates: Requirements 4.4**

**Property 15: Calendar event filtering by date**
*For any* date and set of calendar events, the Mobile_App should display only events where the event's date range includes the selected date.
**Validates: Requirements 4.2**

**Property 16: Todo-to-event conversion**
*For any* todo with a due date, the Mobile_App should create or display a corresponding calendar event with the todo's title and due date.
**Validates: Requirements 4.7**

**Property 17: Google Calendar bidirectional sync**
*For any* set of local and remote Google Calendar events, when sync is triggered, the Sync_Engine should merge events bidirectionally, creating missing events on both sides.
**Validates: Requirements 4.6**

**Property 86: Apple Calendar bidirectional sync**
*For any* set of local and device Apple Calendar events (iOS), when sync is triggered, the Sync_Engine should merge events bidirectionally with the native calendar.
**Validates: Requirements 4.7**

**Property 87: Calendar provider selection**
*For any* calendar provider selection (Google, Apple, or none), the Mobile_App should save the preference and use the selected provider for calendar sync operations.
**Validates: Requirements 4.10**

**Property 88: Sign in with Apple authentication**
*For any* valid Apple ID authentication on iOS, the Auth_System should create or link the user account and grant access to the app.
**Validates: Requirements 1.9, 1.10**

### AI Assistant Properties

**Property 18: Message sending and display**
*For any* user message, when sent to the AI assistant, the Mobile_App should display the message in the chat interface and send it to the Backend_API.
**Validates: Requirements 5.2**

**Property 19: AI response display**
*For any* AI response received from the Backend_API, the Mobile_App should display it in the chat interface.
**Validates: Requirements 5.3**

**Property 20: AI action confirmation**
*For any* AI suggestion to create a todo or expense, the Mobile_App should present a confirmation dialog with pre-filled data from the suggestion.
**Validates: Requirements 5.4**

**Property 21: Confirmed action execution**
*For any* confirmed AI suggestion, the Sync_Engine should create the suggested item (todo, expense, or event) and update the relevant screen.
**Validates: Requirements 5.5**

**Property 22: Voice transcription and sending**
*For any* voice input, the Voice_Module should transcribe it to text and send the transcribed message to the AI assistant.
**Validates: Requirements 5.7**

**Property 23: Chat history persistence**
*For any* chat session, all messages sent and received should be retained and displayed in the chat history for the duration of the session.
**Validates: Requirements 5.8**

### Offline and Sync Properties

**Property 24: Offline data loading**
*For any* app launch without internet connection, the Mobile_App should load and display all data from Offline_Storage.
**Validates: Requirements 6.1**

**Property 25: Offline change persistence**
*For any* data creation or modification while offline, the Offline_Storage should save the changes locally and queue them for sync.
**Validates: Requirements 6.2**

**Property 26: Sync on reconnection**
*For any* pending local changes, when internet connection is restored, the Sync_Engine should synchronize all changes to the Backend_API.
**Validates: Requirements 6.3**

**Property 27: Conflict resolution with last-write-wins** ✅ PBT
*For any* sync conflict between local and remote changes, the Sync_Engine should apply the change with the latest server timestamp.
**Validates: Requirements 6.4**

**Property 28: UI update after successful sync**
*For any* successful sync operation, the Mobile_App should refresh all screens to display the latest data from the Backend_API.
**Validates: Requirements 6.6**

**Property 29: Sync retry with exponential backoff**
*For any* failed sync attempt, the Mobile_App should retry automatically with exponentially increasing delays between attempts.
**Validates: Requirements 6.7**

**Property 30: Immediate sync on change** ✅ PBT
*For any* data change made while online, the Sync_Engine should upload the change to the Backend_API immediately.
**Validates: Requirements 9.1**

**Property 31: Pull and display remote changes** ✅ PBT
*For any* change made on another device, the Sync_Engine should pull the update and refresh the mobile display to show the change.
**Validates: Requirements 9.2**

**Property 32: Incremental sync**
*For any* sync operation, the Sync_Engine should only transfer changes made since the last sync timestamp, not all data.
**Validates: Requirements 9.3**

**Property 33: Queue changes on network error**
*For any* network error during sync, the Sync_Engine should queue the changes locally and retry automatically.
**Validates: Requirements 9.4**

**Property 34: Conflict resolution by server timestamp** ✅ PBT
*For any* conflict where multiple devices modify the same item, the Sync_Engine should resolve it using the server timestamp to determine the winning change.
**Validates: Requirements 9.5**

**Property 35: Sync timestamp update**
*For any* completed sync operation, the Mobile_App should update the last sync timestamp display to reflect the completion time.
**Validates: Requirements 9.7**

**Property 36: Background sync when active**
*For any* time when the app is active and connected to the internet, the Sync_Engine should perform background synchronization.
**Validates: Requirements 9.8**

### Notification Properties

**Property 37: Device registration on permission grant**
*For any* notification permission grant, the Mobile_App should register the device for push notifications with the Backend_API.
**Validates: Requirements 7.1**

**Property 38: Todo due date notifications**
*For any* todo with a due date, the Push_Notification should schedule and send an alert with the todo title and time when the due date approaches.
**Validates: Requirements 7.2**

**Property 39: Calendar event notifications**
*For any* calendar event, the Push_Notification should schedule and send an alert with event details when the event is about to start.
**Validates: Requirements 7.3**

**Property 40: Notification navigation**
*For any* notification tap, the Mobile_App should open and navigate to the relevant screen showing the associated item (todo, expense, or event).
**Validates: Requirements 7.4**

**Property 41: Notification disable**
*For any* state where notifications are disabled in settings, the Mobile_App should stop sending all notifications.
**Validates: Requirements 7.6**

### Receipt Scanning Properties

**Property 42: Receipt image upload**
*For any* accepted receipt photo, the Mobile_App should upload it to the Backend_API for OCR processing.
**Validates: Requirements 8.3**

**Property 43: OCR data extraction**
*For any* receipt image processed by OCR, the Mobile_App should extract amount, date, and merchant information.
**Validates: Requirements 8.4**

**Property 44: Form pre-fill on successful extraction**
*For any* successful OCR extraction, the Mobile_App should pre-fill the expense form with the extracted amount, date, category, and merchant data.
**Validates: Requirements 8.5**

**Property 45: Manual entry on extraction failure**
*For any* failed or incomplete OCR extraction, the Mobile_App should allow manual entry while keeping the receipt image attached.
**Validates: Requirements 8.6**

**Property 46: Image compression on limited storage**
*For any* receipt image when device storage is limited, the Mobile_App should compress the image before upload.
**Validates: Requirements 8.8**

### Settings and Profile Properties

**Property 47: Profile update sync**
*For any* profile field update, the Sync_Engine should save the changes to the Backend_API.
**Validates: Requirements 10.2**

**Property 48: Password change with verification**
*For any* password change request with valid current password, the Mobile_App should update the password; for invalid current password, it should reject the change.
**Validates: Requirements 10.3**

**Property 49: Biometric setting persistence**
*For any* biometric authentication enable/disable action, the Mobile_App should save the setting and apply it on subsequent app launches.
**Validates: Requirements 10.4**

**Property 50: Notification preference persistence**
*For any* notification preference change, the Mobile_App should save the setting and apply it to future notifications.
**Validates: Requirements 10.5**

**Property 51: Theme preference application**
*For any* theme selection (light, dark, or system), the Mobile_App should apply the theme immediately and persist the preference.
**Validates: Requirements 10.6**

**Property 52: Default currency persistence**
*For any* default currency selection, the Mobile_App should save the setting and use it for new expenses.
**Validates: Requirements 10.7**

**Property 53: Logout data clearing**
*For any* logout action, the Mobile_App should clear all local data and authentication tokens, then return to the login screen.
**Validates: Requirements 10.8**

### Cross-Platform Properties

**Property 54: Data model consistency**
*For any* data operation (create, read, update, delete), the results should be identical on iOS and Android platforms.
**Validates: Requirements 11.3**

### Performance Properties

**Property 55: App launch time**
*For any* app launch, the Mobile_App should display the main screen within 2 seconds.
**Validates: Requirements 12.1**

**Property 56: Navigation transition time**
*For any* navigation between screens, the transition should complete within 300 milliseconds.
**Validates: Requirements 12.2**

**Property 57: Scroll frame rate**
*For any* list scrolling, the Mobile_App should maintain a frame rate of 60 FPS.
**Validates: Requirements 12.3**

**Property 58: Optimistic UI updates**
*For any* item creation or update, the Mobile_App should provide immediate UI feedback before the server response.
**Validates: Requirements 12.4**

**Property 59: Data caching**
*For any* frequently accessed data, the Mobile_App should cache it locally to minimize network requests.
**Validates: Requirements 12.6**

**Property 60: Lazy loading**
*For any* large content (images, lists), the Mobile_App should load it on demand rather than upfront.
**Validates: Requirements 12.7**

**Property 61: Memory management**
*For any* low memory condition, the Mobile_App should release cached resources to free memory.
**Validates: Requirements 12.8**

### Error Handling Properties

**Property 62: User-friendly network error messages**
*For any* network error, the Mobile_App should display a user-friendly error message explaining the issue.
**Validates: Requirements 13.1**

**Property 63: Authentication error guidance**
*For any* authentication failure, the Mobile_App should provide clear guidance on how to resolve the issue.
**Validates: Requirements 13.2**

**Property 64: Validation error highlighting**
*For any* form validation error, the Mobile_App should highlight the problematic fields with specific error messages.
**Validates: Requirements 13.3**

**Property 65: Crash logging**
*For any* app crash, the Mobile_App should log error details including stack trace and device information for debugging.
**Validates: Requirements 13.4**

**Property 66: Retry options for recoverable errors**
*For any* recoverable error (network timeout, temporary server error), the Mobile_App should provide a retry option.
**Validates: Requirements 13.5**

**Property 67: Conflict notification**
*For any* sync conflict, the Mobile_App should notify the user and show conflict resolution options.
**Validates: Requirements 13.6**

**Property 68: Graceful API error handling**
*For any* API error response, the Mobile_App should handle it gracefully without crashing.
**Validates: Requirements 13.7**

**Property 69: Error reporting**
*For any* critical error, the Mobile_App should allow users to report the issue with diagnostic information.
**Validates: Requirements 13.8**

### Security Properties

**Property 70: Secure token storage**
*For any* authentication token, the Auth_System should store it in secure device storage (Keychain on iOS, Keystore on Android).
**Validates: Requirements 14.1**

**Property 71: Sensitive data encryption**
*For any* sensitive data stored in Offline_Storage, the Mobile_App should encrypt it before storage.
**Validates: Requirements 14.2**

**Property 72: HTTPS for all network requests**
*For any* network communication, the Mobile_App should use HTTPS protocol.
**Validates: Requirements 14.3**

**Property 73: SSL certificate validation**
*For any* HTTPS connection, the Mobile_App should validate SSL certificates to prevent man-in-the-middle attacks.
**Validates: Requirements 14.4**

**Property 74: Biometric verification on launch**
*For any* app launch when biometric authentication is enabled, the Mobile_App should require biometric verification before granting access.
**Validates: Requirements 14.5**

**Property 75: Auto-lock on inactivity**
*For any* configured inactivity period, the Mobile_App should automatically lock and require re-authentication.
**Validates: Requirements 14.6**

**Property 76: No sensitive data in logs**
*For any* log entry, the Mobile_App should not include sensitive information such as passwords, tokens, or personal data.
**Validates: Requirements 14.7**

**Property 77: Data deletion on account removal**
*For any* account deletion, the Mobile_App should remove all local data including cached items, tokens, and user preferences.
**Validates: Requirements 14.8**

### Accessibility Properties

**Property 78: Screen reader support**
*For any* UI element, the Mobile_App should provide appropriate accessibility labels and hints for screen readers (VoiceOver on iOS, TalkBack on Android).
**Validates: Requirements 15.1**

**Property 79: Text alternatives for images**
*For any* image or icon, the Mobile_App should provide a text alternative describing its purpose or content.
**Validates: Requirements 15.2**

**Property 80: Dynamic text sizing**
*For any* text element, the Mobile_App should scale according to system text size settings.
**Validates: Requirements 15.3**

**Property 81: Minimum touch target size**
*For any* interactive element (button, link, input), the Mobile_App should maintain a minimum touch target size of 44x44 points.
**Validates: Requirements 15.4**

**Property 82: Color contrast ratios**
*For any* text or UI element, the Mobile_App should provide sufficient color contrast ratios meeting WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
**Validates: Requirements 15.5**

**Property 83: Keyboard navigation**
*For any* navigable element, the Mobile_App should support keyboard navigation where applicable.
**Validates: Requirements 15.6**

**Property 84: Screen reader state announcements**
*For any* state change (loading, error, success), the Mobile_App should announce the change to screen readers.
**Validates: Requirements 15.7**

**Property 85: Color-independent information**
*For any* information conveyed through color, the Mobile_App should also convey it through text, icons, or patterns.
**Validates: Requirements 15.8**


## Error Handling

### Error Categories

**Network Errors:**
- Connection timeout
- No internet connection
- Server unreachable
- DNS resolution failure

**Authentication Errors:**
- Invalid credentials
- Expired session
- Token refresh failure
- Biometric authentication failure

**Validation Errors:**
- Missing required fields
- Invalid data format
- Out-of-range values
- Constraint violations

**Sync Errors:**
- Conflict detection
- Merge failures
- Data corruption
- Version mismatch

**Platform Errors:**
- Camera permission denied
- Storage permission denied
- Notification permission denied
- Biometric not available

### Error Handling Strategy

**User-Facing Errors:**
- Display clear, actionable error messages
- Provide retry options for transient failures
- Offer alternative actions when possible
- Log errors for debugging without exposing technical details

**Silent Errors:**
- Log for debugging
- Retry automatically with backoff
- Degrade gracefully
- Continue operation when possible

**Critical Errors:**
- Display error dialog with report option
- Capture full diagnostic information
- Prevent data loss
- Offer safe recovery path

### Error Recovery Patterns

**Retry with Exponential Backoff:**
```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Graceful Degradation:**
- Offline mode when network unavailable
- Cached data when fresh data unavailable
- Basic features when advanced features fail
- Manual entry when OCR fails

**Circuit Breaker:**
- Track failure rates for external services
- Open circuit after threshold failures
- Prevent cascading failures
- Auto-recover after cooldown period

## Testing Strategy

### Dual Testing Approach

The mobile apps will use both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, null handling)
- Error conditions and exception handling
- Integration points between components
- Platform-specific behavior

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariant validation across operations
- Round-trip properties (serialize/deserialize, sync/pull)
- Metamorphic properties (relationships between operations)

### Property-Based Testing Configuration

**Framework:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: mobile-apps, Property {number}: {property_text}`
- Each correctness property implemented by a single property-based test

**Example Property Test:**
```typescript
import fc from 'fast-check';

// Feature: mobile-apps, Property 7: Create and sync todos
describe('Todo Creation and Sync', () => {
  it('should save and sync any valid todo input', async () => {
    await fc.assert(
      fc.asyncProperty(
        todoInputArbitrary(),
        async (todoInput) => {
          // Create todo
          const todo = await todoService.createTodo(todoInput);
          
          // Verify local storage
          const localTodo = await todoRepository.findById(todo.id);
          expect(localTodo).toBeDefined();
          expect(localTodo?.title).toBe(todoInput.title);
          
          // Verify sync
          await waitForSync();
          const remoteTodo = await supabase
            .from('todos')
            .select()
            .eq('id', todo.id)
            .single();
          expect(remoteTodo.data).toBeDefined();
          expect(remoteTodo.data?.title).toBe(todoInput.title);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Organization

```
tests/
├── unit/
│   ├── auth/
│   │   ├── auth-service.test.ts
│   │   └── biometric.test.ts
│   ├── todos/
│   │   ├── todo-service.test.ts
│   │   └── todo-filters.test.ts
│   ├── expenses/
│   │   ├── expense-service.test.ts
│   │   └── expense-summary.test.ts
│   └── calendar/
│       ├── calendar-service.test.ts
│       └── event-views.test.ts
├── properties/
│   ├── auth.property.test.ts
│   ├── todos.property.test.ts
│   ├── expenses.property.test.ts
│   ├── calendar.property.test.ts
│   ├── sync.property.test.ts
│   ├── notifications.property.test.ts
│   └── accessibility.property.test.ts
├── integration/
│   ├── offline-sync.test.ts
│   ├── google-calendar-sync.test.ts
│   └── receipt-scanning.test.ts
└── e2e/
    ├── auth-flow.e2e.ts
    ├── todo-management.e2e.ts
    ├── expense-tracking.e2e.ts
    └── ai-assistant.e2e.ts
```

### Testing Priorities

**High Priority:**
1. Authentication and security
2. Data synchronization and offline functionality
3. CRUD operations for todos, expenses, and events
4. Conflict resolution
5. Data integrity and validation

**Medium Priority:**
1. AI assistant integration
2. Receipt scanning and OCR
3. Push notifications
4. Performance benchmarks
5. Accessibility compliance

**Low Priority:**
1. UI animations and transitions
2. Theme switching
3. Advanced filtering
4. Statistics calculations

### Platform-Specific Testing

**iOS Testing:**
- Test on iOS Simulator and physical devices
- Verify Keychain integration
- Test Face ID and Touch ID
- Validate iOS Human Interface Guidelines compliance

**Android Testing:**
- Test on Android Emulator and physical devices
- Verify Keystore integration
- Test fingerprint authentication
- Validate Material Design compliance

### Continuous Integration

**Pre-commit:**
- Run linter and type checker
- Run unit tests
- Verify code formatting

**Pull Request:**
- Run all unit tests
- Run property-based tests
- Run integration tests
- Generate coverage report

**Pre-release:**
- Run full test suite including E2E
- Test on multiple device types and OS versions
- Performance benchmarking
- Accessibility audit

## Implementation Notes

### Code Sharing with Web App

The following can be shared between web and mobile apps:
- Type definitions (`src/types/`)
- Validation schemas (`src/lib/validations/`)
- Business logic utilities
- API client interfaces
- Supabase client configuration

### Platform-Specific Implementations

**iOS-specific:**
- Keychain for secure storage
- Face ID / Touch ID integration
- iOS notification handling
- iOS-specific UI components

**Android-specific:**
- Keystore for secure storage
- Fingerprint authentication
- Android notification channels
- Material Design components

### Performance Considerations

**WatermelonDB Optimization:**
- Use lazy loading for large datasets
- Implement pagination for lists
- Use database indexes for frequently queried fields
- Batch operations when possible

**React Native Optimization:**
- Use FlatList/SectionList for long lists
- Implement virtualization for large datasets
- Optimize images with proper sizing and caching
- Use React.memo for expensive components
- Avoid inline function definitions in render

**Network Optimization:**
- Implement request deduplication
- Use HTTP caching headers
- Compress request/response payloads
- Batch API calls when possible

### Security Considerations

**Data Protection:**
- Encrypt sensitive data at rest
- Use secure storage for tokens
- Implement certificate pinning for API calls
- Clear sensitive data from memory after use

**Authentication:**
- Implement token refresh before expiration
- Use short-lived access tokens
- Implement biometric authentication
- Auto-lock after inactivity

**Network Security:**
- Use HTTPS for all communications
- Validate SSL certificates
- Implement request signing
- Sanitize user inputs

### Deployment Strategy

**Development:**
- Use Expo development builds
- Enable hot reloading
- Use development Supabase project

**Staging:**
- Use Expo EAS Build
- Test on physical devices
- Use staging Supabase project
- Enable crash reporting

**Production:**
- Build production apps via EAS
- Submit to App Store and Google Play
- Use production Supabase project
- Enable analytics and monitoring
- Implement over-the-air updates via Expo

### Monitoring and Analytics

**Crash Reporting:**
- Sentry for error tracking
- Capture stack traces and device info
- Track error frequency and patterns

**Analytics:**
- Track user engagement metrics
- Monitor feature usage
- Track performance metrics
- Measure sync success rates

**Performance Monitoring:**
- Track app launch time
- Monitor API response times
- Track sync duration
- Monitor memory usage

## References

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [WatermelonDB Documentation](https://watermelondb.dev/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [React Navigation Documentation](https://reactnavigation.org/)
- [fast-check Documentation](https://fast-check.dev/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://m3.material.io/)
- [WCAG Accessibility Standards](https://www.w3.org/WAI/WCAG21/quickref/)
