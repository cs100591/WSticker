import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, apiKey } = req.body;

    if (!prompt || !apiKey) {
      return res.status(400).json({ error: 'Missing prompt or apiKey' });
    }

    // Use Gemini Nano Banana (gemini-2.5-flash-image) for image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseModalities: ['IMAGE']
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    
    // Extract image from response
    const imagePart = data.candidates[0]?.content?.parts?.find((part: any) => part.inlineData);
    
    if (!imagePart || !imagePart.inlineData) {
      return res.status(500).json({ error: 'No image generated' });
    }

    const base64Image = imagePart.inlineData.data;

    return res.status(200).json({ 
      image: `data:image/png;base64,${base64Image}` 
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
