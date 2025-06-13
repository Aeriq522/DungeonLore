// app/api/adventure-notes/[hookId]/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const hookId = req.nextUrl.pathname.match(/[^/]+$/)?.[0];

  if (!hookId) {
    return new Response(JSON.stringify({ error: 'Missing hookId' }), { status: 400 });
  }

  // 1. Get the selected plot hook
  const { data: hook, error: hookError } = await supabase
    .from('next_session_hooks')
    .select('id, title, description, session_id')
    .eq('id', hookId)
    .single();

  if (hookError || !hook) {
    return new Response(JSON.stringify({ error: 'Hook not found' }), { status: 404 });
  }

  // 2a. Lookup the session this hook came from
  const { data: session, error: sessionError } = await supabase
    .from('session_summaries')
    .select('campaign_id, session_date')
    .eq('id', hook.session_id)
    .single();

  if (sessionError || !session) {
    return new Response(JSON.stringify({ error: 'Could not find session for hook' }), { status: 404 });
  }

  // 2b. Fetch the last 3 sessions from the same campaign up to this session's date
  const { data: sessions, error: sessionsError } = await supabase
    .from('session_summaries')
    .select('session_date, summary, location, characters_met, plot_threads')
    .eq('campaign_id', session.campaign_id)  // ✅ use correct campaign_id here
    .lte('session_date', session.session_date)
    .order('session_date', { ascending: false })
    .limit(3);

  if (sessionsError || !sessions || sessions.length === 0) {
    return new Response(JSON.stringify({ error: 'Could not retrieve past sessions' }), { status: 500 });
  }


  const context = sessions.map((s, i) => {
    return `Session ${i + 1}:
      Summary: ${s.summary}
      Location: ${s.location}
      Characters Met: ${s.characters_met}
      Plot Threads: ${s.plot_threads}`;
        }).join('\n\n---\n\n');

  const prompt = `You are a Dungeons & Dragons campaign assistant.

    Based on the selected plot hook:
    "${hook.title}" - ${hook.description}

    And based on the last 3 sessions:
    ${context}

    Write detailed adventure notes for the next session. Return the notes as a *valid JSON object only* with these keys:

    - name (string)
    - summary (string)
    - synopsis (string)
    - adventure_hooks (array of strings)
    - key_locations (array of strings)
    - village_info (object with location, people, mood, and current events)
    - encounters (array of objects with name, type, and difficulty)
    - aftermath (string)
    - rumors (optional string)

    DO NOT include any text before or after the JSON. Do not use markdown or code block formatting. Just return raw JSON only.`;


  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a D&D campaign assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    const text = completion.choices?.[0]?.message?.content;

    if (!text) {
      return new Response(JSON.stringify({ error: 'GPT returned no content' }), { status: 500 });
    }

    let note;
    try {
      // Remove Markdown code block if GPT includes it anyway
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const clean = text.slice(jsonStart, jsonEnd + 1);

      note = JSON.parse(clean);
    } catch (err) {
      console.error('❌ GPT JSON Parse Error:', err);
      return new Response(JSON.stringify({ error: 'GPT returned invalid JSON' }), { status: 500 });
    }


    const { error: insertError } = await supabase.from('adventure_notes').insert({
      hook_id: hook.id,
      session_id: hook.session_id,
      name: note.name,
      summary: note.summary,
      synopsis: note.synopsis,
      adventure_hooks: Array.isArray(note.adventure_hooks) ? note.adventure_hooks : [note.adventure_hooks],
      key_locations: Array.isArray(note.key_locations) ? note.key_locations : [note.key_locations],
      village_info: note.village_info ?? {},
      encounters: Array.isArray(note.encounters) ? note.encounters : [note.encounters],
      aftermath: note.aftermath,
      rumors: Array.isArray(note.rumors) ? note.rumors : [note.rumors],
    });
    console.log('🧾 Adventure Note Object:', note);


    if (insertError) {
      console.error('❌ Supabase Insert Error:', insertError.message);
      return new Response(JSON.stringify({ error: insertError.message || 'Failed to store notes' }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: '✅ Adventure notes saved successfully' }), { status: 200 });
  } catch (err) {
    console.error('❌ Error generating adventure notes:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate adventure notes' }), { status: 500 });
  }
}
