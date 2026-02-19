"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  School, 
  Wallet, 
  GraduationCap,
  Settings 
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Élèves', path: '/eleves', icon: Users },
  { name: 'Classes', path: '/classes', icon: School },
  { name: 'Recouvrement', path: '/recouvrement', icon: Wallet },
  { name: 'Scolarités', path: '/scolarites', icon: GraduationCap },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 h-screen text-white flex flex-col shadow-xl">
      {/* HEADER : Logo et Nom */}
      <div className="p-6">
        <div className="flex items-center justify-center gap-3 py-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
            <School size={22} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-blue-400">ECO1 - PRO</span>
        </div>
      </div>

      {/* NAVIGATION : Menu principal (prend l'espace disponible) */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Menu Principal</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}
              />
              <span className="font-semibold text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER : Le nouveau pied de page flexible */}
      <div className="p-4 mt-auto border-t border-slate-800">
        <div className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase italic">Version Stable</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          </div>
          <p className="text-xs text-blue-400 font-mono text-center">v1.0.2 • 2026</p>
          <p className="text-[9px] text-slate-600 text-center mt-1 uppercase tracking-tighter">Propulsé par ECO-SYS</p>
        </div>
      </div>
    </aside>
  );
}