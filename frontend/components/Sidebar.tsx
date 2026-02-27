/* eslint-disable @next/next/no-img-element */
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  School, 
  Wallet, 
  LayersPlus,
  GraduationCap,
  ChevronLeft,    // Ajouté
  ChevronRight    // Ajouté
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Élèves', path: '/eleves', icon: Users },
  { name: 'Affectations', path: '/affectations', icon: LayersPlus },
  { name: 'Classes', path: '/classes', icon: School },
  { name: 'Recouvrement', path: '/recouvrements', icon: Wallet },
  { name: 'Scolarités', path: '/scolarites', icon: GraduationCap },
];

// Définition de l'interface pour recevoir les props du Layout
interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    // On retire "w-50" car la largeur est gérée par le parent DashboardLayout
    <aside className="relative flex flex-col h-screen text-white shadow-xl bg-slate-900 w-full transition-all duration-300">
      
      {/* Bouton pour réduire/agrandir : Positionné à cheval sur le bord droit */}
      <button 
  onClick={() => setIsCollapsed(!isCollapsed)}
  className="hidden lg:flex absolute -right-3 top-10 bg-blue-600 ... "
>
  {isCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
</button>

      {/* HEADER : Logo et Nom */}
      <div className="p-3">
        <div className={` items-center gap-3 py-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 transition-all duration-300 ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}>
  
  {/* Logo Container */}
  <div className="bg-white flex items-center justify-center p-2 rounded-xl shadow-lg shrink-0">
    <img
      src="/eco1.png"
      alt="Logo"
      className="h-20 w-auto select-none" // Adjusted height for a more standard sidebar fit
      draggable={false}
    />
  </div>

  {/* Logo Text - Only visible when not collapsed */}
  {!isCollapsed && (
    <span className="flex items-center justify-center font-black tracking-tighter text-blue-300 whitespace-nowrap overflow-hidden animate-in fade-in duration-500">
  ECORYS - 224
</span>
  )}
</div>
      </div>

      {/* NAVIGATION : Menu principal */}
      <nav className="flex-1 px-3 mt-4 space-y-2 overflow-y-auto custom-scrollbar">
        {!isCollapsed && (
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Menu Principal</p>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link 
              key={item.path} 
              href={item.path}
              title={isCollapsed ? item.name : ""} // Affiche le nom au survol si réduit
              className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}
              />
              {/* Masquage conditionnel du texte */}
              {!isCollapsed && <span className="font-semibold text-sm whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER : Version stable */}
      <div className="p-3 mt-auto border-t border-slate-800">
        <div className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/30">
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase italic">Version Stable</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <p className="text-xs text-blue-400 font-mono text-center">v1.0.2 • 2026</p>
              <p className="text-xs text-slate-300 font-mono text-center">Propulsée par MAXMA Tech Solutions</p>
            </>
          ) : (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping mx-auto"></div>
          )}
        </div>
      </div>
    </aside>
  );
}