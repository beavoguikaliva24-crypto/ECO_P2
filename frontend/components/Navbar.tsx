"use client";
import { useEffect, useState } from 'react';
import { logout } from '@/lib/auth';
import { User } from 'lucide-react'; // Icône de secours si pas de photo

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
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
    <div className="navbar bg-white shadow-sm border-b border-slate-100 px-6 py-2 flex justify-between items-center">
      {/* Côté Gauche : Infos Texte */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Session active</span>
        <span className="font-bold text-slate-800 leading-tight">
          {user?.prenom} {user?.nom}
        </span>
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
              <img 
                src={getPhotoUrl()} 
                alt="Profile" 
                className="object-cover w-full h-full"
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