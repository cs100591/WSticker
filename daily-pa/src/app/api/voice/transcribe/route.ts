import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        // 1. Authorization Check to prevent "Action failed: Unauthorized"
        // We strictly check for the Authorization header.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
        }

        // 2. Validate Configuration
        if (!process.env.OPENAI_API_KEY) {
            console.error('Missing OPENAI_API_KEY');
            return NextResponse.json({ error: 'Server configuration error: Missing OpenAI API Key' }, { status: 500 });
        }

        // 3. Parse Request Body
        const { audio, language } = await req.json();

        if (!audio) {
            return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
        }

        // 4. Convert Base64 to Blob/File for FormData
        // The mobile app sends base64 encoded audio (likely m4a/aac from expo-av)
        const buffer = Buffer.from(audio, 'base64');

        // Create FormData for OpenAI API
        const formData = new FormData();

        // We create a Blob from the buffer. 
        // Important: 'audio.m4a' filename helps OpenAI infer the format.
        const fileBlob = new Blob([buffer], { type: 'audio/m4a' });
        formData.append('file', fileBlob, 'input.m4a');
        formData.append('model', 'whisper-1');

        // Optional: Prompt or Language
        // Whisper handles mixed language well automatically, but we can hint if provided
        // User requested "support mixed Chinese/English", Whisper model is excellent at this by default.
        // If a specific language code is passed (e.g. 'zh'), we can use it, otherwise let it auto-detect.
        if (language) {
            formData.append('language', language);
        }

        // 5. Call OpenAI Whisper API
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                // Note: Do NOT set Content-Type header manually for FormData, fetch does it with boundary
            },
            body: formData,
        });

        if (!whisperResponse.ok) {
            const errorText = await whisperResponse.text();
            console.error('Whisper API Error:', errorText);
            return NextResponse.json({ error: `Whisper API failed: ${whisperResponse.statusText}` }, { status: whisperResponse.status });
        }

        const data = await whisperResponse.json();

        return NextResponse.json({ text: data.text });

    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json({ error: 'Internal server error during transcription' }, { status: 500 });
    }
}
