import SessionDetails from '@/components/SessionDetails';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Session Details',
  description: 'View your session summary and notes',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/sessions/${id}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to load session');
  const session = await res.json();
  return <SessionDetails session={session} />;
}
