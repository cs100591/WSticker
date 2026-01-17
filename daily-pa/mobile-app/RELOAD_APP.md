# How to Reload the App

The chatbot offline mode changes have been saved, but you need to reload the app to see them.

## Quick Reload

### On iOS (Expo Go)
1. Shake your device
2. Tap "Reload"

OR

1. Press `Cmd + D` (if using simulator)
2. Tap "Reload"

### On Android (Expo Go)
1. Shake your device
2. Tap "Reload"

OR

1. Press `Cmd + M` or `Ctrl + M`
2. Tap "Reload"

## Alternative: Restart Expo Server

If reload doesn't work, restart the Expo server:

```bash
# Stop the current server (Ctrl+C)
# Then restart with clear cache
cd mobile-app
npx expo start --go --clear
```

## What to Expect After Reload

### 1. Welcome Message Changed
The chatbot will now show:
```
Hi! I'm your smart assistant ✨

🔌 Offline Mode
I can help you:
📝 Create tasks (say 'add task...')
📅 Add events (say 'create meeting...')
💰 Track expenses (say 'spent $50...')
📷 Scan receipts

What can I help you with today?
```

### 2. Text Input Works
Try typing:
- "Add task: Buy milk"
- "Spent $20 on lunch"
- "Create meeting tomorrow"

You should see action cards appear with confirm/cancel buttons.

### 3. Voice Input Shows Message
If you try voice input, you'll see:
```
Voice Feature
Voice transcription requires the backend server. 
Please use text input or start the backend server.
```

### 4. No More Network Errors
The "Network request failed" error should be gone!

## Testing Checklist

- [ ] Open chatbot (floating button)
- [ ] See new welcome message with "🔌 Offline Mode"
- [ ] Type "add task: test" → See action card
- [ ] Confirm action → Task appears in TodosScreen
- [ ] Type "spent $10" → See action card
- [ ] Confirm action → Expense appears in ExpensesScreen
- [ ] Type "create meeting" → See action card
- [ ] Confirm action → Event appears in CalendarScreen
- [ ] No network errors in console

---

**Current Status**: Changes saved, waiting for app reload
**Next Step**: Reload the app using one of the methods above
