// app/sessions/[id]/page.tsx
import SessionDetails from '@/components/SessionDetails';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Session Details',
  description: 'View your session summary and notes',
};

type Params = { params: { id: string } };

export default async function Page({ params }: Params) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/sessions/${params.id}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to load session');

  const session = await res.json();
  return <SessionDetails session={session} />;
}
