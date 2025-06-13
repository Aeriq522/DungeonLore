'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase browser client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PlotHook = {
  id: string;
  title: string;
  description: string;
};


function formatAdventureNote(note: any): string {
  return `
    # ${note.name}

    ## Summary
    ${note.summary}

    ## Synopsis
    ${note.synopsis}

    ## Adventure Hooks
    ${note.adventure_hooks?.map((hook: string) => `- ${hook}`).join('\n')}

    ## Key Locations
    ${note.key_locations?.map((loc: string) => `- ${loc}`).join('\n')}

    ## Village Info
    **Location:** ${note.village_info?.location}
    **Mood:** ${note.village_info?.mood}
    **Current Events:** ${note.village_info?.current_events}

    **People:**
    ${note.village_info?.people?.map((p: string) => `- ${p}`).join('\n')}

    ## Encounters
    ${note.encounters?.map((enc: any) => `- **${enc.name}** (${enc.type}, Difficulty: ${enc.difficulty})`).join('\n')}

    ## Aftermath
    ${note.aftermath}

    ${note.rumors ? `## Rumors\n${note.rumors}` : ''}
    `.trim();
    }


export default function SummarizerPage() {
  const [transcript, setTranscript] = useState('');
  const [useMini, setUseMini] = useState(true);
  const [summaryResult, setSummaryResult] = useState<any | null>(null);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [hooks, setHooks] = useState<PlotHook[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingHooks, setGeneratingHooks] = useState(false);
  const [error, setError] = useState('');
  const [selectedHookId, setSelectedHookId] = useState<string | null>(null);
  const [adventureNotes, setAdventureNotes] = useState<string | null>(null);
  const [generatingNotes, setGeneratingNotes] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSummaryResult(null);
    setSummaryId(null);
    setHooks([]);

    try {
      const response = await fetch('http://localhost:3001/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, useMini }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Something went wrong');
      }

      const data = await response.json();
      setSummaryResult(data);

      // ✅ Insert summary into Supabase
      const { data: insertData, error: insertErr } = await supabase
        .from('session_summaries')
        .insert([{
          campaign_id: 'abc123', // replace later with actual campaign reference
          session_date: new Date().toISOString().slice(0, 10),
          summary: data.summary,
          location: data.location,
          characters_met: data.characters_met,
          plot_threads: data.plot_threads
        }])
        .select()
        .single();

      if (insertErr || !insertData) throw new Error('❌ Could not save session summary');
      setSummaryId(insertData.id);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHooks = async () => {
    if (!summaryId) return;
    setGeneratingHooks(true);
    setError('');
    try {
      const res = await fetch('/api/hooks/next-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: summaryId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate hooks');
      setHooks(data.hooks);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingHooks(false);
    }
  };

  const handleGenerateNotes = async (hookId: string) => {
    setGeneratingNotes(true);
    setSelectedHookId(hookId);
    setAdventureNotes(null);
    try {
      const res = await fetch(`/api/adventure-notes/${hookId}`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate notes');

      // Fetch the newly inserted notes
      const { data: notesData, error: fetchError } = await supabase
        .from('adventure_notes')
        .select('*')
        .eq('hook_id', hookId)
        .single();

      if (fetchError || !notesData) {
        throw new Error('Failed to retrieve saved adventure notes');
      }

      // ✅ THIS is the line you want — generate the full copyable string:
      setAdventureNotes(formatAdventureNote(notesData));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingNotes(false);
    }
  };



  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">📝 D&D Session Summarizer</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full p-3 border rounded-lg shadow resize-y min-h-[200px]"
          placeholder="Paste your Notion AI session summary here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useMini}
            onChange={(e) => setUseMini(e.target.checked)}
          />
          Use GPT-4o-mini (faster & cheaper)
        </label>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? 'Summarizing...' : 'Summarize Session'}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4">❌ {error}</p>}

      {summaryResult && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-2">📚 Summary Saved</h2>
          <div className="p-4 border rounded bg-black space-y-2">
            <p><strong>📅 Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>📍 Location:</strong> {summaryResult.location}</p>
            <p><strong>🧙 Characters Met:</strong> {summaryResult.characters_met}</p>
            <p><strong>🧵 Plot Threads:</strong> {summaryResult.plot_threads}</p>
            <p><strong>📝 Summary:</strong> {summaryResult.summary}</p>

            <button
              onClick={handleGenerateHooks}
              disabled={generatingHooks}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            >
              {generatingHooks ? 'Generating Hooks...' : 'Generate Plot Hooks'}
            </button>
          </div>
        </div>
      )}

      {hooks.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-2xl font-bold mb-2">🪝 Plot Hooks</h2>
          {hooks.map((hook) => {
            if (selectedHookId && selectedHookId !== hook.id) return null;

            return (
              <div key={hook.id} className="p-4 border rounded bg-black shadow space-y-2">
                <h3 className="text-lg font-semibold">{hook.title}</h3>
                <p className="text-gray-300">{hook.description}</p>

                {!selectedHookId && (
                  <button
                    onClick={() => handleGenerateNotes(hook.id)}
                    disabled={generatingNotes}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                  >
                    {generatingNotes ? 'Generating Notes...' : 'Generate Adventure Notes'}
                  </button>
                )}
                {adventureNotes && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-2">📜 Adventure Notes</h2>
                    <textarea
                      readOnly
                      className="w-full min-h-[400px] p-4 bg-black text-white border rounded font-mono text-sm"
                      value={adventureNotes}
                    />
                    <p className="mt-2 text-sm text-gray-400">
                      ✅ Copy and paste this into Notion or your campaign journal.
                    </p>
                  </div>
                )}

              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}
