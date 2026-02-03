import { NextRequest, NextResponse } from 'next/server';

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry API calls
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES,
    delayMs: number = RETRY_DELAY
): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            // Don't retry on 401/403 (auth errors) or 400 (bad request)
            if (error.status === 401 || error.status === 403 || error.status === 400) {
                throw error;
            }
            // Don't retry on last attempt
            if (attempt < maxRetries) {
                const backoffDelay = delayMs * Math.pow(2, attempt);
                console.log(`[Transcribe] Retry attempt ${attempt + 1}/${maxRetries} after ${backoffDelay}ms`);
                await delay(backoffDelay);
            }
        }
    }
    throw lastError;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Authorization Check - Allow both authenticated users and guests
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ 
                error: 'Unauthorized: Missing Authorization header',
                code: 'MISSING_AUTH'
            }, { status: 401 });
        }

        // Extract token and determine if user is guest or authenticated
        const token = authHeader.replace('Bearer ', '');
        const isGuest = token === 'guest-user';

        // Log for monitoring
        console.log(`[Transcribe] Request from: ${isGuest ? 'guest user' : 'authenticated user'}`);

        // 2. Validate Configuration with detailed error messages
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('[Transcribe] Missing OPENAI_API_KEY environment variable');
            return NextResponse.json({ 
                error: 'Server configuration error: Missing OpenAI API Key',
                details: 'Please configure OPENAI_API_KEY in your Vercel environment variables. Go to: Project Settings > Environment Variables',
                code: 'MISSING_API_KEY',
                solution: 'Add OPENAI_API_KEY to Vercel environment variables'
            }, { status: 500 });
        }

        // Validate API key format
        if (!apiKey.startsWith('sk-')) {
            console.error('[Transcribe] Invalid API key format');
            return NextResponse.json({ 
                error: 'Invalid API key format',
                details: 'OpenAI API keys should start with "sk-"',
                code: 'INVALID_API_KEY_FORMAT'
            }, { status: 500 });
        }

        // 3. Parse Request Body
        const { audio, language, targetLanguage } = await req.json();

        if (!audio) {
            return NextResponse.json({ 
                error: 'Audio data is required',
                code: 'MISSING_AUDIO'
            }, { status: 400 });
        }

        // Validate audio data size (max 25MB for Whisper API)
        const buffer = Buffer.from(audio, 'base64');
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (buffer.length > maxSize) {
            return NextResponse.json({ 
                error: 'Audio file too large',
                details: `Maximum size is 25MB, received ${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
                code: 'FILE_TOO_LARGE'
            }, { status: 400 });
        }

        console.log(`[Transcribe] Audio buffer size: ${(buffer.length / 1024).toFixed(2)}KB, Language: ${language || 'auto'}`);

        // 4. Dynamic import OpenAI (fixes Vercel build issue)
        const { default: OpenAI, toFile } = await import('openai');

        // 5. Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: apiKey,
            // Add timeout to prevent hanging requests
            timeout: 30000, // 30 seconds
        });

        // 6. Create a File object for the OpenAI SDK
        const file = await toFile(buffer, 'audio.m4a', { type: 'audio/m4a' });

        // 7. Call Whisper API with retry logic
        console.log('[Transcribe] Calling Whisper API...');
        let transcription;
        try {
            transcription = await retryWithBackoff(async () => {
                return await openai.audio.transcriptions.create({
                    file: file,
                    model: 'whisper-1',
                    language: language || undefined, // Only include if provided
                    response_format: 'json',
                });
            });
        } catch (error: any) {
            // Handle specific OpenAI API errors
            const status = error.status || error.response?.status;
            const errorMessage = error.message || error.error?.message || 'Unknown error';

            console.error(`[Transcribe] OpenAI API error (${status}):`, errorMessage);

            // Provide helpful error messages based on status code
            if (status === 401) {
                return NextResponse.json({
                    error: 'Invalid API key',
                    details: 'The OpenAI API key is invalid or expired. Please check your API key in Vercel environment variables.',
                    code: 'INVALID_API_KEY',
                    solution: 'Verify your OPENAI_API_KEY in Vercel project settings'
                }, { status: 401 });
            }

            if (status === 403) {
                return NextResponse.json({
                    error: 'API access forbidden',
                    details: 'Your OpenAI API key does not have permission to use Whisper API, or billing is not enabled.',
                    code: 'FORBIDDEN',
                    solution: '1. Check API key permissions at https://platform.openai.com/api-keys\n2. Enable billing at https://platform.openai.com/account/billing\n3. Verify API key has access to Whisper API'
                }, { status: 403 });
            }

            if (status === 429) {
                return NextResponse.json({
                    error: 'Rate limit exceeded',
                    details: 'Too many requests. Please try again later.',
                    code: 'RATE_LIMIT',
                    solution: 'Wait a few minutes and try again, or upgrade your OpenAI plan'
                }, { status: 429 });
            }

            if (status === 500 || status === 502 || status === 503) {
                return NextResponse.json({
                    error: 'OpenAI service unavailable',
                    details: 'OpenAI API is temporarily unavailable. Please try again later.',
                    code: 'SERVICE_UNAVAILABLE',
                    solution: 'Retry in a few moments'
                }, { status: 503 });
            }

            // Generic error
            return NextResponse.json({
                error: 'Transcription failed',
                details: errorMessage,
                code: status ? `HTTP_${status}` : 'UNKNOWN_ERROR',
                solution: 'Check OpenAI API status at https://status.openai.com'
            }, { status: status || 500 });
        }

        console.log('[Transcribe] Transcription successful:', transcription.text?.substring(0, 50) + '...');
        let finalText = transcription.text;

        // 8. Translate if needed
        if (targetLanguage && targetLanguage !== language && finalText) {
            try {
                console.log(`[Transcribe] Translating to ${targetLanguage}...`);
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini", // Use cheaper model for translation
                    messages: [
                        { 
                            role: "system", 
                            content: `You are a professional translator. Translate the following text into ${targetLanguage}. Maintain the tone and context. Output ONLY the translated text.` 
                        },
                        { role: "user", content: finalText }
                    ],
                    max_tokens: 500,
                });

                const translated = completion.choices[0]?.message?.content;
                if (translated) {
                    console.log('[Transcribe] Translation successful');
                    finalText = translated;
                }
            } catch (translateError: any) {
                console.error('[Transcribe] Translation failed:', translateError.message);
                // Continue with original text if translation fails
            }
        }

        return NextResponse.json({ 
            text: finalText, 
            original: transcription.text,
            language: language || 'auto-detected'
        });

    } catch (error: any) {
        console.error('[Transcribe] Unexpected error:', error);

        // Handle non-OpenAI errors
        return NextResponse.json({
            error: 'Transcription failed',
            details: error.message || 'Unknown error occurred',
            code: 'INTERNAL_ERROR',
            solution: 'Please try again or contact support if the issue persists'
        }, { status: 500 });
    }
}
