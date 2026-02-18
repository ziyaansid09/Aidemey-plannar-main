import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, topic } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful study assistant. Provide concise, actionable study advice.'
          },
          {
            role: 'user',
            content: `Create a study plan for: ${topic} (Subject: ${subject}). Include: 1) A catchy title 2) A brief study plan (2-3 paragraphs) 3) 3 recommended resources. Format as JSON with keys: title, studyPlan, resources (array).`
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI request failed: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from AI response
    let suggestion;
    try {
      suggestion = JSON.parse(content);
    } catch {
      // Fallback if AI doesn't return valid JSON
      suggestion = {
        title: `Study Plan: ${topic}`,
        studyPlan: content,
        resources: []
      };
    }

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
