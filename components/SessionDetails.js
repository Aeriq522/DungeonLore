'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  session_date: string;
  summary: string;
}

export default function SessionDetails({ session }: { session: Session }) {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Session>(session);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    await fetch(`/api/sessions/${session.id}`, { method: 'DELETE' });
    router.push('/sessions');
  };

  const handleUpdate = async () => {
    setSaving(true);
    await fetch(`/api/sessions/${session.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setSaving(false);
    setEditMode(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4">
      {editMode ? (
        <div>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            className="w-full h-32 border"
          />
          <button onClick={handleUpdate} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saved && <p className="mt-2 text-green-600">Saved!</p>}
        </div>
      ) : (
        <div>
          <h1 className="text-xl font-bold">
            {new Date(session.session_date).toLocaleDateString()}
          </h1>
          <p>{session.summary}</p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={() => setEditMode(!editMode)} className="btn btn-secondary">
          {editMode ? 'Cancel' : 'Edit'}
        </button>
        <button onClick={handleDelete} className="btn btn-danger">
          Delete
        </button>
      </div>
    </div>
  );
}
