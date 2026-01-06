import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

const SYSTEM_PROMPT = `你是一个收据解析专家。从OCR识别的收据文本中提取消费信息。

**注意：OCR识别可能不完美，文字可能有错误或乱码，你需要智能理解！**

分析文本并提取：
1. 总金额 - 查找关键词：
   - 中文：合计、总计、实付、应付、总额、金额、￥、元
   - 英文：Total, Amount, Sum, $, USD
   - 数字格式：15.00, 15元, ￥15, $15

2. 根据商家/商品判断分类

3. 描述 - 商家名称或主要商品

返回 JSON 格式：
{
  "success": true,
  "data": {
    "amount": 数字（不带货币符号）,
    "category": "food" | "transport" | "shopping" | "entertainment" | "bills" | "health" | "education" | "other",
    "description": "商家或商品描述（简短）"
  }
}

如果无法解析，返回：
{
  "success": false,
  "error": "原因"
}

分类规则（根据商家名或商品判断）：
- food: 餐厅、咖啡店、奶茶店、超市、便利店、外卖、麦当劳、肯德基、星巴克、瑞幸、美团、饿了么
- transport: 滴滴、出租车、加油站、停车场、地铁、公交、高铁、机票
- shopping: 淘宝、京东、拼多多、商场、服装店、电器店、苹果店
- entertainment: 电影院、KTV、游戏、网吧、酒吧
- bills: 电费、水费、燃气费、话费、宽带、物业
- health: 医院、药店、诊所、体检
- education: 书店、培训机构、学校、课程
- other: 无法判断的其他消费

金额提取优先级：
1. "实付"、"应付" 后面的数字（最终支付金额）
2. "合计"、"总计"、"Total" 后面的数字
3. 最大的金额数字
4. 任何看起来像金额的数字

**重要：即使OCR文字有错误，也要尽力理解并提取信息！**

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
