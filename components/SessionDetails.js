'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionDetails({ session }) {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(session);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    await fetch(`/api/sessions/${session.id}`, { method: 'DELETE' });
    router.push('/sessions');
  };

  const handleUpdate = async () => {
    await fetch(`/api/sessions/${session.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setEditMode(false);
    router.refresh();
  };

  return (
    <div className="p-4">
      {editMode ? (
        <div>
          <textarea
            value={formData.summary}
            onChange={(e) =>
              setFormData({ ...formData, summary: e.target.value })
            }
            className="w-full h-32 border"
          />
          <button onClick={handleUpdate} className="btn btn-primary">Save</button>
        </div>
      ) : (
        <div>
          <h1 className="text-xl font-bold">{session.session_date}</h1>
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
