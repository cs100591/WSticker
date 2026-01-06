import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

const SYSTEM_PROMPT = `你是一个收据解析助手。从OCR识别的收据文本中提取消费信息。

分析文本并提取：
1. 总金额（查找 "Total", "合计", "总计", "实付", "应付", "￥", "$" 等）
2. 根据商家/商品判断分类
3. 描述（商家名称或主要商品）

返回 JSON 格式：
{
  "success": true,
  "data": {
    "amount": 数字,
    "category": "food" | "transport" | "shopping" | "entertainment" | "bills" | "health" | "education" | "other",
    "description": "商家或商品描述"
  }
}

如果无法解析，返回：
{
  "success": false,
  "error": "原因"
}

分类规则：
- food: 餐厅、咖啡、超市、外卖、饮料、食品
- transport: 出租车、滴滴、加油站、停车、地铁、公交
- shopping: 零售店、网购、服装、电子产品
- entertainment: 电影、游戏、KTV、酒吧
- bills: 水电费、话费、房租、物业
- health: 药店、医院、诊所
- education: 书店、培训、课程
- other: 其他

金额提取规则：
- 优先找 "实付"、"应付"、"合计"、"总计" 后面的数字
- 注意中文金额格式如 "￥15.00" 或 "15元"
- 英文格式如 "$15.00" 或 "15.00"

只返回 JSON，不要其他内容。`;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 用 DeepSeek 解析 OCR 文本
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
          { role: 'user', content: `解析这段收据OCR文本：\n\n${text}` },
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
      // 尝试提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
      return NextResponse.json({
        success: false,
        error: 'Failed to parse response',
      });
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse response',
      });
    }
  } catch (error) {
    console.error('OCR parse error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
