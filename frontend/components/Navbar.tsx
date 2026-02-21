/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from 'react';
import { logout } from '@/lib/auth';
import { User } from 'lucide-react'; // Icône de secours si pas de photo
// Ajout du type pour le bouton menu
interface NavbarProps {
  onMenuClick: () => void;
}

// Ajoutez 'onMenuClick' dans les props
export default function Navbar({ onMenuClick }: NavbarProps) {
  const [user, setUser] = useState<any>(null);

useEffect(() => {
  const loadUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        console.log("Contenu réel de user :", userData);
        const parsed = JSON.parse(userData);
        console.log("Utilisateur chargé :", parsed);
        setUser(parsed);
      } catch (e) {
        console.error("Erreur parsing user:", e);
      }
    }
  };

  loadUser();
  // On écoute aussi les changements de storage (au cas où)
  window.addEventListener('storage', loadUser);
  return () => window.removeEventListener('storage', loadUser);
}, []);

  // Construction de l'URL de l'image
  // On vérifie si user.photo existe et si c'est une URL complète ou relative
  // frontend/components/Navbar.tsx
const getPhotoUrl = () => {
    if (!user?.photo) return null;
    
    // Si l'URL commence déjà par http, on la retourne telle quelle
    if (user.photo.startsWith('http')) {
        return user.photo;
    }
    
    // Sinon, on s'assure d'ajouter l'URL du backend définie dans ton .env
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    return `${baseUrl}${user.photo}`;
};

  return (
    <div className="navbar bg-white shadow-sm border-b border-slate-100 px-4 md:px-6 py-2 flex justify-between items-center">
      
      <div className="flex items-center gap-3">
        {/* BOUTON MOBILE : Visible uniquement sous 1024px (lg) */}
        <button onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
        >
          {/* Icône ☰ */}
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
           </svg>
        </button>

        <div className="flex flex-col">
  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Session active</span>
  <span className="font-bold text-slate-800 leading-tight">
    {user ? (
      // 1. On cherche d'abord le prénom et le nom
      user.prenom || user.nom ? (
        `${user.prenom || ''} ${user.nom || ''}`
      ) : (
        // 2. Si absents et que c'est l'admin, on affiche votre nom
        user.username === 'admin' ? "Kaliva BEAVOGUI" : (user.username || "Utilisateur")
      )
    ) : "Chargement..."}
  </span>
</div>
      </div>
      
      {/* Côté Droit : Badge, Photo et Déconnexion */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
             <span className="text-xs font-mono text-blue-600">@{user?.username}</span>
             <span className="text-[10px] font-bold uppercase text-slate-400">{user?.role || "Utilisateur"}</span>
        </div>

        {/* CONTENEUR PHOTO / AVATAR */}
        <div className="avatar">
          <div className="w-10 h-10 rounded-full ring ring-blue-500 ring-offset-base-100 ring-offset-2 overflow-hidden bg-slate-100 flex items-center justify-center">
            {user?.photo ? (
              <img src={getPhotoUrl()} alt="Profile" className="object-cover w-full h-full"
                onError={(e) => {
                    // Si l'image ne charge pas, on remplace par un fallback
                    (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + user?.username;
                }}
              />
            ) : (
              <User size={20} className="text-slate-400" />
            )}
          </div>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

        <button 
          onClick={logout}
          className="btn btn-sm btn-ghost text-error hover:bg-error/10 font-bold"
        >
          Quitter
        </button>
      </div>
    </div>
  );
}