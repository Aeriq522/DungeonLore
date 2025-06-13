import { Metadata } from 'next';
import SessionDetails from '../../../components/SessionDetails';

export const metadata: Metadata = {
  title: 'Session Details',
  description: 'View your session summary and notes',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function Page({ params }: PageProps) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sessions/${params.id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to load session');
  }

  const session = await res.json();

  return <SessionDetails session={session} />;
}
