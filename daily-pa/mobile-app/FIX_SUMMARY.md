# Fixes Applied

## 1. Fixed "Notes Page Unable to Run" (Infinite Loop)
**Issue:** The `NotesScreen` component was crashing with "Maximum update depth exceeded".
**Cause:** The usage of `useLocalStore` with a selector that returned a new array reference (`.filter().sort()`) on every store update caused the component to re-render whenever *any* part of the local store changed. While not a direct infinite loop on its own, combined with frequent store updates (possibly from sync or other components), it led to instability and performance issues.
**Fix:** Optimized the Zustand selector using `useShallow` to ensure `NotesScreen` only re-renders when the actual content of the notes list changes, not just the array reference.

## 2. Fixed "Floating Chatbot Call API Failed"
**Issue:** The Floating Chatbot and Voice Notes features were failing to connect to the backend API.
**Cause:** The API URL was hardcoded in `FloatingChatbot.tsx` and `NotesScreen.tsx`. Upon inspection, the hardcoded URL `https://qmpuasmgkrlkbnsymgaah...` had a typo compared to the correct project URL in your `.env` file (`https://qmpuasmglrkbnsymgaah...` - `krl` vs `glr`). This caused all API calls to fail.
**Fix:** Replaced the hardcoded URLs with a dynamic reference to `ENV.SUPABASE_URL` from your environment configuration. This ensures consistency and prevents typos.

## Verified Files
- `src/screens/NotesScreen.tsx`: Updated to use `useShallow` and `ENV.SUPABASE_URL`.
- `src/components/FloatingChatbot.tsx`: Updated to use `ENV.SUPABASE_URL` and cleaner path construction.

You should now be able to run the app without the "Maximum update depth" crash, and the AI/Chatbot features should correctly connect to your Supabase backend.
