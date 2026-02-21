// @/app/dashboard/layout.tsx (ou votre chemin layout)
"use client";
import React, { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Définition des états
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // État pour le menu mobile

  // 2. Définition de la fonction (C'est elle qui manquait !)
  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-gray-50 relative">
        
        {/* --- MENU MOBILE (ASIDE FLOTTANT) --- */}
        {/* Ce conteneur gère l'affichage seulement sur mobile (lg:hidden) */}
        <div className={`
          fixed inset-0 z-[60] lg:hidden transition-all duration-300
          ${isMenuOpen ? "visible" : "invisible"}
        `}>
          {/* Fond noir transparent (Overlay) */}
          <div 
            className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
            onClick={toggleMobileMenu} 
          />
          
          {/* Menu qui glisse */}
          <div className={`
            absolute left-0 top-0 h-full w-72 transform transition-transform duration-300 ease-in-out
            ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
          `}>
            {/* On force isCollapsed à false ici pour que le menu mobile soit toujours large */}
            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
          </div>
        </div>

        {/* --- SIDEBAR DESKTOP (FIXE) --- */}
        <div className={`hidden lg:flex flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>

        {/* --- ZONE DE CONTENU --- */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* On passe la fonction à la Navbar pour ouvrir le menu */}
          <Navbar onMenuClick={toggleMobileMenu} />
          
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}