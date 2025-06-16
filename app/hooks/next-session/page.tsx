'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

type PlotHook = {
  id: string;
  title: string;
  description: string;
  is_selected: boolean;
};

export default function NextSessionHooks() {
  const [loading, setLoading] = useState(false);
  const [hooks, setHooks] = useState<PlotHook[]>([]);
  const [error, setError] = useState('');
  const [generatingNotesFor, setGeneratingNotesFor] = useState<string | null>(null);

  const handleGenerateHooks = async () => {
    setLoading(true);
    setError('');

    try {
      // ✅ 1. Insert a new empty session_summary to get its ID
      const { data: newSummary, error: insertError } = await supabase
        .from('session_summaries')
        .insert([{
          campaign_id: 'abc123', // replace with real campaign ID
          session_date: new Date().toISOString().slice(0, 10),
          summary: '',
          location: '',
          characters_met: '',
          plot_threads: ''
        }])
        .select()
        .single();

      if (insertError || !newSummary) {
        throw new Error(insertError?.message || 'Failed to create session summary');
      }

      const session_id = newSummary.id;

      // ✅ 2. Send session_id to your backend to generate hooks
      const res = await fetch('/api/hooks/next-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate hooks');

      setHooks(data.hooks);
    } catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('An unknown error occurred');
  }
} finally {
      setLoading(false);
    }
  };

  const handleGenerateNotes = async (hookId: string) => {
    setGeneratingNotesFor(hookId);

    try {
      const res = await fetch(`/api/adventure-notes/${hookId}`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate notes');

      alert('✅ Adventure notes generated!');
    } catch (err: unknown) {
  console.error('❌ Error generating notes:', err);

  if (err instanceof Error) {
    alert('Failed to generate notes: ' + err.message);
  } else {
    alert('Failed to generate notes: Unknown error');
  }
} finally {
  setGeneratingNotesFor(null);
}

  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">🧠 Next-Session Hook Generator</h1>
      <p className="mb-6 text-gray-600">
        Based on your last 3 sessions, generate possible narrative directions.
      </p>

      <button
        onClick={handleGenerateHooks}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        {loading ? 'Thinking...' : 'Generate Next Session Hooks'}
      </button>

      {error && <p className="mt-4 text-red-500">❌ {error}</p>}

      {hooks.length > 0 && (
        <div className="mt-6 space-y-4">
          {hooks.map((hook) => (
            <div key={hook.id} className="p-4 border rounded shadow-sm">
              <h3 className="text-xl font-semibold">{hook.title}</h3>
              <p className="text-gray-700 my-2">{hook.description}</p>
              <button
                onClick={() => handleGenerateNotes(hook.id)}
                disabled={generatingNotesFor === hook.id}
                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
              >
                {generatingNotesFor === hook.id ? 'Generating Notes...' : 'Generate Notes'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
