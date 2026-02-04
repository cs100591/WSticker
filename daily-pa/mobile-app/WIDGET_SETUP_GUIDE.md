# iOS Widget Extension 配置指南

由于 iOS Widget 需要使用 SwiftUI 并在 Xcode 中配置，请按照以下步骤操作：

## 步骤 1: 在 Xcode 中添加 Widget Extension

1. 打开 `ios/DailyPA.xcworkspace`
2. 点击项目 → File → New → Target
3. 选择 "Widget Extension"
4. 命名为 "DailyPAWidget"
5. 确保勾选 "Include Configuration Intent"

## 步骤 2: 配置 App Groups

1. 在项目设置中，选择主 Target 和 Widget Target
2. 启用 "App Groups" Capability
3. 添加相同的 App Group: `group.com.dailypa.app.cssee`

## 步骤 3: 替换 Widget 代码

创建以下 Swift 文件：

### DailyPAWidget.swift
```swift
import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), todos: [], events: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = loadWidgetData()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = loadWidgetData()
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
    
    func loadWidgetData() -> SimpleEntry {
        let sharedDefaults = UserDefaults(suiteName: "group.com.dailypa.app.cssee")
        if let data = sharedDefaults?.data(forKey: "widgetData"),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            let todos = json["todos"] as? [[String: Any]] ?? []
            let events = json["calendarEvents"] as? [[String: Any]] ?? []
            return SimpleEntry(date: Date(), todos: todos, events: events)
        }
        return SimpleEntry(date: Date(), todos: [], events: [])
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let todos: [[String: Any]]
    let events: [[String: Any]]
}

// Today Schedule Widget View
struct TodayScheduleWidgetView: View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("🗓️ TODAY")
                    .font(.caption)
                    .fontWeight(.bold)
                Spacer()
                Text("\(entry.events.count) events")
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            
            ForEach(entry.events.prefix(3).indices, id: \.self) { index in
                let event = entry.events[index]
                HStack {
                    Text(event["startTime"] as? String ?? "")
                        .font(.caption2)
                        .foregroundColor(.gray)
                    Text(event["title"] as? String ?? "")
                        .font(.caption)
                        .lineLimit(1)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

// Tasks Widget View
struct TasksWidgetView: View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("✅ TASKS")
                    .font(.caption)
                    .fontWeight(.bold)
                Spacer()
                Text("\(entry.todos.count)")
                    .font(.caption2)
                    .foregroundColor(.green)
            }
            
            ForEach(entry.todos.prefix(4).indices, id: \.self) { index in
                let todo = entry.todos[index]
                HStack {
                    Image(systemName: todo["status"] as? String == "completed" ? "checkmark.square.fill" : "square")
                        .foregroundColor(todo["status"] as? String == "completed" ? .green : .gray)
                    Text(todo["title"] as? String ?? "")
                        .font(.caption)
                        .lineLimit(1)
                    Spacer()
                    Circle()
                        .fill(priorityColor(todo["priority"] as? String ?? "medium"))
                        .frame(width: 6, height: 6)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    func priorityColor(_ priority: String) -> Color {
        switch priority {
        case "high": return .red
        case "medium": return .orange
        default: return .blue
        }
    }
}

// Combined Widget View
struct CombinedWidgetView: View {
    var entry: Provider.Entry
    
    var body: some View {
        HStack(spacing: 12) {
            // Schedule Column
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("🗓️")
                    Text("Schedule")
                        .font(.caption2)
                    Text("\(entry.events.count)")
                        .font(.caption2)
                        .foregroundColor(.blue)
                }
                
                ForEach(entry.events.prefix(3).indices, id: \.self) { index in
                    let event = entry.events[index]
                    VStack(alignment: .leading, spacing: 2) {
                        Text(formatTime(event["startTime"] as? String ?? ""))
                            .font(.caption2)
                            .foregroundColor(.gray)
                        Text(event["title"] as? String ?? "")
                            .font(.caption)
                            .lineLimit(1)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            
            Divider()
            
            // Tasks Column
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("✅")
                    Text("Tasks")
                        .font(.caption2)
                    Text("\(entry.todos.count)")
                        .font(.caption2)
                        .foregroundColor(.green)
                }
                
                ForEach(entry.todos.prefix(3).indices, id: \.self) { index in
                    let todo = entry.todos[index]
                    HStack {
                        Image(systemName: todo["status"] as? String == "completed" ? "checkmark.square.fill" : "square")
                            .font(.caption2)
                        Text(todo["title"] as? String ?? "")
                            .font(.caption)
                            .lineLimit(1)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    func formatTime(_ isoString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        if let date = formatter.date(from: isoString) {
            formatter.dateFormat = "h:mm a"
            return formatter.string(from: date)
        }
        return ""
    }
}

// Widget Configuration
@main
struct DailyPAWidgets: WidgetBundle {
    var body: some Widget {
        TodayScheduleWidget()
        TasksWidget()
        CombinedWidget()
    }
}

struct TodayScheduleWidget: Widget {
    let kind: String = "TodayScheduleWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            TodayScheduleWidgetView(entry: entry)
        }
        .configurationDisplayName("Today's Schedule")
        .description("View today's schedule at a glance")
        .supportedFamilies([.systemMedium])
    }
}

struct TasksWidget: Widget {
    let kind: String = "TasksWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            TasksWidgetView(entry: entry)
        }
        .configurationDisplayName("Tasks")
        .description("Track your tasks and completion rate")
        .supportedFamilies([.systemMedium])
    }
}

struct CombinedWidget: Widget {
    let kind: String = "CombinedWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            CombinedWidgetView(entry: entry)
        }
        .configurationDisplayName("Today's Plan")
        .description("See today's schedule and tasks together")
        .supportedFamilies([.systemLarge])
    }
}
```

## 步骤 4: 构建并运行

1. 在 Xcode 中选择 Widget Extension Scheme
2. 构建运行到设备
3. 长按主屏幕 → 添加 Widget
4. 选择 Daily PA Widgets

## 注意事项

- Widget 数据通过 App Groups 共享
- 当 App 数据更新时，需要调用 WidgetCenter.shared.reloadAllTimelines() 刷新
- 目前 React Native 代码已保存数据到 SharedGroupPreferences
