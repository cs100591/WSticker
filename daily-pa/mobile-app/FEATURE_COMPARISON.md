# Feature Comparison: Web App vs Mobile App

## Web App Features (from code review)

### Dashboard
- ✅ Overview with stats (Active Tasks, Completion Rate, Monthly Spend, Events Today)
- ✅ Priority Tasks list (top 5)
- ✅ Today's Schedule widget
- ✅ Quick Actions buttons
- ✅ Productivity Insights card
- ✅ Search functionality
- ✅ Notifications bell

### Todos
- ✅ Add todo with priority selection
- ✅ Group by priority (High, Medium, Low, Completed)
- ✅ Collapsible priority groups
- ✅ Toggle todo completion
- ✅ Add to Calendar button
- ✅ Add Notes button
- ✅ Expand/collapse notes
- ✅ Notes indicator (📝)
- ✅ Calendar modal for scheduling
- ✅ Notes modal for adding descriptions

### Expenses
- ✅ Monthly spending summary
- ✅ Category breakdown with icons
- ✅ Add expense form with category selection
- ✅ Transaction history grouped by date
- ✅ Delete expense
- ✅ Category icons (Food, Shopping, Transport, Entertainment, etc.)

### Calendar
- ✅ Multiple view modes (Month, Week, Day, Schedule)
- ✅ Google Calendar sync
- ✅ Sync status indicator
- ✅ Add event with color selection
- ✅ All-day event support
- ✅ Multi-day event spanning
- ✅ Event tooltips on hover
- ✅ "+more" indicator for overflow events
- ✅ Delete event
- ✅ Today button

## Mobile App Current Status

### Dashboard
- ❌ NO DASHBOARD SCREEN
- ❌ Missing overview stats
- ❌ Missing quick actions
- ❌ Missing productivity insights

### Todos (TodosScreen.tsx)
- ✅ Add todo with priority
- ✅ List todos
- ✅ Toggle completion
- ❌ NO priority grouping
- ❌ NO collapsible groups
- ❌ NO add to calendar
- ❌ NO add notes
- ❌ NO notes display

### Expenses (ExpensesScreen.tsx)
- ✅ Add expense
- ✅ List expenses
- ✅ Category selection
- ❌ NO monthly summary
- ❌ NO category breakdown
- ❌ NO delete functionality
- ❌ Different UI from web

### Calendar (CalendarScreen.tsx)
- ✅ Month view
- ✅ Week view
- ✅ Day view
- ✅ Add event
- ❌ NO Google Calendar sync
- ❌ NO sync status
- ❌ NO multi-day event spanning
- ❌ NO event tooltips
- ❌ NO "+more" indicator
- ❌ Different UI from web

## Critical Missing Features

1. **Dashboard Screen** - Completely missing
2. **Todo Notes** - Cannot add/view notes on todos
3. **Todo Calendar Integration** - Cannot add todos to calendar
4. **Todo Priority Grouping** - Not grouped by priority
5. **Expense Summary** - No monthly overview
6. **Expense Categories** - No visual breakdown
7. **Calendar Sync** - No Google Calendar integration
8. **Multi-day Events** - Events don't span multiple days properly

## Recommendation

The mobile app needs significant updates to match web app functionality:

1. Create Dashboard screen with stats and quick actions
2. Update TodosScreen to match web (grouping, notes, calendar integration)
3. Update ExpensesScreen to match web (summary, category breakdown)
4. Update CalendarScreen to match web (sync, multi-day events)
5. Ensure all CRUD operations work the same way
6. Match the UI/UX patterns from web app

**Current Status: Mobile app has ~40% of web app features**
