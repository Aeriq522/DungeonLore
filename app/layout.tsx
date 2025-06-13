import './globals.css';
import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react'; // ✅ Import the Analytics component

export const metadata: Metadata = {
  title: 'DungeonLore',
  description: 'AI-enhanced campaign manager for D&D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-gray-800">
        <Navbar />
        <main className="p-6">{children}</main>
        <Analytics /> {/* ✅ Add this line at the end of <body> */}
      </body>
    </html>
  );
}
