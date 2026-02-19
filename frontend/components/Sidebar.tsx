"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Élèves', path: '/eleves' },
  { name: 'Classes', path: '/classes' },
  { name: 'Recouvrement', path: '/recouvrement' },
  { name: 'Scolarités', path: '/scolarites' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white p-4">
      <div className="text-2xl font-black mb-10 text-center text-blue-400">ECO1 - PRO</div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`block p-3 rounded-lg transition ${
              pathname === item.path ? 'bg-blue-600' : 'hover:bg-gray-800'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}