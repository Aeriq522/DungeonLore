// app/api/summarize/route.js
import { summarizeSession } from '../../../ai-services/agent.js';
// import { supabase } from '../../../lib/supabase.js';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function POST(request) {
  try {
    const { transcript, useMini } = await request.json();

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'Missing "transcript" field in request body.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await summarizeSession(transcript, { useMini: !!useMini });

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate summary from AI.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: dbError } = await supabase
      .from('session_summaries')
      .insert([
        {
          session_date: result.session_date,
          summary: result.summary,
          location: result.location,
          characters_met: result.characters_met,
          plot_threads: result.plot_threads,
          campaign_id: 'default-campaign',
          user_id: null
        }
      ]);

    if (dbError) {
      console.error('❌ Failed to insert summary into Supabase:', dbError);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ summarize route error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
