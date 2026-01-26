# Home Screen Widget Setup Guide

This guide explains how to finalize the setup for Home Screen widgets on iOS and Android.

## Setup Overview

The app uses **Shared Storage** to send data from the React Native app to the native widgets.
*   **iOS**: Uses App Groups (`NSUserDefaults` via `initWithSuiteName`).
*   **Android**: Uses Shared Preferences (`getSharedPreferences`).

---

## 📅 Android Setup (Already Included)

I have already created the necessary files for Android:
1.  **Layout**: `android/app/src/main/res/layout/widget_daily_summary.xml`
2.  **Provider**: `android/app/src/main/java/com/dailypa/app/DailySummaryWidget.java`
3.  **Config**: `plugins/withWidgets.js` plugin added to `app.json`.

**To test on Android:**
1.  Run `npx expo prebuild --platform android` (if you haven't already).
2.  Run `npx expo run:android`.
3.  Long press on the home screen -> Widgets -> Daily PA -> Drag the widget to the screen.

---

## 🍎 iOS Setup (Manual Steps Required)

Because iOS widgets require a separate "Target" in the Xcode project, you must add this manually.

### 1. Add Widget Target
1.  Run `npx expo prebuild --platform ios` to generate the `ios` folder.
2.  Open `ios/mobileapp.xcworkspace` in **Xcode**.
3.  Go to **File -> New -> Target**.
4.  Search for **Widget Extension**.
5.  Name it: `DailyPAWidget`.
6.  **Uncheck** "Include Live Activity" (unless you want to implement that later).
7.  Click **Finish**.
8.  When asked to "Activate" scheme, click **Activate**.

### 2. Configure App Group
Both the main app and the widget need to share data.
1.  In Xcode, select the **main app target** (`mobile-app`).
2.  Go to **Signing & Capabilities** -> **+ Capability** -> **App Groups**.
3.  Add a new group named: `group.com.dailypa.app` (Must match `APP_GROUP_IDENTIFIER` in `src/services/widgetService.ts`).
4.  Now select the **DailyPAWidgetExtension target**.
5.  Go to **Signing & Capabilities** -> **+ Capability** -> **App Groups**.
6.  Select the **same group** (`group.com.dailypa.app`).

### 3. Add Widget Code (SwiftUI)
Replace the contents of `DailyPAWidget/DailyPAWidget.swift` with the following code:

```swift
import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), nextEvent: "Loading...", taskCount: "0", expenseTotal: "$0.00")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), nextEvent: "Team Standup", taskCount: "5", expenseTotal: "$25.00")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // 1. Read Shared Data
        let sharedDefaults = UserDefaults(suiteName: "group.com.dailypa.app")
        let dataJsonString = sharedDefaults?.string(forKey: "widgetData") ?? "{}"
        
        // 2. Parse JSON
        var nextEvent = "No events"
        var taskCount = "0"
        var expenseTotal = "$0.00"
        
        if let data = dataJsonString.data(using: .utf8) {
            do {
                if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
                    
                    // Parse Calendar
                    if let events = json["calendarEvents"] as? [[String: Any]], let first = events.first {
                        nextEvent = first["title"] as? String ?? "Event"
                    }
                    
                    // Parse Todos
                    if let todos = json["todos"] as? [[String: Any]] {
                        taskCount = "\(todos.count)"
                    }
                    
                    // Parse Expenses
                    if let expenses = json["expenses"] as? [[String: Any]], let first = expenses.first {
                         if let total = first["total"] as? Double {
                             expenseTotal = String(format: "$%.2f", total)
                         }
                    }
                }
            } catch {
                print("JSON Error: \(error)")
            }
        }

        let entry = SimpleEntry(date: Date(), nextEvent: nextEvent, taskCount: taskCount, expenseTotal: expenseTotal)

        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let nextEvent: String
    let taskCount: String
    let expenseTotal: String
}

struct DailyPAWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Daily PA")
                .font(.headline)
                .foregroundColor(.blue)
            
            HStack {
                Text("📅 Next:")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(entry.nextEvent)
                    .font(.caption)
                    .bold()
                    .lineLimit(1)
            }
            
            HStack {
                Text("📝 Tasks:")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text("\(entry.taskCount) active")
                    .font(.caption)
                    .bold()
            }
            
            HStack {
                Text("💰 Spent:")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(entry.expenseTotal)
                    .font(.caption)
                    .bold()
            }
        }
        .padding()
    }
}

@main
struct DailyPAWidget: Widget {
    let kind: String = "DailyPAWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            DailyPAWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Daily Summary")
        .description("View your tasks, schedule, and expenses.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct DailyPAWidget_Previews: PreviewProvider {
    static var previews: some View {
        DailyPAWidgetEntryView(entry: SimpleEntry(date: Date(), nextEvent: "Meeting", taskCount: "3", expenseTotal: "$120"))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
```

### 4. Build and Run
1.  Select the **DailyPAWidgetExtension** scheme up top to test the widget UI in Simulator.
2.  Or select **mobile-app** scheme and run on your device.
3.  Add the widget to your home screen!

---

## 🛠 Troubleshooting

*   **Widget shows empty data?**
    *   Open the main app first.
    *   Add a task or event to trigger a data save.
    *   Wait a few moments for the widget to reload (timeline policy).
*   **Android build fails?**
    *   Ensure `DailySummaryWidget.java` is in the correct package folder (`com.dailypa.app`).
    *   Check `AndroidManifest.xml` (in `android/app/src/main`) to see if the `<receiver>` tag was correctly added by the plugin.
