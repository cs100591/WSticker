import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'API not configured' }, { status: 500 });
        }

        const { language = 'en' } = await req.json();

        const systemPrompt = language === 'zh'
            ? "You are a wise philosopher. Provide a short, inspirational, and random daily quote in Chinese. Max 20 words. No explanations."
            : "You are a wise philosopher. Provide a short, inspirational, and random daily quote in English. Max 15 words. No explanations.";

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: "Give me a quote." }
            ],
            temperature: 0.9,
            max_tokens: 60,
        });

        const quote = response.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');

        return NextResponse.json({ quote });
    } catch (error) {
        console.error('Quote error:', error);
        return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
    }
}
