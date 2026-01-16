# Expenses Screen Fix

## Issue
- Monthly spending showed $0 even though expenses were loaded
- Summary wasn't calculating correctly from mock data

## Root Cause
The `loadSummary()` function was calling the expense service separately, which was returning an empty summary (total: 0) even when mock expenses were loaded.

## Solution
Changed the summary calculation to be **derived from the loaded expenses** instead of fetching separately:

### Before:
```typescript
useEffect(() => {
  loadExpenses();  // Loads mock data
  loadSummary();   // Fetches from service (returns empty)
}, []);
```

### After:
```typescript
useEffect(() => {
  loadExpenses();  // Loads mock data
}, []);

useEffect(() => {
  // Calculate summary whenever expenses change
  if (expenses.length > 0) {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    // ... calculate category totals, highest, lowest, etc.
    setSummary({ total, count, average, ... });
  }
}, [expenses]);  // Recalculates when expenses change
```

## Benefits
1. ✅ Summary always matches the loaded expenses
2. ✅ Works with both real data and mock data
3. ✅ No separate API call needed for summary
4. ✅ Automatically updates when expenses change
5. ✅ Simpler code - one source of truth

## Result
- Monthly spending now shows **$270.50** (sum of 4 mock expenses)
- Category breakdown shows correct totals
- Transaction history displays all 4 expenses
- "+ Add" button is visible and functional
