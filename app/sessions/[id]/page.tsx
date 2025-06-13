import SessionDetails from '../../../components/SessionDetails';

export default async function Page({ params }: { params: { id: string } }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sessions/${params.id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    // This won't render as expected in an async function, consider using a fallback component
    throw new Error('Failed to load session');
  }

  const session = await res.json();

  return <SessionDetails session={session} />;
}
