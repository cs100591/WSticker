import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

// 意图类型
type IntentType = 'create_todo' | 'create_expense' | 'unknown';

interface ParsedIntent {
  type: IntentType;
  confidence: number;
  data: {
    // Todo 相关
    title?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    // Expense 相关
    amount?: number;
    category?: string;
    description?: string;
  };
  originalText: string;
}

const SYSTEM_PROMPT = `You are a smart assistant that parses voice input and extracts user intent.
You understand both Chinese (中文) and English.

The user may want to:
1. Create a todo (create_todo) - Examples: "提醒我明天开会", "remind me to buy milk", "添加任务买牛奶", "add task meeting tomorrow"
2. Record an expense (create_expense) - Examples: "花了50块吃午饭", "spent $30 on lunch", "打车花了30元", "taxi cost 15 dollars"

Analyze the user input and return JSON format:
{
  "type": "create_todo" | "create_expense" | "unknown",
  "confidence": 0.0-1.0,
  "data": {
    // For create_todo:
    "title": "task title (in the same language as input)",
    "priority": "low" | "medium" | "high",
    "dueDate": "YYYY-MM-DD or null",
    
    // For create_expense:
    "amount": number,
    "category": "food" | "transport" | "shopping" | "entertainment" | "bills" | "health" | "education" | "other",
    "description": "expense description (in the same language as input)"
  }
}

Category rules:
- food: 餐饮、吃饭、外卖、咖啡、lunch, dinner, coffee, food
- transport: 打车、地铁、公交、加油、taxi, uber, bus, gas
- shopping: 购物、买东西、超市、shopping, store, amazon
- entertainment: 电影、游戏、娱乐、movie, game, netflix
- bills: 水电费、话费、房租、rent, utilities, phone bill
- health: 医疗、药品、看病、doctor, medicine, pharmacy
- education: 书籍、课程、培训、books, course, training
- other: 其他、other

Priority rules:
- high: 紧急、重要、马上、urgent, important, asap
- low: 有空、不急、when free, not urgent
- medium: default

Date parsing:
- 明天/tomorrow → tomorrow's date
- 后天/day after tomorrow → date + 2 days
- 下周一/next Monday → next Monday's date
- 今天/today → today's date

IMPORTANT: Keep the title/description in the SAME LANGUAGE as the user's input.
Only return JSON, no other text.`;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
    }

    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 添加当前日期信息帮助解析相对日期
    const today = new Date();
    const dateContext = `Today is ${today.toISOString().split('T')[0]} (${today.toLocaleDateString('en-US', { weekday: 'long' })}).`;

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `${dateContext}\n\nUser input: ${text}` },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek API error:', error);
      return NextResponse.json({ error: 'Failed to parse intent' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // 解析 JSON 响应
    let parsed: ParsedIntent;
    try {
      parsed = JSON.parse(content);
      parsed.originalText = text;
    } catch {
      // 如果解析失败，返回 unknown
      parsed = {
        type: 'unknown',
        confidence: 0,
        data: {},
        originalText: text,
      };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error in POST /api/voice/parse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
