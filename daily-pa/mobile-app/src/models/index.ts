/**
 * Models Index
 * Re-exports from local store (no WatermelonDB)
 */

export {
  useLocalStore,
  type Todo,
  type Expense,
  type CalendarEvent,
  type TodoPriority,
  type TodoStatus,
  type TodoColor,
  type ExpenseCategory,
  type EventSource,
} from '../store/localStore';

// Legacy exports for compatibility
export const database = null;
export const getDatabase = () => null;
export const isDatabaseAvailable = () => false;
export const getDatabaseError = () => null;
