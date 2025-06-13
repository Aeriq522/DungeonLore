// app/api/sessions/[id]/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function GET(request, { params }) {
  const { id } = params;

  const { data, error } = await supabase
    .from('session_summaries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}

// ✏️ PUT = Edit session
export async function PUT(request, { params }) {
  const { id } = params;
  const updates = await request.json();

  const { error } = await supabase
    .from('session_summaries')
    .update(updates)
    .eq('id', id);

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// 🗑 DELETE session
export async function DELETE(request, { params }) {
  const { id } = params;

  const { error } = await supabase
    .from('session_summaries')
    .delete()
    .eq('id', id);

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
