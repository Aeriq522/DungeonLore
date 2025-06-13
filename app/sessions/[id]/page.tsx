import SessionDetails from '../../../components/SessionDetails';

type PageProps = {
  params: {
    id: string;
  };
};

export default async function Page({ params }: PageProps) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sessions/${params.id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return <div className="p-4 text-red-500">Failed to load session.</div>;
  }

  const session = await res.json();

  return <SessionDetails session={session} />;
}
