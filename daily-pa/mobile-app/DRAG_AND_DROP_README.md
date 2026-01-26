# Drag and Drop Implementation for Calendar

I have implemented drag-and-drop functionality for your calendar events across Day, Week, and Month views.

## Features Added

1.  **Month View Drag & Drop**:
    *   You can now long-press any event bar in the Month view.
    *   Drag it to another day cell to reschedule it.
    *   The event will move to the new date while preserving its original time.

2.  **Universal Drag from Agenda List**:
    *   In Day, Week, or List modes, the events in the bottom "Agenda List" are now draggable.
    *   **To Month View**: If you are in Month view, you can drag an event from the list *up* onto the calendar grid to change its date.
    *   **To Week View**: If you are in Week view, you can drag an event from the list *up* onto the week header strip to change its date.

## Technical Details

- **Libraries**: Installed `react-native-gesture-handler` and `react-native-reanimated`.
- **Configuration**: Updated `babel.config.js` to include the Reanimated plugin.
- **Components**:
    - `DraggableEvent`: Handles dragging within the Month grid.
    - `DraggableAgendaItem`: Handles dragging from the list.
    - Updated `CalendarScreen` to manage drop zones and coordinate updates.

## Next Steps

Since native dependencies were added, you must **restart your development server** and potentially **rebuild the native app**:

```bash
# Stop current server (Ctrl+C)
npx expo start --clear
# If running on emulator/device, standard reload might not be enough due to new native code.
# Run with --clear to ensure babel config is picked up.
```

If you see an error about `Reanimated` not being initialized, please rebuild the client (`npx expo run:ios` or `npx expo run:android`).
