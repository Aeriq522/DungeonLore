import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">🏰 DungeonLore</h1>
      <Link
        href="/summarizer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Go to Session Summarizer →
      </Link>
    </main>
  );
}
