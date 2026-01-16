# Run Preview - Quick Start

## 🚀 Start the App

```bash
cd mobile-app
npx expo start
```

## 📱 Open the App

### Option 1: iOS Simulator (Mac only)
Press `i` in the terminal

### Option 2: Android Emulator
Press `a` in the terminal

### Option 3: Physical Device
1. Install "Expo Go" app from App Store / Play Store
2. Scan the QR code shown in terminal

## 🔑 Login

When the app opens:
1. You'll see the login screen
2. Click **"Skip Login (Dev Only)"** button
3. You'll be taken to the Dashboard

## ✅ What to Check

### Dashboard (Home Tab 🏠)
- [ ] See 4 stat cards
- [ ] See priority tasks list
- [ ] See today's schedule
- [ ] See productivity insight card
- [ ] Pull down to refresh

### Todos Tab (✓)
- [ ] See priority groups (High 🔴, Medium 🟠, Low 🔵)
- [ ] Tap group header to expand/collapse
- [ ] Create a new task at bottom
- [ ] Select priority (High/Medium/Low)
- [ ] Tap 📄 icon to add notes
- [ ] Tap 📅 icon to add to calendar
- [ ] Tap ▼ to expand notes
- [ ] Tap ☑️ to complete task
- [ ] Verify checkbox is on RIGHT side

### Expenses Tab (💰)
- [ ] See monthly spending card
- [ ] See category breakdown (3 columns)
- [ ] See transaction history
- [ ] Transactions grouped by date
- [ ] Tap 🗑️ to delete transaction

### Calendar Tab (📅)
- [ ] See icon-based view selector
- [ ] Tap 📅 for month view
- [ ] Tap 📊 for week view
- [ ] Tap 📄 for day view
- [ ] See event dots on dates
- [ ] See "+X" for multiple events

## 🐛 Troubleshooting

### App won't start
```bash
# Clear cache and restart
npx expo start -c
```

### "Network request failed" errors
This is normal if Supabase is not configured. The app will still work with local data.

### Can't see changes
1. Stop the app (Ctrl+C)
2. Clear cache: `npx expo start -c`
3. Restart

## 📸 Compare with Web App

Open the web app side-by-side to compare:
- Same layout structure
- Same priority grouping
- Same icons and colors
- Same feature placement

## ✨ Key Differences (Mobile-Optimized)

1. **Bottom Navigation** - Easier thumb access
2. **Native Modals** - Better mobile UX
3. **Touch Targets** - 44x44 minimum size
4. **Input at Bottom** - One-handed typing

## 🎯 Success Criteria

You should see:
- ✅ Priority-grouped todos (like web app)
- ✅ Notes and calendar icons (like web app)
- ✅ Checkbox on right (like web app)
- ✅ Monthly spending card (like web app)
- ✅ Category breakdown (like web app)
- ✅ Icon-based view selector (like web app)

**If you see all of these, the update is successful! 🎉**

## 📝 Notes

- The app uses mock data when API is not available
- "Skip Login" is for development only
- All screens are now matching the web app layout
- Theme is optimized for mobile devices

## 🆘 Need Help?

If something doesn't look right:
1. Check the terminal for errors
2. Try clearing cache: `npx expo start -c`
3. Make sure you're on the latest code
4. Check `PREVIEW_WHAT_TO_EXPECT.md` for visual reference

---

**Ready to preview! Run `npx expo start` and enjoy! 🚀**
