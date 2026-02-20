"use client";
import React, { useState } from 'react'; // Ajout de useState
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // État pour gérer la réduction du menu
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AuthGuard>
      {/* h-screen empêche le body entier de défiler */}
      <div className="flex h-screen overflow-hidden bg-gray-50">
        
        {/* SIDEBAR : Fixe à gauche */}
        {/* SIDEBAR : Largeur dynamique selon l'état */}
        <div className={`hidden md:flex flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>

        {/* CONTENU : Zone défilante à droite */}
        {/* CONTENU : S'adapte automatiquement à l'espace restant */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Navbar />
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}