import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLOUD_VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

// Google Cloud Vision API for accurate OCR
async function googleVisionOCR(imageBase64: string): Promise<string> {
  if (!GOOGLE_CLOUD_VISION_API_KEY) {
    throw new Error('Google Cloud Vision API key not configured');
  }

  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Data },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Google Vision API error:', error);
    throw new Error('OCR failed');
  }

  const data = await response.json();
  const text = data.responses?.[0]?.fullTextAnnotation?.text || '';
  return text;
}

// Parse OCR text with DeepSeek
async function parseReceiptText(text: string, language: string): Promise<{
  success: boolean;
  data?: { amount: number; category: string; description: string };
  error?: string;
}> {
  if (!DEEPSEEK_API_KEY) {
    return { success: false, error: 'AI not configured' };
  }

  const isZh = language === 'zh';
  
  const systemPrompt = isZh ? `你是收据解析专家。从OCR文本中提取：
1. 总金额（找"合计"、"总计"、"实付"、"Total"后的数字）
2. 分类（根据商家判断）
3. 描述（商家名称）

返回JSON：
{"success":true,"data":{"amount":数字,"category":"food|transport|shopping|entertainment|bills|health|education|other","description":"描述"}}

分类：food(餐饮)、transport(交通)、shopping(购物)、entertainment(娱乐)、bills(账单)、health(医疗)、education(教育)、other(其他)

只返回JSON。` : `You are a receipt parsing expert. Extract from OCR text:
1. Total amount (find number after "Total", "Amount", "Sum")
2. Category (based on merchant)
3. Description (merchant name)

Return JSON:
{"success":true,"data":{"amount":number,"category":"food|transport|shopping|entertainment|bills|health|education|other","description":"description"}}

Categories: food, transport, shopping, entertainment, bills, health, education, other

Only return JSON.`;

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
        { role: 'user', content: `OCR Text:\n${text}` },
      ],
      temperature: 0.1,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    return { success: false, error: 'Parse failed' };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Parse error
  }

  return { success: false, error: 'Could not parse receipt' };
}

export async function POST(request: NextRequest) {
  try {
    const { image, language = 'en' } = await request.json();
    
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Step 1: OCR with Google Cloud Vision
    let ocrText = '';
    try {
      ocrText = await googleVisionOCR(image);
    } catch (err) {
      console.error('OCR error:', err);
      return NextResponse.json({ 
        success: false, 
        error: language === 'zh' ? '图片识别失败，请手动输入' : 'OCR failed, please enter manually',
        ocrText: '' 
      });
    }

    if (!ocrText.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: language === 'zh' ? '未识别到文字，请手动输入' : 'No text detected, please enter manually',
        ocrText: '' 
      });
    }

    // Step 2: Parse with AI
    const result = await parseReceiptText(ocrText, language);
    
    return NextResponse.json({
      ...result,
      ocrText,
    });
  } catch (error) {
    console.error('OCR scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
