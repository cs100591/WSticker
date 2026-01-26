import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        // 1. Authorization Check - Allow both authenticated users and guests
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
        }

        // Extract token and determine if user is guest or authenticated
        const token = authHeader.replace('Bearer ', '');
        const isGuest = token === 'guest-user';

        // Log for monitoring (optional)
        console.log(`Transcription request from: ${isGuest ? 'guest user' : 'authenticated user'}`);

        // 2. Validate Configuration
        if (!process.env.OPENAI_API_KEY) {
            console.error('Missing OPENAI_API_KEY');
            return NextResponse.json({ error: 'Server configuration error: Missing OpenAI API Key' }, { status: 500 });
        }

        // 3. Parse Request Body
        const { audio, language, targetLanguage } = await req.json();

        if (!audio) {
            return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
        }

        console.log('Received audio data, length:', audio.length);
        console.log('Language:', language, 'Target:', targetLanguage);

        // 4. Convert Base64 to Buffer
        const buffer = Buffer.from(audio, 'base64');
        console.log('Audio buffer size:', buffer.length);

        // 5. Dynamic import OpenAI (fixes Vercel build issue)
        const { default: OpenAI, toFile } = await import('openai');

        // 6. Initialize OpenAI client
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('Initializing OpenAI with Key:', apiKey ? `${apiKey.substring(0, 5)}...` : 'MISSING');

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        // 7. Create a File object for the OpenAI SDK
        // Use toFile helper for better compatibility
        const file = await toFile(buffer, 'audio.m4a', { type: 'audio/m4a' });

        // 7. Call Whisper API
        console.log('Calling Whisper API...');
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: language, // Hint improves accuracy if known
        });

        console.log('Transcription successful:', transcription.text);
        let finalText = transcription.text;

        // 8. Translate if needed
        if (targetLanguage && targetLanguage !== language && finalText) {
            console.log(`Translating to ${targetLanguage}...`);
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: `You are a professional translator. Translate the following text into ${targetLanguage}. Maintain the tone and context. Output ONLY the translated text.` },
                    { role: "user", content: finalText }
                ],
            });

            const translated = completion.choices[0]?.message?.content;
            if (translated) {
                console.log('Translation successful');
                finalText = translated; // You might want to return both, but for now replacing as per 'Notes' usually implies the result.
                // Or maybe append? "Original: ... \n\nTranslated: ..."
                // The user request was "user able to choose input language and output language", implying they want the output.
                // Let's return just the output or maybe structured?
                // The mobile app expects { text: string }.
                // I will return the translated text as 'text'.
            }
        }

        return NextResponse.json({ text: finalText, original: transcription.text });

    } catch (error: any) {
        console.error('Transcription error:', error);
        console.error('Error details:', error.message, error.status, error.type);
        return NextResponse.json({
            error: 'Internal server error during transcription',
            details: error.message
        }, { status: 500 });
    }
}
