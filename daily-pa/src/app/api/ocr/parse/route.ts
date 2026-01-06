import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

const SYSTEM_PROMPT = `You are an OCR assistant that extracts expense information from receipt images.

Analyze the image and extract:
1. Total amount (look for "Total", "合计", "总计", "Amount Due")
2. Category based on merchant/items
3. Description (merchant name or main items)
4. Date if visible

Return JSON format:
{
  "success": true,
  "data": {
    "amount": number,
    "category": "food" | "transport" | "shopping" | "entertainment" | "bills" | "health" | "education" | "other",
    "description": "merchant or item description",
    "date": "YYYY-MM-DD or null"
  }
}

If cannot parse, return:
{
  "success": false,
  "error": "reason"
}

Category rules:
- food: restaurants, cafes, groceries, 餐厅, 超市, 外卖
- transport: taxi, uber, gas station, parking, 打车, 加油
- shopping: retail stores, online shopping, 购物
- entertainment: movies, games, 娱乐
- bills: utilities, phone, rent, 水电费
- health: pharmacy, hospital, 医院, 药店
- education: books, courses, 书店, 培训
- other: anything else

Only return JSON.`;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { image } = await request.json();
    
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // DeepSeek 目前不支持图片，使用文字描述方式
    // 实际生产环境应该用支持视觉的 API（如 GPT-4V, Claude 3）
    // 这里我们用一个简化方案：让用户描述收据内容
    
    // 检查是否是 base64 图片
    if (image.startsWith('data:image')) {
      // 由于 DeepSeek 不支持图片，返回提示让用户手动输入
      return NextResponse.json({
        success: false,
        needManualInput: true,
        message: 'Please enter the receipt details manually',
        suggestedFields: {
          amount: null,
          category: 'other',
          description: '',
        }
      });
    }

    // 如果是文字描述，用 DeepSeek 解析
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
          { role: 'user', content: `Parse this receipt description: ${image}` },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to parse' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No response' }, { status: 500 });
    }

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse response',
      });
    }
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
