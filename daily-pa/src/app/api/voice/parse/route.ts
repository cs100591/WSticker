import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

type IntentType = 'create_todo' | 'create_expense' | 'unknown';

interface ParsedIntent {
  type: IntentType;
  confidence: number;
  data: {
    title?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    amount?: number;
    category?: string;
    description?: string;
  };
  originalText: string;
}

const SYSTEM_PROMPT_EN = `You are a smart assistant that parses voice input and extracts user intent.

The user may want to:
1. Create a todo (create_todo) - Examples: "remind me to buy milk", "add task meeting tomorrow", "call mom"
2. Record an expense (create_expense) - Examples: "spent $30 on lunch", "taxi cost $15", "coffee $5"

Return JSON format:
{
  "type": "create_todo" | "create_expense" | "unknown",
  "confidence": 0.0-1.0,
  "data": {
    "title": "task title",
    "priority": "low" | "medium" | "high",
    "dueDate": "YYYY-MM-DD or null",
    "amount": number,
    "category": "food" | "transport" | "shopping" | "entertainment" | "bills" | "health" | "education" | "other",
    "description": "expense description"
  }
}

Category rules:
- food: lunch, dinner, coffee, groceries, restaurant
- transport: taxi, uber, gas, parking, bus
- shopping: store, amazon, clothes, electronics
- entertainment: movie, game, netflix, concert
- bills: rent, utilities, phone, internet
- health: doctor, medicine, pharmacy
- education: books, course, training
- other: anything else

Priority rules:
- high: urgent, important, asap, today
- low: when free, not urgent, sometime
- medium: default

Date parsing:
- tomorrow → tomorrow's date
- next Monday → next Monday's date
- today → today's date

IMPORTANT: If input mentions money/cost/spent, it's an expense. Otherwise, it's a todo.
Only return JSON.`;

const SYSTEM_PROMPT_ZH = `你是一个智能语音助手，负责解析用户的语音输入并提取意图。

用户可能想要：
1. 创建待办 (create_todo) - 例如: "提醒我明天开会", "买牛奶", "打电话给妈妈"
2. 记录消费 (create_expense) - 例如: "午饭50块", "打车30元", "咖啡15块"

返回 JSON 格式：
{
  "type": "create_todo" | "create_expense" | "unknown",
  "confidence": 0.0-1.0,
  "data": {
    "title": "任务标题",
    "priority": "low" | "medium" | "high",
    "dueDate": "YYYY-MM-DD 或 null",
    "amount": 数字,
    "category": "food" | "transport" | "shopping" | "entertainment" | "bills" | "health" | "education" | "other",
    "description": "消费描述"
  }
}

分类规则：
- food: 吃饭、午饭、晚饭、咖啡、奶茶、外卖、超市
- transport: 打车、滴滴、地铁、公交、加油、停车
- shopping: 购物、淘宝、京东、衣服、鞋子
- entertainment: 电影、游戏、KTV、娱乐
- bills: 水电费、话费、房租、物业费
- health: 看病、买药、医院
- education: 买书、课程、培训
- other: 其他

优先级规则：
- high: 紧急、重要、马上、今天
- low: 有空、不急、以后
- medium: 默认

日期解析：
- 明天 → 明天日期
- 后天 → 后天日期
- 下周一 → 下周一日期

重要：如果提到金额/花了/块/元，就是消费记录。否则是待办事项。
只返回 JSON。`;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
    }

    const { text, language } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const isZh = language === 'zh';
    const systemPrompt = isZh ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN;

    const today = new Date();
    const dateContext = isZh 
      ? `今天是 ${today.toISOString().split('T')[0]}（${today.toLocaleDateString('zh-CN', { weekday: 'long' })}）。`
      : `Today is ${today.toISOString().split('T')[0]} (${today.toLocaleDateString('en-US', { weekday: 'long' })}).`;

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
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

    let parsed: ParsedIntent;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
        parsed.originalText = text;
      } else {
        throw new Error('No JSON found');
      }
    } catch {
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
