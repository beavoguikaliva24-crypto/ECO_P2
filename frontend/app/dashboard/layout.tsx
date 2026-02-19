"use client";
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* h-screen empêche le body entier de défiler */}
      <div className="flex h-screen overflow-hidden bg-gray-50">
        
        {/* SIDEBAR : Fixe à gauche */}
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar />
        </div>

        {/* CONTENU : Zone défilante à droite */}
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <Navbar />
          
          {/* main prend le reste de la hauteur et gère son propre scroll */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}