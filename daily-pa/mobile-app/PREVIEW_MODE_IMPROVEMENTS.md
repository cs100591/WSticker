# Preview Mode Improvements

## Summary
Added mock data and "Add" buttons to Expenses and Calendar screens so users can preview the app functionality even without database connection (Skip Login mode).

## Changes Made

### 1. Expenses Screen

#### Added "Add" Button
- Blue "+ Add" button in header (top right)
- Shows alert when clicked (placeholder for expense form)
- Matches web app styling

#### Added Mock Data
- **4 sample expenses** displayed when no real data available:
  - Lunch at cafe ($45.50) - Food
  - New shoes ($120.00) - Shopping
  - Taxi ride ($25.00) - Transport
  - Movie tickets ($80.00) - Entertainment
- **Mock summary** showing:
  - Total: $270.50
  - Monthly spending card with percentage badge
  - Category breakdown with icons
  - Transaction history grouped by date

#### Behavior
- If database fetch succeeds but returns empty → show mock data
- If database fetch fails (no connection) → show mock data
- Users can see full layout and functionality in preview mode

### 2. Calendar Screen

#### Added "Add" Button
- Blue "+ Add" button next to date title
- Shows console log when clicked (placeholder for event form)
- Matches web app styling

#### Added Mock Data
- **3 sample events** displayed when no real data available:
  - Team Meeting (10:00 AM - 11:00 AM) - Blue
  - Lunch Break (12:30 PM - 1:30 PM) - Green
  - Project Review (3:00 PM - 4:30 PM) - Orange
- Events show in all views (Month/Week/Day)

#### Behavior
- If database fetch succeeds but returns empty → show mock data
- If database fetch fails (no connection) → show mock data
- Users can see calendar views with sample events

### 3. Dashboard Screen
- Already fetches data with proper error handling
- Shows empty states when no data available
- Quick Actions buttons navigate to respective screens

## Preview Mode Experience

When using "Skip Login" (no database connection):

1. **Dashboard** → Shows stats cards, empty states for tasks/events
2. **Todos** → Shows priority-grouped tasks (already has mock data)
3. **Expenses** → Shows 4 sample expenses with category breakdown
4. **Calendar** → Shows 3 sample events in calendar views

Users can now:
- ✅ See how all screens look with data
- ✅ Navigate between screens
- ✅ Test UI interactions
- ✅ Understand app functionality
- ✅ See "Add" buttons for creating new items

## Next Steps

To make the "Add" buttons functional:
1. Create ExpenseForm modal/screen
2. Create EventForm modal/screen
3. Wire up form submissions to local storage or database
4. Add edit/delete functionality for mock items

## Technical Notes

- Mock data uses `as Expense[]` and `as CalendarEvent[]` type casting
- Mock data only shows when database returns empty or errors
- Real data takes precedence when available
- All mock data includes proper TypeScript types
