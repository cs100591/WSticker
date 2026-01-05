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

    // Use Replicate API for FLUX image generation
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "png",
          output_quality: 90
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API Error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const prediction = await response.json();
    
    // Poll for completion
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait
    
    while (!imageUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          }
        }
      );
      
      const status = await statusResponse.json();
      
      if (status.status === 'succeeded') {
        imageUrl = status.output[0];
        break;
      } else if (status.status === 'failed') {
        return res.status(500).json({ error: 'Image generation failed' });
      }
      
      attempts++;
    }
    
    if (!imageUrl) {
      return res.status(408).json({ error: 'Image generation timeout' });
    }

    return res.status(200).json({ 
      image: imageUrl 
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
