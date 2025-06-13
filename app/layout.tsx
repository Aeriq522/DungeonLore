import './globals.css';
import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DungeonLore',
  description: 'AI-enhanced campaign manager for D&D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-800">
        <Navbar />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
