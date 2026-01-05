export interface StickerResult {
    id: string;
    originalUrl: string;
    style: 'generated' | 'cartoon' | 'sketch' | 'pop-art';
}

export const generateStickers = async (
    file: File | null,
    prompt: string,
    apiKey: string
): Promise<StickerResult[]> => {
    try {
        // Combine default prompt with user prompt
        const defaultPrompt = "cartoon/comics big head with no background, icon, sticker size";
        const fullPrompt = `${defaultPrompt}, ${prompt}`;
        
        console.log("Generating stickers via serverless function:", { 
            fullPrompt, 
            file: file?.name
        });

        // Use Vercel serverless function (works both locally and in production)
        const apiUrl = '/api/generate';

        // Generate 8 stickers sequentially
        const results: StickerResult[] = [];
        
        for (let index = 0; index < 8; index++) {
            try {
                console.log(`Generating sticker ${index + 1}/8...`);
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: `${fullPrompt}, style variation ${index + 1}, high quality, detailed`,
                        apiKey: apiKey
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`API error for sticker ${index}:`, errorData);
                    throw new Error(`API request failed: ${response.status} - ${errorData.error}`);
                }

                const data = await response.json();
                
                results.push({
                    id: crypto.randomUUID(),
                    originalUrl: data.image,
                    style: 'generated' as const
                });
                
                console.log(`Sticker ${index + 1}/8 generated successfully`);
                
                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`Failed to generate sticker ${index}:`, error);
                throw error;
            }
        }

        console.log("All stickers generated successfully");
        return results;

    } catch (error) {
        console.error("Generation failed", error);
        throw error;
    }
};

// Helper function to convert file to base64 (for future use with image generation APIs)
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};
