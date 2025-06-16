// app/api/hooks/next-session/route.js
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  const { session_id } = await request.json();

  if (!session_id) {
    return new Response(JSON.stringify({ error: 'Missing session_id' }), { status: 400 });
  }

    // Step 1: Lookup the current session so we can get its campaign_id and date
  const { data: currentSession, error: sessionLookupError } = await supabase
    .from('session_summaries')
    .select('campaign_id, session_date')
    .eq('id', session_id)
    .single();

  if (sessionLookupError || !currentSession) {
    return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
  }

  // Step 2: Fetch the 3 most recent summaries from the same campaign
  const { data: sessions, error } = await supabase
    .from('session_summaries')
    .select('summary')
    .eq('campaign_id', currentSession.campaign_id)
    .lte('session_date', currentSession.session_date)
    .order('session_date', { ascending: false })
    .limit(3);


  if (error || !sessions || sessions.length === 0) {
    return new Response(JSON.stringify({ error: 'No sessions available' }), { status: 500 });
  }

  const summaries = sessions
    .map((s, i) => `Session ${i + 1}:\n${s.summary}`)
    .join('\n\n');

  const prompt = `You are a creative D&D story planner. Based on the past three sessions, suggest 3 compelling ways the story could evolve next. Return each as a JSON object with: title and description. Format your reply as a JSON array.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a creative D&D campaign assistant.' },
        { role: 'user', content: `${prompt}\n\n${summaries}` }
      ],
      temperature: 0.7
    });

    if (
      !response ||
      !response.choices ||
      !response.choices.length ||
      !response.choices[0].message ||
      !response.choices[0].message.content
    ) {
      console.error('❌ GPT returned an invalid structure:', response);
      return new Response(JSON.stringify({ error: 'Invalid GPT response' }), { status: 500 });
    }

    const raw = response.choices[0].message.content;
    console.log('📦 GPT Raw Output:', raw);

    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    const jsonBlock = raw.slice(start, end + 1);

    let hooks;
    try {
      hooks = JSON.parse(jsonBlock);
    } catch (parseErr) {
      console.error('❌ JSON parse error:', parseErr);
      return new Response(JSON.stringify({ error: 'GPT returned invalid JSON' }), { status: 500 });
    }

    const entries = hooks.map(hook => ({
      id: uuidv4(),
      session_id: session_id,
      title: hook.title,
      description: hook.description,
    }));

    const { error: insertError } = await supabase
      .from('next_session_hooks')
      .insert(entries);

    if (insertError) {
      console.error('❌ Supabase insert error:', insertError);
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ hooks: entries }), { status: 200 });
  } catch (err) {
    console.error('❌ GPT fetch or unknown error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate plot hooks' }), { status: 500 });
  }
}
