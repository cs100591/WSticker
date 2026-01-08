# Todo List 优化文档

## 更新内容

### 1. **Sticky Notes 风格设计** 📝
- 采用便签纸风格的卡片设计
- 每个todo显示为彩色便签
- 轻微旋转效果，更自然的便签感觉
- 悬停时有上浮动画效果

### 2. **颜色分类系统** 🎨
- 6种颜色可选：
  - 🟡 Yellow (黄色) - 默认
  - 🔵 Blue (蓝色)
  - 🟢 Green (绿色)
  - 🩷 Pink (粉色)
  - 🟣 Purple (紫色)
  - 🟠 Orange (橙色)

- 创建todo时可选择颜色
- 颜色过滤器快速筛选
- 每种颜色有独特的背景和边框样式

### 3. **简化的UI设计** ✨
- 移除复杂的统计卡片
- 简洁的顶部统计（活跃/已完成）
- 响应式网格布局（1-4列）
- 更清爽的视觉效果

### 4. **Chatbot 智能跟进** 🤖

#### 待办事项确认后的后续询问：
1. **添加到日历**
   - 用户确认创建todo后
   - Chatbot询问是否添加到日历
   - 一键添加到当天日程

2. **选择颜色**
   - 提供6种颜色选择
   - 点击emoji即可更改todo颜色
   - 实时更新，无需刷新

#### 用户体验流程：
```
用户: "明天开会"
AI: "好的！帮你添加明天的会议，确认吗？📅"
[用户点击确认✓]
AI: "✓ 待办已创建！要添加到日历吗？选择一个颜色吧 🎨"
[显示颜色选择器和日历按钮]
```

### 5. **数据库更新** 💾
- 添加 `color` 字段到 `todos` 表
- 支持6种颜色值
- 默认值为 'yellow'
- 迁移文件：`20260108100000_add_todo_color.sql`

### 6. **类型系统更新** 📘
- 新增 `TodoColor` 类型
- 更新 `Todo` 接口包含 `color` 字段
- 更新 `CreateTodoInput` 支持颜色选择
- 更新数据库类型定义

---

## 使用指南

### 创建带颜色的Todo

**在Todo页面：**
1. 输入todo标题
2. 点击下方的颜色emoji选择颜色
3. 点击 + 按钮创建

**通过Chatbot：**
1. 对AI说："明天开会"
2. 确认创建
3. 选择喜欢的颜色
4. 可选：添加到日历

### 颜色过滤

1. 在todo页面顶部
2. 点击 "All Colors" 查看所有
3. 或点击特定颜色圆点只看该颜色的todos

### Sticky Notes 视图

- 自动网格布局
- 手机：1列
- 平板：2列
- 桌面：3-4列
- 每个便签略微旋转，更自然

---

## 技术实现

### 前端组件
- `src/app/(dashboard)/todos/page.tsx` - 主页面
- `src/components/chat/AIChatbot.tsx` - 聊天机器人

### 后端API
- `POST /api/todos` - 创建todo（支持color参数）
- `PATCH /api/todos/[id]` - 更新todo颜色

### 数据库
```sql
ALTER TABLE public.todos 
ADD COLUMN color VARCHAR(20) DEFAULT 'yellow' 
CHECK (color IN ('yellow', 'blue', 'green', 'pink', 'purple', 'orange'));
```

### 类型定义
```typescript
export type TodoColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export interface Todo {
  // ... other fields
  color: TodoColor;
}
```

---

## 下一步计划

### 可能的增强功能：
1. **拖拽排序** - 允许用户拖拽重新排列todos
2. **颜色主题** - 自定义颜色方案
3. **标签系统** - 除了颜色外的额外分类
4. **优先级可视化** - 在便签上显示优先级标记
5. **批量操作** - 批量更改颜色或状态
6. **导出功能** - 导出为图片或PDF

---

## 注意事项

### 数据库迁移
运行迁移前请确保：
1. 备份现有数据
2. 在Supabase Dashboard中运行迁移SQL
3. 或使用Supabase CLI: `supabase db push`

### 兼容性
- 现有todos会自动获得默认颜色（yellow）
- 不影响现有功能
- 向后兼容

---

## 截图示例

### Sticky Notes 视图
```
🟡 [✓] 买菜        🔵 [ ] 开会
   [🗑️]               [🗑️]

🟢 [ ] 健身        🩷 [✓] 读书
   [🗑️]               [🗑️]
```

### Chatbot 跟进
```
用户: 明天开会
AI: 好的！帮你添加明天的会议，确认吗？📅
    [✓ 开会 · 09:00]  [✓] [✗]

AI: ✓ 待办已创建！要添加到日历吗？选择一个颜色吧 🎨
    [选择颜色]
    🟡 🔵 🟢 🩷 🟣 🟠
    
    [📅 添加到日历] [跳过]
```

---

**更新时间**: 2026-01-08
**版本**: 1.0.0
