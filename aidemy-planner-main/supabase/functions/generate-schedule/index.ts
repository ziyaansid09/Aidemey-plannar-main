import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { availableHoursPerDay, days, userId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        },
      }
    );

    // Fetch user's subjects
    const { data: subjects, error } = await supabaseClient
      .from('subjects')
      .select('id, name, priority')
      .eq('user_id', userId);

    if (error) throw error;
    if (!subjects || subjects.length === 0) {
      throw new Error('No subjects found');
    }

    // Calculate weights based on priority (1=high=3x, 2=medium=2x, 3=low=1x)
    const totalWeight = subjects.reduce((sum, s) => sum + (4 - s.priority), 0);
    const minutesPerDay = availableHoursPerDay * 60;

    const schedules = [];
    const today = new Date();

    for (let day = 0; day < days; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];

      // Distribute time based on weights
      for (const subject of subjects) {
        const weight = 4 - subject.priority;
        const duration = Math.round((weight / totalWeight) * minutesPerDay);
        
        if (duration > 0) {
          schedules.push({
            date: dateStr,
            task: `Study ${subject.name}`,
            duration,
            subject_id: subject.id,
          });
        }
      }
    }

    return new Response(JSON.stringify({ schedules }), {
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
