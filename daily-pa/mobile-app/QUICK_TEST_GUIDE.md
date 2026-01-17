# Quick Test Guide - AI Chatbot

## 🚀 READY TO TEST!

Everything is configured and running. Just reload the app!

---

## Step 1: Reload the App ⚡

### On Your Phone (Expo Go):
1. **Shake your device** 📱
2. Tap **"Reload"**
3. Wait 5 seconds for app to restart

---

## Step 2: Open the Chatbot 💬

1. Look for the **floating AI button** (bottom right)
2. Tap it to open the chatbot
3. You should see a new welcome message:

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

**✅ If you see "🔌 Offline Mode" → SUCCESS! The fix is working!**

---

## Step 3: Test Basic Commands 🧪

### Test 1: Create a Task
**Type:** `add task buy milk`

**Expected:**
- Action card appears with "Buy milk"
- Click ✓ (checkmark) to confirm
- Go to Tasks screen → See "Buy milk" in the list

### Test 2: Add an Expense
**Type:** `spent $20 on lunch`

**Expected:**
- Action card appears with "$20 • other"
- You can change category (food, transport, etc.)
- Click ✓ to confirm
- Go to Expenses screen → See the $20 expense

### Test 3: Create a Calendar Event
**Type:** `create meeting tomorrow`

**Expected:**
- Action card appears with "Meeting"
- You can pick date and time
- Click ✓ to confirm
- Go to Calendar screen → See the meeting

---

## Step 4: Test Advanced Features (Optional) 🎯

### Voice Input 🎤
1. Click the **microphone icon**
2. Speak: "Add task buy groceries"
3. Wait for transcription
4. Action card should appear

**Note:** Voice requires backend server (already running!)

### Receipt Scanning 📷
1. Click the **camera icon**
2. Take a photo of any receipt
3. Wait for processing
4. Expense action card appears

**Note:** Currently uses mock OCR (random amount/category)

### Natural Language (Backend AI) 🤖
**Type:** `Tomorrow I have a meeting at 9am and lunch at 12pm`

**Expected:**
- AI creates 2 separate calendar events
- One at 9am, one at 12pm
- Both for tomorrow

---

## Troubleshooting 🔧

### ❌ Still seeing "Network request failed"?
**Solution:** The offline mode should handle this!
- After reload, you should see action cards even without backend
- Check that welcome message shows "🔌 Offline Mode"

### ❌ Voice input not working?
**Possible causes:**
1. **Phone can't reach backend**
   - Test: Open `http://192.168.100.111:3000` in phone browser
   - Should see the web app
   - If not, check WiFi (same network as computer)

2. **Microphone permission**
   - Settings → Expo Go → Allow Microphone

### ❌ Actions not executing?
**Check:**
- Did you click the ✓ (checkmark) button?
- Go to the respective screen (Tasks/Expenses/Calendar)
- Items should appear immediately after confirmation

### ❌ Chatbot not responding?
**Try:**
1. Use simple keywords: "add task test"
2. Check welcome message
3. Restart app if needed

---

## What to Expect 🎉

### Offline Mode (Always Works)
- ✅ Keyword detection
- ✅ Basic task/expense/event creation
- ✅ Action cards with pickers
- ✅ No network errors
- ⚠️ No natural language understanding
- ⚠️ No voice transcription

### With Backend (Advanced)
- ✅ Everything from offline mode
- ✅ Natural language understanding
- ✅ Voice transcription (Whisper API)
- ✅ Multi-action support
- ✅ Conflict detection
- ✅ Smart date/time parsing

---

## Quick Commands Reference 📝

### English
```
add task buy milk
create todo call mom
spent $50 on lunch
expense $25 coffee
create meeting tomorrow
schedule event next week
```

### Chinese
```
添加任务买菜
创建待办打电话
支出50元午餐
花费25元咖啡
创建会议明天
安排日程下周
```

---

## Status Check ✅

Before testing, verify:

- [x] Backend server running (http://localhost:3000)
- [x] Expo server running (mobile-app)
- [x] Offline mode code saved
- [x] API URL configured (192.168.100.111:3000)
- [x] Environment variables set
- [ ] **App reloaded** ← YOU NEED TO DO THIS!

---

## Next Steps

1. **Reload the app** (shake → Reload)
2. **Test basic commands** (add task, spent $20, create meeting)
3. **Verify items appear** in respective screens
4. **Report back** if you see any issues!

---

**Status**: ✅ READY
**Date**: 2026-01-17
**Action Required**: Reload the app on your phone

