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

const SYSTEM_PROMPT = `你是一个智能助手，负责解析用户的语音输入并提取意图。

用户可能想要：
1. 创建待办事项 (create_todo) - 例如："提醒我明天开会"、"添加任务买牛奶"
2. 记录消费 (create_expense) - 例如："花了50块吃午饭"、"打车花了30元"

请分析用户输入，返回 JSON 格式：
{
  "type": "create_todo" | "create_expense" | "unknown",
  "confidence": 0.0-1.0,
  "data": {
    // 如果是 create_todo:
    "title": "任务标题",
    "priority": "low" | "medium" | "high",
    "dueDate": "YYYY-MM-DD 或 null",
    
    // 如果是 create_expense:
    "amount": 数字,
    "category": "food" | "transport" | "shopping" | "entertainment" | "bills" | "health" | "education" | "other",
    "description": "消费描述"
  }
}

分类规则：
- food: 餐饮、吃饭、外卖、咖啡、饮料
- transport: 打车、地铁、公交、加油、停车
- shopping: 购物、买东西、超市
- entertainment: 电影、游戏、娱乐
- bills: 水电费、话费、房租
- health: 医疗、药品、看病
- education: 书籍、课程、培训
- other: 其他

优先级规则：
- high: 包含"紧急"、"重要"、"马上"等词
- low: 包含"有空"、"不急"等词
- medium: 默认

只返回 JSON，不要其他文字。`;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
    }

    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

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
          { role: 'user', content: text },
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
