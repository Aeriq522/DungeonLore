'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/summarizer', label: 'Summarizer' },
  { href: '/hooks/next-session', label: 'Plot Hooks' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-100 px-6 py-4 shadow-md flex items-center justify-between">
      <h1 className="text-xl font-bold">🏰 DungeonLore</h1>
      <div className="flex space-x-4">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`hover:text-blue-700 ${
              pathname === href
                ? 'text-blue-800 font-semibold underline'
                : 'text-blue-600'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
