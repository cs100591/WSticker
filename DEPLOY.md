# Deploy to Vercel

## Quick Deploy

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? Press enter (or choose a name)
- Directory? Press enter (current directory)
- Override settings? **N**

4. **Deploy to Production**:
```bash
vercel --prod
```

## Environment Variables

Your Hugging Face API key should be set as an environment variable. For production, you should:

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add: `VITE_HF_API_KEY` = `YOUR_HUGGING_FACE_TOKEN`
4. Redeploy

For local development, create a `.env` file:
```
VITE_HF_API_KEY=your_hugging_face_token_here
```

## How It Works

- The frontend calls `/api/generate` 
- Vercel serverless function handles the Hugging Face API call
- No CORS issues because the API call happens server-side
- Returns base64 image data to the frontend

## Testing Locally with Vercel Dev

```bash
vercel dev
```

This will run the serverless functions locally at http://localhost:3000
