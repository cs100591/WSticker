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

const SYSTEM_PROMPT = `你是一个智能语音助手，负责解析用户的语音输入并提取意图。
你精通中文和英文，能够理解各种口语表达。

**重要：语音识别可能会把中文识别成拼音，你需要智能纠正！**
例如：
- "tixing wo mingtian kaihui" → 理解为 "提醒我明天开会"
- "mai niunnai" → 理解为 "买牛奶"
- "chi wufan hua le 50 kuai" → 理解为 "吃午饭花了50块"
- "da che 30 yuan" → 理解为 "打车30元"

用户可能想要：
1. 创建待办 (create_todo) - 例如: "提醒我明天开会", "买牛奶", "remind me to call mom"
2. 记录消费 (create_expense) - 例如: "午饭50块", "打车30元", "coffee $5"

返回 JSON 格式：
{
  "type": "create_todo" | "create_expense" | "unknown",
  "confidence": 0.0-1.0,
  "data": {
    // 待办相关:
    "title": "任务标题（用中文）",
    "priority": "low" | "medium" | "high",
    "dueDate": "YYYY-MM-DD 或 null",
    
    // 消费相关:
    "amount": 数字,
    "category": "food" | "transport" | "shopping" | "entertainment" | "bills" | "health" | "education" | "other",
    "description": "消费描述（用中文）"
  }
}

分类规则：
- food: 吃饭、午饭、晚饭、早餐、外卖、咖啡、奶茶、零食、超市、餐厅
- transport: 打车、滴滴、出租车、地铁、公交、加油、停车
- shopping: 购物、买东西、淘宝、京东、衣服、鞋子
- entertainment: 电影、游戏、KTV、酒吧、娱乐
- bills: 水电费、话费、房租、物业费、网费
- health: 看病、买药、医院、药店
- education: 买书、课程、培训、学习
- other: 其他

优先级规则：
- high: 紧急、重要、马上、立刻、今天必须
- low: 有空、不急、以后、随便
- medium: 默认

日期解析：
- 明天 → 明天日期
- 后天 → 后天日期
- 下周一 → 下周一日期
- 今天 → 今天日期

**关键规则：**
1. 如果输入看起来像拼音，先转换成中文再理解
2. 如果提到金额数字，优先判断为消费记录
3. 如果没有金额，优先判断为待办事项
4. 输出的 title 和 description 用中文

只返回 JSON，不要其他内容。`;

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
