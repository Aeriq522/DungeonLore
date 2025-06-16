'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SessionItem = {
  id: string;
  session_date: string;
  location: string;
  summary: string;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data: SessionItem[]) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching sessions:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4 text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🧾 Past Sessions</h1>
      {sessions.length === 0 ? (
        <p>No sessions found.</p>
      ) : (
        <ul className="space-y-4">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <Link href={`/sessions/${session.id}`}>
                <div className="cursor-pointer">
                  <h2 className="text-xl font-semibold">
                    {new Date(session.session_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                  <p className="text-sm text-gray-600 mb-1">{session.location}</p>
                  <p className="text-gray-800 line-clamp-2">{session.summary}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
