import SessionDetails from '../../../components/SessionDetails';

type PageProps = {
  params: {
    id: string;
  };
};

async function getSession(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sessions/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch session');
  }

  return res.json();
}

export default function Page({ params }: PageProps) {
  // This function is now sync, and uses a React Suspense boundary or wrapper
  return (
    <SessionLoader id={params.id} />
  );
}

async function SessionLoader({ id }: { id: string }) {
  const session = await getSession(id);
  return <SessionDetails session={session} />;
}
