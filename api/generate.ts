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

    // Use Hugging Face Inference Client approach
    const HF_MODEL = "black-forest-labs/FLUX.1-schnell";
    const apiUrl = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: prompt,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    return res.status(200).json({ 
      image: `data:image/png;base64,${base64Image}` 
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
