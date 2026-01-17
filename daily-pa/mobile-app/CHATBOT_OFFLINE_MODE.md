# AI Chatbot - Offline Mode

## Problem
The AI chatbot was showing "Network request failed" errors because it was trying to connect to a backend API server that wasn't running.

## Solution
I've implemented **offline mode** with local intent detection. The chatbot now works without a backend server!

## Changes Made

### 1. Local Intent Detection
The chatbot now detects common intents locally:
- **Tasks/Todos**: Detects keywords like "task", "todo", "待办", "任务"
- **Expenses**: Detects keywords like "expense", "spent", "支出", "花费", "$", "¥"
- **Calendar Events**: Detects keywords like "meeting", "event", "calendar", "会议", "日程"

### 2. Offline Fallback
When the API is unavailable, the chatbot:
- ✅ Parses user input locally
- ✅ Creates action cards for confirmation
- ✅ Executes actions via local services (todoService, expenseService, calendarService)
- ✅ Shows helpful offline mode message

### 3. Voice Input Disabled
Voice transcription requires the backend Whisper API, so:
- Voice recording still works
- Shows a message that voice transcription needs the backend
- Suggests using text input instead

## How to Use (Offline Mode)

### Create a Task
Type any of these:
- "Add task: Buy groceries"
- "Create todo: Call mom"
- "添加任务：买菜"
- "任务：打电话给妈妈"

### Add an Expense
Type any of these:
- "Spent $50 on lunch"
- "Expense: $25 coffee"
- "支出50元午餐"
- "花费25元咖啡"

### Create a Calendar Event
Type any of these:
- "Create meeting tomorrow"
- "Add event: Team sync"
- "创建会议明天"
- "添加日程：团队会议"

### Scan Receipt
- Click the camera icon
- Take a photo of a receipt
- The chatbot will detect the amount and category
- Confirm to add the expense

## Enabling Backend API (Optional)

If you want full AI features (natural language understanding, voice transcription), you need to start the backend server:

### Step 1: Start the Next.js Backend
```bash
# In the root directory (not mobile-app)
npm run dev
```

This starts the backend server at `http://localhost:3000`

### Step 2: Update API URL
The mobile app needs to connect to your computer's IP address, not localhost.

1. Find your computer's IP address:
   - **Mac**: System Preferences → Network → Your IP
   - **Windows**: `ipconfig` in Command Prompt
   - **Linux**: `ifconfig` or `ip addr`

2. Update the API URL in `mobile-app/.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3000
```

For example:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

### Step 3: Restart Expo
```bash
cd mobile-app
npx expo start --go --clear
```

### Step 4: Test
Open the chatbot and try:
- Natural language: "I need to buy milk tomorrow"
- Voice input: Click the microphone and speak
- Complex queries: "Schedule a meeting with John next Tuesday at 3pm"

## Features Comparison

| Feature | Offline Mode | With Backend API |
|---------|-------------|------------------|
| Create tasks | ✅ Basic | ✅ Advanced NLU |
| Add expenses | ✅ Basic | ✅ Advanced NLU |
| Calendar events | ✅ Basic | ✅ Advanced NLU |
| Receipt scanning | ✅ Mock data | ✅ Real OCR |
| Voice input | ❌ Disabled | ✅ Whisper API |
| Natural language | ⚠️ Keywords only | ✅ Full AI |
| Multi-language | ✅ Yes | ✅ Yes |

## Examples

### Offline Mode (Current)
```
User: "Add task buy milk"
Bot: "I'll create a task: buy milk"
[Action card appears with confirm/cancel buttons]
```

### With Backend API
```
User: "I need to buy milk tomorrow and also schedule a dentist appointment"
Bot: "I'll help you with that! I've created:
1. A task to buy milk with due date tomorrow
2. A calendar event for your dentist appointment"
[Two action cards appear]
```

## Troubleshooting

### Chatbot not responding
- Check that you're using the right keywords
- Try simpler phrases like "add task: test"
- Make sure the app has restarted after the changes

### Actions not executing
- This should be fixed now with the sync fix
- Make sure you confirmed the action (clicked the checkmark)
- Check the respective screen (Tasks/Expenses/Calendar)

### Want voice input
- You need to start the backend server (see "Enabling Backend API" above)
- Voice transcription uses OpenAI's Whisper API which requires the backend

## Technical Details

### Local Intent Detection
The chatbot uses simple keyword matching:
```typescript
const lowerText = userMessage.toLowerCase();

if (lowerText.includes('task') || lowerText.includes('todo')) {
  // Create task action
} else if (lowerText.includes('expense') || lowerText.includes('$')) {
  // Create expense action
} else if (lowerText.includes('meeting') || lowerText.includes('event')) {
  // Create calendar action
}
```

### Action Execution
Actions are executed through the same services as manual entry:
- `todoService.createTodo()` → Updates Zustand store → Screen updates
- `expenseService.createExpense()` → Updates Zustand store → Screen updates
- `calendarService.createEvent()` → Updates Zustand store → Screen updates

### Why This Works
- No network required for basic functionality
- All data stays local (Zustand + AsyncStorage)
- Same code path as manual entry (reliable)
- Instant feedback (no API latency)

---

**Status**: ✅ WORKING - Offline mode enabled
**Date**: 2026-01-17
**Files Modified**: 1 (FloatingChatbot.tsx)
