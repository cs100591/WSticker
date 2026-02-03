// supabase/functions/api/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
      throw new Error('Missing Supabase Secret: OPENAI_API_KEY')
    }

    // URL Routing: Support both query-param (?route=/chat) and path-based routing
    const targetRoute = url.searchParams.get('route') || url.pathname

    // ---------------------------------------------------------
    // 🎤 Route 1: Transcribe (+ Optional Translate)
    // ---------------------------------------------------------
    if (targetRoute.includes('/transcribe')) {
      const { audio, language, targetLanguage } = await req.json()

      if (!audio) throw new Error('No audio data provided')

      // Convert Base64 to Blob
      const binaryString = atob(audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const file = new Blob([bytes], { type: 'audio/m4a' })

      const formData = new FormData()
      formData.append('file', file, 'audio.m4a')
      formData.append('model', 'whisper-1')
      // Only pass audio language if recognized (not auto)
      if (language && language !== 'auto') {
        formData.append('language', language)
      }

      console.log(`Transcribing audio (Lang: ${language || 'auto'})...`)

      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: formData,
      })

      if (!whisperResponse.ok) {
        const errText = await whisperResponse.text()
        console.error('OpenAI Whisper Error:', errText.substring(0, 100))
        throw new Error(`Whisper API Failed: ${whisperResponse.status}`)
      }

      const whisperData = await whisperResponse.json()
      let finalText = whisperData.text

      // --- Optional Translation Step ---
      if (finalText && targetLanguage && targetLanguage !== 'auto' && targetLanguage !== language) {
        console.log(`Translating to ${targetLanguage}...`)
        const translateResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: `You are a professional translator. Translate the following text into the language code '${targetLanguage}'. Output ONLY the translated text.` },
              { role: 'user', content: finalText }
            ]
          })
        })
        const translateData = await translateResponse.json()
        if (translateData.choices?.[0]?.message?.content) {
          finalText = translateData.choices[0].message.content.trim()
        }
      }

      return new Response(JSON.stringify({ text: finalText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ---------------------------------------------------------
    // 💬 Route 2: Chat Assistant
    // ---------------------------------------------------------
    if (targetRoute.includes('/chat')) {
      const { message, history, date, language } = await req.json()

      const currentDate = date || new Date().toISOString().split('T')[0]
      const systemPrompt = `You are 'CLASP', an intelligent Life OS assistant.
Current Date: ${currentDate}

Your goal is to understand user intent and return structured JSON responses.

## Supported Action Types:
1. **task** - Todo/Task creation
   { "type": "task", "data": { "title": "string", "priority": "high|medium|low", "dueDate": "YYYY-MM-DD (optional)" } }

2. **expense** - Expense tracking  
   { "type": "expense", "data": { "amount": number, "category": "food|transport|shopping|entertainment|bills|other", "description": "string", "merchant": "string (optional)" } }

3. **calendar** - Calendar event scheduling
   { "type": "calendar", "data": { "title": "string", "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM", "allDay": boolean } }

## Response Format:
{
  "message": "Friendly response in user's language",
  "actions": [ ...array of actions... ]  // Use 'actions' (plural) for MULTIPLE items
  // OR
  "action": { single action object }  // Use 'action' (singular) for ONE item
}

## Critical Rules:
1. **MULTIPLE ITEMS**: If user mentions multiple things (e.g., "I have meetings at 3pm and 6pm tomorrow"), return an "actions" array with ALL items.
2. **Time Parsing**: 
   - "3pm" → "15:00", "6pm" → "18:00", "9am" → "09:00"
   - "tomorrow" → add 1 day to current date
   - "next Monday" → calculate the correct date
3. **Duration**: If no end time specified, assume 1 hour duration for meetings
4. **Language**: Match the user's input language in your response
5. **No Action**: If user is just chatting, set action/actions to null

## Examples:
User: "我明天三点和六点有会议"
Response: {
  "message": "好的，我帮您创建两个会议！",
  "actions": [
    { "type": "calendar", "data": { "title": "会议", "date": "TOMORROW_DATE", "startTime": "15:00", "endTime": "16:00", "allDay": false } },
    { "type": "calendar", "data": { "title": "会议", "date": "TOMORROW_DATE", "startTime": "18:00", "endTime": "19:00", "allDay": false } }
  ]
}

User: "Add tasks: buy milk, call mom, finish report"
Response: {
  "message": "I've created 3 tasks for you!",
  "actions": [
    { "type": "task", "data": { "title": "Buy milk", "priority": "medium" } },
    { "type": "task", "data": { "title": "Call mom", "priority": "medium" } },
    { "type": "task", "data": { "title": "Finish report", "priority": "medium" } }
  ]
}

Output valid JSON ONLY. No markdown, no explanation outside JSON.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
            { role: 'user', content: message }
          ],
          response_format: { type: "json_object" }
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`OpenAI Chat Failed: ${response.status}`)
      }

      const data = await response.json()
      const aiContent = data.choices[0].message.content
      const parsed = JSON.parse(aiContent)

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
