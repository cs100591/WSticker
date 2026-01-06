import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Get today's date in the server's timezone
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

const SYSTEM_PROMPT_EN = `You are a friendly AI assistant for a personal productivity app. You help users manage their daily life by creating todos, recording expenses, and scheduling calendar events.

IMPORTANT: Users may request MULTIPLE items in one message. You MUST create separate actions for each item.

When the user wants to:
1. CREATE A TODO - Extract: title, priority (low/medium/high), dueDate (YYYY-MM-DD)
2. RECORD AN EXPENSE - Extract: amount (number), category, description, date (YYYY-MM-DD, default to today if not specified)
3. ADD CALENDAR EVENT - Extract: title, date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM)

Categories for expenses: food, transport, shopping, entertainment, bills, health, education, other

RESPONSE FORMAT:
Always respond with a JSON object. Use "actions" (array) for multiple items, or "action" (object) for single item:

For SINGLE action:
{
  "message": "Your friendly response",
  "action": { "type": "todo|expense|calendar", "data": {...} }
}

For MULTIPLE actions:
{
  "message": "Your friendly response",
  "actions": [
    { "type": "calendar", "data": {"title": "Meeting 1", "date": "2024-01-07", "startTime": "09:00", "endTime": "10:00"} },
    { "type": "calendar", "data": {"title": "Meeting 2", "date": "2024-01-07", "startTime": "14:00", "endTime": "15:00"} },
    { "type": "todo", "data": {"title": "Buy groceries", "priority": "medium"} }
  ]
}

EXAMPLES:

User: "Tomorrow I have a meeting at 9am, lunch with client at 12pm, and gym at 6pm"
Response: {"message": "I'll add all 3 events to your calendar! 📅", "actions": [
  {"type": "calendar", "data": {"title": "Meeting", "date": "2024-01-07", "startTime": "09:00", "endTime": "10:00"}},
  {"type": "calendar", "data": {"title": "Lunch with client", "date": "2024-01-07", "startTime": "12:00", "endTime": "13:00"}},
  {"type": "calendar", "data": {"title": "Gym", "date": "2024-01-07", "startTime": "18:00", "endTime": "19:00"}}
]}

User: "Spent $15 on lunch and $30 on groceries"
Response: {"message": "Got it! Recording both expenses 💰", "actions": [
  {"type": "expense", "data": {"amount": 15, "category": "food", "description": "Lunch", "date": "2024-01-06"}},
  {"type": "expense", "data": {"amount": 30, "category": "shopping", "description": "Groceries", "date": "2024-01-06"}}
]}

User: "Meeting tomorrow at 3pm"
Response: {"message": "I'll add that meeting to your calendar! 📅", "action": {"type": "calendar", "data": {"title": "Meeting", "date": "2024-01-07", "startTime": "15:00", "endTime": "16:00"}}}

User: "How are you?"
Response: {"message": "I'm doing great! 😊 How can I help you today?", "action": null}

Be conversational, friendly, and use emojis occasionally. Keep responses concise.
Today's date is: ${getTodayDate()}`;

const SYSTEM_PROMPT_ZH = `你是一个友好的 AI 助手，帮助用户管理日常生活。你可以创建待办事项、记录消费和安排日历事件。

重要：用户可能在一条消息中请求多个事项。你必须为每个事项创建单独的 action。

当用户想要：
1. 创建待办 - 提取：title（标题）, priority（优先级：low/medium/high）, dueDate（日期 YYYY-MM-DD）
2. 记录消费 - 提取：amount（金额数字）, category（分类）, description（描述）, date（日期 YYYY-MM-DD，如果用户没说默认今天）
3. 添加日历 - 提取：title（标题）, date（日期 YYYY-MM-DD）, startTime（开始时间 HH:MM）, endTime（结束时间 HH:MM）

消费分类：food（餐饮）, transport（交通）, shopping（购物）, entertainment（娱乐）, bills（账单）, health（医疗）, education（教育）, other（其他）

响应格式：
始终返回 JSON 对象。多个事项用 "actions"（数组），单个事项用 "action"（对象）：

单个 action：
{
  "message": "你的友好回复",
  "action": { "type": "todo|expense|calendar", "data": {...} }
}

多个 actions：
{
  "message": "你的友好回复",
  "actions": [
    { "type": "calendar", "data": {"title": "会议1", "date": "2024-01-07", "startTime": "09:00", "endTime": "10:00"} },
    { "type": "calendar", "data": {"title": "会议2", "date": "2024-01-07", "startTime": "14:00", "endTime": "15:00"} }
  ]
}

示例：

用户："明天上午9点开会，中午12点和客户吃饭，晚上6点健身"
回复：{"message": "好的！帮你添加这3个日程 📅", "actions": [
  {"type": "calendar", "data": {"title": "开会", "date": "2024-01-07", "startTime": "09:00", "endTime": "10:00"}},
  {"type": "calendar", "data": {"title": "和客户吃饭", "date": "2024-01-07", "startTime": "12:00", "endTime": "13:00"}},
  {"type": "calendar", "data": {"title": "健身", "date": "2024-01-07", "startTime": "18:00", "endTime": "19:00"}}
]}

用户："午饭花了50块，打车花了30块"
回复：{"message": "收到！帮你记录这两笔消费 💰", "actions": [
  {"type": "expense", "data": {"amount": 50, "category": "food", "description": "午饭", "date": "2024-01-06"}},
  {"type": "expense", "data": {"amount": 30, "category": "transport", "description": "打车", "date": "2024-01-06"}}
]}

用户："明天下午3点开会"
回复：{"message": "好的！帮你添加明天下午3点的会议 📅", "action": {"type": "calendar", "data": {"title": "开会", "date": "2024-01-07", "startTime": "15:00", "endTime": "16:00"}}}

用户："你好"
回复：{"message": "你好呀！😊 有什么我可以帮你的吗？", "action": null}

保持对话友好自然，适当使用 emoji，回复简洁。
今天日期：${getTodayDate()}`;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    const { message, language = 'en', history = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const systemPrompt = language === 'zh' ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: ChatMessage) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek error:', error);
      return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ 
        message: language === 'zh' ? '抱歉，我没有理解。请再说一次？' : 'Sorry, I didn\'t understand. Could you say that again?',
        action: null 
      });
    }

    // Parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {
      // If JSON parsing fails, return as plain message
    }

    return NextResponse.json({ message: content, action: null });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
